import { DashboardLayout } from "#/components/dashboard/DashboardLayout";
import { DashboardProvider } from "#/components/dashboard/DashboardSidebar";
import { Route, useLocation } from "wouter";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";
import { GuildBase } from "./dashboardPages/GuildBase";
import { Suspense } from "react";

export function Dashboard() {
  const [, navigate] = useLocation();

  const configurationQuery = useQuery(trpc.configuration.queryOptions());

  const userQuery = useQuery(trpc.authed.currentUser.me.queryOptions());

  const guildQuery = useQuery(trpc.authed.currentUser.getGuilds.queryOptions());

  if (
    userQuery.isLoading ||
    guildQuery.isLoading ||
    configurationQuery.isLoading
  ) {
    return <div>Loading</div>;
  }

  if (!userQuery.data) {
    navigate("~/");
    return <div>Redirecting</div>;
  }
  return (
    <DashboardProvider
      user={userQuery.data!}
      guilds={guildQuery.data!}
      configuration={configurationQuery.data!}
    >
      <DashboardLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <Route path="/:guild" component={GuildBase} nest />

          <Route path="/">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </Route>
        </Suspense>
      </DashboardLayout>
    </DashboardProvider>
  );
}
