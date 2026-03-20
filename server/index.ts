import type { Core } from '@strapi/strapi';
import contentTypes from './src/content-types';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
  },
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
  },
  contentTypes,
};
