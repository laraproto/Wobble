import { useDashboard } from "#/components/DashboardSidebar";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";

export function Overview() {
  const dashboardContext = useDashboard();

  return (
    <div className="container mx-auto relative my-4 ">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Overview</CardTitle>
          <CardDescription>
            {dashboardContext.guild?.name ?? "ur mum"} at a glance
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
