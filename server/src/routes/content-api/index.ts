export default () => ({
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'controller.index',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/ask',
      handler: 'ask.ask',
      config: {
        auth: false,
        // NOTE: plug in your Strapi rate-limit middleware here, e.g.:
        // middlewares: ['plugin::faq-ai-bot.rateLimit'],
      },
    },
    {
      method: 'GET',
      path: '/suggestion-and-logo',
      handler: 'suggestQuestionsAndLogo.getSuggestionAndLogo',
      config: {
        auth: false,
      },
    },
  ],
});
