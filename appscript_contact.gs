function setupContactSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ms = ss.getSheetByName("Messages");
  if (!ms) {
    ms = ss.insertSheet("Messages");
    ms.appendRow(["Timestamp", "Name", "Email", "Inquiry Type", "Message"]);
    ms.getRange("A1:E1").setFontWeight("bold");
    if(ss.getSheetByName("Sheet1")) ss.deleteSheet(ss.getSheetByName("Sheet1"));
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Validate
    if(!data.name || !data.email || !data.message) {
      return ContentService.createTextOutput(JSON.stringify({success:false, error:"Missing fields"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Save to Sheet "Messages"
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Messages");
    if(!sheet) {
      sheet = ss.insertSheet("Messages");
      sheet.appendRow(["Timestamp", "Name", "Email", "Message"]);
    }
    
    sheet.appendRow([
      new Date().toISOString(),
      data.name,
      data.email,
      data.message
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error:err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
