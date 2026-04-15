import { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const UID = 'plugin::nui-strapi-chatbot-plugin.faqqa';

  const updateEmbedding = async (params: any, existingEntry?: any) => {
    const { data } = params;
    const question = data.question ?? existingEntry?.question;
    const answer = data.answer ?? existingEntry?.answer;

    if (!question || !answer) return;

    const textToEmbed = `Q: ${question}\nA: ${answer}`;

    const result = await strapi
      .plugin('nui-strapi-chatbot-plugin')
      .service('embed')
      .generateEmbedding(textToEmbed);

    if (result) {
      data.embedding = result.embedding;

      try {
        const pluginStore = strapi.store({
          environment: null,
          type: 'plugin',
          name: 'nui-strapi-chatbot-plugin',
        });
        const existing = ((await pluginStore.get({ key: 'token_usage' })) as {
          totalTokens: number;
          promptTokens: number;
          completionTokens: number;
          embeddingTokens: number;
        } | null) || {
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          embeddingTokens: 0,
        };
        await pluginStore.set({
          key: 'token_usage',
          value: {
            totalTokens: existing.totalTokens + result.tokensUsed,
            promptTokens: existing.promptTokens + result.tokensUsed,
            completionTokens: existing.completionTokens,
            embeddingTokens: (existing.embeddingTokens || 0) + result.tokensUsed,
          },
        });
      } catch (e) {
        strapi.log.error('Failed to save embedding token usage:', e);
      }
    }
  };

  strapi.db.lifecycles.subscribe({
    models: [UID],

    async beforeCreate(event) {
      await updateEmbedding(event.params);
    },

    async beforeUpdate(event) {
      const { where } = event.params;

      const existingEntry = await strapi.db.query(UID).findOne({ where });

      await updateEmbedding(event.params, existingEntry);
    },
  });
};
