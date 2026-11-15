# KR Mailer

The team email tool. You write emails from blocks in a web page, see a live preview, and it
sends **one email per family** (swimmer + parents together) from headcoach@kettlerunswim.org.

It lives in Google, not on the website. These files are the saved copy; the running copy is in
the **KR Swim Mailer** Sheet → Extensions → Apps Script. After changing a file here, paste it there.

| File | What it is | Runs where |
|---|---|---|
| `Code.gs` | Reads the Sheet, groups families, sends through the Gmail API, writes the Log | Google's computers |
| `Index.html` | The editor page **and the email design** (`renderEmail`) | Your browser |

The email logo is `src/assets/email/kr-logo-email.png` on the website (email apps don't show SVG).

## Try it on your computer

Double-click `Index.html`. It opens in **demo mode**: made-up families, nothing is sent. Handy
for trying design changes before pasting them into Apps Script.

## One-time setup

1. Signed in as **headcoach@**, open the KR Swim Mailer Sheet → **Extensions → Apps Script**.
2. Make sure **Gmail API** is listed under **Services** (left side). If not: **+** → Gmail API → Add.
3. Replace everything in `Code.gs` with this repo's `Code.gs`.
4. **+** next to Files → **HTML** → name it `Index` (Apps Script adds `.html`). Paste `Index.html` into it.
5. Save (⌘S). Reload the Sheet: a **Team Mailer** menu appears. Run **Team Mailer → Set up tabs**
   (approve the permissions the first time). This makes the Contacts, Log and Draft tabs.
6. Back in Apps Script: **Deploy → New deployment** → gear ⚙ → **Web app**.
   - Execute as: **Me**
   - Who has access: **Only myself**
   - Deploy, then copy the web app URL and **bookmark it** (works on your phone too).
7. Add your phone number for the signature: Apps Script → **Project Settings** (gear) → **Script Properties** →
   **Add script property**. Property: `PHONE`. Value: your number. It's kept on Google because this repo is public.

## Contacts tab

One row per swimmer. The columns follow the paper Swim Team Contact Form from left to right, so
you can type each form straight across. **Team Mailer → Set up tabs** creates them, with dropdowns,
checkboxes and email checks. The mailer finds columns by name, so you can move columns or add
your own; just don't rename these:

| Column | What to put |
|---|---|
| Swimmer First / Swimmer Last | Name |
| Grade | 9–12. Grade 12 puts the swimmer in the `seniors` group automatically |
| Best Email, Parent 1 Email, Parent 2 Email | One address per cell. The mailer puts all of them on the family's email (duplicates removed). At least one is **required**: swimmers are never emailed without a parent |
| Swimmer Email | Optional (it's not on the paper form) |
| Photos OK | The form asks "Do you **object**?" Object = Yes → put **No** here |
| Groups | Tags separated by commas, e.g. `girls, state team`. Each tag becomes a button in the mailer |
| Active | Checked = gets emails (new rows start checked). Uncheck for graduated, quit, or asked to stop |
| Physical, Acknowledgement, Concussion, Contact Form | Tick each form as it's turned in. Anyone with a box unchecked is in the `missing forms` group |

The other columns (birthdate, address, medical, phones…) are for your records; the mailer ignores them.

- **Private info stays in the Sheet.** Medical, birthdates, addresses and phones never go in this repo (it's public).
- **Siblings:** give them the same parent emails and they get one shared email.
- **Coaches, AD, boosters:** leave the swimmer columns blank, put their email in Best Email, tag `staff`.
- **Missing forms:** pick the `missing forms` group to email only the families who still owe a form. It disappears once every box is ticked.
- **Older sheets:** a single "Parent Emails" column (comma list) still works. Set up tabs adds the new columns on the right without moving anything.

## Sharing contacts with team parents (the Directory)

Never share the mailer Sheet: anyone who can open a spreadsheet can see every tab (hidden ones
too), and editors can change the sending code. Instead, a separate **KR Swim Directory** Sheet
copies only the columns parents need. It updates by itself when you edit Contacts.

1. Signed in as headcoach@, make a new Google Sheet named **KR Swim Directory**.
2. In cell A1, paste this formula, replacing `MAILER_SHEET_URL` with the mailer Sheet's address (from the browser bar):

   ```
   =QUERY(IMPORTRANGE("MAILER_SHEET_URL", "Contacts!A1:AA"),
     "select Col1, Col3, Col4, Col13, Col14, Col15, Col16, Col17, Col18, Col11, Col12
      where Col22 = true and Col1 is not null order by Col3, Col1", 1)
   ```

3. Click **Allow access** when A1 asks (one time).
4. **Share → add the parents as Viewer** (never Editor), then in the gear ⚙ untick
   *Viewers and commenters can see the option to download, print, and copy*.

**What the formula does:** `IMPORTRANGE` pulls the Contacts tab from the other file, and `QUERY`
keeps only some columns (`Col1` = column A, `Col3` = column C…) for active swimmers, sorted by last name.
That's swimmer name, grade, both parents' names/phones/emails, and the best email/phone. It never
pulls birthdate, address, medical, club, photos, groups, forms or notes.

**Why Viewer only:** once you click Allow access, any *editor* of the Directory could change the
formula to pull the private columns too. Viewers can't change the formula.

**If you move or add columns in Contacts**, the column numbers shift. Fix the numbers in the formula.

## Sent emails tab

Every real send adds one row here (made automatically the first time): date, subject, groups,
how many families, and the email's content. In the editor, the template menu lists your recent
ones under **Past emails**, so you can open last week's update, change what's new and send it.
The content is saved as blocks, not HTML, so a reused email always gets the current design.
The exact copy families received is in headcoach@'s Sent folder.

## If you see "No HTML file named Index was found"

The file list on the left in Apps Script must show exactly `Index.html`: capital I, one `.html`.
If it says `index.html`, `Index.html.html` or `Index.gs`, fix it with the ⋮ next to the file
(for `Index.gs`, delete it and create an **HTML** file instead). Then publish a new version
(next section), because the web address keeps running the last version you deployed.

## Updating the code later

Paste the new file into Apps Script and save. Then **Deploy → Manage deployments → ✏️ Edit →
Version: New version → Deploy**. The bookmark stays the same. (Skipping this step means the
bookmark keeps running the old code.)

## Limits

Sending uses the Gmail API, which doesn't count against Apps Script's 100-a-day email limit.
Gmail's own Workspace limit (about 2,000 recipients a day) still applies — far more than we need.
Every send is written to the Log tab, and a copy lands in headcoach@'s Sent folder.
