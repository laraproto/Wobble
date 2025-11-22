import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Link } from "wouter";
import z from "zod";

const installerSchema = z.object({
  databaseType: z.enum(["pglite", "postgresql"]),
  databaseUrl: z.string().optional(),
  botToken: z.string().min(1, "Bot token is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  registrationEnabled: z.boolean().optional().default(false),
});

export function Installer() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <Card>
        <CardHeader>
          <CardTitle>Installer</CardTitle>
          <CardDescription>Wobble initial configuration</CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter>wawwwwwwwwwwwww</CardFooter>
      </Card>
    </div>
  );
}
