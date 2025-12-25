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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useForm } from "@tanstack/react-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { ChevronsUpDown, Trash, PlusCircle } from "lucide-react";

import { z } from "zod";
import { zodSnowflake } from "#/types/discord";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import { toast } from "sonner";
import { useState } from "react";

const levelFormSchema = z.object({
  levels: z.array(
    z.object({
      id: zodSnowflake,
      level: z.number().min(0).max(100),
    }),
  ),
});

export function Levels() {
  const dashboardContext = useDashboard();

  const levelsQuery = useQuery(
    trpc.authed.guild.levels.get.queryOptions({
      guildId: dashboardContext.guild!.id,
    }),
  );

  const levelsMutation = useMutation(
    trpc.authed.guild.levels.set.mutationOptions(),
  );

  const [openCollapsibles, setOpenCollapsibles] = useState<boolean[]>([]);

  const form = useForm({
    defaultValues: {
      levels: levelsQuery.data ?? [],
    },
    validators: {
      onSubmit: levelFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await levelsMutation.mutateAsync({
        guildId: dashboardContext.guild!.id,
        ...value,
      });

      if (result.success) {
        toast.success(result.message);
      }
    },
  });

  if (levelsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Levels</CardTitle>
          <CardDescription>
            Permission levels are represented as a number from 0 to 100
          </CardDescription>
          <CardContent className="mt-4">
            <form
              id="levels-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div>
                <form.Field name="levels" mode="array">
                  {(field) => (
                    <div>
                      <div
                        className="mb-4"
                        onClick={() => {
                          field.pushValue({
                            id: "",
                            level: 0,
                          });
                        }}
                      >
                        <Button type="button">
                          <PlusCircle /> Add Level
                        </Button>
                        <span className="ml-2">
                          This button needs to be put somewhere better
                        </span>
                      </div>
                      {field.state.value.map((level, index) => {
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
                                Level {level.level} - ID: {level.id}
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
                              <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2">
                                <form.Field
                                  name={`levels[${index}].id`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                          Role or User ID
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
                                  name={`levels[${index}].level`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                          Role or User ID
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
              </div>
            </form>
          </CardContent>
          <CardFooter className="pt-4 flex items-end justify-end">
            <Button type="submit" form="levels-form">
              Submit
            </Button>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  );
}
