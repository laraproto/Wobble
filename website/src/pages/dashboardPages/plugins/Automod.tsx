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
import { operationParsingRegex, durationParsingRegex } from "#/types/modules";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import { toast } from "sonner";

const automodRuleObjectSchema = z.object({
  enabled: z.boolean(),
  triggers: z.array(
    z.object({
      automod_trigger: z.object({
        ruleId: zodSnowflake,
      }),
      counter_trigger: z.object({
        counter: z.string(),
        trigger: z.string(),
      }),
    }),
  ),
  actions: z.object({
    warn: z.object({
      reason: z.string().min(0).max(400),
    }),
    mute: z.object({
      duration: z.string().min(0).max(32).regex(durationParsingRegex),
      reason: z.string().min(0).max(400),
    }),
    kick: z.object({
      reason: z.string().max(400),
    }),
    ban: z.object({
      duration: z.string().min(0).max(32).regex(durationParsingRegex),
      reason: z.string().max(400),
    }),
    add_counter: z.object({
      counter: z.string(),
      value: z.number().min(0),
    }),
    remove_counter: z.object({
      counter: z.string(),
      value: z.number().min(0),
    }),
  }),
});

const automodBaseSchema = z.object({
  rules: z.array(z.object({ name: z.string(), rule: automodRuleObjectSchema })),
});

const automodFormSchema = z.object({
  config: automodBaseSchema,
  overrides: z.array(
    z.object({
      level: z.string().regex(operationParsingRegex),
      config: z.object({
        rules: z.array(
          z.object({
            name: z.string(),
            rule: automodRuleObjectSchema.pick({
              enabled: true,
            }),
          }),
        ),
      }),
    }),
  ),
});

export function Automod() {
  const dashboardContext = useDashboard();

  const automodQuery = useQuery(
    trpc.authed.guild.automod.get.queryOptions({
      guildId: dashboardContext.guild!.id,
    }),
  );

  const automodMutation = useMutation(
    trpc.authed.guild.automod.set.mutationOptions(),
  );

  const form = useForm({
    defaultValues: {
      config: {
        rules: automodQuery.data?.config.rules ?? [],
      },
      overrides: automodQuery.data?.overrides ?? [],
    },
    validators: {
      onSubmit: automodFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await automodMutation.mutateAsync({
        guildId: dashboardContext.guild!.id,
        ...value,
      });

      if (result.success) {
        toast.success(result.message);
      }
    },
  });

  if (automodQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Automod</CardTitle>
          <CardDescription>Configure automod module</CardDescription>
          <CardContent className="mt-4">
            <form
              id="automod-form"
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
            <Button type="submit" form="automod-form">
              Submit
            </Button>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
