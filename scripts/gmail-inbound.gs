const CRM_URL = "https://custodia-pearl.vercel.app/api/v1/inbound/email";
const INBOX_ADDRESS = "adam.claude.hyben+custodia@gmail.com";
const DONE_LABEL = "Custodia CRM";

function forwardToCustodia() {
  const secret = PropertiesService.getScriptProperties().getProperty("INBOUND_SECRET");
  if (!secret) throw new Error("Chýba INBOUND_SECRET v Script Properties.");
  const label = GmailApp.getUserLabelByName(DONE_LABEL) || GmailApp.createLabel(DONE_LABEL);
  const threads = GmailApp.search(`to:${INBOX_ADDRESS} -label:"${DONE_LABEL}" newer_than:2d`, 0, 20);

  for (const thread of threads) {
    const message = thread.getMessages().pop();
    const response = UrlFetchApp.fetch(CRM_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "X-Inbound-Secret": secret },
      payload: JSON.stringify({
        from: message.getFrom(),
        subject: message.getSubject(),
        text: message.getPlainBody().slice(0, 20000),
      }),
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() === 201) {
      thread.addLabel(label);
      thread.markRead();
    } else {
      console.log(`CRM odmietol e-mail (${response.getResponseCode()}): ${response.getContentText()}`);
    }
  }
}

function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("forwardToCustodia").timeBased().everyMinutes(1).create();
}
