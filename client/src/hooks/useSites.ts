import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SiteInfo, CreateSiteRequest, UpdateSiteRequest } from '@/lib/types';
import { fetchSites, fetchSiteById, createSite, updateSite, deleteSite } from '@/lib/siteService';

export const useSites = () => {
  const queryClient = useQueryClient();
  
  // שליפת כל האתרים
  const { 
    data: sites = [], 
    isLoading: isSitesLoading, 
    error: sitesError 
  } = useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites
  });
  
  // שליפת אתר לפי מזהה
  const getSite = (siteId: string) => {
    return useQuery({
      queryKey: ['sites', siteId],
      queryFn: () => fetchSiteById(siteId)
    });
  };
  
  // יצירת אתר חדש
  const createSiteMutation = useMutation({
    mutationFn: (newSite: CreateSiteRequest) => createSite(newSite),
    onSuccess: () => {
      // עדכון המטמון לאחר יצירת אתר חדש
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    }
  });
  
  // עדכון אתר קיים
  const updateSiteMutation = useMutation({
    mutationFn: ({ siteId, site }: { siteId: string, site: UpdateSiteRequest }) => 
      updateSite(siteId, site),
    onSuccess: (data) => {
      // עדכון המטמון לאחר עדכון אתר
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', data.siteId] });
    }
  });
  
  // מחיקת אתר
  const deleteSiteMutation = useMutation({
    mutationFn: (siteId: string) => deleteSite(siteId),
    onSuccess: (_, siteId) => {
      // עדכון המטמון לאחר מחיקת אתר
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
    }
  });
  
  return {
    sites,
    isSitesLoading,
    sitesError,
    getSite,
    createSite: createSiteMutation.mutate,
    isCreatingSite: createSiteMutation.isPending,
    updateSite: updateSiteMutation.mutate,
    isUpdatingSite: updateSiteMutation.isPending,
    deleteSite: deleteSiteMutation.mutate,
    isDeletingSite: deleteSiteMutation.isPending,
  };
};

export default useSites; 