import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';

// Default Google Sheet ID from the requirements
const DEFAULT_SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

// Function to extract sheet ID from URL
function extractSheetId(url: string): string | null {
  const regex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Add proxy endpoint for Google Sheets
  app.get('/api/sheets/:sheetName', async (req: Request, res: Response) => {
    try {
      const { sheetName } = req.params;
      
      // Check if custom sheet URL was provided in the request
      let sheetId = DEFAULT_SHEET_ID;
      const customSheetUrl = req.headers['x-sheet-url'] as string;
      
      if (customSheetUrl) {
        const extractedId = extractSheetId(customSheetUrl);
        if (extractedId) {
          sheetId = extractedId;
        }
      }
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      console.log(`Fetching from sheet ID: ${sheetId}, sheet name: ${sheetName}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
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
        return res.status(500).json({ error: 'Failed to extract JSON data from Google Sheets response' });
      }
      
      res.set('Content-Type', 'application/json');
      res.send(jsonText);
    } catch (error) {
      console.error(`Error fetching sheet:`, error);
      res.status(500).json({ error: 'Failed to fetch data from Google Sheets' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
