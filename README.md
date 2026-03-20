# FAQ AI Bot Plugin for Strapi

   
## 📦 Setup Instructions
    
     
### 1. Create a Strapi Project

Run the following command to create a new Strapi app:

```bash
npx create-strapi@latest my-strapi-project
```

Then navigate into the project:

```bash
cd my-strapi-project
```
  
  
### 2. Create the Plugin

Initialize the plugin using the Strapi SDK:

```bash
npx @strapi/sdk-plugin init src/plugins/faq-ai-bot
```

This will generate the plugin inside:

```
src/plugins/faq-ai-bot
```
  
  
### 3. Add Plugin Code

Navigate to the plugin folder:

```bash
cd src/plugins/faq-ai-bot
```

Replace the plugin folder files with this repo's files(all of them).
  
  
### 4. Install Dependencies

From the root of your project, run:

```bash
npm install
```
  
  
### 5. Build the Plugin

Inside the plugin directory(need not run if no changes made):

```bash
npm run build
```
  
  
### 6. Start the Strapi App

Go back to the root folder:

```bash
cd ../..
```

Run Strapi in development mode:

```bash
npm run develop
```

---

    
## 📁 Plugin Structure

```
src/plugins/faq-ai-bot/
├── admin/        # Admin panel UI
├── server/       # Backend logic (controllers, services)
├── plugin.ts     # Plugin entry point
└── package.json
```

---

## 💡 Usage

1. Start your Strapi app.
2. Open the admin panel.
3. Enable/configure the `faq-ai-bot` plugin.
4. Add your FAQ AI logic inside services/controllers.

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
- Restart the server if needed.

## Additional Configuration

- Add the following code to your config/plugins.ts file:
  ```bash
  export default {
     'faq-ai-bot': {
       enabled: true,
       resolve: 'src/plugins/faq-ai-bot'
     },
   }
  ```

  ---
