import { useDashboard } from "#/components/dashboard/DashboardSidebar";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";

export function ModActions() {
  const dashboardContext = useDashboard();

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Mod Actions</CardTitle>
          <CardDescription>
            Configure mod actions module
          </CardDescription>
          <CardContent>
            <h1 className="text-3xl font-bold">THIS PAGE IS INCOMPLETE</h1>
          </CardContent>
          <CardFooter></CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
