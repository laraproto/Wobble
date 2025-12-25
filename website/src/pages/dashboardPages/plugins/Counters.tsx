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
import { useForm, useStore } from "@tanstack/react-form";

import { z } from "zod";
import { operationParsingRegex, durationParsingRegex } from "#/types/modules";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { ChevronsUpDown, Trash, PlusCircle } from "lucide-react";

import { toast } from "sonner";
import { useState } from "react";

const countersBaseSchema = z.object({
  counters: z.array(
    z.object({
      name: z.string(),
      counter: z.object({
        per_channel: z.boolean(),
        per_user: z.boolean(),
        initial_value: z.number(),
        decay: z.object({
          amount: z.number().min(0),
          interval: z.string().regex(durationParsingRegex),
        }),
        triggers: z.array(
          z.object({
            name: z.string(),
            data: z.object({
              condition: z.string().regex(operationParsingRegex),
            }),
          }),
        ),
      }),
    }),
  ),
  can_view: z.boolean(),
  can_edit: z.boolean(),
  can_reset_all: z.boolean(),
});

const countersFormSchema = z.object({
  config: countersBaseSchema,
  overrides: z.array(
    z.object({
      level: z.string().regex(operationParsingRegex),
      config: countersBaseSchema.omit({
        counters: true,
      }),
    }),
  ),
});

export function Counters() {
  const dashboardContext = useDashboard();

  const countersQuery = useQuery(
    trpc.authed.guild.counters.get.queryOptions({
      guildId: dashboardContext.guild!.id,
    }),
  );

  const countersMutation = useMutation(
    trpc.authed.guild.counters.set.mutationOptions(),
  );

  const [openCollapsibles, setOpenCollapsibles] = useState<boolean[]>([]);

  const [openOverridesCollapsibles, setOpenOverridesCollapsibles] = useState<
    boolean[]
  >([]);

  const [openTriggerCollapsibles, setOpenTriggerCollapsibles] = useState<{
    [k: string]: boolean;
  }>({});

  const form = useForm({
    defaultValues: {
      config: {
        counters: countersQuery.data?.config.counters ?? [],
        can_view: countersQuery.data?.config.can_view ?? false,
        can_edit: countersQuery.data?.config.can_edit ?? false,
        can_reset_all: countersQuery.data?.config.can_reset_all ?? false,
      },
      overrides: countersQuery.data?.overrides ?? [],
    },
    validators: {
      onSubmit: countersFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await countersMutation.mutateAsync({
        guildId: dashboardContext.guild!.id,
        ...(value as z.infer<typeof countersFormSchema>),
      });

      if (result.success) {
        toast.success(result.message);
      }
    },
  });

  const mainConfigField = useStore(form.store, (state) => state.values.config);

  if (countersQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Counters</CardTitle>
          <CardDescription>Configure counters module</CardDescription>
          <CardContent className="mt-4">
            <form
              id="counters-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div>
                <FieldGroup className="flex flex-col gap-4">
                  <p className="text-2xl -ml-6 font-bold">Permissions</p>
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
                              Can view
                            </FieldLabel>
                            <FieldDescription className="text-left">
                              Can view counters and their values.
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
                    name="config.can_edit"
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
                              Can edit
                            </FieldLabel>
                            <FieldDescription className="text-left">
                              Can edit counter values.
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
                    name="config.can_reset_all"
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
                              Can reset all
                            </FieldLabel>
                            <FieldDescription className="text-left">
                              Can reset all counters to their initial values.
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
                <FieldGroup className="flex flex-col gap-4 mt-8">
                  <form.Field name="config.counters" mode="array">
                    {(field) => (
                      <div>
                        <div className="flex mt-4 mb-4 justify-between items-center">
                          <h1 className="text-2xl font-bold -ml-6">Counters</h1>
                          <Button
                            type="button"
                            onClick={() => {
                              field.pushValue({
                                name: "",
                                counter: {
                                  per_channel: false,
                                  per_user: false,
                                  initial_value: 0,
                                  decay: { amount: 0, interval: "0s" },
                                  triggers: [],
                                },
                              });
                            }}
                          >
                            <PlusCircle className="ml-auto" /> Add Counter
                          </Button>
                        </div>
                        {field.state.value.map((counter, index) => {
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
                                  Counter {counter.name}
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
                                    name={`config.counters[${index}].name`}
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
                                    name={`config.counters[${index}].counter.initial_value`}
                                    children={(field) => {
                                      const isInvalid =
                                        field.state.meta.isTouched &&
                                        !field.state.meta.isValid;

                                      return (
                                        <Field data-invalid={isInvalid}>
                                          <FieldLabel htmlFor={field.name}>
                                            Initial Value
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
                                            aria-invalid={isInvalid}
                                            type="number"
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
                                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                  <form.Field
                                    name={`config.counters[${index}].counter.per_user`}
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
                                              Per user
                                            </FieldLabel>
                                            <FieldDescription className="text-left">
                                              Counter is per user.
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
                                    name={`config.counters[${index}].counter.per_channel`}
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
                                              Per channel
                                            </FieldLabel>
                                            <FieldDescription className="text-left">
                                              Counter is per channel.
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

                                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                  <form.Field
                                    name={`config.counters[${index}].counter.decay.amount`}
                                    children={(field) => {
                                      const isInvalid =
                                        field.state.meta.isTouched &&
                                        !field.state.meta.isValid;

                                      return (
                                        <Field data-invalid={isInvalid}>
                                          <FieldLabel htmlFor={field.name}>
                                            Decay Amount
                                          </FieldLabel>
                                          <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            type="number"
                                            onChange={(e) =>
                                              field.handleChange(
                                                Number(e.target.value),
                                              )
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
                                    name={`config.counters[${index}].counter.decay.interval`}
                                    children={(field) => {
                                      const isInvalid =
                                        field.state.meta.isTouched &&
                                        !field.state.meta.isValid;

                                      return (
                                        <Field data-invalid={isInvalid}>
                                          <FieldLabel htmlFor={field.name}>
                                            Decay Interval
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
                                </FieldGroup>

                                <FieldGroup className="flex flex-col gap-4 mt-8">
                                  <form.Field
                                    name={`config.counters[${index}].counter.triggers`}
                                    mode="array"
                                  >
                                    {(field) => (
                                      <div>
                                        <div
                                          className="mb-4"
                                          onClick={() => {
                                            field.pushValue({
                                              name: "",
                                              data: {
                                                condition: "",
                                              },
                                            });
                                          }}
                                        >
                                          <Button type="button">
                                            <PlusCircle /> Add Trigger
                                          </Button>
                                        </div>
                                        {field.state.value.map(
                                          (trigger, indexTrigger) => {
                                            return (
                                              <Collapsible
                                                key={indexTrigger}
                                                open={
                                                  openTriggerCollapsibles[
                                                    `${index}-${trigger.name}`
                                                  ]
                                                }
                                                onOpenChange={(isOpen) => {
                                                  const newOpenStates = {
                                                    ...openTriggerCollapsibles,
                                                  };
                                                  newOpenStates[
                                                    `${index}-${trigger.name}`
                                                  ] = isOpen;
                                                  setOpenTriggerCollapsibles(
                                                    newOpenStates,
                                                  );
                                                }}
                                                className="flex flex-col border rounded-md w-full bg-background gap-2 mb-2"
                                              >
                                                <div className="ml-2 flex items-center justify-between">
                                                  <h4 className="text-sm font-semibold">
                                                    Trigger {trigger.name}
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
                                                <CollapsibleContent className="flex flex-col pb-2 ml-2 bg-background space-y-2">
                                                  <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                                    <form.Field
                                                      name={`config.counters[${index}].counter.triggers[${indexTrigger}].name`}
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
                                                      name={`config.counters[${index}].counter.triggers[${indexTrigger}].data.condition`}
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
                                                              Condition
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
                                                        field.removeValue(
                                                          index,
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
                                <div>
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
                                                field.handleChange(
                                                  e.target.value,
                                                )
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
                                    <p className="text-2xl font-bold">
                                      Permissions
                                    </p>
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
                                                Can view
                                              </FieldLabel>
                                              <FieldDescription className="text-left">
                                                Can view counters and their
                                                values.
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
                                      name={`overrides[${index}].config.can_edit`}
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
                                                Can edit
                                              </FieldLabel>
                                              <FieldDescription className="text-left">
                                                Can edit counter values.
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
                                      name={`overrides[${index}].config.can_reset_all`}
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
                                                Can reset all
                                              </FieldLabel>
                                              <FieldDescription className="text-left">
                                                Can reset all counters to their
                                                initial values.
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
                </FieldGroup>
              </div>
            </form>
          </CardContent>
          <CardFooter className="pt-4 flex items-end justify-end">
            <Button type="submit" form="counters-form">
              Submit
            </Button>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
