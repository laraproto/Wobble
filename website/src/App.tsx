import "./index.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Route, Switch } from "wouter";
import { Home } from "./pages/Home";
import { Test } from "./pages/Test";
import { NotFound } from "./pages/NotFound";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/trpc";

export function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/test" component={Test} />
            <Route path="/" component={Home} />

            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
