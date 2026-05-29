import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Crawls from "@/pages/crawls";
import CrawlDetail from "@/pages/crawl-detail";
import Keywords from "@/pages/keywords";
import KeywordDetail from "@/pages/keyword-detail";
import Leads from "@/pages/leads";
import Backlinks from "@/pages/backlinks";
import BacklinkDetail from "@/pages/backlink-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/crawls" component={Crawls} />
      <Route path="/crawls/:id" component={CrawlDetail} />
      <Route path="/keywords" component={Keywords} />
      <Route path="/keywords/:id" component={KeywordDetail} />
      <Route path="/leads" component={Leads} />
      <Route path="/backlinks" component={Backlinks} />
      <Route path="/backlinks/:id" component={BacklinkDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
