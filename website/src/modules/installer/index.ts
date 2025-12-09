import { Database } from "bun:sqlite";
import { DATA_DIR } from "#modules/config";
import installer from "./installer.sql" with { type: "text" };

export class InstallerConfiguration {
  id: number = 0;
  database_type: string;
  database_url: string;
  url: string;
  registration_enabled: number = 0;
  bot_token: string;
  client_id: string;
  client_secret: string;

  get canRegister() {
    return this.registration_enabled === 1;
  }

  set canRegister(value: boolean) {
    this.registration_enabled = value ? 1 : 0;
  }

  constructor(
    p_database_type: string,
    p_database_url: string,
    p_url: string,
    p_registration_enabled: number,
    p_bot_token: string,
    p_client_id: string,
    p_client_secret: string,
  ) {
    this.database_type = p_database_type;
    this.database_url = p_database_url;
    this.url = p_url;
    this.registration_enabled = p_registration_enabled;
    this.bot_token = p_bot_token;
    this.client_id = p_client_id;
    this.client_secret = p_client_secret;
  }

  update() {
    const updateQuery = configDB.query(
      "UPDATE data SET database_type = $database_type, database_url = $database_url, url = $url, registration_enabled = $registration_enabled, bot_token = $bot_token, client_id = $client_id, client_secret = $client_secret;",
    );

    updateQuery.get({
      database_type: installerConfig!.database_type,
      database_url: installerConfig!.database_url,
      url: installerConfig!.url,
      registration_enabled: installerConfig!.canRegister ? 1 : 0,
      bot_token: installerConfig!.bot_token,
      client_id: installerConfig!.client_id,
      client_secret: installerConfig!.client_secret,
    });
  }
}

export const configDB = new Database(`${DATA_DIR}/config.db`, {
  strict: true,
});

const dataExists = configDB.query<{ "count(*)": number }, []>(
  "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='data';",
);

if (dataExists.get()!["count(*)"] === 0) {
  console.log("Migrating database...");
  configDB.run(installer);
}

const dataTableQuery = configDB
  .query("SELECT * FROM data;")
  .as(InstallerConfiguration);

export let installerConfig = dataTableQuery.get();

export const setInstallerConfig = (config: InstallerConfiguration | null) => {
  installerConfig = config;
};
