import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/index";
import Settings from "@/pages/settings";
import Main from "@/pages/main";
import AdminPage from "@/pages/admin";
import SitePage from "@/pages/sites/[siteId]";
import SiteContentPage from "@/pages/sites/[siteId]/[folder]/[page]";

function Router() {
  return (
    <Switch>
      <Route path="/main" component={Main} />
      
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/settings" component={Settings} />
            <Route path="/sites/:siteId/:folder/:page" component={SiteContentPage} />
            <Route path="/sites/:siteId" component={SitePage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
