import { useDashboard } from "#/components/dashboard/DashboardSidebar";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";
import { useLocation } from "wouter";

export function Debug() {
  const [location, navigate] = useLocation();
  const dashboardContext = useDashboard();

  if (!dashboardContext.configuration.development) {
    navigate("/overview");
  }

  return (
    <div className="container mx-auto relative my-4 ">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Debug</CardTitle>
          <CardDescription>
            Primarily dev test stuff, might give it to superadmins tho
          </CardDescription>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
