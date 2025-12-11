import * as arctic from "arctic";
import { installerConfig } from "../installer";

const redirectUri = new URL(
  "/api/auth/callback",
  installerConfig?.url ?? "http://localhost:3000",
);
// we might do something with emails eventually
export const discordScopes = ["identify", "email", "guilds"];

export let discord: arctic.Discord | null = null;

export const setupOAuthModules = async () => {
  discord = new arctic.Discord(
    installerConfig?.client_id!,
    installerConfig?.client_secret!,
    redirectUri.href,
  );
};

if (installerConfig) {
  setupOAuthModules();
}
