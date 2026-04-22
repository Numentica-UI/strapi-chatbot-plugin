export default ({ strapi }: { strapi: any }) => ({
  async index(ctx: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });

    const settings = await pluginStore.get({ key: "settings" });

    ctx.body = {
      cardStyles: settings?.cardStyles || {},
    };
  },
});
