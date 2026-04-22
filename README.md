# Strapi Chatbot Plugin

An AI-powered FAQ chatbot plugin for Strapi. Drop it into any Strapi project and get an intelligent FAQ assistant in your admin panel.

> ⚠️ **Note:** To test the chatbot API, you can use the [**_nui-strapi-chatbot-react_**](https://www.npmjs.com/package/nui-strapi-chatbot-react) package as a simple frontend UI.

[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D%2018-green.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/nui-strapi-chatbot-plugin)](https://www.npmjs.com/package/nui-strapi-chatbot-plugin)
![Strapi v5](https://img.shields.io/badge/Strapi-%5E5.0.0-blueviolet)

---

## 📦 Installation

```bash
# npm
npm install nui-strapi-chatbot-plugin@latest

# yarn
yarn add nui-strapi-chatbot-plugin@latest

# pnpm
pnpm add nui-strapi-chatbot-plugin@latest
```

---

## 🚀 Build & Start

```bash
npm run build
npm run develop
```

---

## 💡 Usage

1. Start your Strapi app.

2. Open the admin panel and navigate to **NUI Chatbot Configuration** in the sidebar.
<p align="center"><img src="./screenshots/Plugin_Homepage.png" width="90%"/></p>

3. Set up your [OpenAI API key](https://platform.openai.com/settings/organization/api-keys). Make sure **`gpt-4o-mini`** and **`text-embedding-3-small`** models are available on your account.
<p align="center"><img src="./screenshots/Add_API_Key.png" width="90%"/></p>

4. Clicking **_Save_** will validate the API key and save it.
<p align="center"><img src="./screenshots/API_Key_Validation.png" width="90%"/></p>

5. Add your frontend base domain (used to resolve card assets from its public folder).
<p align="center"><img src="./screenshots/Add_Base_Domain.png" width="90%"/></p>

6. Add a contact link so the AI can provide it to users on request.
<p align="center"><img src="./screenshots/Add_Contact_Link.png" width="90%"/></p>

7. Save the configuration.
<p align="center"><img src="./screenshots/Save_Button.png" width="90%"/></p>

8. Add your FAQ entries in the **Chatbot-FAQ** collection.
<p align="center"><img src="./screenshots/Chatbot_FAQ.png" width="90%"/></p>

9. The chatbot is ready to use — test it directly from the admin panel.
<p align="center">
  <img src="./screenshots/Chatbot_Preview_1.png" width="49%"/>
  &nbsp;
  <img src="./screenshots/Chatbot_Preview_2.png" width="49%"/>
</p>

---

## 🔄 Updating

```bash
npm install nui-strapi-chatbot-plugin@latest

# Then rebuild and restart
npm run build && npm run develop
```

---

## 🔒 Security

- **Admin endpoints** (`/collections`, `/usage`, `/validate-key`) require Strapi admin authentication and are not publicly accessible.
- **Your OpenAI API key** is stored in the Strapi plugin store and is never returned to the browser in plaintext.
- **The `/ask` endpoint** is public (required by the frontend chatbot widget). In production, apply rate limiting at your reverse-proxy or CDN to prevent billing abuse.

---

## ⚠️ Troubleshooting

- Make sure the base domain is set correctly before testing.
- Only add FAQ entries to the **Chatbot-FAQ** collection after providing a valid API key.
- If you see a version mismatch during install, run:

  ```bash
  npm install --legacy-peer-deps
  ```

---

## Additional Information

- **Response Template**
  - Add collections for AI to query realtime data
    <img src="./screenshots/Response_Template.png" width="50%"/>

- **Suggested Questions**
  - Add questions so that it can be fetched in frontend as suggestions
    <img src="./screenshots/Suggested_Questions.png" width="50%"/>

- **AI Instructions**
  - System Instrcutions : Used in realtime querying. Sent while AI creates DB query
  - Response Tone : Used in the final response sent by AI.

    <img src="./screenshots/AI_Instructions.png" width="50%"/>

## 📚 Links

- [Strapi Docs](https://docs.strapi.io)
- [Developer Setup](./DEVELOPERS_README.md)
