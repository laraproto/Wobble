import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";

export function Overview() {
  return (
    <div className="container mx-auto text-center relative my-4 ">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
