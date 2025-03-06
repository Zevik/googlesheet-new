import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import useSites from '@/hooks/useSites';
import { CreateSiteRequest, UpdateSiteRequest } from '@/lib/types';

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { sites, isSitesLoading, createSite, updateSite, deleteSite } = useSites();
  
  // מצב לטופס יצירת אתר חדש
  const [newSite, setNewSite] = useState<CreateSiteRequest>({
    siteId: '',
    name: '',
    description: '',
    sheetUrl: '',
  });
  
  // מצב לטופס עדכון אתר קיים
  const [editingSite, setEditingSite] = useState<{ siteId: string } & UpdateSiteRequest | null>(null);
  
  // מצב לדיאלוג יצירת אתר
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // מצב לדיאלוג עדכון אתר
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // מצב לדיאלוג מחיקת אתר
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);
  
  // טיפול ביצירת אתר חדש
  const handleCreateSite = () => {
    // וידוא שכל השדות הנדרשים מלאים
    if (!newSite.siteId || !newSite.name || !newSite.sheetUrl) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }
    
    // וידוא שמזהה האתר מכיל רק אותיות, מספרים ומקפים
    if (!/^[a-z0-9-]+$/.test(newSite.siteId)) {
      toast({
        title: 'שגיאה',
        description: 'מזהה האתר יכול להכיל רק אותיות קטנות באנגלית, מספרים ומקפים',
        variant: 'destructive',
      });
      return;
    }
    
    // וידוא שכתובת הגיליון תקינה
    if (!newSite.sheetUrl.includes('docs.google.com/spreadsheets')) {
      toast({
        title: 'שגיאה',
        description: 'כתובת הגיליון אינה תקינה',
        variant: 'destructive',
      });
      return;
    }
    
    // יצירת האתר
    createSite(newSite, {
      onSuccess: () => {
        toast({
          title: 'האתר נוצר בהצלחה',
          description: `האתר ${newSite.name} נוצר בהצלחה`,
        });
        
        // איפוס הטופס
        setNewSite({
          siteId: '',
          name: '',
          description: '',
          sheetUrl: '',
        });
        
        // סגירת הדיאלוג
        setIsCreateDialogOpen(false);
      },
      onError: (error) => {
        toast({
          title: 'שגיאה ביצירת האתר',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // טיפול בעדכון אתר קיים
  const handleUpdateSite = () => {
    if (!editingSite) return;
    
    // וידוא שכל השדות הנדרשים מלאים
    if (!editingSite.name || !editingSite.sheetUrl) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }
    
    // וידוא שכתובת הגיליון תקינה
    if (!editingSite.sheetUrl.includes('docs.google.com/spreadsheets')) {
      toast({
        title: 'שגיאה',
        description: 'כתובת הגיליון אינה תקינה',
        variant: 'destructive',
      });
      return;
    }
    
    // עדכון האתר
    updateSite(
      { 
        siteId: editingSite.siteId, 
        site: {
          name: editingSite.name,
          description: editingSite.description,
          sheetUrl: editingSite.sheetUrl,
          isActive: editingSite.isActive,
        }
      },
      {
        onSuccess: () => {
          toast({
            title: 'האתר עודכן בהצלחה',
            description: `האתר ${editingSite.name} עודכן בהצלחה`,
          });
          
          // איפוס הטופס
          setEditingSite(null);
          
          // סגירת הדיאלוג
          setIsEditDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: 'שגיאה בעדכון האתר',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };
  
  // טיפול במחיקת אתר
  const handleDeleteSite = () => {
    if (!deletingSiteId) return;
    
    deleteSite(deletingSiteId, {
      onSuccess: () => {
        toast({
          title: 'האתר נמחק בהצלחה',
          description: 'האתר נמחק בהצלחה',
        });
        
        // איפוס המצב
        setDeletingSiteId(null);
      },
      onError: (error) => {
        toast({
          title: 'שגיאה במחיקת האתר',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // פתיחת דיאלוג עדכון אתר
  const openEditDialog = (site: any) => {
    setEditingSite({
      siteId: site.siteId,
      name: site.name,
      description: site.description || '',
      sheetUrl: site.sheetUrl,
      isActive: site.isActive,
    });
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>ניהול אתרים</CardTitle>
          <CardDescription>צור, ערוך ומחק אתרים המבוססים על גיליונות Google Sheets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>יצירת אתר חדש</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>יצירת אתר חדש</DialogTitle>
                  <DialogDescription>
                    מלא את הפרטים הבאים ליצירת אתר חדש המבוסס על גיליון Google Sheets
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="siteId" className="text-right">
                      מזהה האתר
                    </Label>
                    <Input
                      id="siteId"
                      value={newSite.siteId}
                      onChange={(e) => setNewSite({ ...newSite, siteId: e.target.value })}
                      className="col-span-3"
                      placeholder="dogs"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      שם האתר
                    </Label>
                    <Input
                      id="name"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                      className="col-span-3"
                      placeholder="אתר כלבים"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      תיאור
                    </Label>
                    <Textarea
                      id="description"
                      value={newSite.description}
                      onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                      className="col-span-3"
                      placeholder="תיאור האתר"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sheetUrl" className="text-right">
                      כתובת הגיליון
                    </Label>
                    <Input
                      id="sheetUrl"
                      value={newSite.sheetUrl}
                      onChange={(e) => setNewSite({ ...newSite, sheetUrl: e.target.value })}
                      className="col-span-3"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      dir="ltr"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateSite}>
                    יצירת אתר
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {isSitesLoading ? (
            <div className="text-center py-4">טוען אתרים...</div>
          ) : sites.length === 0 ? (
            <div className="text-center py-4">אין אתרים להצגה</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם האתר</TableHead>
                  <TableHead>מזהה</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>{site.siteId}</TableCell>
                    <TableCell>{site.description || '-'}</TableCell>
                    <TableCell>{site.isActive ? 'פעיל' : 'לא פעיל'}</TableCell>
                    <TableCell>{new Date(site.createdAt).toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/sites/${site.siteId}`)}
                        >
                          צפייה
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(site)}
                        >
                          עריכה
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingSiteId(site.siteId)}
                            >
                              מחיקה
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                              <AlertDialogDescription>
                                פעולה זו תמחק את האתר לצמיתות ולא ניתן יהיה לשחזר אותו.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingSiteId(null)}>
                                ביטול
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteSite}>
                                מחיקה
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* דיאלוג עדכון אתר */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עדכון אתר</DialogTitle>
            <DialogDescription>
              עדכן את פרטי האתר
            </DialogDescription>
          </DialogHeader>
          {editingSite && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  שם האתר
                </Label>
                <Input
                  id="edit-name"
                  value={editingSite.name}
                  onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  תיאור
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingSite.description || ''}
                  onChange={(e) => setEditingSite({ ...editingSite, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sheetUrl" className="text-right">
                  כתובת הגיליון
                </Label>
                <Input
                  id="edit-sheetUrl"
                  value={editingSite.sheetUrl}
                  onChange={(e) => setEditingSite({ ...editingSite, sheetUrl: e.target.value })}
                  className="col-span-3"
                  dir="ltr"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateSite}>
              עדכון
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage; 