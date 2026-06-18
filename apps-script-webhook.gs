// ============================================================
//  PORTFOLIO FORM WEBHOOK — Google Apps Script
//  Deploy as: Web app → Execute as: Me → Access: Anyone
// ============================================================

// ⬇ Paste your Google Sheet ID here (from the URL: /d/SHEET_ID/edit)
const SPREADSHEET_ID = "1z6Zv3P4_EUlOLE2ztT8c7Uh8ZlYQOYeU7rOf4vpUWI4";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { page, name, email, extra, message } = data;

    // ── Append row to Google Sheet ──
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Submissions");
    if (!sheet) {
      sheet = ss.insertSheet("Submissions");
      sheet.appendRow(["Timestamp (IST)", "Page", "Name", "Email", "Subject / Profession", "Message"]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }
    sheet.appendRow([
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      page === "experience" ? "Experience — Join" : "Contact",
      name   || "",
      email  || "",
      extra  || "",
      message || ""
    ]);

    // ── Send email notification ──
    const isJoin  = page === "experience";
    const to      = isJoin ? "mindsmachines00@gmail.com" : "kaaronjoshua@gmail.com";
    const subject = isJoin
      ? `New student — ${name}`
      : `${name} wants to connect`;

    const body = isJoin
      ? `New student signup for Minds & Machines:\n\nName:       ${name}\nEmail:      ${email}\nProfession: ${extra || "Not specified"}`
      : `New contact form submission:\n\nName:    ${name}\nEmail:   ${email}\nSubject: ${extra || "(none)"}\n\nMessage:\n${message}`;

    MailApp.sendEmail(to, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
