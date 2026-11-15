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
const SENT_SHEET     = 'Sent emails';

// The name families see next to headcoach@kettlerunswim.org in their inbox.
const FROM_NAME = 'Kettle Run Swimming';

// Pause between families so Gmail doesn't think we're a spam bot (milliseconds).
const PAUSE_MS = 400;

/*
  The Contacts tab: one row per swimmer, in the same order as the paper contact form so you
  can type straight across. The mailer finds columns by their header name, so you can move
  columns around or add your own; just don't rename the ones it uses.
*/
const CONTACT_COLUMNS = [
  'Swimmer First', 'MI', 'Swimmer Last', 'Grade', 'Birthdate', 'T-Shirt',
  'Address', 'Allergies/Medical', 'Club & Coach', 'Other Activities',
  'Best Email', 'Best Phone',
  'Parent 1 Name', 'Parent 1 Phone', 'Parent 1 Email',
  'Parent 2 Name', 'Parent 2 Phone', 'Parent 2 Email',
  'Photos OK', 'Swimmer Email', 'Groups', 'Active',
  'Physical', 'Acknowledgement', 'Concussion', 'Contact Form', 'Notes'
];

// The mailer stops with a message if any of these are missing.
const REQUIRED_COLUMNS = ['Swimmer First', 'Swimmer Last', 'Active'];

// Every parent address comes from these columns (whichever exist), duplicates removed.
// "Parent Emails" is the older one-cell layout (a comma list), still read so old rows work.
const PARENT_EMAIL_COLUMNS = ['Best Email', 'Parent 1 Email', 'Parent 2 Email', 'Parent Emails'];

// The four required forms. A swimmer with any of these unchecked is put in the "missing forms" group.
const FORM_COLUMNS = ['Physical', 'Acknowledgement', 'Concussion', 'Contact Form'];

// Groups the mailer adds by itself, so they appear as buttons without typing them in Groups.
const MISSING_FORMS_GROUP = 'missing forms'; // any form box unchecked
const SENIORS_GROUP = 'seniors';             // Grade is 12

const LOG_HEADERS = ['Timestamp', 'Type', 'Subject', 'Groups', 'Audience', 'Family', 'To', 'Status', 'Error'];
const SENT_HEADERS = ['Sent', 'Subject', 'Groups', 'Audience', 'Families', 'Content'];
const PAST_EMAILS_SHOWN = 25; // how many recent emails the editor's "Past emails" list offers


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

// Creates the Contacts, Log and Draft tabs (safe to run again; it never deletes or moves contacts).
function setupSheets() {
  const ss = SpreadsheetApp.getActive();

  let contacts = ss.getSheetByName(CONTACTS_SHEET);
  if (!contacts) contacts = ss.insertSheet(CONTACTS_SHEET);
  setupContacts_(contacts);

  let log = ss.getSheetByName(LOG_SHEET);
  if (!log) log = ss.insertSheet(LOG_SHEET);
  log.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]).setFontWeight('bold');
  log.setFrozenRows(1);

  if (!ss.getSheetByName(DRAFT_SHEET)) ss.insertSheet(DRAFT_SHEET).hideSheet();
  sentSheet_();
}

/*
  Lays out the Contacts tab.
  - Nothing typed in yet: writes every column in form order, from scratch.
  - Contacts already in it: leaves everything where it is and adds any missing columns on the right.
  Then adds the typing helpers, using Sheets' "data validation" (the same thing as
  Data → Data validation in the menu): dropdowns, checkboxes, date cells, and a red corner
  warning on anything in an email column that isn't an email address.
*/
function setupContacts_(sh) {
  const fresh = !hasContacts_(sh);
  let added;

  if (fresh) {
    sh.clear();
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
    added = CONTACT_COLUMNS;
    ensureSize_(sh, 1, added.length);
    sh.getRange(1, 1, 1, added.length).setValues([added]);
    sh.setFrozenColumns(3); // keeps the swimmer's name in view while you scroll right
  } else {
    const have = headerRow_(sh);
    added = CONTACT_COLUMNS.filter(h => !have.includes(h));
    if (added.length) {
      const start = sh.getLastColumn() + 1;
      ensureSize_(sh, 1, start + added.length - 1);
      sh.getRange(1, start, 1, added.length).setValues([added]);
    }
  }
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold');
  sh.setFrozenRows(1);

  const rows = Math.max(200, sh.getLastRow() + 50); // room to keep typing
  ensureSize_(sh, rows + 1, 1);
  const header = headerRow_(sh);
  const column = h => sh.getRange(2, header.indexOf(h) + 1, rows, 1);
  const rule = () => SpreadsheetApp.newDataValidation();

  const WIDTHS = {
    'Swimmer First': 110, 'MI': 40, 'Swimmer Last': 120, 'Grade': 60, 'Birthdate': 95, 'T-Shirt': 70,
    'Address': 240, 'Allergies/Medical': 200, 'Club & Coach': 170, 'Other Activities': 170,
    'Best Email': 220, 'Best Phone': 115, 'Parent 1 Name': 140, 'Parent 1 Phone': 115, 'Parent 1 Email': 220,
    'Parent 2 Name': 140, 'Parent 2 Phone': 115, 'Parent 2 Email': 220, 'Photos OK': 85,
    'Swimmer Email': 220, 'Groups': 170, 'Active': 60, 'Physical': 75, 'Acknowledgement': 120,
    'Concussion': 90, 'Contact Form': 100, 'Notes': 240
  };
  header.forEach((h, i) => { if (WIDTHS[h]) sh.setColumnWidth(i + 1, WIDTHS[h]); });

  // Dropdowns. "setAllowInvalid(false)" refuses anything else; "true" accepts it with a warning.
  column('Grade').setDataValidation(rule().requireValueInList(['9', '10', '11', '12']).setAllowInvalid(false).build());
  column('T-Shirt').setDataValidation(rule().requireValueInList(['YS', 'YM', 'YL', 'XS', 'S', 'M', 'L', 'XL', 'XXL']).setAllowInvalid(true).build());
  column('Photos OK').setDataValidation(rule().requireValueInList(['Yes', 'No']).setAllowInvalid(false)
    .setHelpText('The form asks "Do you OBJECT to photos?" If they checked Yes, put No here.').build());

  // Dates and phone numbers. "@" means plain text, so phones stay exactly as you type them.
  column('Birthdate').setNumberFormat('mm/dd/yyyy')
    .setDataValidation(rule().requireDate().setAllowInvalid(true).setHelpText('Type it like 3/14/2010.').build());
  ['Best Phone', 'Parent 1 Phone', 'Parent 2 Phone'].forEach(h => column(h).setNumberFormat('@'));

  // One address per email cell, flagged if it's not an email (a typo, or two addresses in one cell).
  ['Best Email', 'Parent 1 Email', 'Parent 2 Email', 'Swimmer Email'].forEach(h =>
    column(h).setDataValidation(rule().requireTextIsEmail().setAllowInvalid(true)
      .setHelpText('Not an email address. Check for a typo; one address per cell.').build()));

  // Checkboxes, only on columns that were just made (so nothing you've already ticked changes).
  ['Active', ...FORM_COLUMNS].filter(h => added.includes(h)).forEach(h => column(h).insertCheckboxes());
  if (added.includes('Active')) column('Active').check(); // new swimmers start as "gets emails"
}

function headerRow_(sh) {
  return sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(h => String(h).trim());
}

// True if any row below the header has something typed in it (checkboxes alone don't count).
function hasContacts_(sh) {
  if (sh.getLastRow() < 2) return false;
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues()
    .some(r => r.some(v => v !== '' && typeof v !== 'boolean'));
}

// Adds rows/columns if the tab is smaller than we need (a new tab has 26 columns; we use 27).
function ensureSize_(sh, rows, cols) {
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
  if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns());
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
  const header = data.shift().map(h => String(h).trim());
  REQUIRED_COLUMNS.forEach(h => {
    if (!header.includes(h)) throw new Error(`The Contacts tab is missing the "${h}" column.`);
  });
  if (!PARENT_EMAIL_COLUMNS.some(h => header.includes(h))) {
    throw new Error('The Contacts tab has no parent email columns. Use Team Mailer → Set up tabs to add them.');
  }
  const trackingForms = FORM_COLUMNS.some(h => header.includes(h));

  return data.map((r, i) => {
    // get('Grade') = this row's value in the Grade column, or '' if there's no such column.
    const get = h => (header.includes(h) ? r[header.indexOf(h)] : '');
    const first = String(get('Swimmer First')).trim();
    const last = String(get('Swimmer Last')).trim();
    const swimmer = `${first} ${last}`.trim();
    const groups = splitList_(get('Groups'));

    if (swimmer) {
      if (parseInt(get('Grade'), 10) === 12) groups.push(SENIORS_GROUP);
      if (trackingForms && FORM_COLUMNS.some(h => header.includes(h) && !isChecked_(get(h)))) {
        groups.push(MISSING_FORMS_GROUP);
      }
    }

    return {
      row: i + 2,
      swimmer,
      lastName: last,
      swimmerEmail: String(get('Swimmer Email')).trim().toLowerCase(),
      parents: [...new Set(PARENT_EMAIL_COLUMNS.flatMap(h => splitList_(get(h))).map(e => e.toLowerCase()))],
      groups,
      active: isChecked_(get('Active'))
    };
  }).filter(c => c.swimmer || c.swimmerEmail || c.parents.length); // skip empty rows
}

/*
  Works out who gets the email.
    groups:   list of group names to include ([] = everyone)
    audience: 'family' (parents in To, swimmers in Cc) or 'parents' (parents only)

  Swimmers who share a parent email are siblings, so they're merged into ONE email.
  A row with no swimmer name is an individual contact (coach, AD...): their address goes
  in Parent Emails and they get their own copy.

  Returns { families: [{ label, to, cc }], skipped: [{ row, name, reason }] }.
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
      // A swimmer whose address is also listed as a parent stays in To only.
      const cc = audience === 'parents' ? [] : f.swimmerEmails.filter(e => !f.parents.includes(e));
      const label = f.swimmers.length
        ? `${[...new Set(f.lastNames)].join(' / ')} (${f.swimmers.join(', ')})`
        : f.parents.join(', ');
      return { label, to: f.parents, cc: [...new Set(cc)] };
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
    addressCount: families.reduce((n, f) => n + f.to.length + f.cc.length, 0),
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

function buildMessage_(to, cc, subject, html, text) {
  const from = Session.getEffectiveUser().getEmail();
  const boundary = 'kr' + Utilities.getUuid().replace(/-/g, '');
  return [
    `From: ${encodeHeader_(FROM_NAME)} <${from}>`,
    `To: ${to.join(', ')}`,
    ...(cc.length ? [`Cc: ${cc.join(', ')}`] : []),
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
function sendRaw_(to, cc, subject, html, text) {
  const raw = Utilities.base64EncodeWebSafe(buildMessage_(to, cc, subject, html, text));
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
  sendRaw_(to, [], `[TEST] ${email.subject}`, email.html, email.text);
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
    const logged = f.cc.length ? [...f.to, `cc: ${f.cc.join(', ')}`] : f.to; // for the Log's To column
    try {
      sendRaw_(f.to, f.cc, email.subject, email.html, email.text);
      log_('Send', email.subject, groups, audienceLabel, f.label, logged, 'Sent');
      sent++;
    } catch (e) {
      log_('Send', email.subject, groups, audienceLabel, f.label, logged, 'Failed', e.message);
      failed.push(`${f.label}: ${e.message}`);
    }
    Utilities.sleep(PAUSE_MS);
  });

  // One row in the Sent emails tab. If that fails, the emails still went out, so just report it.
  let archived = false;
  if (sent) {
    try {
      archive_(email.subject, groups, audienceLabel, sent, email.content || '');
      archived = true;
    } catch (e) {}
  }

  return { sent, failed, archived };
}


/***** SENT EMAILS (one row per email you send, so you can reuse it later) *****/

// Makes the tab the first time it's needed, so there's no setup step.
function sentSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SENT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SENT_SHEET);
    sh.getRange(1, 1, 1, SENT_HEADERS.length).setValues([SENT_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// content is the email's text and blocks as JSON (not the HTML), so it can be opened and
// edited again, and it picks up any design changes made since.
function archive_(subject, groups, audienceLabel, familyCount, content) {
  // A cell holds at most 50,000 characters, and a cut-off copy couldn't be reopened.
  if (content.length > 50000) content = '';
  sentSheet_().appendRow([new Date(), subject, groups.join(', ') || 'Everyone', audienceLabel, familyCount, content]);
}

// For the editor's "Past emails" list, newest first. Dates are sent as text because
// google.script.run can't pass Date objects to the page.
function getPastEmails() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SENT_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const n = Math.min(PAST_EMAILS_SHOWN, sh.getLastRow() - 1);
  const rows = sh.getRange(sh.getLastRow() - n + 1, 1, n, SENT_HEADERS.length).getValues();
  const tz = Session.getScriptTimeZone();
  return rows.reverse().filter(r => r[5]).map(r => ({
    date: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'MMM d') : String(r[0]),
    subject: String(r[1]),
    content: String(r[5])
  }));
}


/***** DRAFT (so you can close the page and come back, even on another device) *****/

function saveDraft(json) {
  SpreadsheetApp.getActive().getSheetByName(DRAFT_SHEET).getRange('A1').setValue(json);
}

function loadDraft() {
  const sh = SpreadsheetApp.getActive().getSheetByName(DRAFT_SHEET);
  return sh ? String(sh.getRange('A1').getValue() || '') : '';
}
