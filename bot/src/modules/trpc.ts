import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@wobble/website/trpc";

import { BOT_SESSION, URL } from "./config";
import SuperJSON from "superjson";

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
