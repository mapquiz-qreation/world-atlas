// =====================================================
// WorldAtlas — Google Apps Script バックエンド
// シート構成:
//   Sheet1 (Scores) : スコア・ランキング
//   SRS             : 忘却曲線データ
//   Paid            : 有料ユーザー管理
// =====================================================

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

// ── POST ──────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var type    = payload.type;

    // ── Stripe Webhook ──
    if (type === 'checkout.session.completed') {
      var session  = payload.data && payload.data.object ? payload.data.object : {};
      var fields   = session.custom_fields || [];
      var username = '';
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].text && fields[i].text.value) {
          username = fields[i].text.value;
          break;
        }
      }
      var email = (session.customer_details && session.customer_details.email)
                    ? session.customer_details.email : '';
      if (username) {
        var paidSheet = getSheet_('Paid');
        // 重複登録を防ぐ
        var lastRow = paidSheet.getLastRow();
        var alreadyPaid = false;
        if (lastRow >= 2) {
          var names = paidSheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (var j = 0; j < names.length; j++) {
            if (names[j][0] === username) { alreadyPaid = true; break; }
          }
        }
        if (!alreadyPaid) {
          paidSheet.appendRow([username, email, new Date(), session.id || '']);
        }
      }
      return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
    }

    // ── SRS データ保存 ──
    if (type === 'srs') {
      var username = payload.name;
      var srsJson  = JSON.stringify(payload.data || {});
      var sheet    = getSheet_('SRS');
      var lastRow  = sheet.getLastRow();
      var foundRow = -1;
      if (lastRow >= 2) {
        var rows = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < rows.length; i++) {
          if (rows[i][0] === username) { foundRow = i + 2; break; }
        }
      }
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 2, 1, 2).setValues([[srsJson, new Date()]]);
      } else {
        sheet.appendRow([username, srsJson, new Date()]);
      }
      return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
    }

    // ── スコア保存 ──
    var scoreSheet = getSheet_('Sheet1');
    var name       = payload.name;
    var newScore   = Number(payload.score);
    var tag        = payload.tag;
    var lastRow    = scoreSheet.getLastRow();

    if (lastRow < 2) {
      scoreSheet.appendRow([name, newScore, new Date(), tag]);
    } else {
      var data      = scoreSheet.getRange(2, 1, lastRow - 1, 4).getValues();
      var foundIdx  = -1;
      for (var i = 0; i < data.length; i++) {
        if (data[i][0] === name && data[i][3] === tag) { foundIdx = i; break; }
      }
      if (foundIdx !== -1) {
        if (newScore > Number(data[foundIdx][1])) {
          scoreSheet.getRange(foundIdx + 2, 2, 1, 2).setValues([[newScore, new Date()]]);
        }
      } else {
        scoreSheet.appendRow([name, newScore, new Date(), tag]);
      }
    }
    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput('error: ' + err.message)
             .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ── GET ───────────────────────────────────────────────
function doGet(e) {
  var action   = e.parameter.action;
  var callback = e.parameter.callback;

  // ── 有料チェック ──
  if (action === 'isPaid') {
    var username = e.parameter.user;
    var sheet    = getSheet_('Paid');
    var lastRow  = sheet.getLastRow();
    var found    = false;
    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][0] === username) { found = true; break; }
      }
    }
    return ContentService.createTextOutput(
      callback + '(' + JSON.stringify({ paid: found }) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // ── SRS データ取得 ──
  if (action === 'getSRS') {
    var username = e.parameter.user;
    var sheet    = getSheet_('SRS');
    var lastRow  = sheet.getLastRow();
    var srsData  = {};
    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][0] === username) {
          try { srsData = JSON.parse(data[i][1]); } catch (_) {}
          break;
        }
      }
    }
    return ContentService.createTextOutput(
      callback + '(' + JSON.stringify(srsData) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // ── スコア（ランキング）取得 ──
  var sheet   = getSheet_('Sheet1');
  var lastRow = sheet.getLastRow();
  var scores  = [];
  if (lastRow >= 2) {
    var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    scores = data.map(function(row) {
      return { name: String(row[0] || ''), score: Number(row[1]), tag: String(row[3] || '') };
    }).filter(function(s) {
      return s.name.trim() !== '' && !s.name.startsWith('#') &&
             isFinite(s.score)   && s.score >= 0 &&
             s.tag.trim()  !== '' && !s.tag.startsWith('#');
    });
  }
  return ContentService.createTextOutput(
    callback + '(' + JSON.stringify(scores) + ')'
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
