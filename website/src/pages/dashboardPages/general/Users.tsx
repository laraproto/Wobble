//import { useDashboard } from "#/components/dashboard/DashboardSidebar";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";

export function Users() {
  //const dashboardContext = useDashboard();

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Users</CardTitle>
          <CardDescription>
            Revoke or add access to dashboard users
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
