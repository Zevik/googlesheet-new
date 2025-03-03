const express = require('express');
const path = require('path');
const { log } = require('./vite.cjs'); // תיקון הנתיב לקובץ vite.cjs שנמצא באותה תיקייה

// Create Express app
const app = express();

// Enable CORS for Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
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
      
      // Check if custom sheet URL was provided in the request
      let sheetId = DEFAULT_SHEET_ID;
      const customSheetUrl = req.headers['x-sheet-url'];
      
      if (customSheetUrl) {
        const extractedId = extractSheetId(customSheetUrl);
        if (extractedId) {
          sheetId = extractedId;
          console.log('Using custom sheet ID:', sheetId);
        }
      }
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      console.log(`Fetching from sheet ID: ${sheetId}, sheet name: ${sheetName}`);
      
      // Using node-fetch (imported at the top of the file)
      const fetch = require('node-fetch');
      const response = await fetch(url);
      
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
      res.send(jsonText);
      
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