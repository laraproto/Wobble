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
import { operationParsingRegex } from "#/types/modules";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import { toast } from "sonner";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { ChevronsUpDown, Trash, PlusCircle } from "lucide-react";
import { useState } from "react";

const automodRuleObjectSchema = z.object({
  enabled: z.boolean(),
  triggers: z.array(
    z.object({
      automod_trigger: z.object({
        ruleId: z.string(),
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
      duration: z.string().min(0).max(32),
      reason: z.string().min(0).max(400),
    }),
    kick: z.object({
      reason: z.string().max(400),
    }),
    ban: z.object({
      duration: z.string().min(0).max(32),
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

  const [openCollapsibles, setOpenCollapsibles] = useState<boolean[]>([]);

  const [openOverridesCollapsibles, setOpenOverridesCollapsibles] = useState<
    boolean[]
  >([]);

  const [openOverridesRuleCollapsibles, setOpenOverridesRuleCollapsibles] =
    useState<{ [k: string]: boolean }>({});

  const [openTriggerCollapsibles, setOpenTriggerCollapsibles] = useState<{
    [k: string]: boolean;
  }>({});

  const [openActionCollapsibles, setOpenActionCollapsibles] = useState<{
    [k: string]: boolean;
  }>({});

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
          <CardDescription>
            Configure automod module (This UI is ugly af)
          </CardDescription>
          <CardContent className="mt-4">
            <form
              id="automod-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div>
                <FieldGroup>
                  <form.Field name="config.rules" mode="array">
                    {(field) => (
                      <div>
                        <div className="flex mt-4 mb-4 justify-between items-center">
                          <h1 className="text-2xl font-bold -ml-6">Rules</h1>
                          <Button
                            type="button"
                            onClick={() => {
                              field.pushValue({
                                name: "",
                                rule: {
                                  enabled: true,
                                  triggers: [],
                                  actions: {
                                    warn: { reason: "" },
                                    mute: { duration: "", reason: "" },
                                    kick: { reason: "" },
                                    ban: { duration: "", reason: "" },
                                    add_counter: { counter: "", value: 0 },
                                    remove_counter: { counter: "", value: 0 },
                                  },
                                },
                              });
                            }}
                          >
                            <PlusCircle className="ml-auto" /> Add Rule
                          </Button>
                        </div>
                        {field.state.value.map((rule, index) => {
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
                                  Rule {rule.name}
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
                              <CollapsibleContent className="flex flex-col pb-2 ml-2 bg-muted space-y-2">
                                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                  <form.Field
                                    name={`config.rules[${index}].name`}
                                    children={(field) => {
                                      const isInvalid =
                                        field.state.meta.isTouched &&
                                        !field.state.meta.isValid;

                                      return (
                                        <Field data-invalid={isInvalid}>
                                          <FieldLabel htmlFor={field.name}>
                                            Name
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
                                    name={`config.rules[${index}].rule.enabled`}
                                    children={(field) => {
                                      const isInvalid =
                                        field.state.meta.isTouched &&
                                        !field.state.meta.isValid;

                                      return (
                                        <Field
                                          data-invalid={isInvalid}
                                          orientation="horizontal"
                                          className="mt-6"
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
                                              Enabled
                                            </FieldLabel>
                                            <FieldDescription className="text-left">
                                              Rule is active (can be changed in
                                              override by perm level)
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

                                <FieldGroup>
                                  <form.Field
                                    name={`config.rules[${index}].rule.triggers`}
                                    mode="array"
                                  >
                                    {(field) => (
                                      <div>
                                        <div className="mb-2">
                                          <Button
                                            type="button"
                                            onClick={() => {
                                              field.pushValue({
                                                automod_trigger: {
                                                  ruleId: "",
                                                },
                                                counter_trigger: {
                                                  counter: "",
                                                  trigger: "",
                                                },
                                              });
                                            }}
                                          >
                                            <PlusCircle className="ml-auto" />
                                            Add Trigger
                                          </Button>
                                        </div>
                                        {field.state.value.map(
                                          (trigger, indexTrigger) => {
                                            return (
                                              <Collapsible
                                                key={index}
                                                open={
                                                  openTriggerCollapsibles[
                                                    `${index}-${indexTrigger}`
                                                  ]
                                                }
                                                onOpenChange={(isOpen) => {
                                                  const newOpenStates = {
                                                    ...openTriggerCollapsibles,
                                                  };
                                                  newOpenStates[
                                                    `${index}-${indexTrigger}`
                                                  ] = isOpen;
                                                  setOpenTriggerCollapsibles(
                                                    newOpenStates,
                                                  );
                                                }}
                                                className="flex flex-col border rounded-md w-full bg-background gap-2 mb-2"
                                              >
                                                <div className="ml-2 flex items-center justify-between">
                                                  <h4 className="text-sm font-semibold">
                                                    Trigger Section{" "}
                                                    {indexTrigger + 1} (Empty
                                                    values for trigger type
                                                    means it&apos;s not active)
                                                  </h4>
                                                  <CollapsibleTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="size-8 bg-muted"
                                                    >
                                                      <ChevronsUpDown />
                                                      <span className="sr-only">
                                                        Toggle
                                                      </span>
                                                    </Button>
                                                  </CollapsibleTrigger>
                                                </div>
                                                <CollapsibleContent className="flex flex-col pb-2 ml-2 mr-2 bg-background space-y-2">
                                                  <h4 className="text-lg font-semibold">
                                                    Discord Automod Activation
                                                  </h4>
                                                  <FieldGroup>
                                                    <form.Field
                                                      name={`config.rules[${index}].rule.triggers[${indexTrigger}].automod_trigger.ruleId`}
                                                      children={(field) => {
                                                        const isInvalid =
                                                          field.state.meta
                                                            .isTouched &&
                                                          !field.state.meta
                                                            .isValid;

                                                        return (
                                                          <Field
                                                            data-invalid={
                                                              isInvalid
                                                            }
                                                          >
                                                            <FieldLabel
                                                              htmlFor={
                                                                field.name
                                                              }
                                                            >
                                                              Rule ID (Discord
                                                              Snowflake)
                                                            </FieldLabel>
                                                            <Input
                                                              id={field.name}
                                                              name={field.name}
                                                              value={
                                                                field.state
                                                                  .value
                                                              }
                                                              onBlur={
                                                                field.handleBlur
                                                              }
                                                              onChange={(e) =>
                                                                field.handleChange(
                                                                  e.target
                                                                    .value,
                                                                )
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                            />
                                                            {isInvalid && (
                                                              <FieldError
                                                                errors={
                                                                  field.state
                                                                    .meta.errors
                                                                }
                                                              />
                                                            )}
                                                          </Field>
                                                        );
                                                      }}
                                                    />
                                                  </FieldGroup>

                                                  <h4 className="text-lg font-semibold">
                                                    Counter trigger
                                                  </h4>
                                                  <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                                    <form.Field
                                                      name={`config.rules[${index}].rule.triggers[${indexTrigger}].counter_trigger.counter`}
                                                      children={(field) => {
                                                        const isInvalid =
                                                          field.state.meta
                                                            .isTouched &&
                                                          !field.state.meta
                                                            .isValid;

                                                        return (
                                                          <Field
                                                            data-invalid={
                                                              isInvalid
                                                            }
                                                          >
                                                            <FieldLabel
                                                              htmlFor={
                                                                field.name
                                                              }
                                                            >
                                                              Counter Name
                                                            </FieldLabel>
                                                            <Input
                                                              id={field.name}
                                                              name={field.name}
                                                              value={
                                                                field.state
                                                                  .value
                                                              }
                                                              onBlur={
                                                                field.handleBlur
                                                              }
                                                              onChange={(e) =>
                                                                field.handleChange(
                                                                  e.target
                                                                    .value,
                                                                )
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                            />
                                                            {isInvalid && (
                                                              <FieldError
                                                                errors={
                                                                  field.state
                                                                    .meta.errors
                                                                }
                                                              />
                                                            )}
                                                          </Field>
                                                        );
                                                      }}
                                                    />
                                                    <form.Field
                                                      name={`config.rules[${index}].rule.triggers[${indexTrigger}].counter_trigger.trigger`}
                                                      children={(field) => {
                                                        const isInvalid =
                                                          field.state.meta
                                                            .isTouched &&
                                                          !field.state.meta
                                                            .isValid;

                                                        return (
                                                          <Field
                                                            data-invalid={
                                                              isInvalid
                                                            }
                                                          >
                                                            <FieldLabel
                                                              htmlFor={
                                                                field.name
                                                              }
                                                            >
                                                              Trigger Name
                                                            </FieldLabel>
                                                            <Input
                                                              id={field.name}
                                                              name={field.name}
                                                              value={
                                                                field.state
                                                                  .value
                                                              }
                                                              onBlur={
                                                                field.handleBlur
                                                              }
                                                              onChange={(e) =>
                                                                field.handleChange(
                                                                  e.target
                                                                    .value,
                                                                )
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                            />
                                                            {isInvalid && (
                                                              <FieldError
                                                                errors={
                                                                  field.state
                                                                    .meta.errors
                                                                }
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
                                                        const newOpenStates = {
                                                          ...openTriggerCollapsibles,
                                                        };
                                                        newOpenStates[
                                                          `${index}-${indexTrigger}`
                                                        ] = false;
                                                        setOpenTriggerCollapsibles(
                                                          newOpenStates,
                                                        );
                                                        field.removeValue(
                                                          indexTrigger,
                                                        );
                                                      }}
                                                    >
                                                      <Trash className="ml-auto" />{" "}
                                                      Delete
                                                    </Button>
                                                  </div>
                                                </CollapsibleContent>
                                              </Collapsible>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </form.Field>
                                </FieldGroup>

                                <FieldGroup>
                                  <Collapsible
                                    className="flex flex-col border rounded-md w-full bg-background gap-2 mb-2"
                                    open={
                                      openActionCollapsibles[`${rule.name}`]
                                    }
                                    onOpenChange={(isOpen) => {
                                      const newOpenStates = {
                                        ...openActionCollapsibles,
                                      };

                                      newOpenStates[`${rule.name}`] = isOpen;

                                      setOpenActionCollapsibles(newOpenStates);
                                    }}
                                  >
                                    <div className="ml-2 flex items-center justify-between">
                                      <h4 className="text-sm font-semibold">
                                        Actions for {rule.name} (Any empty
                                        property on an action means that action
                                        is disabled)
                                      </h4>
                                      <CollapsibleTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="size-8 bg-muted"
                                        >
                                          <ChevronsUpDown />
                                          <span className="sr-only">
                                            Toggle
                                          </span>
                                        </Button>
                                      </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent className="flex flex-col pb-2 ml-2 mr-2 bg-background space-y-2">
                                      <h4 className="text-lg font-semibold">
                                        Warn
                                      </h4>
                                      <FieldGroup>
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.warn.reason`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Reason
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                      </FieldGroup>

                                      <h4 className="text-lg font-semibold">
                                        Kick
                                      </h4>
                                      <FieldGroup>
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.kick.reason`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Reason
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                      </FieldGroup>

                                      <h4 className="text-lg font-semibold">
                                        Mute
                                      </h4>
                                      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.mute.duration`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Duration
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                <FieldDescription>
                                                  Duration, formatted such as
                                                  10s, 5m, 1h, 2d, etc
                                                </FieldDescription>
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.mute.reason`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Reason
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                      </FieldGroup>

                                      <h4 className="text-lg font-semibold">
                                        Ban
                                      </h4>
                                      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.ban.duration`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Duration
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                <FieldDescription>
                                                  Duration, formatted such as
                                                  10s, 5m, 1h, 2d, etc
                                                </FieldDescription>
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.ban.reason`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Reason
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                      </FieldGroup>

                                      <h4 className="text-lg font-semibold">
                                        Increment Counter
                                      </h4>
                                      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.add_counter.counter`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Counter Name
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.add_counter.value`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Amount to increment
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      Number(e.target.value),
                                                    )
                                                  }
                                                  type="number"
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                      </FieldGroup>

                                      <h4 className="text-lg font-semibold">
                                        Decrement Counter
                                      </h4>
                                      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.remove_counter.counter`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Counter Name
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      e.target.value,
                                                    )
                                                  }
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                        <form.Field
                                          name={`config.rules[${index}].rule.actions.remove_counter.value`}
                                          children={(field) => {
                                            const isInvalid =
                                              field.state.meta.isTouched &&
                                              !field.state.meta.isValid;

                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <FieldLabel
                                                  htmlFor={field.name}
                                                >
                                                  Amount to decrement
                                                </FieldLabel>
                                                <Input
                                                  id={field.name}
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) =>
                                                    field.handleChange(
                                                      Number(e.target.value),
                                                    )
                                                  }
                                                  type="number"
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && (
                                                  <FieldError
                                                    errors={
                                                      field.state.meta.errors
                                                    }
                                                  />
                                                )}
                                              </Field>
                                            );
                                          }}
                                        />
                                      </FieldGroup>
                                    </CollapsibleContent>
                                  </Collapsible>
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
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="overrides" mode="array">
                    {(field) => (
                      <div>
                        <div className="flex mt-4 mb-4 justify-between items-center">
                          <h1 className="text-2xl font-bold -ml-6">
                            Overrides
                          </h1>
                          <Button
                            type="button"
                            onClick={() => {
                              field.pushValue({
                                level: "",
                                config: {
                                  rules: [],
                                },
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
                              open={openOverridesCollapsibles[index]}
                              onOpenChange={(isOpen) => {
                                const newOpenStates = [
                                  ...openOverridesCollapsibles,
                                ];
                                newOpenStates[index] = isOpen;
                                setOpenOverridesCollapsibles(newOpenStates);
                              }}
                              className="flex flex-col border rounded-md w-full bg-muted gap-2 mb-2"
                            >
                              <div className="ml-2 flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                  Override for {override.level}
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
                              <CollapsibleContent className="flex flex-col pb-2 ml-2 mr-2 bg-muted space-y-2">
                                <FieldGroup>
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
                                </FieldGroup>

                                <FieldGroup>
                                  <form.Field
                                    name={`overrides[${index}].config.rules`}
                                    mode="array"
                                  >
                                    {(field) => (
                                      <div>
                                        <div className="mb-2">
                                          <Button
                                            type="button"
                                            onClick={() => {
                                              field.pushValue({
                                                name: "",
                                                rule: {
                                                  enabled: true,
                                                },
                                              });
                                            }}
                                          >
                                            <PlusCircle className="ml-auto" />
                                            Add Rule
                                          </Button>
                                        </div>
                                        {field.state.value.map(
                                          (rule, indexRule) => {
                                            return (
                                              <Collapsible
                                                key={index}
                                                open={
                                                  openOverridesRuleCollapsibles[
                                                    `${index}-${indexRule}`
                                                  ]
                                                }
                                                onOpenChange={(isOpen) => {
                                                  const newOpenStates = {
                                                    ...openOverridesRuleCollapsibles,
                                                  };
                                                  newOpenStates[
                                                    `${index}-${indexRule}`
                                                  ] = isOpen;
                                                  setOpenOverridesRuleCollapsibles(
                                                    newOpenStates,
                                                  );
                                                }}
                                                className="flex flex-col border rounded-md w-full bg-background gap-2 mb-2"
                                              >
                                                <div className="ml-2 flex items-center justify-between">
                                                  <h4 className="text-sm font-semibold">
                                                    Rule {rule.name}
                                                  </h4>
                                                  <CollapsibleTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="size-8 bg-muted"
                                                    >
                                                      <ChevronsUpDown />
                                                      <span className="sr-only">
                                                        Toggle
                                                      </span>
                                                    </Button>
                                                  </CollapsibleTrigger>
                                                </div>
                                                <CollapsibleContent className="flex flex-col pb-2 ml-2 mr-2 bg-background space-y-2">
                                                  <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                                    <form.Field
                                                      name={`overrides[${index}].config.rules[${indexRule}].name`}
                                                      children={(field) => {
                                                        const isInvalid =
                                                          field.state.meta
                                                            .isTouched &&
                                                          !field.state.meta
                                                            .isValid;

                                                        return (
                                                          <Field
                                                            data-invalid={
                                                              isInvalid
                                                            }
                                                          >
                                                            <FieldLabel
                                                              htmlFor={
                                                                field.name
                                                              }
                                                            >
                                                              Name
                                                            </FieldLabel>
                                                            <Input
                                                              id={field.name}
                                                              name={field.name}
                                                              value={
                                                                field.state
                                                                  .value
                                                              }
                                                              onBlur={
                                                                field.handleBlur
                                                              }
                                                              onChange={(e) =>
                                                                field.handleChange(
                                                                  e.target
                                                                    .value,
                                                                )
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                            />
                                                            {isInvalid && (
                                                              <FieldError
                                                                errors={
                                                                  field.state
                                                                    .meta.errors
                                                                }
                                                              />
                                                            )}
                                                          </Field>
                                                        );
                                                      }}
                                                    />
                                                    <form.Field
                                                      name={`overrides[${index}].config.rules[${indexRule}].rule.enabled`}
                                                      children={(field) => {
                                                        const isInvalid =
                                                          field.state.meta
                                                            .isTouched &&
                                                          !field.state.meta
                                                            .isValid;

                                                        return (
                                                          <Field
                                                            data-invalid={
                                                              isInvalid
                                                            }
                                                            orientation="horizontal"
                                                            className="mt-6"
                                                          >
                                                            <Checkbox
                                                              id={field.name}
                                                              name={field.name}
                                                              checked={
                                                                field.state
                                                                  .value
                                                              }
                                                              onBlur={
                                                                field.handleBlur
                                                              }
                                                              onCheckedChange={(
                                                                e,
                                                              ) =>
                                                                field.handleChange(
                                                                  e as boolean,
                                                                )
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                            />
                                                            <FieldContent>
                                                              <FieldLabel
                                                                htmlFor={
                                                                  field.name
                                                                }
                                                              >
                                                                Enabled
                                                              </FieldLabel>
                                                              <FieldDescription className="text-left">
                                                                Rule is active
                                                              </FieldDescription>
                                                            </FieldContent>
                                                            {isInvalid && (
                                                              <FieldError
                                                                errors={
                                                                  field.state
                                                                    .meta.errors
                                                                }
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
                                                        const newOpenStates = {
                                                          ...openOverridesRuleCollapsibles,
                                                        };
                                                        newOpenStates[
                                                          `${index}-${indexRule}`
                                                        ] = false;
                                                        setOpenOverridesRuleCollapsibles(
                                                          newOpenStates,
                                                        );
                                                        field.removeValue(
                                                          indexRule,
                                                        );
                                                      }}
                                                    >
                                                      <Trash className="ml-auto" />{" "}
                                                      Delete
                                                    </Button>
                                                  </div>
                                                </CollapsibleContent>
                                              </Collapsible>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </form.Field>
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
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </form.Field>
                </FieldGroup>
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
