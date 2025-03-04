const express = require('express');
const path = require('path');
const { log } = require('./vite.cjs'); // תיקון הנתיב לקובץ vite.cjs שנמצא באותה תיקייה
// Use isomorphic-fetch which works in both browser and server environments
require('isomorphic-fetch');
// As a fallback, also try to use node-fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.log('node-fetch not available, using global fetch from isomorphic-fetch');
  fetch = global.fetch;
}

// Create Express app
const app = express();

// Enable CORS for Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-sheet-url');
  next();
});

// Serve static files
app.use(express.static(path.resolve(__dirname, '../../public')));

// Parse JSON request bodies
app.use(express.json());

// A map to store routes
const routes = new Map();

// Default Google Sheet ID
const DEFAULT_SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

// Function to extract sheet ID from URL
function extractSheetId(url) {
  const regex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper to define routes
function defineRoutes() {
  // Handler function for Google Sheets API requests
  const apiHandler = async (req, res) => {
    try {
      const sheetName = req.params.sheetName;
      console.log('API request for sheet:', sheetName);
      
      // Validate sheet name to prevent injection attacks
      if (!sheetName || !/^[a-zA-Z0-9_-]+$/.test(sheetName)) {
        console.error('Invalid sheet name:', sheetName);
        return res.status(400).json({ error: 'Invalid sheet name' });
      }
      
      // Check if custom sheet URL was provided in the request
      let sheetId = DEFAULT_SHEET_ID;
      const customSheetUrl = req.headers['x-sheet-url'];
      
      if (customSheetUrl) {
        const extractedId = extractSheetId(customSheetUrl);
        if (extractedId) {
          sheetId = extractedId;
          console.log('Using custom sheet ID:', sheetId);
        } else {
          console.warn('Invalid custom sheet URL format:', customSheetUrl);
        }
      }
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      console.log(`Fetching from sheet ID: ${sheetId}, sheet name: ${sheetName}`);
      
      try {
        // Using fetch that was imported at the top of the file
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Netlify Function)',
            'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (!response.ok) {
          console.error(`Google Sheets API error: ${response.status} ${response.statusText}`);
          return res.status(response.status).json({ 
            error: `Failed to fetch data from Google Sheets: ${response.statusText}` 
          });
        }
        
        const text = await response.text();
        
        // Extract the JSON part from the response
        // The response is in the format: /*O_o*/ google.visualization.Query.setResponse({...});
        const jsonText = text.replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/, '')
                          .replace(/\);$/, '');
        
        if (!jsonText) {
          console.error('Failed to extract JSON from Google Sheets response');
          return res.status(500).json({ error: 'Failed to extract JSON data from Google Sheets response' });
        }
        
        // Check if jsonText is valid JSON
        try {
          JSON.parse(jsonText);
        } catch (err) {
          console.error('Invalid JSON from Google Sheets:', err);
          console.log('Raw response:', text);
          return res.status(500).json({ error: 'Invalid JSON response from Google Sheets' });
        }
        
        // Set headers and send the response
        res.set('Content-Type', 'application/json');
        res.set('Cache-Control', 'no-cache');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type, x-sheet-url');
        res.send(jsonText);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return res.status(500).json({ 
          error: 'Failed to connect to Google Sheets API', 
          details: fetchError.message
        });
      }
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };

  // Register the path for both possible locations
  app.get('/api/sheets/:sheetName', apiHandler);
  
  // Additional path in case the path doesn't arrive as expected
  app.get('/.netlify/functions/server/api/sheets/:sheetName', apiHandler);
}

// Initialize routes
defineRoutes();

// For Netlify Functions - create a serverless handler
exports.handler = async function(event, context) {
  // Log the incoming request for debugging
  console.log(`Request: ${event.path} [${event.httpMethod}]`);

  // Create a router for handling the request
  const router = express.Router();
  
  // This router will handle all requests to the serverless function
  router.all('*', (req, res) => {
    // Bridge between Netlify event and Express
    // נשנה את ההתנהגות כדי שיתמוך גם בניתוב ישיר לנתיב וגם בניתוב דרך פונקציות נטליפיי
    console.log('Original path:', event.path);
    
    // Check for OPTIONS requests and handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, x-sheet-url',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
          'Access-Control-Max-Age': '86400'
        },
        body: ''
      };
    }
    
    // Handle API requests for Google Sheets
    if (event.path.includes('/api/sheets/') || event.path.includes('/.netlify/functions/server/api/sheets/')) {
      // Extract sheet name from path
      const sheetNameMatch = event.path.match(/\/api\/sheets\/([^\/]+)$/) || 
                            event.path.match(/\/.netlify\/functions\/server\/api\/sheets\/([^\/]+)$/);
      
      if (sheetNameMatch && sheetNameMatch[1]) {
        const sheetName = decodeURIComponent(sheetNameMatch[1]);
        console.log('Direct function call for sheet:', sheetName);
        
        // Create a simplified req object
        req.params = { sheetName };
        req.headers = event.headers;
        req.method = event.httpMethod;
        
        // Create a simplified response handler
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        
        res.set = (name, value) => {
          if (!res.headers) res.headers = {};
          res.headers[name] = value;
          return res;
        };
        
        res.json = (data) => {
          return {
            statusCode: res.statusCode || 200,
            headers: Object.assign({}, res.headers || {}, { 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
          };
        };
        
        res.send = (data) => {
          return {
            statusCode: res.statusCode || 200,
            headers: Object.assign({}, res.headers || {}, { 'Content-Type': 'application/json' }),
            body: typeof data === 'object' ? JSON.stringify(data) : data
          };
        };
        
        // Find and execute the handler
        const apiHandler = app._router.stack
          .filter(layer => layer.route && (
            layer.route.path === '/api/sheets/:sheetName' || 
            layer.route.path === '/.netlify/functions/server/api/sheets/:sheetName'
          ))
          .map(layer => layer.route.stack[0].handle)[0];
        
        if (apiHandler) {
          return apiHandler(req, res, () => {
            return {
              statusCode: 404,
              body: 'Not Found'
            };
          });
        }
      }
    }
    
    // Standard handling for other paths
    const normalizedPath = event.path
      .replace(/^\/.netlify\/functions\/server/, '') // מסיר את הקידומת של נטליפיי פונקציות
      .replace(/^\/\.netlify\/functions\/server/, '') // מסיר קידומות אפשריות אחרות
      || '/';
    
    console.log('Normalized path:', normalizedPath);
    req.path = normalizedPath;
    req.method = event.httpMethod;
    req.headers = event.headers;
    req.query = event.queryStringParameters || {};
    
    if (event.body) {
      try {
        req.body = JSON.parse(event.body);
      } catch (error) {
        req.body = event.body;
      }
    }
    
    // Create a response object for Netlify
    const response = {
      statusCode: 200,
      headers: {},
      body: ''
    };
    
    // Intercept res methods
    res.status = (code) => {
      response.statusCode = code;
      return res;
    };
    
    res.set = (name, value) => {
      response.headers[name] = value;
      return res;
    };
    
    res.json = (data) => {
      response.body = JSON.stringify(data);
      response.headers['Content-Type'] = 'application/json';
      return response;
    };
    
    res.send = (data) => {
      response.body = typeof data === 'object' ? JSON.stringify(data) : data;
      return response;
    };
    
    // Process the request through the Express app
    app(req, res, () => {
      // If we get here, no route handled the request
      return {
        statusCode: 404,
        body: 'Not Found'
      };
    });
  });
  
  // Handle the request
  try {
    return await new Promise((resolve) => {
      router(event, context, () => {
        resolve({
          statusCode: 404,
          body: 'Not Found'
        });
      });
    });
  } catch (error) {
    console.error(`Error processing request: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};