import { type BaseAutomodRuleObjectSchema } from "#/types/modules";

// TODO: Implement automod actions
export async function handleAutomodActions(
  actions: BaseAutomodRuleObjectSchema["actions"],
) {
  if (!actions) {
    return;
  }
}
