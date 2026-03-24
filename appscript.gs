/**
 * Google Apps Script Backend for Startup Journal
 * Handle Database Storage & Google Drive Meda Uploads
 */

const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // The subagent will replace this
const DRIVE_FOLDER_ID = ''; // Optional specific folder. If empty, saves to root.

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'signup':
        return signupUser(data);
      case 'login':
        return loginUser(data);
      case 'submitPost':
        return submitPost(data);
      case 'getPosts':
        return getPosts(data);
      case 'getAllPendingPosts':
        return getAllPendingPosts(data);
      case 'approvePost':
        return approvePost(data);
      case 'rejectPost':
        return rejectPost(data);
      default:
        return jsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doOptions(e) {
  return HtmlService.createHtmlOutput("")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function signupUser(data) {
  // Hardcoded check
  if (data.email === 'admin@gmail.com') {
    return jsonResponse({ success: false, error: 'Cannot register reserved admin' });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][1] === data.email) {
      return jsonResponse({ success: false, error: 'User already exists' });
    }
  }

  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  sheet.appendRow([id, data.email, data.password, 'user', timestamp]);
  
  return jsonResponse({ success: true, user: { id: id, email: data.email, role: 'user' } });
}

function loginUser(data) {
  // Hardcoded Admin Override
  if (data.email === 'admin@gmail.com' && data.password === 'Admin@123') {
    return jsonResponse({ 
      success: true, 
      user: { id: 'admin_sys', email: data.email, role: 'admin' } 
    });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    const [id, email, password, role] = dataRange[i];
    if (email === data.email && password === data.password) {
      return jsonResponse({ success: true, user: { id: id, email: email, role: role } });
    }
  }
  
  return jsonResponse({ success: false, error: 'Invalid credentials' });
}

function uploadFileToDrive(fileObj) {
  if (!fileObj || !fileObj.data) return '';
  try {
    const base64Data = fileObj.data.split(',')[1] || fileObj.data;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), fileObj.type, fileObj.name);
    const file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl(); 
  } catch(e) {
    return '';
  }
}

function submitPost(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Posts");
  const postId = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  
  // Upload base64 files directly to Google Drive
  let uploadedImageUrl = '';
  let uploadedVideoUrl = '';

  if (data.imageFile) uploadedImageUrl = uploadFileToDrive(data.imageFile);
  if (data.videoFile) uploadedVideoUrl = uploadFileToDrive(data.videoFile);
  
  sheet.appendRow([
    postId, 
    data.title, 
    data.description, 
    uploadedImageUrl, 
    uploadedVideoUrl, 
    data.caption || '', 
    'Pending', 
    timestamp, 
    data.userEmail
  ]);
  
  return jsonResponse({ success: true, message: 'Post submitted for review' });
}

function getPosts(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Posts");
  const dataRange = sheet.getDataRange().getValues();
  const posts = [];
  
  for (let i = 1; i < dataRange.length; i++) {
    const row = dataRange[i];
    if (row[6] === 'Approved') {
      posts.push({
        id: row[0], title: row[1], description: row[2],
        imageUrl: row[3], videoUrl: row[4], caption: row[5],
        status: row[6], createdAt: row[7], userEmail: row[8]
      });
    }
  }
  
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return jsonResponse({ success: true, posts: posts });
}

function getAllPendingPosts(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Posts");
  const dataRange = sheet.getDataRange().getValues();
  const posts = [];
  
  if (!data.isAdmin) return jsonResponse({ success: false, error: 'Unauthorized' });

  for (let i = 1; i < dataRange.length; i++) {
    const row = dataRange[i];
    if (row[6] === 'Pending') {
      posts.push({
        id: row[0], title: row[1], description: row[2],
        imageUrl: row[3], videoUrl: row[4], caption: row[5],
        status: row[6], createdAt: row[7], userEmail: row[8]
      });
    }
  }
  
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return jsonResponse({ success: true, posts: posts });
}

function updatePostStatus(postId, newStatus) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Posts");
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === postId) {
      sheet.getRange(i + 1, 7).setValue(newStatus); 
      return true;
    }
  }
  return false;
}

function approvePost(data) {
  if (!data.isAdmin) return jsonResponse({ success: false, error: 'Unauthorized' });
  const updated = updatePostStatus(data.postId, 'Approved');
  if (updated) return jsonResponse({ success: true, message: 'Post approved' });
  return jsonResponse({ success: false, error: 'Post not found' });
}

function rejectPost(data) {
  if (!data.isAdmin) return jsonResponse({ success: false, error: 'Unauthorized' });
  const updated = updatePostStatus(data.postId, 'Rejected');
  if (updated) return jsonResponse({ success: true, message: 'Post rejected' });
  return jsonResponse({ success: false, error: 'Post not found' });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
