import dns from 'dns/promises';
import type { Core } from '@strapi/strapi';

const ALLOWED_SETTINGS_KEYS: Record<string, { type: string; maxLength?: number }> = {
  openaiKey: { type: 'string', maxLength: 200 },
  baseDomain: { type: 'string', maxLength: 500 },
  systemInstructions: { type: 'string', maxLength: 4000 },
  responseInstructions: { type: 'string', maxLength: 4000 },
  contactLink: { type: 'string', maxLength: 500 },
  callsPerMinute: { type: 'number' },
  cardStyles: { type: 'object' },
  config: { type: 'object' },
  suggestedQuestions: { type: 'array' },
};

function sanitizeSettings(raw: any): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, rules] of Object.entries(ALLOWED_SETTINGS_KEYS)) {
    if (!(key in raw)) continue;
    const value = raw[key];
    if (rules.type === 'string') {
      if (typeof value !== 'string') continue;
      sanitized[key] = rules.maxLength ? value.slice(0, rules.maxLength) : value;
    } else if (rules.type === 'array') {
      if (!Array.isArray(value)) continue;
      sanitized[key] = value;
    } else if (rules.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value) || value === null) continue;
      sanitized[key] = value;
    } else if (rules.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) continue;
      sanitized[key] = Math.min(300, Math.max(1, Math.floor(n)));
    }
  }
  return sanitized;
}

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const METADATA_HOSTNAMES = ['169.254.169.254', 'metadata.google.internal'];

async function validateBaseDomain(
  url: string,
  isDev: boolean
): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!url) return { valid: true };

    let normalized = url.trim().toLowerCase();

    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    normalized = normalized.replace(/\/+$/, '');

    const parsed = new URL(normalized);
    const hostname = parsed.hostname;

    if (METADATA_HOSTNAMES.includes(hostname)) {
      return { valid: false, message: 'Base domain is not allowed.' };
    }

    if (isDev) {
      return { valid: true };
    }

    const result = await dns.lookup(hostname);
    const resolvedIp = result.address;

    if (PRIVATE_IP_RANGES.some((re) => re.test(resolvedIp))) {
      return { valid: false, message: 'Base domain resolves to a private/internal address.' };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      message: 'Base domain is invalid or DNS resolution failed.',
    };
  }
}

function maskSettings(settings: any): any {
  if (!settings) return settings;
  const masked = { ...settings };
  if (masked.openaiKey) {
    masked.openaiKey = '********' + settings.openaiKey.slice(-4);
  }
  return masked;
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
      settings: maskSettings(settings),
      contentTypes,
    };
  },

  async update(ctx: any) {
    const rawBody = ctx.request.body?.data ?? ctx.request.body;

    const settings = sanitizeSettings(rawBody);

    const isDev = process.env.NODE_ENV !== 'production';

    const check = await validateBaseDomain(settings.baseDomain ?? '', isDev);

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

    if (settings.openaiKey && (existingSettings as any)?.openaiKey !== settings.openaiKey) {
      await pluginStore.set({
        key: 'token_usage',
        value: { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
      });
    }
    
    if (settings.openaiKey && settings.openaiKey.startsWith('********')) {
      delete settings.openaiKey;
    }

    const data = await strapi.plugin('faq-ai-bot').service('config').setConfig(settings);
    ctx.body = maskSettings(data);
  },
});
