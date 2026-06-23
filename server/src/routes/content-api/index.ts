export default () => ({
  type: "content-api",
  routes: [
    {
      method: "POST",
      path: "/ask",
      handler: "ask.ask",
    },
    {
      method: "GET",
      path: "/suggestions-and-privacy",
      handler: "suggestionsAndPrivacy.getSuggestionsAndPrivacy",
    },
  ],
});
