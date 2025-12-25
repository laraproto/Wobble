import { useDashboard } from "#/components/dashboard/DashboardSidebar";
import { useParams, Route, Redirect } from "wouter";
import { useEffect } from "react";

import { Overview } from "./general/Overview";
import { Debug } from "./general/Debug";
import { Users } from "./general/Users";

import { Cases } from "./plugins/Cases";
import { ModActions } from "./plugins/ModActions";
import { Levels } from "./plugins/Levels";

export function GuildBase() {
  const params = useParams();
  const dashboardContext = useDashboard();

  useEffect(() => {
    dashboardContext.setSelectedServerId(params.guild);
  });

  if (!dashboardContext.guild) {
    return <h1 className="text-3xl font-bold">Guild not found</h1>;
  }

  return (
    <>
      <Route path="/overview" component={Overview} />
      <Route path="/users" component={Users} />
      {dashboardContext.configuration.development ? (
        <Route path="/debug" component={Debug} />
      ) : (
        <Redirect to="/overview" />
      )}
      <Route path="/cases" component={Cases} />
      <Route path="/moderation" component={ModActions} />
      <Route path="/levels" component={Levels} />
      <Route path="/">
        <h1 className="text-3xl font-bold">
          Guild Dashboard for {params.guild}
        </h1>
        <Redirect to="/overview" />
      </Route>
    </>
  );
}
