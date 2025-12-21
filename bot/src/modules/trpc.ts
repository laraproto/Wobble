import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wobble/website/trpc";

import { BOT_SESSION, URL } from "./config";
import SuperJSON from "superjson";

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${URL}/api/trpc`,
      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          authorization: BOT_SESSION,
        };
      },
      transformer: SuperJSON,
    }),
  ],
});

export default client;
