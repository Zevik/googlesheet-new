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

// Helper to define routes
function defineRoutes() {
  // Define API routes for both direct access and via Netlify Functions
  const apiHandler = async (req, res) => {
    try {
      const sheetName = req.params.sheetName;
      console.log('API request for sheet:', sheetName);
      
      // Return some mock data for testing
      const mockData = {
        main_menu: [
          { id: '1', folder_name: 'Home', display_order: 1, active: 'yes', slug: 'home' },
          { id: '2', folder_name: 'בלוג', display_order: 2, active: 'yes', slug: 'blog' },
          { id: '3', folder_name: 'יסודות הבינה המלאכותית', display_order: 3, active: 'yes', slug: 'ai-basics' },
          { id: '4', folder_name: 'כלים ויישומים', display_order: 4, active: 'yes', slug: 'tools' }
        ],
        pages: [
          { id: '1', folder_id: '1', page_name: 'דף הבית', display_order: 1, active: 'yes', slug: 'home', meta_description: 'דף הבית של האתר', seo_title: 'דף הבית' },
          { id: '2', folder_id: '2', page_name: 'בלוג', display_order: 1, active: 'yes', slug: 'blog', meta_description: 'המאמרים שלנו', seo_title: 'בלוג' },
          { id: '3', folder_id: '3', page_name: 'מה זה בינה מלאכותית?', display_order: 1, active: 'yes', slug: 'what-is-ai', meta_description: 'מבוא לבינה מלאכותית', seo_title: 'מה זה בינה מלאכותית?' },
          { id: '4', folder_id: '4', page_name: 'כלים מובילים', display_order: 1, active: 'yes', slug: 'leading-tools', meta_description: 'הכלים המובילים בתחום', seo_title: 'כלים מובילים' }
        ],
        content: [
          { id: '1', page_id: '1', content_type: 'title', display_order: 1, content: 'ברוך הבא לעולם הבינה המלאכותית', active: 'yes' },
          { id: '2', page_id: '1', content_type: 'text', display_order: 2, content: 'אתר זה נועד לספק מידע וכלים בנושא בינה מלאכותית', active: 'yes' },
          { id: '3', page_id: '1', content_type: 'image', display_order: 3, content: 'https://i.postimg.cc/8N2WrbLN/LOGOGO.jpg', active: 'yes' }
        ],
        settings: [
          { key: 'siteName', value: 'עולם הבינה המלאכותית' },
          { key: 'logo', value: 'https://i.postimg.cc/8N2WrbLN/LOGOGO.jpg' },
          { key: 'footerText', value: 'כל הזכויות שמורות לאתר הבינה המלאכותית © 2025' },
          { key: 'primaryColor', value: '#1A73E8' },
          { key: 'secondaryColor', value: '#FF9800' },
          { key: 'language', value: 'he' },
          { key: 'rtl', value: 'TRUE' },
          { key: 'contactEmail', value: 'info@aiworld.co.il' },
          { key: 'phoneNumber', value: '03-1234567' },
          { key: 'address', value: 'רח\' הטכנולוגיה 10 תל אביב' }
        ],
        templates: []
      };
      
      if (mockData[sheetName]) {
        const data = mockData[sheetName];
        console.log(`Returning ${data.length} items for ${sheetName}`);
        return res.json(data);
      } else {
        console.log(`Sheet "${sheetName}" not found`);
        return res.status(404).json({ error: 'Sheet not found' });
      }
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };

  // רישום הנתיב לשני מיקומים אפשריים
  app.get('/api/sheets/:sheetName', apiHandler);
  
  // נתיב נוסף למקרה שהנתיב לא מגיע כמצופה
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