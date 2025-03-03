import express from 'express';
import { registerRoutes } from '../routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, serveStatic } from '../vite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Enable CORS for Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static files from the dist folder
app.use(express.static(path.resolve(__dirname, '../../public')));

// Parse JSON request bodies
app.use(express.json());

// Routes will be registered in the handler function
let routesRegistered = false;

// For Netlify Functions - create a serverless handler
export async function handler(event, context) {
  // Register routes if not done yet
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }

  // Log the incoming request for debugging
  log(`Request: ${event.path} [${event.httpMethod}]`);

  // Create a new Express Router for each invocation
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
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;
    
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
    const result = await router(event, context);
    return result;
  } catch (error) {
    log(`Error processing request: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}