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
import { Textarea } from "#/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { ChevronsUpDown, Trash, PlusCircle } from "lucide-react";
import { useForm, useStore } from "@tanstack/react-form";

import { z } from "zod";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import { toast } from "sonner";
import { operationParsingRegex } from "#/types/modules";
import { useState } from "react";

const modActionsConfigFormSchema = z.object({
  dm_on_warn: z.boolean(),
  dm_on_kick: z.boolean(),
  dm_on_ban: z.boolean(),
  warn_message: z.string().max(2000),
  kick_message: z.string().max(2000),
  ban_message: z.string().max(2000),
  tempban_message: z.string().max(2000),
  can_note: z.boolean(),
  can_warn: z.boolean(),
  can_mute: z.boolean(),
  can_kick: z.boolean(),
  can_ban: z.boolean(),
  can_unban: z.boolean(),
  can_view: z.boolean(),
  can_addcase: z.boolean(),
  can_massunban: z.boolean(),
  can_massban: z.boolean(),
  can_massmute: z.boolean(),
  can_hidecase: z.boolean(),
  can_deletecase: z.boolean(),
});

const modActionsFormSchema = z.object({
  config: modActionsConfigFormSchema,
  overrides: z.array(
    z.object({
      level: z.string().regex(operationParsingRegex),
      config: modActionsConfigFormSchema,
    }),
  ),
});

export function ModActions() {
  const dashboardContext = useDashboard();

  const modActionsQuery = useQuery(
    trpc.authed.guild.modActions.get.queryOptions({
      guildId: dashboardContext.guild!.id,
    }),
  );

  const modActionsMutation = useMutation(
    trpc.authed.guild.modActions.set.mutationOptions(),
  );

  const [openCollapsibles, setOpenCollapsibles] = useState<boolean[]>([]);

  const form = useForm({
    defaultValues: {
      config: {
        dm_on_warn: modActionsQuery.data?.config.dm_on_warn ?? true,
        dm_on_kick: modActionsQuery.data?.config.dm_on_kick ?? false,
        dm_on_ban: modActionsQuery.data?.config.dm_on_ban ?? false,
        warn_message:
          modActionsQuery.data?.config.warn_message ??
          "You have received a warning on the {{guildName}} server: {{reason}}",
        kick_message:
          modActionsQuery.data?.config.kick_message ??
          "You have been kicked from the {{guildName}} server: {{reason}}",
        ban_message:
          modActionsQuery.data?.config.ban_message ??
          "You have been banned from the {{guildName}} server: {{reason}}",
        tempban_message:
          modActionsQuery.data?.config.tempban_message ??
          "You have been temporarily banned from the {{guildName}} server for {{duration}}: {{reason}}",
        can_note: modActionsQuery.data?.config.can_note ?? false,
        can_warn: modActionsQuery.data?.config.can_warn ?? false,
        can_mute: modActionsQuery.data?.config.can_mute ?? false,
        can_kick: modActionsQuery.data?.config.can_kick ?? false,
        can_ban: modActionsQuery.data?.config.can_ban ?? false,
        can_unban: modActionsQuery.data?.config.can_unban ?? false,
        can_view: modActionsQuery.data?.config.can_view ?? false,
        can_addcase: modActionsQuery.data?.config.can_addcase ?? false,
        can_massunban: modActionsQuery.data?.config.can_massunban ?? false,
        can_massban: modActionsQuery.data?.config.can_massban ?? false,
        can_massmute: modActionsQuery.data?.config.can_massmute ?? false,
        can_hidecase: modActionsQuery.data?.config.can_hidecase ?? false,
        can_deletecase: modActionsQuery.data?.config.can_deletecase ?? false,
      },
      overrides: modActionsQuery.data?.overrides || [],
    },
    validators: {
      onSubmit: modActionsFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await modActionsMutation.mutateAsync({
        guildId: dashboardContext.guild!.id,
        ...(value as z.infer<typeof modActionsFormSchema>),
      });

      if (result.success) {
        toast.success(result.message);
      }
    },
  });

  const mainConfigField = useStore(form.store, (state) => state.values.config);

  if (modActionsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Mod Actions</CardTitle>
          <CardDescription>
            Configure mod actions module (Imma be honest I initially thought
            this grid pattern would look cool)
          </CardDescription>
          <CardContent className="mt-4">
            <form
              id="modactions-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                <FieldGroup className="flex flex-col gap-4">
                  <form.Field
                    name="config.dm_on_ban"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              DM User upon ban
                            </FieldLabel>
                            <FieldDescription className="text-left">
                              Whether to send a DM to the user when they are
                              banned
                            </FieldDescription>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.dm_on_kick"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              DM User upon kick
                            </FieldLabel>
                            <FieldDescription className="text-left">
                              Whether to send a DM to the user when they are
                              kicked
                            </FieldDescription>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.dm_on_warn"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              DM User upon warn
                            </FieldLabel>
                            <FieldDescription className="text-left">
                              Whether to send a DM to the user when they are
                              warned
                            </FieldDescription>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>

                <FieldGroup className="flex flex-col gap-4">
                  <form.Field
                    name="config.ban_message"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Ban message
                          </FieldLabel>
                          <Textarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.kick_message"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Kick message
                          </FieldLabel>
                          <Textarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.warn_message"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Warn message
                          </FieldLabel>
                          <Textarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>

                <FieldGroup className="flex flex-col gap-4">
                  <p className="text-center font-bold">Permissions</p>
                  <form.Field
                    name="config.can_ban"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can ban users
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_unban"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can unban users
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_kick"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can kick users
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_mute"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can mute users
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_warn"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can warn users
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_note"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can add notes
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_addcase"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can add cases (allows adding any case, including
                              action ones)
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_view"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can view cases
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="config.can_deletecase"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field
                          data-invalid={isInvalid}
                          orientation="horizontal"
                        >
                          <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={field.state.value}
                            onBlur={field.handleBlur}
                            onCheckedChange={(e) =>
                              field.handleChange(e as boolean)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              Can delete cases
                            </FieldLabel>
                          </FieldContent>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>
              </div>
              <form.Field name="overrides" mode="array">
                {(field) => (
                  <div>
                    <div className="flex mt-4 mb-4 justify-between items-center">
                      <h1 className="text-2xl font-bold -ml-6">Overrides</h1>
                      <Button
                        type="button"
                        onClick={() => {
                          field.pushValue({
                            level: "",
                            config: mainConfigField,
                          });
                        }}
                      >
                        <PlusCircle className="ml-auto" /> Add Override
                      </Button>
                    </div>
                    {field.state.value.map((override, index) => {
                      return (
                        <Collapsible
                          key={index}
                          open={openCollapsibles[index]}
                          onOpenChange={(isOpen) => {
                            const newOpenStates = [...openCollapsibles];
                            newOpenStates[index] = isOpen;
                            setOpenCollapsibles(newOpenStates);
                          }}
                          className="flex flex-col border rounded-md w-full bg-muted gap-2 mb-2"
                        >
                          <div className="ml-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold">
                              Overrides for {override.level}
                            </h4>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 bg-background"
                              >
                                <ChevronsUpDown />
                                <span className="sr-only">Toggle</span>
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="flex flex-col pb-2 ml-2 bg-muted">
                            <div className="grid grid-cols-3 gap-4">
                              <FieldGroup className="flex flex-col gap-4">
                                <form.Field
                                  name={`overrides[${index}].level`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                          Level
                                        </FieldLabel>
                                        <Input
                                          id={field.name}
                                          name={field.name}
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                            field.handleChange(e.target.value)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldDescription>
                                          Allowed operators are &gt;, &gt;=,
                                          &lt;, &lt;=, =
                                        </FieldDescription>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.dm_on_ban`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            DM User upon ban
                                          </FieldLabel>
                                          <FieldDescription className="text-left">
                                            Whether to send a DM to the user
                                            when they are banned
                                          </FieldDescription>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.dm_on_kick`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            DM User upon kick
                                          </FieldLabel>
                                          <FieldDescription className="text-left">
                                            Whether to send a DM to the user
                                            when they are kicked
                                          </FieldDescription>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.dm_on_warn`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            DM User upon warn
                                          </FieldLabel>
                                          <FieldDescription className="text-left">
                                            Whether to send a DM to the user
                                            when they are warned
                                          </FieldDescription>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                              </FieldGroup>

                              <FieldGroup className="flex flex-col gap-4">
                                <form.Field
                                  name={`overrides[${index}].config.ban_message`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                          Ban message
                                        </FieldLabel>
                                        <Textarea
                                          id={field.name}
                                          name={field.name}
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                            field.handleChange(e.target.value)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.kick_message`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                          Kick message
                                        </FieldLabel>
                                        <Textarea
                                          id={field.name}
                                          name={field.name}
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                            field.handleChange(e.target.value)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.warn_message`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                          Warn message
                                        </FieldLabel>
                                        <Textarea
                                          id={field.name}
                                          name={field.name}
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                            field.handleChange(e.target.value)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                              </FieldGroup>

                              <FieldGroup className="flex flex-col gap-4">
                                <p className="text-center font-bold">
                                  Permissions
                                </p>
                                <form.Field
                                  name={`overrides[${index}].config.can_ban`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can ban users
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_unban`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can unban users
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_kick`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can kick users
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_mute`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can mute users
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_warn`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can warn users
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_note`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can add notes
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_addcase`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can add cases (allows adding any
                                            case, including action ones)
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_view`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can view cases
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                                <form.Field
                                  name={`overrides[${index}].config.can_deletecase`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field
                                        data-invalid={isInvalid}
                                        orientation="horizontal"
                                      >
                                        <Checkbox
                                          id={field.name}
                                          name={field.name}
                                          checked={field.state.value}
                                          onBlur={field.handleBlur}
                                          onCheckedChange={(e) =>
                                            field.handleChange(e as boolean)
                                          }
                                          aria-invalid={isInvalid}
                                        />
                                        <FieldContent>
                                          <FieldLabel htmlFor={field.name}>
                                            Can delete cases
                                          </FieldLabel>
                                        </FieldContent>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                              </FieldGroup>
                              <div className="flex mt-4 gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    field.removeValue(index);
                                  }}
                                >
                                  <Trash className="ml-auto" /> Delete
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </form.Field>
            </form>
          </CardContent>
          <CardFooter className="pt-4 flex items-end justify-end">
            <Button type="submit" form="modactions-form">
              Submit
            </Button>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
