import "./index.css";

import { Toaster } from "#/components/ui/sonner";
import { ThemeProvider } from "#/components/theme-provider";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/trpc";

import { Home } from "./pages/Home";
import { Test } from "./pages/Test";
import { NotFound } from "./pages/NotFound";
import { Installer } from "./pages/Installer";
import { Dashboard } from "./pages/Dashboard";

export function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <QueryClientProvider client={queryClient}>
          <Router hook={useHashLocation}>
            <Switch>
              <Route path="/test" component={Test} />
              <Route path="/installer" component={Installer} />

              <Route path="/" component={Home} />
              <Route path="/dashboard" component={Dashboard} nest />

              <Route component={NotFound} />
            </Switch>
          </Router>
          <Toaster position="top-center" />
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
