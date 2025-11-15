declare module "bun" {
  interface Env {
    HOST: string;
    PORT: string;
    DATA_DIR: string;
  }
}

declare module "*.sql" {
  const content: string;
  export default content;
}

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

export {};
