# Knowledge Base Functionality Test Plan

## Overview
This document contains test cases to verify that the Knowledge Base system works correctly for all core functionalities: upload, store, view, download, and delete files.

## Test Environment Setup
- **Local Development**: `netlify dev` running on `http://localhost:8084/`
- **Browser**: Open DevTools Console (F12) to monitor logs
- **Test Files**: Prepare sample files for testing

---

## 1. FILE UPLOAD FUNCTIONALITY

### Test Case 1.1: Basic Text File Upload
**Objective**: Verify basic text file upload and content extraction

**Steps**:
1. Create a test file: `test-upload.txt` with content:
   ```
   This is a test file for Knowledge Base upload.
   It contains multiple lines of text.
   This should be extracted correctly.
   ```
2. Navigate to Knowledge Base section
3. Click "Add Content" or Upload button
4. Select the `.txt` file
5. Fill in:
   - Title: "Test Text File Upload"
   - Description: "Testing text file upload functionality"
   - Category: Select any available category
6. Click Upload

**Expected Results**:
✅ File uploads successfully  
✅ Success message appears  
✅ File appears in Knowledge Base list  
✅ Console shows no errors  
✅ Processing status shows "completed"  

**Test Data**: Text file (.txt) with 3 lines of content

---

### Test Case 1.2: Markdown File Upload
**Objective**: Verify markdown file upload and content extraction

**Steps**:
1. Create a test file: `test-markdown.md` with content:
   ```markdown
   # Test Markdown File
   
   This is a **markdown** file with formatting.
   
   - List item 1
   - List item 2
   
   ## Section 2
   
   Some more content here.
   ```
2. Follow same upload process as Test 1.1
3. Use title: "Test Markdown File"

**Expected Results**:
✅ Markdown file uploads successfully  
✅ Content extracted with markdown formatting preserved  
✅ File appears in Knowledge Base  

---

### Test Case 1.3: JSON File Upload
**Objective**: Verify JSON file upload and content extraction

**Steps**:
1. Create a test file: `test-data.json` with content:
   ```json
   {
     "name": "Knowledge Base Test",
     "type": "JSON Upload Test",
     "data": {
       "test_case": "1.3",
       "description": "Testing JSON file upload"
     }
   }
   ```
2. Upload with title: "Test JSON File"

**Expected Results**:
✅ JSON file uploads successfully  
✅ JSON content extracted and formatted  
✅ File appears in Knowledge Base  

---

### Test Case 1.4: Large File Upload
**Objective**: Test file size limits and performance

**Steps**:
1. Create a larger text file (50KB+) with repeated content
2. Attempt upload

**Expected Results**:
✅ Large file uploads successfully OR  
✅ Appropriate error message for size limit  

---

### Test Case 1.5: Invalid File Upload
**Objective**: Test error handling for unsupported files

**Steps**:
1. Try uploading a binary file (.exe, .zip, etc.)
2. Try uploading with empty content

**Expected Results**:
✅ Appropriate error handling  
✅ Clear error messages  
✅ System remains stable  

---

## 2. CONTENT STORAGE VERIFICATION

### Test Case 2.1: Database Storage Verification
**Objective**: Verify content is properly stored in database

**Steps**:
1. Upload a test file (use Test 1.1)
2. Open browser DevTools Console
3. Navigate to the uploaded file in Knowledge Base
4. Check console logs for file data

**Expected Results**:
✅ `extracted_text` field contains actual file content  
✅ `file_name` matches uploaded file  
✅ `file_type` correctly detected  
✅ `processing_status` is "completed"  
✅ `created_at` timestamp is recent  

---

### Test Case 2.2: Content Integrity Check
**Objective**: Verify uploaded content matches original

**Steps**:
1. Upload a file with known content
2. View the file details in debug mode
3. Compare extracted content with original

**Expected Results**:
✅ Extracted content exactly matches original  
✅ No content truncation or corruption  
✅ Special characters preserved  

---

## 3. FILE VIEWING/PREVIEW FUNCTIONALITY

### Test Case 3.1: Text File Preview
**Objective**: Verify text files display correctly in viewer

**Steps**:
1. Upload a text file (Test 1.1)
2. Click "View" button on the file
3. Observe the FileViewer display

**Expected Results**:
✅ FileViewer opens successfully  
✅ Green banner shows "📝 Showing processed content from text file"  
✅ File content displays correctly formatted  
✅ Title and description shown  
✅ Zoom controls available  

---

### Test Case 3.2: Markdown File Preview
**Objective**: Verify markdown files display in viewer

**Steps**:
1. Upload markdown file (Test 1.2)
2. View the file
3. Check content formatting

**Expected Results**:
✅ Markdown content displays  
✅ Raw markdown text shown (not rendered HTML)  
✅ Content is readable and properly formatted  

---

### Test Case 3.3: File Without Content Preview
**Objective**: Test fallback behavior for files without content

**Steps**:
1. If you have a file with no extracted content, view it
2. Check the debug information displayed

**Expected Results**:
✅ "Preview Not Available" message shown  
✅ Debug information displays:  
   - File type  
   - Has extracted text: No  
   - Processing status  
   - Text length: 0 characters  
✅ Download button still available  

---

### Test Case 3.4: Zoom Functionality
**Objective**: Test zoom controls in file viewer

**Steps**:
1. Open any file with content in viewer
2. Click zoom in (+) button multiple times
3. Click zoom out (-) button multiple times

**Expected Results**:
✅ Content scales appropriately  
✅ Zoom percentage updates  
✅ Content remains readable  
✅ Zoom limits enforced (50% - 200%)  

---

## 4. FILE DOWNLOAD FUNCTIONALITY

### Test Case 4.1: Basic Download Test
**Objective**: Verify file download works correctly

**Steps**:
1. Upload a test file (Test 1.1)
2. Click "Download" button from Knowledge Base list OR from FileViewer
3. Check downloaded file

**Expected Results**:
✅ Download starts immediately  
✅ File downloads with correct name and extension  
✅ Downloaded content matches original + metadata  
✅ Success toast notification appears  
✅ Console shows download completion log  

---

### Test Case 4.2: Download Content Verification
**Objective**: Verify downloaded content is correct

**Steps**:
1. Download a file you uploaded
2. Open the downloaded file in text editor
3. Compare with original content

**Expected Results**:
✅ Downloaded file contains:  
   - Title: [Original Title]  
   - Description: [Original Description]  
   - Content: [Original File Content]  
✅ Content is readable and properly formatted  
✅ No corruption or encoding issues  

---

### Test Case 4.3: Download Error Handling
**Objective**: Test download error scenarios

**Steps**:
1. Try downloading from a file with no content
2. Check error handling

**Expected Results**:
✅ Download still works (creates info file)  
✅ Appropriate error message if needed  
✅ System remains stable  

---

### Test Case 4.4: Multiple File Downloads
**Objective**: Test downloading multiple files

**Steps**:
1. Upload 3-5 different files
2. Download each one
3. Verify all downloads work

**Expected Results**:
✅ All files download successfully  
✅ Unique filenames for each download  
✅ No conflicts or overwrites  

---

## 5. FILE DELETION FUNCTIONALITY

### Test Case 5.1: Basic Delete Test
**Objective**: Verify file deletion works

**Steps**:
1. Upload a test file
2. Locate delete option (usually in dropdown menu)
3. Confirm deletion
4. Verify file is removed

**Expected Results**:
✅ Confirmation dialog appears  
✅ File deleted successfully  
✅ File removed from Knowledge Base list  
✅ Success message shown  

---

### Test Case 5.2: Delete Verification
**Objective**: Ensure deleted files are completely removed

**Steps**:
1. Note the number of files before deletion
2. Delete a file
3. Refresh the page
4. Count files again

**Expected Results**:
✅ File count decreased by 1  
✅ Deleted file not visible after refresh  
✅ Other files unaffected  

---

## 6. KNOWLEDGE BASE INTEGRATION TESTS

### Test Case 6.1: Dashboard Integration
**Objective**: Verify Knowledge Base integrates with Dashboard

**Steps**:
1. Upload several files
2. Go to Dashboard
3. Check "Recent Activity" section

**Expected Results**:
✅ Uploaded files appear in recent activity  
✅ File count statistics updated  
✅ "Knowledge Base" button works  

---

### Test Case 6.2: Navigation Test
**Objective**: Test navigation between sections

**Steps**:
1. Navigate: Dashboard → Knowledge Base → File Viewer → Back
2. Test all navigation paths

**Expected Results**:
✅ All navigation links work  
✅ Back buttons function correctly  
✅ No broken routes or 404 errors  

---

## 7. ERROR HANDLING & EDGE CASES

### Test Case 7.1: Network Error Simulation
**Objective**: Test offline/network error handling

**Steps**:
1. Disconnect internet
2. Try uploading a file
3. Try viewing existing files

**Expected Results**:
✅ Appropriate error messages  
✅ No app crashes  
✅ Graceful degradation  

---

### Test Case 7.2: Concurrent Operations
**Objective**: Test multiple simultaneous operations

**Steps**:
1. Upload multiple files simultaneously
2. Download while uploading
3. View files during operations

**Expected Results**:
✅ All operations complete successfully  
✅ No race conditions or conflicts  
✅ UI remains responsive  

---

## 8. PERFORMANCE TESTS

### Test Case 8.1: Large Content Handling
**Objective**: Test performance with large text content

**Steps**:
1. Upload file with 10,000+ lines of text
2. View the file
3. Test scrolling and zoom

**Expected Results**:
✅ File uploads successfully  
✅ Viewer remains responsive  
✅ Content displays without lag  

---

### Test Case 8.2: Multiple Files Performance
**Objective**: Test performance with many files

**Steps**:
1. Upload 20+ files
2. Test list view and grid view
3. Test search/filter functionality

**Expected Results**:
✅ Interface remains responsive  
✅ All files load correctly  
✅ No memory leaks  

---

## CHECKLIST: OVERALL SYSTEM VERIFICATION

### Core Functionality ✅
- [ ] File Upload (txt, md, json)
- [ ] Content Extraction
- [ ] File Storage
- [ ] File Viewing/Preview
- [ ] File Download
- [ ] File Deletion

### User Interface ✅
- [ ] Knowledge Base List View
- [ ] Knowledge Base Grid View
- [ ] File Viewer Interface
- [ ] Upload Dialog
- [ ] Error Messages
- [ ] Success Notifications

### Integration ✅
- [ ] Dashboard Integration
- [ ] Navigation Flow
- [ ] Back Button Functionality
- [ ] Search/Filter (if implemented)

### Error Handling ✅
- [ ] Invalid File Types
- [ ] Network Errors
- [ ] Large Files
- [ ] Empty Content
- [ ] Server Errors

### Performance ✅
- [ ] Upload Speed
- [ ] View Loading Time
- [ ] Download Speed
- [ ] UI Responsiveness

---

## EXECUTION INSTRUCTIONS

1. **Setup**: Start `netlify dev` and open browser with DevTools
2. **Sequential Testing**: Run tests in order 1.1 → 1.2 → 1.3... etc.
3. **Document Results**: Mark ✅ or ❌ for each test case
4. **Log Issues**: Note any failures with error messages
5. **Edge Case Testing**: Test unusual scenarios
6. **Performance Check**: Monitor browser performance tab

## TROUBLESHOOTING

**If Upload Fails (500 Error)**:
- Check `netlify dev` terminal for error logs
- Verify environment variables are loaded
- Check Supabase connection

**If Preview Shows "Not Available"**:
- Check console logs for file data
- Verify `extracted_text` field has content
- Check file type detection

**If Download Fails**:
- Check browser network tab
- Verify file ID exists
- Check download service logs

---

This test plan covers all major functionality and edge cases. Execute these tests to verify your Knowledge Base system works correctly! 🚀 