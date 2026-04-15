import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    ctx.body = strapi.plugin('nui-strapi-chatbot-plugin').service('service').getWelcomeMessage();
  },
});

export default controller;
