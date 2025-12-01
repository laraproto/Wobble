import * as arctic from "arctic";
import { installerConfig } from "../installer";

const redirectUri = new URL("/api/auth/callback", installerConfig?.url);
// we might do something with emails eventually
export const discordScopes = ["identify", "email"];

export const discord = new arctic.Discord(
  installerConfig?.client_id!,
  installerConfig?.client_secret!,
  redirectUri.href,
);
