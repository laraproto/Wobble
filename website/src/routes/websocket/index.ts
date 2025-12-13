import { server } from "#/index.ts";
import type { WSEventPayloads, WSEvents, WSMessage } from "#/types/ws";

export async function sendEvent(event: WSEvents, data: WSEventPayloads) {
  if (!server) {
    throw new Error("wait for server init before sending ws messages");
  }

  server.publish(
    "bot",
    JSON.stringify({
      event: event,
      data: data,
    } as WSMessage),
  );
}
