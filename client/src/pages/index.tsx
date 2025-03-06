import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useSites from '@/hooks/useSites';

const Home: React.FC = () => {
  const [location] = useLocation();
  const { sites, isSitesLoading } = useSites();
  
  // גלילה לראש העמוד כשמשתנה ה-URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // עדכון כותרת הדף
    document.title = 'אתרי Google Sheets';
  }, [location]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>ברוכים הבאים לאתרי Google Sheets</CardTitle>
          <CardDescription>
            צור אתרים דינמיים המבוססים על גיליונות Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            מערכת זו מאפשרת לך ליצור אתרים דינמיים המבוססים על גיליונות Google Sheets.
            כל אתר מקושר לגיליון Google Sheets משלו, וכל שינוי בגיליון משתקף באתר באופן אוטומטי.
          </p>
          <div className="flex space-x-4 mb-8">
            <Button asChild>
              <Link href="/admin">ניהול אתרים</Link>
            </Button>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">האתרים שלנו</h2>
          
          {isSitesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-500 mb-4">אין אתרים להצגה</p>
              <Button asChild>
                <Link href="/admin">צור אתר חדש</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.filter(site => site.isActive).map((site) => (
                <Card key={site.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-medium mb-2">{site.name}</h3>
                    <p className="text-gray-500 mb-4">{site.description || 'אין תיאור'}</p>
                    <Button asChild>
                      <Link href={`/sites/${site.siteId}`}>כניסה לאתר</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
