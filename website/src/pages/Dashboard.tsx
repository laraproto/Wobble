import { DashboardLayout } from "#/components/DashboardLayout";
import { DashboardProvider } from "#/components/DashboardSidebar";
import { Route, useParams, useLocation, useSearchParams } from "wouter";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";
import { GuildBase } from "./dashboardPages/GuildBase";
import { Suspense } from "react";

export function Dashboard() {
  const [location, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const userQuery = useQuery(trpc.authed.currentUser.me.queryOptions());

  const guildQuery = useQuery(trpc.authed.currentUser.getGuilds.queryOptions());

  if (userQuery.isLoading || guildQuery.isLoading) {
    return <div>Loading</div>;
  }

  if (!userQuery.data) {
    navigate("~/");
    return <div>Redirecting</div>;
  }

  const guildUuid = searchParams.get("uuid");

  return (
    <DashboardProvider
      user={userQuery.data!}
      selectedServerId={guildUuid || undefined}
      guilds={guildQuery.data!}
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
