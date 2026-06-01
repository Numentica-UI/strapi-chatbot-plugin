export default ({ strapi }: { strapi: any }) => ({
  async getSuggestionsAndPrivacy(ctx: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });

    const settings = await pluginStore.get({ key: "settings" });

    ctx.body = {
      suggestedQuestions: settings?.suggestedQuestions || [],
      privacyPolicyUrl: settings?.privacyPolicyUrl || null,
    };
  },
});
