export default (policyContext: any, config: { action: string }, { strapi }: { strapi: any }) => {
  const { action } = config;
  const { userAbility } = policyContext.state;

  return userAbility.can(`plugin::nui-strapi-chatbot-plugin.${action}`);
};
