import type { Core } from '@strapi/strapi';

const WINDOW_MS = 60_000;
const store = new Map<string, { count: number; resetAt: number }>();

export default async (ctx: any, _config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const pluginStore = strapi.store({ environment: null, type: 'plugin', name: 'faq-ai-bot' });
  const settings = (await pluginStore.get({ key: 'settings' })) as any;
  const max: number = settings?.callsPerMinute ?? 10;

  const ip =
    ctx.request.headers['x-forwarded-for']?.split(',')[0].trim() ?? ctx.request.ip ?? 'unknown';

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    const message = `You have reached the maximum number of calls per minute. Please wait ${retryAfter} second(s) and try again.`;

    const origin = ctx.request.headers['origin'] || '*';

    ctx.res.statusCode = 200;
    ctx.res.setHeader('Content-Type', 'text/event-stream');
    ctx.res.setHeader('Cache-Control', 'no-cache');
    ctx.res.setHeader('Connection', 'keep-alive');
    ctx.res.setHeader('Access-Control-Allow-Origin', origin);
    ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');

    const words = message.split(' ');

    for (const word of words) {
      await new Promise<void>((resolve) => {
        ctx.res.write(`data: ${word} \n\n`, () => resolve());
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 40));
    }

    await new Promise<void>((resolve) => {
      ctx.res.end(`data: [DONE]\n\n`, () => resolve());
    });

    return;
  }

  entry.count += 1;
};
