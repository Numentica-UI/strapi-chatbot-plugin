import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Read Settings',
      uid: 'read',
      pluginName: 'faq-ai-bot',
    },
    {
      section: 'plugins',
      displayName: 'Update Settings',
      uid: 'update',
      pluginName: 'faq-ai-bot',
    },
  ]);
};

export default register;
