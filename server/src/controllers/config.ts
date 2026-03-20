import dns from 'dns/promises';
import axios from 'axios';
import type { Core } from '@strapi/strapi';

async function validateBaseDomain(
  url: string,
  isDev: boolean
): Promise<{ valid: boolean; message?: string }> {
  try {
    // Allow empty value
    if (!url) return { valid: true };

    let normalized = url.trim().toLowerCase();

    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    // Remove trailing slash
    normalized = normalized.replace(/\/+$/, '');

    const parsed = new URL(normalized);

    // DEV mode → skip DNS & reachability checks
    if (isDev) {
      return { valid: true };
    }

    // DNS check
    await dns.lookup(parsed.hostname);

    // Reachability check (accept any HTTP status)
    await axios.get(parsed.origin, {
      timeout: 2000,
      validateStatus: () => true,
    });

    return { valid: true };
  } catch {
    return {
      valid: false,
      message: 'Base domain is invalid, DNS failed, or site not reachable.',
    };
  }
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(ctx: any) {
    const settings = await strapi.plugin('faq-ai-bot').service('config').getConfig();

    const contentTypes = Object.values(strapi.contentTypes)
      .filter((ct: any) => ct.uid.startsWith('api::'))
      .map((ct: any) => ({
        uid: ct.uid,
        displayName: ct.info.displayName,
        attributes: Object.keys(ct.attributes).map((attr) => ({
          name: attr,
        })),
      }));

    ctx.body = {
      settings,
      contentTypes,
    };
  },

  async update(ctx: any) {
    const settings = ctx.request.body;

    const isDev = process.env.NODE_ENV !== 'production';

    const check = await validateBaseDomain(settings.baseDomain, isDev);

    if (!check.valid) {
      ctx.status = 400;
      ctx.body = { error: check.message };
      return;
    }

    const pluginStore = strapi.store({
      environment: null,
      type: 'plugin',
      name: 'faq-ai-bot',
    });
    const existingSettings = await pluginStore.get({ key: 'settings' });
    console.log('[DEBUG] existingSettings:', existingSettings);

    if (settings.openaiKey && (existingSettings as any)?.openaiKey !== settings.openaiKey) {
      await pluginStore.set({
        key: 'token_usage',
        value: { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
      });
    }

    const data = await strapi.plugin('faq-ai-bot').service('config').setConfig(settings);

    ctx.body = data;
  },
});
