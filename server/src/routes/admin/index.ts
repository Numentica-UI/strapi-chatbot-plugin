export default {
  type: "admin",
  routes: [
    {
      method: "GET",
      path: "/collections",
      handler: "config.index",
      config: {
        auth: { scope: ["admin"] },
        policies: [
          "admin::isAuthenticatedAdmin",
          {
            name: "plugin::nui-strapi-chatbot-plugin.hasPluginPermission",
            config: { action: "read" },
          },
        ],
      },
    },
    {
      method: "POST",
      path: "/collections",
      handler: "config.update",
      config: {
        auth: { scope: ["admin"] },
        policies: [
          "admin::isAuthenticatedAdmin",
          {
            name: "plugin::nui-strapi-chatbot-plugin.hasPluginPermission",
            config: { action: "update" },
          },
        ],
      },
    },
    {
      method: "GET",
      path: "/usage",
      handler: "ask.getUsage",
      config: {
        auth: { scope: ["admin"] },
        policies: [
          "admin::isAuthenticatedAdmin",
          {
            name: "plugin::nui-strapi-chatbot-plugin.hasPluginPermission",
            config: { action: "read" },
          },
        ],
      },
    },
    {
      method: "POST",
      path: "/validate-key",
      handler: "ask.validateKey",
      config: {
        auth: { scope: ["admin"] },
        policies: [
          "admin::isAuthenticatedAdmin",
          {
            name: "plugin::nui-strapi-chatbot-plugin.hasPluginPermission",
            config: { action: "update" },
          },
        ],
      },
    },
  ],
};
