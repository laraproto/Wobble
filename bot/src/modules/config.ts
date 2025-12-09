const isUndefinedOrEmpty = (
  value: string | undefined,
  replace_value?: string,
) => {
  if (value === undefined || value.trim() === "") {
    return replace_value;
  }
  return value;
};

export const URL = (() => {
  const url = isUndefinedOrEmpty(Bun.env.URL);

  if (!url) {
    throw new Error("URL environment variable is not defined");
  }

  return url;
})();

export const BOT_TOKEN = (() => {
  const token = isUndefinedOrEmpty(Bun.env.BOT_TOKEN);

  if (!token) {
    throw new Error("BOT_TOKEN environment variable is not defined");
  }

  return token;
})();
