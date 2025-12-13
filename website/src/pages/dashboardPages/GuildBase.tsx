import { useDashboard } from "#/components/DashboardSidebar";
import { useParams, Route, Redirect } from "wouter";
import { Overview } from "./Overview";

export function GuildBase() {
  const params = useParams();
  const dashboardContext = useDashboard();

  dashboardContext.setSelectedServerId(params.guild);

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
