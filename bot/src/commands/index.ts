import { type BotCommand, client, rest } from "#botBase";
import {
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type APIApplicationCommand,
  Routes,
} from "discord.js";

import utilityCommands from "./utility";
import moderationCommands from "./moderation";

const commands: BotCommand[] = [
  ...utilityCommands,
  ...moderationCommands,
] as const;
const commandsData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

for await (const command of commands) {
  if (!client.commands) {
    console.warn("Client.commands is not defined");
    break;
  }
  if (!("data" in command && "execute" in command)) {
    console.warn("Found invalid command, somewhere");
    continue;
  }
  console.log("Registering command:", command.data.name);
  client.commands.set(command.data.name, command);
  commandsData.push(command.data.toJSON());
}

(async () => {
  try {
    const data = await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commandsData,
    });

    console.log(
      `Successfully registered ${(data as Array<APIApplicationCommand>).length} application (/) commands.`,
    );
  } catch (error) {
    console.error(error);
  }
})();
