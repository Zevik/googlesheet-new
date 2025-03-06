import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';
import { db } from "./db";
import { sites, insertSiteSchema, updateSiteSchema } from "../shared/schema";
import { eq } from "drizzle-orm";

// אין ברירת מחדל - רק מה שנשלח בכותרת הבקשה או בפרמטר
// const DEFAULT_SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

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

  // נקודות קצה לניהול אתרים
  
  // קבלת כל האתרים
  app.get('/api/sites', async (req: Request, res: Response) => {
    try {
      const allSites = await db.select().from(sites);
      res.json(allSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
      res.status(500).json({ error: 'Failed to fetch sites' });
    }
  });
  
  // קבלת אתר לפי מזהה
  app.get('/api/sites/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const site = await db.select().from(sites).where(eq(sites.siteId, siteId)).limit(1);
      
      if (site.length === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      res.json(site[0]);
    } catch (error) {
      console.error('Error fetching site:', error);
      res.status(500).json({ error: 'Failed to fetch site' });
    }
  });
  
  // יצירת אתר חדש
  app.post('/api/sites', async (req: Request, res: Response) => {
    try {
      const validation = insertSiteSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid site data', details: validation.error });
      }
      
      // בדיקה אם האתר כבר קיים
      const existingSite = await db.select().from(sites).where(eq(sites.siteId, req.body.siteId)).limit(1);
      
      if (existingSite.length > 0) {
        return res.status(409).json({ error: 'Site with this ID already exists' });
      }
      
      // יצירת האתר
      const newSite = await db.insert(sites).values({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      res.status(201).json(newSite[0]);
    } catch (error) {
      console.error('Error creating site:', error);
      res.status(500).json({ error: 'Failed to create site' });
    }
  });
  
  // עדכון אתר קיים
  app.put('/api/sites/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      const validation = updateSiteSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid site data', details: validation.error });
      }
      
      // בדיקה אם האתר קיים
      const existingSite = await db.select().from(sites).where(eq(sites.siteId, siteId)).limit(1);
      
      if (existingSite.length === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      // עדכון האתר
      const updatedSite = await db.update(sites)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(sites.siteId, siteId))
        .returning();
      
      res.json(updatedSite[0]);
    } catch (error) {
      console.error('Error updating site:', error);
      res.status(500).json({ error: 'Failed to update site' });
    }
  });
  
  // מחיקת אתר
  app.delete('/api/sites/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      // בדיקה אם האתר קיים
      const existingSite = await db.select().from(sites).where(eq(sites.siteId, siteId)).limit(1);
      
      if (existingSite.length === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      // מחיקת האתר
      await db.delete(sites).where(eq(sites.siteId, siteId));
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting site:', error);
      res.status(500).json({ error: 'Failed to delete site' });
    }
  });

  // Add proxy endpoint for Google Sheets
  app.get('/api/sheets/:sheetName', async (req: Request, res: Response) => {
    try {
      const { sheetName } = req.params;
      
      // אפשרות לקבל מזהה גיליון ישירות כפרמטר בבקשה
      const querySheetId = req.query.sheetId as string;
      
      // חובה לספק כתובת לגיליון או מזהה גיליון ישיר
      const customSheetUrl = req.headers['x-sheet-url'] as string;
      
      let sheetId: string | null = null;
      
      // אם התקבל מזהה גיליון ישירות בפרמטר - נשתמש בו
      if (querySheetId) {
        sheetId = querySheetId;
      } 
      // אחרת ננסה לחלץ מזהה מהכתובת שהתקבלה בכותרת
      else if (customSheetUrl) {
        // חילוץ מזהה הגיליון מהכתובת
        const extractedId = extractSheetId(customSheetUrl);
        if (!extractedId) {
          return res.status(400).json({ 
            error: 'Invalid Google Sheets URL format: ' + customSheetUrl
          });
        }
        
        // שימוש במזהה שחולץ
        sheetId = extractedId;
      } else {
        return res.status(400).json({ 
          error: 'Missing required header: x-sheet-url or query parameter: sheetId' 
        });
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

  // הוספת נקודת קצה חדשה לאתרים
  app.get('/api/sites/:siteId/sheets/:sheetName', async (req: Request, res: Response) => {
    try {
      const { siteId, sheetName } = req.params;
      
      // קבלת האתר ממסד הנתונים
      const site = await db.select().from(sites).where(eq(sites.siteId, siteId)).limit(1);
      
      if (site.length === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      // חילוץ מזהה הגיליון מה-URL
      const sheetUrl = site[0].sheetUrl;
      const sheetId = extractSheetId(sheetUrl);
      
      if (!sheetId) {
        return res.status(400).json({ 
          error: 'Invalid Google Sheets URL in site configuration' 
        });
      }
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      console.log(`Fetching from site: ${siteId}, sheet ID: ${sheetId}, sheet name: ${sheetName}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to fetch data from Google Sheets: ${response.statusText}` 
        });
      }
      
      const text = await response.text();
      
      // Extract the JSON part from the response
      const jsonText = text.replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/, '')
                           .replace(/\);$/, '');
      
      if (!jsonText) {
        return res.status(500).json({ error: 'Failed to extract JSON data from Google Sheets response' });
      }
      
      res.set('Content-Type', 'application/json');
      res.send(jsonText);
    } catch (error) {
      console.error(`Error fetching sheet for site:`, error);
      res.status(500).json({ error: 'Failed to fetch data from Google Sheets' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
