import "./index.css";

import { Link, Route, Switch } from "wouter";
import { Home } from "./pages/Home";
import { Test } from "./pages/Test";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <>
      <Switch>
        <Route path="/test" component={Test} />
        <Route path="/" component={Home} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default App;
