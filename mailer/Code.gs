/*
  KR Mailer — the "server" half. This runs on Google's computers, not in your browser.
  It reads the Sheet, works out who gets each email, and sends through the Gmail API.

  Index.html is the other half: the editor page you see. It calls the functions below
  with google.script.run (for example google.script.run.getAudience(...)).

  Naming rule: functions ending in _ (like readContacts_) are private. Apps Script hides
  them from the editor page and from the Run menu. Everything else here can be called by
  Index.html, so only put things without _ that the page actually needs.
*/

/***** SETTINGS *****/
const CONTACTS_SHEET = 'Contacts';
const LOG_SHEET      = 'Log';
const DRAFT_SHEET    = 'Draft';

// The name families see next to headcoach@kettlerunswim.org in their inbox.
const FROM_NAME = 'Kettle Run Swimming';

// Pause between families so Gmail doesn't think we're a spam bot (milliseconds).
const PAUSE_MS = 400;

const HEADERS = ['Swimmer First', 'Swimmer Last', 'Swimmer Email', 'Parent Emails', 'Groups', 'Active'];
const LOG_HEADERS = ['Timestamp', 'Type', 'Subject', 'Groups', 'Audience', 'Family', 'To', 'Status', 'Error'];


/***** OPENING THE EDITOR *****/

// Runs when someone opens the mailer's web address. Sends back the editor page.
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('KR Mailer')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Adds a "Team Mailer" menu to the Sheet.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Team Mailer')
    .addItem('Open mailer', 'showMailerLink')
    .addItem('Set up tabs', 'setupSheets')
    .addToUi();
}

function showMailerLink() {
  const url = ScriptApp.getService().getUrl();
  const html = url
    ? `<p style="font:14px sans-serif"><a href="${url}" target="_blank">Open KR Mailer ↗</a></p>`
    : '<p style="font:14px sans-serif">Not deployed yet. In Apps Script: Deploy → New deployment → Web app.</p>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(260).setHeight(80), 'KR Mailer');
}

// Creates the Contacts, Log and Draft tabs (safe to run again; it never deletes contacts).
function setupSheets() {
  const ss = SpreadsheetApp.getActive();

  let contacts = ss.getSheetByName(CONTACTS_SHEET);
  if (!contacts) contacts = ss.insertSheet(CONTACTS_SHEET);
  contacts.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  contacts.setFrozenRows(1);
  contacts.getRange(2, 6, 300, 1).insertCheckboxes(); // Active column
  contacts.setColumnWidths(1, 2, 110);
  contacts.setColumnWidths(3, 2, 240);
  contacts.setColumnWidth(5, 180);

  let log = ss.getSheetByName(LOG_SHEET);
  if (!log) log = ss.insertSheet(LOG_SHEET);
  log.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]).setFontWeight('bold');
  log.setFrozenRows(1);

  if (!ss.getSheetByName(DRAFT_SHEET)) ss.insertSheet(DRAFT_SHEET).hideSheet();
}


/***** CONTACTS → FAMILIES *****/

// Splits "a@x.com, b@y.com" or "girls; state team" into a clean list.
function splitList_(value) {
  return String(value || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
}

function isEmail_(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isChecked_(v) {
  if (v === true) return true;
  const s = String(v || '').trim().toLowerCase();
  return s === 'yes' || s === 'y' || s === 'true';
}

// Reads the Contacts tab into a list of rows: { row, swimmer, swimmerEmail, parents, groups, active }.
function readContacts_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONTACTS_SHEET);
  if (!sh) throw new Error('No "Contacts" tab yet. In the Sheet, use Team Mailer → Set up tabs.');

  const data = sh.getDataRange().getValues();
  const header = data.shift();
  const col = {};
  HEADERS.forEach(h => {
    col[h] = header.indexOf(h);
    if (col[h] === -1) throw new Error(`The Contacts tab is missing the "${h}" column.`);
  });

  return data.map((r, i) => ({
    row: i + 2,
    swimmer: `${r[col['Swimmer First']]} ${r[col['Swimmer Last']]}`.trim(),
    lastName: String(r[col['Swimmer Last']]).trim(),
    swimmerEmail: String(r[col['Swimmer Email']]).trim().toLowerCase(),
    parents: splitList_(r[col['Parent Emails']]).map(e => e.toLowerCase()),
    groups: splitList_(r[col['Groups']]),
    active: isChecked_(r[col['Active']])
  })).filter(c => c.swimmer || c.swimmerEmail || c.parents.length); // skip empty rows
}

/*
  Works out who gets the email.
    groups:   list of group names to include ([] = everyone)
    audience: 'family' (swimmers + parents) or 'parents' (parents only)

  Swimmers who share a parent email are siblings, so they're merged into ONE email.
  A row with no swimmer name is an individual contact (coach, AD...): their address goes
  in Parent Emails and they get their own copy.

  Returns { families: [{ label, swimmers, to }], skipped: [{ row, name, reason }] }.
*/
function buildFamilies_(groups, audience) {
  const wanted = groups.map(g => g.toLowerCase());
  const skipped = [];

  const rows = readContacts_().filter(c => {
    if (!c.active) return false;
    if (wanted.length && !c.groups.some(g => wanted.includes(g.toLowerCase()))) return false;

    const bad = [c.swimmerEmail, ...c.parents].filter(e => e && !isEmail_(e));
    if (bad.length) {
      skipped.push({ row: c.row, name: c.swimmer || c.parents.join(', '), reason: `Doesn't look like an email: ${bad.join(', ')}` });
      return false;
    }
    if (!c.parents.length) {
      // Never email a swimmer without a parent on it.
      skipped.push({ row: c.row, name: c.swimmer, reason: 'No parent email' });
      return false;
    }
    return true;
  });

  // Group rows that share any parent email (siblings) into one family.
  const families = [];
  const familyOf = {}; // parent email → family
  rows.forEach(c => {
    let fam = c.parents.map(e => familyOf[e]).find(Boolean);
    if (!fam) {
      fam = { swimmers: [], lastNames: [], parents: [], swimmerEmails: [] };
      families.push(fam);
    }
    if (c.swimmer) fam.swimmers.push(c.swimmer.split(' ')[0]);
    if (c.lastName) fam.lastNames.push(c.lastName);
    if (c.swimmerEmail) fam.swimmerEmails.push(c.swimmerEmail);
    c.parents.forEach(e => {
      if (!fam.parents.includes(e)) fam.parents.push(e);
      familyOf[e] = fam;
    });
  });

  return {
    families: families.map(f => {
      const to = audience === 'parents' ? f.parents : [...f.swimmerEmails, ...f.parents];
      const label = f.swimmers.length
        ? `${[...new Set(f.lastNames)].join(' / ')} (${f.swimmers.join(', ')})`
        : f.parents.join(', ');
      return { label, to: [...new Set(to)] };
    }),
    skipped
  };
}

// For the editor page: every group name used in the Contacts tab, for the checkboxes.
function getGroups() {
  const seen = {};
  readContacts_().forEach(c => c.groups.forEach(g => {
    if (!seen[g.toLowerCase()]) seen[g.toLowerCase()] = g;
  }));
  return Object.values(seen).sort((a, b) => a.localeCompare(b));
}

// For the editor page: who would get this email right now.
function getAudience(groups, audience) {
  const { families, skipped } = buildFamilies_(groups, audience);
  return {
    familyCount: families.length,
    addressCount: families.reduce((n, f) => n + f.to.length, 0),
    families: families.map(f => f.label),
    skipped
  };
}

function getMyEmail() {
  return Session.getEffectiveUser().getEmail();
}

// The signature's phone number. It's stored with the script on Google (Project Settings →
// Script Properties → PHONE) because this code is saved in a public repo.
function getPhone() {
  return PropertiesService.getScriptProperties().getProperty('PHONE') || '';
}


/***** SENDING *****/

/*
  An email is plain text: header lines (To, Subject...), a blank line, then the body.
  Ours has two versions of the body, plain text and HTML, so every email app can show one.
  Non-English characters (curly quotes, emoji, the – dash) are base64-encoded so they arrive intact.
*/
function encodeHeader_(text) {
  return /^[\x20-\x7E]*$/.test(text)
    ? text
    : `=?UTF-8?B?${Utilities.base64Encode(text, Utilities.Charset.UTF_8)}?=`;
}

function base64Lines_(text) {
  return Utilities.base64Encode(text, Utilities.Charset.UTF_8).replace(/.{76}/g, '$&\r\n');
}

function buildMessage_(to, subject, html, text) {
  const from = Session.getEffectiveUser().getEmail();
  const boundary = 'kr' + Utilities.getUuid().replace(/-/g, '');
  return [
    `From: ${encodeHeader_(FROM_NAME)} <${from}>`,
    `To: ${to.join(', ')}`,
    `Subject: ${encodeHeader_(subject)}`,
    // Gives families an "Unsubscribe" link in Gmail; it just emails you, and spam filters like it.
    `List-Unsubscribe: <mailto:${from}?subject=Unsubscribe>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines_(text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines_(html),
    `--${boundary}--`
  ].join('\r\n');
}

// Sends through the Gmail API (the "Gmail" service you added), which doesn't use the
// 100-a-day Apps Script email limit.
function sendRaw_(to, subject, html, text) {
  const raw = Utilities.base64EncodeWebSafe(buildMessage_(to, subject, html, text));
  Gmail.Users.Messages.send({ raw }, 'me');
}

function log_(type, subject, groups, audience, family, to, status, error) {
  SpreadsheetApp.getActive().getSheetByName(LOG_SHEET).appendRow([
    new Date(), type, subject, groups.join(', ') || 'Everyone', audience, family, to.join(', '), status, error || ''
  ]);
}

// email = { subject, html, text } built by the editor page.
function sendTest(email, testTo) {
  const to = splitList_(testTo);
  if (!to.length || !to.every(isEmail_)) throw new Error('Enter a valid test address.');
  sendRaw_(to, `[TEST] ${email.subject}`, email.html, email.text);
  log_('Test', email.subject, [], '-', '-', to, 'Sent');
  return to.join(', ');
}

function sendToFamilies(email, groups, audience) {
  if (!email.subject.trim()) throw new Error('Add a subject first.');

  // Work out the families again here rather than trusting the page, in case the Sheet changed.
  const { families } = buildFamilies_(groups, audience);
  const audienceLabel = audience === 'parents' ? 'Parents only' : 'Swimmers + parents';
  let sent = 0;
  const failed = [];

  families.forEach(f => {
    try {
      sendRaw_(f.to, email.subject, email.html, email.text);
      log_('Send', email.subject, groups, audienceLabel, f.label, f.to, 'Sent');
      sent++;
    } catch (e) {
      log_('Send', email.subject, groups, audienceLabel, f.label, f.to, 'Failed', e.message);
      failed.push(`${f.label}: ${e.message}`);
    }
    Utilities.sleep(PAUSE_MS);
  });

  return { sent, failed };
}


/***** DRAFT (so you can close the page and come back, even on another device) *****/

function saveDraft(json) {
  SpreadsheetApp.getActive().getSheetByName(DRAFT_SHEET).getRange('A1').setValue(json);
}

function loadDraft() {
  const sh = SpreadsheetApp.getActive().getSheetByName(DRAFT_SHEET);
  return sh ? String(sh.getRange('A1').getValue() || '') : '';
}
