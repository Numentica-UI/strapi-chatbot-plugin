# FAQ AI Bot - Strapi Plugin
<br>
  
> **Compatibility:** Strapi **v5 only** (requires `@strapi/strapi ^5.0.0`).
> Node.js **>=18** is required.
> This plugin is **not compatible with Strapi v4**
<br>

## 📦 Setup Instructions (Developer Setup)
     
### 1. Create a Strapi Project

Run the following command to create a new Strapi app:

```bash
npx create-strapi@latest (my-strapi-project)
```

Then navigate into the project:

```bash
cd (my-strapi-project)
```
<br>  
  
### 2. Create the Plugin

Initialize the plugin using the Strapi SDK:       
⚠️ Note : Don't change the plugin name.

```bash
npx @strapi/sdk-plugin init src/plugins/faq-ai-bot
```

This will generate the plugin inside:

```
src/plugins/faq-ai-bot
```
> ⚠️ If a version mismatch occurs while installing node_modules, run:
> ```bash
> npm install --legacy-peer-deps
> ```

#### 2.1. Additional Configuration

- Add the following code to your config/plugins.ts file:
  ```bash
  export default {
     'faq-ai-bot': {
       enabled: true,
       resolve: 'src/plugins/faq-ai-bot'
     },
   }
  ```
<br>  
  
### 3. Add Plugin Code

Navigate to the plugin folder:

```bash
cd src/plugins/faq-ai-bot
```

Replace the plugin folder files with this repo's files(all of them).

<br>  
  
### 4. Install Dependencies

From the root of your project, run:

```bash
npm install
```
<br>
  
### 5. Build the Plugin

Inside the plugin directory (need not run if no changes made):

```bash
npm run build
```
<br>  
  
### 6. Start the Strapi App

Go back to the root folder:

```bash
cd ../..
```

Run Strapi in development mode:

```bash
npm run develop
```
<br>

---
    
## 📁 Plugin Structure

```
src/plugins/faq-ai-bot/
├── admin/        # Admin panel UI
├── server/       # Backend logic (controllers, services)
└── package.json

config/plugin.ts
└── plugin.ts     # Plugin entry point (in your Strapi project root)
```

---

## 💡 Usage

1. Start your Strapi app.
2. Open the admin panel.
3. Navigate to the **FAQ AI Bot** plugin and configure it (admin login required).
4. Enter your OpenAI API key and configure collections for the chatbot.

---

## 🔒 Security Notes
 
- Admin configuration endpoints (`/collections`, `/usage`, `/validate-key`) require Strapi admin authentication and are not publicly accessible.
- Your OpenAI API key is stored in the Strapi plugin store and is never returned to the browser in plaintext.
- The `/ask` endpoint is public (needed by the frontend widget). Apply rate limiting at your reverse-proxy or CDN in production.
 
---

## 📚 Helpful Links

- [Strapi Docs](https://docs.strapi.io)
- [Plugin Development](https://docs.strapi.io/dev-docs/plugins)

---

## ⚠️ Notes

- Rebuild the plugin after changes:
  ```bash
  npm run build
  ```
- Restart the server.

---

[Back to User Setup](./README.md)
