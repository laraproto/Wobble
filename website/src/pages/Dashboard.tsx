import { DashboardLayout } from "#/components/DashboardLayout";
import { DashboardProvider } from "#/components/DashboardSidebar";
import { Route, Switch, useLocation } from "wouter";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

export function Dashboard() {
  const [location, navigate] = useLocation();

  const userQuery = useQuery(trpc.authed.currentUser.me.queryOptions());

  const guildQuery = useQuery(trpc.authed.currentUser.getGuilds.queryOptions());

  if (userQuery.isLoading || guildQuery.isLoading) {
    return <div>Loading</div>;
  }

  return (
    <Switch>
      <DashboardProvider user={userQuery.data!} guilds={guildQuery.data!}>
        <DashboardLayout>
          <div className="ml-2 mt-2">
            <Route>
              <h1 className="text-3xl font-bold">Dashboard</h1>
            </Route>
          </div>
        </DashboardLayout>
      </DashboardProvider>
    </Switch>
  );
}
