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

One row per swimmer.

| Column | What to put |
|---|---|
| Swimmer First / Last | Name |
| Swimmer Email | Optional |
| Parent Emails | All parent/guardian emails, separated by commas. **Required** — swimmers are never emailed without a parent |
| Groups | Tags separated by commas, e.g. `girls, seniors, state team`. Each tag becomes a button in the mailer |
| Active | Checked = gets emails. Uncheck for graduated, quit, or asked to stop |

- **Siblings:** give them the same parent emails and they get one shared email.
- **Coaches, AD, boosters:** leave the swimmer columns blank, put their email in Parent Emails, tag `staff`.
- **Senior families:** tag the senior's row `seniors`. Sending to "seniors" reaches that swimmer and their parents.

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
