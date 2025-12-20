declare module "bun" {
  interface Env {
    HOST: string;
    PORT: string;
    DATA_DIR: string;
  }
}

declare global {
  interface BigInt {
    toJSON(): string;
  }
  var botGlobal: Bun.Subprocess<"ignore", "inherit", "inherit"> | null;
  var client:
    | import("bun").SQL
    | import("@electric-sql/pglite").PGlite
    | undefined;
}

export {};
