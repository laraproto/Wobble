import { useDashboard } from "#/components/DashboardSidebar";
import { useParams, Route, Redirect, useLocation } from "wouter";
import { Overview } from "./Overview";
import { useEffect } from "react";

export function GuildBase() {
  const params = useParams();
  const [location, setLocation] = useLocation();
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
      <Route path="/">
        <h1 className="text-3xl font-bold">
          Guild Dashboard for {params.guild}
        </h1>
        <Redirect to="/overview" />
      </Route>
    </>
  );
}
