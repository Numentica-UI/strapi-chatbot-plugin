export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/collections',
      handler: 'config.index',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/collections',
      handler: 'config.update',
      config: {
        auth: false,
      },
    },
  ],
};
