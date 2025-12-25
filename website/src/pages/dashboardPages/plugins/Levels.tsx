import { useDashboard } from "#/components/dashboard/DashboardSidebar";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "#/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { useForm } from "@tanstack/react-form";

import { z } from "zod";
import { zodSnowflake } from "#/types/discord";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import { toast } from "sonner";

const levelFormSchema = z.record(zodSnowflake, z.number().min(0).max(100));

export function Cases() {
  const dashboardContext = useDashboard();

  const casesQuery = useQuery(
    trpc.authed.guild.cases.get.queryOptions({
      guildId: dashboardContext.guild!.id,
    }),
  );

  const casesMutation = useMutation(
    trpc.authed.guild.cases.set.mutationOptions(),
  );

  const form = useForm({
    defaultValues: {
      uwu: 100,
    },
    validators: {
      onSubmit: levelFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await casesMutation.mutateAsync({
        guildId: dashboardContext.guild!.id,
        ...value,
      });

      if (result.success) {
        toast.success(result.message);
      }
    },
  });

  if (casesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Cases</CardTitle>
          <CardDescription>
            Configure cases module (Imma be honest I initially thought this grid
            pattern would look cool)
          </CardDescription>
          <CardContent className="mt-4">
            <form
              id="cases-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                <FieldGroup className="flex flex-col gap-4"></FieldGroup>

                <FieldGroup className="flex flex-col gap-4"></FieldGroup>

                <FieldGroup className="flex flex-col gap-4"></FieldGroup>
              </div>
            </form>
          </CardContent>
          <CardFooter className="pt-4 flex items-end justify-end">
            <Button type="submit" form="cases-form">
              Submit
            </Button>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
