#!/usr/bin/env node

/**
 * Knowledge Base Automated Test Script
 * 
 * This script performs basic automated tests for the Knowledge Base functionality.
 * Run this after starting `netlify dev` to verify core features work.
 * 
 * Usage: node scripts/test-knowledge-base.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8084',
  apiUrl: 'http://localhost:8084/api',
  testTimeout: 30000,
  testFiles: {
    text: {
      name: 'test-text.txt',
      content: 'This is a test text file.\nIt has multiple lines.\nTesting Knowledge Base upload.',
      expectedType: 'text'
    },
    markdown: {
      name: 'test-markdown.md',
      content: '# Test Markdown\n\nThis is **bold** text.\n\n- Item 1\n- Item 2',
      expectedType: 'text'
    },
    json: {
      name: 'test-data.json',
      content: JSON.stringify({
        test: 'Knowledge Base Test',
        type: 'JSON',
        data: { success: true }
      }, null, 2),
      expectedType: 'application'
    }
  }
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName}: PASSED ${details}`, 'success');
  } else {
    testResults.failed++;
    log(`${testName}: FAILED ${details}`, 'error');
  }
  
  testResults.details.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

// Create test files
function createTestFiles() {
  log('Creating test files...');
  
  const testDir = path.join(__dirname, '../temp-test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  Object.values(TEST_CONFIG.testFiles).forEach(file => {
    const filePath = path.join(testDir, file.name);
    fs.writeFileSync(filePath, file.content, 'utf8');
    log(`Created: ${file.name}`);
  });
  
  return testDir;
}

// Clean up test files
function cleanupTestFiles(testDir) {
  log('Cleaning up test files...');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    log('Test files cleaned up');
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  log('Testing API endpoints...');
  
  try {
    // Test knowledge items endpoint
    const response = await fetch(`${TEST_CONFIG.apiUrl}/knowledge-base/items`);
    const isSuccess = response.ok;
    
    addTestResult(
      'API Endpoint - Knowledge Items',
      isSuccess,
      isSuccess ? `Status: ${response.status}` : `Error: ${response.status} ${response.statusText}`
    );
    
    if (isSuccess) {
      const data = await response.json();
      const isValidResponse = Array.isArray(data) || (data && data.data && Array.isArray(data.data));
      
      addTestResult(
        'API Response Format',
        isValidResponse,
        isValidResponse ? 'Valid array response' : 'Invalid response format'
      );
    }
    
  } catch (error) {
    addTestResult('API Endpoint - Knowledge Items', false, `Network error: ${error.message}`);
  }
}

// Test categories endpoint
async function testCategoriesEndpoint() {
  log('Testing categories endpoint...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.apiUrl}/knowledge-base/categories`);
    const isSuccess = response.ok;
    
    addTestResult(
      'API Endpoint - Categories',
      isSuccess,
      isSuccess ? `Status: ${response.status}` : `Error: ${response.status} ${response.statusText}`
    );
    
    if (isSuccess) {
      const data = await response.json();
      const hasCategories = Array.isArray(data) && data.length > 0;
      
      addTestResult(
        'Categories Available',
        hasCategories,
        hasCategories ? `Found ${data.length} categories` : 'No categories found'
      );
    }
    
  } catch (error) {
    addTestResult('API Endpoint - Categories', false, `Network error: ${error.message}`);
  }
}

// Test file upload simulation
async function testFileUploadSimulation() {
  log('Testing file upload simulation...');
  
  const testFile = TEST_CONFIG.testFiles.text;
  
  try {
    const uploadData = {
      categoryId: '1', // Default category
      title: 'Automated Test File',
      description: 'File uploaded by automated test script',
      metadata: {
        subject: 'Testing',
        tags: ['automated', 'test']
      }
    };
    
    const requestBody = {
      uploadData: JSON.stringify(uploadData),
      fileName: testFile.name,
      fileSize: testFile.content.length,
      fileType: 'text/plain',
      fileContent: testFile.content
    };
    
    const response = await fetch(`${TEST_CONFIG.apiUrl}/knowledge-base/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const isSuccess = response.ok;
    
    addTestResult(
      'File Upload Simulation',
      isSuccess,
      isSuccess ? `Status: ${response.status}` : `Error: ${response.status} ${response.statusText}`
    );
    
    if (isSuccess) {
      const result = await response.json();
      const hasData = result && (result.data || result.success);
      
      addTestResult(
        'Upload Response Valid',
        hasData,
        hasData ? 'Valid upload response' : 'Invalid response structure'
      );
      
      return result.data || result;
    } else {
      const errorText = await response.text();
      log(`Upload error details: ${errorText}`, 'error');
    }
    
  } catch (error) {
    addTestResult('File Upload Simulation', false, `Network error: ${error.message}`);
  }
  
  return null;
}

// Test environment variables
function testEnvironmentSetup() {
  log('Testing environment setup...');
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let envVarsSet = 0;
  
  requiredEnvVars.forEach(envVar => {
    const isSet = process.env[envVar] !== undefined;
    envVarsSet += isSet ? 1 : 0;
    
    addTestResult(
      `Environment Variable - ${envVar}`,
      isSet,
      isSet ? 'Set' : 'Missing'
    );
  });
  
  const allEnvVarsSet = envVarsSet === requiredEnvVars.length;
  addTestResult(
    'Environment Setup Complete',
    allEnvVarsSet,
    `${envVarsSet}/${requiredEnvVars.length} variables set`
  );
}

// Generate test report
function generateTestReport() {
  log('\n' + '='.repeat(60));
  log('KNOWLEDGE BASE TEST REPORT');
  log('='.repeat(60));
  
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  log('\n📊 DETAILED RESULTS:');
  testResults.details.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    log(`${status} ${result.name} - ${result.details}`);
  });
  
  log('\n🔧 RECOMMENDATIONS:');
  
  if (testResults.failed > 0) {
    log('• Check netlify dev is running on localhost:8084', 'warning');
    log('• Verify environment variables are set', 'warning');
    log('• Check Supabase connection', 'warning');
    log('• Review console logs for detailed errors', 'warning');
  } else {
    log('• All basic tests passed! ✨', 'success');
    log('• Ready for manual testing with the test plan', 'success');
    log('• Consider running performance tests with large files', 'info');
  }
  
  log('\n📋 NEXT STEPS:');
  log('1. Execute manual test cases from KNOWLEDGE_BASE_TEST_PLAN.md');
  log('2. Test file upload through UI');
  log('3. Verify file viewing and download functionality');
  log('4. Test error handling scenarios');
  
  return testResults.passed === testResults.total;
}

// Main test execution
async function runTests() {
  log('🚀 Starting Knowledge Base Automated Tests');
  log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  log(`API URL: ${TEST_CONFIG.apiUrl}`);
  
  const testDir = createTestFiles();
  
  try {
    // Run all tests
    testEnvironmentSetup();
    await testAPIEndpoints();
    await testCategoriesEndpoint();
    await testFileUploadSimulation();
    
    // Generate report
    const allTestsPassed = generateTestReport();
    
    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    log(`Unexpected error during testing: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    cleanupTestFiles(testDir);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Test execution interrupted', 'warning');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  runTests,
  TEST_CONFIG,
  testResults
}; 