import "./index.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Link, Route, Switch } from "wouter";
import { Home } from "./pages/Home";
import { Test } from "./pages/Test";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <Switch>
          <Route path="/test" component={Test} />
          <Route path="/" component={Home} />

          <Route component={NotFound} />
        </Switch>
      </ThemeProvider>
    </>
  );
}

export default App;
