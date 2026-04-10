export default (policyContext: any, config: { action: string }, { strapi }: { strapi: any }) => {
  const { action } = config;
  const { userAbility } = policyContext.state;

  return userAbility.can(`plugin::faq-ai-bot.${action}`);
};
