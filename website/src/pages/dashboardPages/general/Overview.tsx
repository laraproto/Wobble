import { useDashboard } from "#/components/dashboard/DashboardSidebar";
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
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Overview</CardTitle>
          <CardDescription>
            Initially this description was something not very quirky so I
            deleted it, might replace it with something else
          </CardDescription>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
