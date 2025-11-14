import "./index.css";

import { Link, Route, Switch } from "wouter";
import { Home } from "./pages/Home";
import { Test } from "./pages/Test";

export function App() {
  return (
    <>
      <Switch>
        <Route path="/test" component={Test} />
        <Route path="" component={Home} />
      </Switch>
    </>
  );
}

export default App;
