import type { Core } from "@strapi/strapi";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: "plugins",
      displayName: "Read Settings",
      uid: "read",
      pluginName: "nui-strapi-chatbot-plugin",
    },
    {
      section: "plugins",
      displayName: "Update Settings",
      uid: "update",
      pluginName: "nui-strapi-chatbot-plugin",
    },
  ]);
};

export default register;
