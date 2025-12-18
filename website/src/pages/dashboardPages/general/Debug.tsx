import { useDashboard } from "#/components/dashboard/DashboardSidebar";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { useLocation } from "wouter";

import { toast } from "sonner";
import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

export function Debug() {
  const [, navigate] = useLocation();
  const dashboardContext = useDashboard();
  const [testParse, setTestParse] = useState("");

  if (!dashboardContext.configuration.development) {
    navigate("/overview");
  }

  const guildRefreshMutation = useMutation(
    trpc.authed.guild.refreshGuild.mutationOptions(),
  );

  const testParseMutation = useMutation(
    trpc.authed.guild.testConfig.mutationOptions(),
  );

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Debug</CardTitle>
          <CardDescription>
            Primarily dev test stuff, might give it to superadmins tho
          </CardDescription>
          <CardContent>
            <Button
              variant="destructive"
              onClick={async () => {
                const result = await guildRefreshMutation.mutateAsync({
                  guildId: dashboardContext.guild!.id,
                });

                if (result.success) {
                  toast.success(result.message);
                } else {
                  toast.error(result.message);
                }
              }}
            >
              Guild Refresh (potentially desctructive)
            </Button>
            <div className="grid w-full gap-2">
              <Textarea
                value={testParse}
                onChange={(e) => setTestParse(e.target.value)}
                placeholder="Type your parse here"
              />
              <Button
                onClick={async () => {
                  const parseResult = await testParseMutation.mutateAsync({
                    ...JSON.parse(testParse || "{}"),
                    guildId: dashboardContext.guild!.id,
                  });

                  if (parseResult.success) {
                    toast.success(parseResult.message, {
                      description: JSON.stringify(parseResult.config),
                      closeButton: true,
                    });
                  } else {
                    toast.error(parseResult.message, {
                      description: JSON.stringify(parseResult.errors),
                      closeButton: true,
                    });
                  }
                }}
              >
                Send test parse
              </Button>
            </div>
          </CardContent>
          <CardFooter></CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
