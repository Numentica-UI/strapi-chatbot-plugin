export default ({ strapi }: { strapi: any }) => ({
  async getSuggestionAndLogo(ctx: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });

    const settings = await pluginStore.get({ key: "settings" });

    ctx.body = {
      suggestedQuestions: settings?.suggestedQuestions || [],
      logoUrl: settings?.logoUrl || null,
    };
  },
});
