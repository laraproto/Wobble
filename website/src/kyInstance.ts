import ky from "ky";

export const discordKy = ky.create({
  prefixUrl: "https://discord.com/api/v10",
});
