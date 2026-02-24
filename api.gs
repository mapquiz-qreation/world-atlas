function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const params = JSON.parse(e.postData.contents);
  const name = params.name;
  const newScore = Number(params.score);
  const tag = params.tag; // 例: europe_ancient

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    sheet.appendRow([name, newScore, new Date(), tag]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }

  // 必要な範囲だけ1回で読み取り（A〜D列、データ行のみ）
  const data = sheet.getRange(2, 1, lastRow, 4).getValues();
  let foundIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === name && data[i][3] === tag) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex !== -1) {
    const existingScore = Number(data[foundIndex][1]);
    if (newScore > existingScore) {
      const sheetRow = foundIndex + 2;
      sheet.getRange(sheetRow, 2, 1, 2).setValues([[newScore, new Date()]]);
    }
  } else {
    sheet.appendRow([name, newScore, new Date(), tag]);
  }
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  
  if (action === 'get') {
    const lastRow = sheet.getLastRow();
    let scores = [];
    if (lastRow >= 2) {
      const data = sheet.getRange(2, 1, lastRow, 4).getValues();
      scores = data.map(row => ({ name: row[0], score: row[1], tag: row[3] }));
    }
    const result = callback + "(" + JSON.stringify(scores) + ")";
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}
