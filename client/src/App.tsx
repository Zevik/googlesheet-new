import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import FolderPage from "@/pages/[folder]/[page]";
import Home from "@/pages/index";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:folder/:page" component={FolderPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
