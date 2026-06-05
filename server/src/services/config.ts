import type { Core } from "@strapi/strapi";

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getConfig() {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });

    const settings = await pluginStore.get({ key: "settings" });

    return settings && typeof settings === "object" ? settings : {};
  },

  async setConfig(newSettings: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });
    const existingRaw = await pluginStore.get({ key: "settings" });

    const existingSettings =
      existingRaw && typeof existingRaw === "object" ? existingRaw : {};

    let rebuiltCollections: any[] = [];

    if (newSettings.config) {
      rebuiltCollections = Object.entries(newSettings.config)
        .map(([uid, selectedFields]: any) => {
          const contentType = strapi.contentTypes[uid];
          if (!contentType) return null;

          const allFields = Object.keys(contentType.attributes);

          return {
            name: uid.split(".")[1],
            fields: allFields.map((field) => ({
              name: field,
              enabled: selectedFields.includes(field),
            })),
          };
        })
        .filter(Boolean);
    }

    const mergedSettings = {
      ...existingSettings,
      ...newSettings,
    };

    if (newSettings.config) {
      await pluginStore.set({
        key: "collections",
        value: rebuiltCollections,
      });
    }

    await pluginStore.set({
      key: "settings",
      value: mergedSettings,
    });

    return mergedSettings;
  },
});
