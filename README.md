# FAQ AI Bot - Strapi Plugin

An AI-powered FAQ chatbot plugin for Strapi. Drop it into any Strapi project and get an intelligent FAQ assistant in your admin panel.

<br>

---

## Requirements

- Node.js `>=18.0.0`
- Strapi `>=4.x`

---

## 📦 Installation

Pick your package manager:

```bash
# npm
npm install strapi-plugin-faq-ai-bot@latest

# yarn
yarn add strapi-plugin-faq-ai-bot@latest

# pnpm
pnpm add strapi-plugin-faq-ai-bot@latest
```

---

## Build & Start

```bash
# npm
npm run build
npm run develop

# yarn
yarn build
yarn develop

# pnpm
pnpm build
pnpm develop
```

---

### 💡 Usage

1. Start your Strapi app.
2. Open the admin panel.
3. Navigate to the **FAQ AI Bot** plugin in the sidebar.
4. Setup the [OpenAI API Key](https://platform.openai.com/settings/organization/api-keys) (Make sure _**GPT-4o mini**_ and _**text-embedding-3-small**_ models are available).
5. Add your base domain of the frontend (To access the cards from it's public folder).
6. Add contact link so that the AI can provide it to the user if he requests.
7. Save the configurations.
8. Entry your FAQs in the _Chatbot-FAQ_ collection.
9. The chatbot is ready to use.
10. You can test the Chatbot in Admin panel.

---

### Updating

```bash
# npm
npm install strapi-plugin-faq-ai-bot@latest

# yarn
yarn add strapi-plugin-faq-ai-bot@latest

# pnpm
pnpm add strapi-plugin-faq-ai-bot@latest
```

Then rebuild and restart:

```bash
npm run build && npm run develop
```

---

### ⚠️ Troubleshooting

- Make sure the base domain is proper.
- Only enter FAQs into the Chatbot-FAQ collection after providing the API key.

---

### 📚 Links

- [Strapi Docs](https://docs.strapi.io)
- [Developer Setup](./DEVELOPERS_README.md)
