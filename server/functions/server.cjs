const express = require('express');
const path = require('path');
const { log } = require('../vite.cjs');

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

// Helper to define routes
function defineRoutes() {
  // Define API routes
  app.get('/api/sheets/:sheetName', async (req, res) => {
    try {
      const sheetName = req.params.sheetName;
      
      // Return some mock data for testing
      const mockData = {
        main_menu: [
          { id: '1', folder_name: 'Home', display_order: 1, active: 'yes', slug: 'home' },
          { id: '2', folder_name: 'About', display_order: 2, active: 'yes', slug: 'about' }
        ],
        pages: [
          { id: '1', folder_id: '1', page_name: 'Homepage', display_order: 1, active: 'yes', slug: 'home' },
          { id: '2', folder_id: '2', page_name: 'About Us', display_order: 1, active: 'yes', slug: 'about' }
        ],
        content: [
          { id: '1', page_id: '1', content_type: 'text', display_order: 1, content: 'Welcome to our site', active: 'yes' }
        ],
        settings: [
          { key: 'siteName', value: 'My Site' },
          { key: 'footerText', value: 'Copyright 2023' }
        ],
        templates: []
      };
      
      if (mockData[sheetName]) {
        return res.json(mockData[sheetName]);
      } else {
        return res.status(404).json({ error: 'Sheet not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
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
    req.path = event.path.replace(/^\/.netlify\/functions\/server/, '') || '/';
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