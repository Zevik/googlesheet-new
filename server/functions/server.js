const fetch = require('node-fetch');

// אין ברירת מחדל - רק מה שנשלח בכותרת הבקשה או בפרמטר
// const DEFAULT_SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

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
    
    // Extract site ID and sheet name from URL for site-specific requests
    const siteMatch = event.path.match(/\/api\/sites\/([^\/]+)\/sheets\/([^\/]+)$/) || 
                     event.path.match(/\/.netlify\/functions\/server\/api\/sites\/([^\/]+)\/sheets\/([^\/]+)$/);
    
    // Handle site-specific requests
    if (siteMatch && siteMatch[1] && siteMatch[2]) {
      const siteId = siteMatch[1];
      const sheetName = decodeURIComponent(siteMatch[2]);
      console.log('API request for site:', siteId, 'sheet:', sheetName);
      
      // כאן יש לקבל את ה-URL של הגיליון ממסד הנתונים לפי ה-siteId
      // לצורך הדוגמה, נשתמש בפרמטר בבקשה
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const sheetId = queryParams.get('sheetId');
      
      if (!sheetId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing required query parameter: sheetId' })
        };
      }
      
      // Fetch from Google Sheets
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      console.log(`Fetching from site: ${siteId}, sheet ID: ${sheetId}, sheet name: ${sheetName}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Google Sheets API error:', response.status, response.statusText);
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: `Failed to fetch data from Google Sheets: ${response.statusText}` })
        };
      }
      
      const text = await response.text();
      
      // Extract the JSON part from the response
      const jsonText = text.replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/, '')
                           .replace(/\);$/, '');
      
      if (!jsonText) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to extract JSON data from Google Sheets response' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: jsonText
      };
    }
    
    // Handle regular sheet requests
    if (!sheetMatch || !sheetMatch[1]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid sheet name in URL' })
      };
    }
    
    const sheetName = decodeURIComponent(sheetMatch[1]);
    console.log('API request for sheet:', sheetName);
    
    // Get sheet ID (from query or header)
    let sheetId = null;
    const customSheetUrl = event.headers['x-sheet-url'];
    const queryParams = new URLSearchParams(event.queryStringParameters || {});
    const querySheetId = queryParams.get('sheetId');
    
    // אם התקבל מזהה גיליון ישירות בפרמטר - נשתמש בו
    if (querySheetId) {
      sheetId = querySheetId;
    } 
    // אחרת ננסה לחלץ מזהה מהכתובת שהתקבלה בכותרת
    else if (customSheetUrl) {
      const extractedId = extractSheetId(customSheetUrl);
      if (extractedId) {
        sheetId = extractedId;
        console.log('Using custom sheet ID:', sheetId);
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid Google Sheets URL format: ' + customSheetUrl })
        };
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required header: x-sheet-url or query parameter: sheetId' })
      };
    }
    
    // Fetch from Google Sheets
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    console.log(`Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google Sheets API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch data from Google Sheets: ${response.statusText}` })
      };
    }
    
    const text = await response.text();
    
    // Extract the JSON part from the response
    const jsonText = text.replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/, '')
                         .replace(/\);$/, '');
    
    if (!jsonText) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to extract JSON data from Google Sheets response' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: jsonText
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

// Handle health check requests
function handleHealthCheck() {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
  };
}

// Main handler function
exports.handler = async function(event, context) {
  console.log('Request path:', event.path);
  
  // Health check endpoint
  if (event.path === '/.netlify/functions/server/api/health' || 
      event.path === '/api/health') {
    return handleHealthCheck();
  }
  
  // Google Sheets API endpoints
  if (event.path.match(/\/api\/sheets\//) || 
      event.path.match(/\/.netlify\/functions\/server\/api\/sheets\//) ||
      event.path.match(/\/api\/sites\/[^\/]+\/sheets\//) ||
      event.path.match(/\/.netlify\/functions\/server\/api\/sites\/[^\/]+\/sheets\//)) {
    return handleGoogleSheetsRequest(event);
  }
  
  // Default response for unknown endpoints
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not found' })
  };
};