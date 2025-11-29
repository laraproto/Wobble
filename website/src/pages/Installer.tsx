import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useForm, useStore } from "@tanstack/react-form";
import { zodSnowflake } from "@/types/discord";
import { useLocation } from "wouter";
import { toast } from "sonner";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import type { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/routes/trpc";

const installerSchema = z.object({
  databaseType: z.enum(["pglite", "postgres"]),
  databaseUrl: z.string(),
  websiteUrl: z.url().min(1, "URL is required"),
  botToken: z.string().min(1, "Bot token is required"),
  clientId: zodSnowflake.min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  registrationEnabled: z.boolean(),
});

export function Installer() {
  const installerMutation = useMutation(trpc.installer.set.mutationOptions({}));
  const [location, navigate] = useLocation();

  const form = useForm({
    defaultValues: {
      databaseType: "pglite",
      databaseUrl: "",
      websiteUrl: "",
      botToken: "",
      clientId: "",
      clientSecret: "",
      registrationEnabled: false,
    },
    validators: {
      onSubmit: installerSchema,
      onSubmitAsync: async ({ value }) => {
        if (
          value.databaseType === "postgres" &&
          value.databaseUrl.trim() === ""
        ) {
          toast.error("Database URL is required when using postgresql");
          return {
            fields: {
              databaseUrl: "Database URL is required when using postgresql",
            },
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      if (
        value.databaseType === "postgres" &&
        value.databaseUrl.trim() === ""
      ) {
        toast.error("Database URL is required when using postgresql");
        return {
          fields: {
            databaseUrl: {
              message: "Database URL is required when using postgresql",
            },
          },
        };
      }

      try {
        const status = await installerMutation.mutateAsync(value);
        if (status?.success) {
          toast.success(status.message);
          if (status.redirect) {
            navigate(status.redirect);
          }
        } else {
          toast.error(status?.message || "An unknown error occurred");
        }
      } catch (err) {
        const error = err as TRPCClientError<AppRouter>;
        toast.error(error.data?.code);
      }
    },
  });

  const databaseTypeField = useStore(
    form.store,
    (state) => state.values.databaseType,
  );

  return (
    <div className="container mx-auto p-8 text-center relative z-10 w-96 lg:w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Installer</CardTitle>
          <CardDescription>Wobble initial configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="installer-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="databaseType"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Database Type
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(e) => field.handleChange(e)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a database type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pglite">PGLite</SelectItem>
                          <SelectItem value="postgres">PostgreSQL</SelectItem>
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              {databaseTypeField === "postgres" && (
                <form.Field
                  name="databaseUrl"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Database URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          placeholder="postgres://username:password@host:port/database"
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <>
                            {/* @ts-expect-error type error due to empty string check, also I had to add a fragment for this comment */}
                            <FieldError errors={field.state.meta.errors} />
                          </>
                        )}
                      </Field>
                    );
                  }}
                />
              )}
              <form.Field
                name="websiteUrl"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                      <Input
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
                name="clientId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Client ID</FieldLabel>
                      <Input
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
                name="clientSecret"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Client Secret
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        type="password"
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
                name="botToken"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Bot Token</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        type="password"
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
                name="registrationEnabled"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid} orientation="horizontal">
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
                          Enable User Registration
                        </FieldLabel>
                        <FieldDescription className="text-left">
                          Allow users to freely register and start using the
                          bot, otherwise invite codes will need to be given out
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
          </form>
        </CardContent>
        <CardFooter className="pt-4">
          <Field orientation="horizontal">
            <Button type="submit" form="installer-form">
              Submit
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
