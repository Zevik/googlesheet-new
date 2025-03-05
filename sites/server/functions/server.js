const fetch = require('node-fetch');

// Default Google Sheet ID
const DEFAULT_SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

// Function to extract sheet ID from URL
function extractSheetId(url) {
  const regex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Handle Google Sheets API requests
async function handleGoogleSheetsRequest(event) {
  try {
    // Extract sheet name from URL
    const sheetMatch = event.path.match(/\/api\/sheets\/([^\/]+)$/) || 
                      event.path.match(/\/.netlify\/functions\/server\/api\/sheets\/([^\/]+)$/);
    
    if (!sheetMatch || !sheetMatch[1]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid sheet name in URL' })
      };
    }
    
    const sheetName = decodeURIComponent(sheetMatch[1]);
    console.log('API request for sheet:', sheetName);
    
    // Get sheet ID (default or custom)
    let sheetId = DEFAULT_SHEET_ID;
    const customSheetUrl = event.headers['x-sheet-url'];
    
    if (customSheetUrl) {
      const extractedId = extractSheetId(customSheetUrl);
      if (extractedId) {
        sheetId = extractedId;
        console.log('Using custom sheet ID:', sheetId);
      }
    }
    
    // Fetch from Google Sheets
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    console.log(`Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google Sheets API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch data: ${response.statusText}` })
      };
    }
    
    const text = await response.text();
    
    // Extract JSON from the Google Sheets response format
    const jsonText = text.replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/, '')
                     .replace(/\);$/, '');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: jsonText
    };
    
  } catch (error) {
    console.error('Error handling Google Sheets request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
}

// Main serverless function handler
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-sheet-url',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-cache'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // Handle Google Sheets API requests
  if (event.path.includes('/api/sheets/')) {
    const response = await handleGoogleSheetsRequest(event);
    // Add CORS headers to the response
    return {
      ...response,
      headers: { ...headers, ...response.headers }
    };
  }
  
  // For any other request
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Endpoint not found' })
  };
};