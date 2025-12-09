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
}

export {};
