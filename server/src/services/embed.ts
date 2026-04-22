import { Core } from "@strapi/strapi";
import OpenAI from "openai";

type PluginSettings = {
  openaiKey?: string;
  contactLink?: string;
  systemInstructions?: string;
  responseInstructions?: string;
};

async function getOpenAI(strapi: Core.Strapi) {
  const pluginStore = strapi.store({
    environment: null,
    type: "plugin",
    name: "nui-strapi-chatbot-plugin",
  });

  const settings = (await pluginStore.get({
    key: "settings",
  })) as PluginSettings;
  const key = settings?.openaiKey;

  if (!key) return null;

  return new OpenAI({ apiKey: key });
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async generateEmbedding(text: string) {
    try {
      const openai = await getOpenAI(strapi);
      if (!openai) {
        strapi.log.warn("OpenAI key missing – skipping embedding");
        return null;
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      return {
        embedding: response.data[0].embedding,
        tokensUsed: response.usage?.prompt_tokens || 0,
      };
    } catch (error) {
      strapi.log.error("Error generating embedding via OpenAI:");
      console.error(error);
      return null;
    }
  },
});
