import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';

type SiteConfig = {
  name: string;
  url: string;
  lastUpdated: string; // ISO string
}

const MainPage: React.FC = () => {
  const { toast } = useToast();
  const [currentSheetUrl, setCurrentSheetUrl] = useState<string>('');
  const [newSheetUrl, setNewSheetUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sites, setSites] = useState<SiteConfig[]>([]);
  const [newSiteName, setNewSiteName] = useState<string>('');

  // Load current Google Sheets URL from localStorage on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl) {
      setCurrentSheetUrl(savedUrl);
      setNewSheetUrl(savedUrl);
    }
    
    // Load saved sites
    const savedSites = localStorage.getItem('savedSites');
    if (savedSites) {
      try {
        setSites(JSON.parse(savedSites));
      } catch (e) {
        console.error('Error parsing saved sites:', e);
        setSites([]);
      }
    }
  }, []);

  const handleSaveUrl = () => {
    if (!newSheetUrl) {
      toast({
        title: "Error",
        description: "Please enter a Google Sheets URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Validate and extract the sheet ID
    const sheetId = extractSheetId(newSheetUrl);
    if (!sheetId) {
      toast({
        title: "Invalid URL",
        description: "Could not extract Google Sheets ID from the provided URL",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Test if we can access the sheet
    fetch(`/api/sheets/settings?sheetId=${sheetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-sheet-url': newSheetUrl
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error accessing the Google Sheet: ${response.statusText}`);
        }
        return response.json();
      })
      .then(() => {
        // If we successfully got data, save the URL to localStorage
        localStorage.setItem('googleSheetsUrl', newSheetUrl);
        setCurrentSheetUrl(newSheetUrl);
        
        toast({
          title: "Success",
          description: "Google Sheets URL has been saved and verified",
          variant: "default",
        });
        
        // Reload the page to apply the new URL to all components
        window.location.reload();
      })
      .catch(error => {
        toast({
          title: "Error",
          description: error.message || "Failed to access Google Sheet",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSaveSite = () => {
    if (!newSiteName || !currentSheetUrl) {
      toast({
        title: "Error",
        description: "Please enter a site name and ensure you have a valid Google Sheets URL",
        variant: "destructive",
      });
      return;
    }

    const newSite: SiteConfig = {
      name: newSiteName,
      url: currentSheetUrl,
      lastUpdated: new Date().toISOString()
    };

    const updatedSites = [...sites, newSite];
    localStorage.setItem('savedSites', JSON.stringify(updatedSites));
    setSites(updatedSites);
    setNewSiteName('');

    toast({
      title: "Site Saved",
      description: `Site "${newSiteName}" has been saved successfully`,
      variant: "default",
    });
  };

  const handleLoadSite = (site: SiteConfig) => {
    setNewSheetUrl(site.url);
    toast({
      title: "Site Loaded",
      description: `Loaded "${site.name}". Click "Save and Apply" to activate this site.`,
      variant: "default",
    });
  };

  const handleDeleteSite = (index: number) => {
    const updatedSites = [...sites];
    updatedSites.splice(index, 1);
    localStorage.setItem('savedSites', JSON.stringify(updatedSites));
    setSites(updatedSites);

    toast({
      title: "Site Deleted",
      description: "The site has been removed from your saved sites",
      variant: "default",
    });
  };

  // Helper function to extract the sheet ID from a Google Sheets URL
  const extractSheetId = (url: string): string | null => {
    // Regular expression to match patterns like /d/{SHEET_ID}/ or /spreadsheets/d/{SHEET_ID}/
    const regex = /\/d\/([a-zA-Z0-9-_]+)(?:\/|$)|spreadsheets\/d\/([a-zA-Z0-9-_]+)(?:\/|$)/;
    const match = url.match(regex);
    
    if (match) {
      // Return the first capturing group that has a value
      return match[1] || match[2] || null;
    }
    
    return null;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Site Manager</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Google Sheets Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-url">Current Google Sheets URL</Label>
                  <Input
                    id="current-url"
                    value={currentSheetUrl}
                    readOnly
                    className="mt-1 bg-muted"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-url">New Google Sheets URL</Label>
                  <Input
                    id="new-url"
                    value={newSheetUrl}
                    onChange={(e) => setNewSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the URL of your Google Sheets document.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setNewSheetUrl(currentSheetUrl)}
              >
                Reset
              </Button>
              <Button 
                onClick={handleSaveUrl} 
                disabled={isLoading || newSheetUrl === currentSheetUrl}
              >
                {isLoading ? "Verifying..." : "Save and Apply"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Saved Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="site-name">New Site Name</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="site-name"
                      value={newSiteName}
                      onChange={(e) => setNewSiteName(e.target.value)}
                      placeholder="My Site"
                    />
                    <Button onClick={handleSaveSite}>Save</Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save the current Google Sheet URL as a named site for easy access later.
                  </p>
                </div>
                
                <Separator />
                
                {sites.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No saved sites yet</p>
                ) : (
                  <div className="space-y-3">
                    {sites.map((site, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <h3 className="font-medium">{site.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(site.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleLoadSite(site)}>
                            Load
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSite(index)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Help & Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">How to use the Site Manager</h3>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Create or open a Google Sheets document with the required structure</li>
                    <li>Make sure the sheets are named: <code>main_menu</code>, <code>pages</code>, <code>content</code>, <code>settings</code>, and <code>templates</code></li>
                    <li>Copy the URL of your Google Sheets document</li>
                    <li>Paste it in the "New Google Sheets URL" field and click "Save and Apply"</li>
                    <li>Optionally save it as a named site for easy access later</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold">Required Google Sheets Structure</h3>
                  <p className="mt-2">
                    Your Google Sheets document must have the following sheets:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>main_menu</strong> - Navigation structure</li>
                    <li><strong>pages</strong> - Page information and metadata</li>
                    <li><strong>content</strong> - Content blocks for each page</li>
                    <li><strong>settings</strong> - Site settings and configuration</li>
                    <li><strong>templates</strong> - Content templates (optional)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MainPage;