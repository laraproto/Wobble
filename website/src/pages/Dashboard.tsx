import { DashboardLayout } from "#/components/DashboardLayout";
import { Route, Switch } from "wouter";

export function Dashboard() {
  return (
    <Switch>
      <DashboardLayout>
        <div className="ml-2 mt-2">
          <Route>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </Route>
        </div>
      </DashboardLayout>
    </Switch>
  );
}
