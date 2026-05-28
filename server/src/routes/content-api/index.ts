export default () => ({
  type: "content-api",
  routes: [
    {
      method: "GET",
      path: "/",
      handler: "controller.index",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/ask",
      handler: "ask.ask",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/suggestions-and-privacy",
      handler: "suggestionsAndPrivacy.getSuggestionsAndPrivacy",
      config: {
        auth: false,
      },
    },
  ],
});
