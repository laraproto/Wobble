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
import { Input } from "@/components/ui/input";
import { useForm, useStore } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

const installerSchema = z.object({
  databaseType: z.enum(["pglite", "postgresql"]),
  databaseUrl: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  registrationEnabled: z.boolean(),
});

export function Installer() {
  const form = useForm({
    defaultValues: {
      databaseType: "pglite",
      databaseUrl: "",
      botToken: "",
      clientId: "",
      clientSecret: "",
      registrationEnabled: false,
    },
    validators: {
      onSubmit: installerSchema,
    },
    onSubmit: async ({ value }) => {
      console.log("what");
      toast.success("Form submitted");
    },
  });

  const databaseTypeField = useStore(
    form.store,
    (state) =>
      (state.values as { databaseType: string | undefined }).databaseType,
  );

  return (
    <div className="container mx-auto p-8 text-center relative z-10 w-96">
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
              form.handleSubmit();
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
                        value={
                          (field.state as { value: string | undefined }).value
                        }
                        onValueChange={(e) => field.handleChange(e)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a database type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pglite">PGLite</SelectItem>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              {databaseTypeField === "postgresql" && (
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
                          value={
                            (field.state as { value: string | undefined }).value
                          }
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
              )}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="pt-4">
          <Field orientation="horizontal">
            <Button
              type="submit"
              form="installer-form"
              onClick={(e) => {
                form.handleSubmit();
              }}
            >
              Submit
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
