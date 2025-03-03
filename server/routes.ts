import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';

// Google Sheet ID from the requirements
const SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Add proxy endpoint for Google Sheets
  app.get('/api/sheets/:sheetName', async (req: Request, res: Response) => {
    try {
      const { sheetName } = req.params;
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Extract the JSON part from the response
      const jsonText = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)?.[1];
      
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
