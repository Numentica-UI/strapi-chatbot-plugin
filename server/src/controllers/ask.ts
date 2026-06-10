import OpenAI from "openai";

async function getOpenAI(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: "plugin",
    name: "nui-strapi-chatbot-plugin",
  });

  const settings = await pluginStore.get({ key: "settings" });
  const key = settings?.openaiKey;

  if (!key) {
    throw new Error("OpenAI key not configured in plugin settings");
  }

  return new OpenAI({ apiKey: key });
}

async function getContactLink(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: "plugin",
    name: "nui-strapi-chatbot-plugin",
  });

  const settings = await pluginStore.get({ key: "settings" });
  return settings?.contactLink || null;
}

async function getInstructions(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: "plugin",
    name: "nui-strapi-chatbot-plugin",
  });

  const settings = await pluginStore.get({ key: "settings" });

  return {
    system: settings?.systemInstructions || "",
    response: settings?.responseInstructions || "",
  };
}

async function getCardStyles(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: "plugin",
    name: "nui-strapi-chatbot-plugin",
  });

  const settings = await pluginStore.get({ key: "settings" });
  return settings?.cardStyles || {};
}

async function getActiveCollections(strapi: any) {
  try {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });

    const settings = await pluginStore.get({ key: "collections" });
    if (!settings) return [];

    const relationConfig: Record<string, Record<string, string[]>> = (
      await pluginStore.get({ key: "settings" })
    )?.relationConfig || {};

    const activeList = [];

    for (const item of settings) {
      const hasEnabledFields = item.fields?.some((f: any) => f.enabled);
      if (!hasEnabledFields) continue;

      const uid = `api::${item.name}.${item.name}`;
      const contentType = strapi.contentTypes[uid];

      if (!contentType) {
        console.warn(`[WARNING] Content type not found for UID: ${uid}`);
        continue;
      }

      const ALLOWED_TYPES = [
        "string",
        "text",
        "email",
        "uid",
        "richtext",
        "enumeration",
        "integer",
        "biginteger",
        "decimal",
        "float",
        "date",
        "datetime",
        "time",
        "boolean",
        "relation",
        "media",
      ];

      const collectionRelationConfig = relationConfig[item.name] || {};

      const fieldConfigs = item.fields
        ?.filter((f: any) => f.enabled)
        ?.map((f: any) => {
          const attr = contentType.attributes[f.name];
          if (!attr || !ALLOWED_TYPES.includes(attr.type)) return null;

          const fieldConfig: any = { name: f.name, type: attr.type };

          if (attr.type === "relation" && attr.target) {
            const savedSubFields = collectionRelationConfig[f.name];

            const inlineSubFields = (f.relationFields as any[] | undefined)
              ?.filter((sf: any) => sf.enabled)
              ?.map((sf: any) => sf.name);

            const enabledSubFields = savedSubFields ?? inlineSubFields ?? [];

            if (enabledSubFields.length > 0) {
              fieldConfig.relationTarget = attr.target;
              fieldConfig.relationFields = enabledSubFields;
            }
          }

          return fieldConfig;
        })
        ?.filter(Boolean);

      if (!fieldConfigs || fieldConfigs.length === 0) continue;

      activeList.push({
        name: item.name,
        fields: fieldConfigs.map((f: any) => f.name),
        fieldConfigs,
      });
    }

    return activeList;
  } catch (err) {
    console.error("[getActiveCollections] Error:", err);
    return [];
  }
}

async function rephraseQuestion(
  strapi: any,
  history: any[],
  question: string,
  usage: any,
) {
  try {
    const openai = await getOpenAI(strapi);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a Search Query Optimizer.
        Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up or has spelling mistakes just rewrite the question .
        Do NOT return any explanations, only the optimized search string.

        ### RULES
        1. **Dependency Check (The "Pronoun" Rule):**
           - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").

        2. **Independence Check (The "Specifics" Rule):**
           - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
           - **Do NOT** attach the previous topic to it.
           - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
           - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

        3. **Output:**
           - Return ONLY the optimized search string.`,
        },
        ...history.slice(-4),
        { role: "user", content: question },
      ],
    });

    usage.prompt_tokens += response.usage?.prompt_tokens || 0;
    usage.completion_tokens += response.usage?.completion_tokens || 0;
    usage.total_tokens += response.usage?.total_tokens || 0;

    const rewritten = response.choices[0].message.content?.trim();
    if (!rewritten) return question;

    return rewritten;
  } catch (err) {
    console.error("[REPHRASE] Error:", err);
    return question;
  }
}

function sanitizeFilters(filters: any): any {
  if (!filters || typeof filters !== "object") return filters;

  if (Array.isArray(filters)) {
    return filters.map(sanitizeFilters);
  }

  const operators = [
    "eq",
    "ne",
    "lt",
    "gt",
    "lte",
    "gte",
    "in",
    "notIn",
    "contains",
    "notContains",
    "containsi",
    "notContainsi",
    "null",
    "notNull",
    "between",
    "startsWith",
    "endsWith",
    "or",
    "and",
    "not",
  ];

  const newFilters: any = {};

  for (const key in filters) {
    let newKey = key;
    if (operators.includes(key) && !key.startsWith("$")) {
      newKey = `$${key}`;
    }
    newFilters[newKey] = sanitizeFilters(filters[key]);
  }

  return newFilters;
}

function updateJsonContext(prevContext: any, question: string) {
  const MAX_HISTORY = 10;
  const ctx = { ...(prevContext || {}) };

  ctx.history = Array.isArray(ctx.history) ? ctx.history : [];
  ctx.history.push(question);
  if (ctx.history.length > MAX_HISTORY) ctx.history.shift();

  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter((w) => w.length > 3);

  ctx.keywords = [...new Set([...(ctx.keywords || []), ...words])];
  ctx.lastQuestion = question;

  return ctx;
}

function extractFilterFields(filters: any, collected: Set<string> = new Set()) {
  if (!filters || typeof filters !== "object") return [];

  for (const key in filters) {
    if (key.startsWith("$")) {
      extractFilterFields(filters[key], collected);
    } else {
      collected.add(key);
      extractFilterFields(filters[key], collected);
    }
  }

  return Array.from(collected);
}

async function searchRealtime(strapi: any, plan: any, activeCollections: any) {
  if (!plan || !plan.collection) return null;

  const config = activeCollections.find((c: any) => c.name === plan.collection);

  if (!config) {
    console.warn(
      "[REALTIME] Collection not found in activeCollections:",
      plan.collection,
    );
    return null;
  }

  const sanitizedFilters = sanitizeFilters(plan.filters || {});
  const requestedFields = extractFilterFields(sanitizedFilters);

  for (const field of requestedFields) {
    if (!config.fields.includes(field)) {
      console.warn(
        `[REALTIME] Field '${field}' not in allowed fields — aborting`,
      );
      return null;
    }
  }

  const uid = `api::${plan.collection}.${plan.collection}`;

  try {
    if (plan.operation === "count") {
      const count = await strapi.entityService.count(uid, {
        filters: sanitizedFilters,
      });
      return { type: "count", collection: plan.collection, value: count };
    }

    const contentType = strapi.contentTypes[uid];

    console.log(
      `[REALTIME] Content type attributes for "${plan.collection}":`,
      JSON.stringify(
        Object.entries(contentType.attributes).reduce(
          (acc: any, [key, val]: [string, any]) => {
            acc[key] = {
              type: (val as any).type,
              ...((val as any).relation
                ? { relation: (val as any).relation }
                : {}),
              ...((val as any).target ? { target: (val as any).target } : {}),
            };
            return acc;
          },
          {},
        ),
        null,
        2,
      ),
    );

    const fieldConfigs: any[] =
      config.fieldConfigs ||
      config.fields.map((f: string) => ({
        name: f,
        type: contentType.attributes[f]?.type,
      }));

    const mediaFields = fieldConfigs
      .filter((fc: any) => fc.type === "media")
      .map((fc: any) => fc.name);

    const relationFieldConfigs = fieldConfigs.filter(
      (fc: any) => fc.type === "relation",
    );
    const relationFields = relationFieldConfigs.map((fc: any) => fc.name);

    console.log(
      `[REALTIME] Media fields detected for "${plan.collection}":`,
      mediaFields,
    );
    console.log(
      `[REALTIME] Relation fields detected for "${plan.collection}":`,
      relationFields,
    );
    console.log(
      `[REALTIME] Relation field configs (with sub-fields):`,
      JSON.stringify(relationFieldConfigs, null, 2),
    );

    let populateObj: any = undefined;

    if (mediaFields.length > 0 || relationFields.length > 0) {
      populateObj = {};

      mediaFields.forEach((field: string) => {
        populateObj[field] = true;
      });

      relationFieldConfigs.forEach((fc: any) => {
        if (fc.relationFields && fc.relationFields.length > 0) {
          populateObj[fc.name] = { fields: fc.relationFields };
          console.log(
            `[REALTIME] Relation "${fc.name}" → selective populate:`,
            fc.relationFields,
          );
        } else {
          populateObj[fc.name] = true;
          console.log(
            `[REALTIME] Relation "${fc.name}" → full populate (no sub-fields configured)`,
          );
        }
      });
    }

    console.log(
      `[REALTIME] Populate object for "${plan.collection}":`,
      JSON.stringify(populateObj, null, 2),
    );

    const result = await strapi.entityService.findMany(uid, {
      filters: sanitizedFilters,
      sort: plan.sort,
      limit: 10,
      ...(populateObj ? { populate: populateObj } : {}),
    });

    console.log(
      `[REALTIME] Raw result from Strapi for "${plan.collection}" (first item):`,
      JSON.stringify(result?.[0] || {}, null, 2),
    );
    console.log(`[REALTIME] Total raw items returned:`, result?.length ?? 0);

    const relationSubFieldMap: Record<string, string[]> = {};
    relationFieldConfigs.forEach((fc: any) => {
      if (fc.relationFields?.length) {
        relationSubFieldMap[fc.name] = fc.relationFields;
      }
    });

    const cleaned = result.map((row: any) => {
      const clean: any = {};

      for (const f of config.fields) {
        const value = row[f];

        console.log(
          `[REALTIME] Field "${f}" raw value:`,
          JSON.stringify(value, null, 2),
        );

        if (value && typeof value === "object" && (value as any).url) {
          console.log(
            `[REALTIME] Field "${f}" → MEDIA, url: ${(value as any).url}`,
          );
          clean[f] = (value as any).url;
        } else if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          const selectedSubFields = relationSubFieldMap[f];

          if (selectedSubFields?.length) {
            selectedSubFields.forEach((sf) => {
              const key = `${f}.${sf}`;
              clean[key] = (value as any)[sf] ?? null;
              console.log(
                `[REALTIME] Field "${f}" → sub-field "${sf}" → "${clean[key]}"`,
              );
            });
          } else {
            const resolved =
              (value as any).name ||
              (value as any).title ||
              (value as any).label ||
              (value as any).fullName ||
              (value as any).username ||
              (value as any).id ||
              JSON.stringify(value);
            console.log(
              `[REALTIME] Field "${f}" → RELATION (no sub-fields), display: "${resolved}"`,
              `| keys: [${Object.keys(value).join(", ")}]`,
            );
            clean[f] = resolved;
          }
        } else if (Array.isArray(value)) {
          const selectedSubFields = relationSubFieldMap[f];

          if (selectedSubFields?.length) {
            clean[f] = value.map((item: any) => {
              const obj: any = {};
              selectedSubFields.forEach((sf) => {
                obj[sf] = item[sf] ?? null;
              });
              return obj;
            });
            console.log(
              `[REALTIME] Field "${f}" → ARRAY RELATION with sub-fields:`,
              clean[f],
            );
          } else {
            const resolved = value.map(
              (item: any) =>
                item.name ||
                item.title ||
                item.label ||
                item.fullName ||
                item.username ||
                item.id ||
                JSON.stringify(item),
            );
            console.log(
              `[REALTIME] Field "${f}" → ARRAY RELATION (no sub-fields):`,
              resolved,
            );
            clean[f] = resolved.join(", ");
          }
        } else {
          clean[f] = value;
        }
      }

      return clean;
    });

    console.log(
      `[REALTIME] Cleaned items for "${plan.collection}":`,
      JSON.stringify(cleaned, null, 2),
    );

    return {
      type: "list",
      collection: plan.collection,
      schema: config.fields,
      items: cleaned,
    };
  } catch (err) {
    console.error("[REALTIME] Search error:", err);
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchFAQ(question: string, strapi: any, usage: any) {
  const openai = await getOpenAI(strapi);

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  const embeddingTokensUsed = embedding.usage?.total_tokens || 0;
  usage.embedding_tokens += embeddingTokensUsed;
  usage.total_tokens += embeddingTokensUsed;

  let queryVector = embedding.data[0].embedding;
  if (!queryVector || !queryVector.length) return [];

  const faqs = await strapi.db
    .connection("chatbot_config_faqqas")
    .select("answer", "embedding")
    .whereNotNull("embedding")
    .whereNotNull("published_at");

  if (!faqs.length) return [];

  const scored = faqs.map((f: any) => {
    let dbVector = f.embedding;

    try {
      if (typeof dbVector === "string") dbVector = JSON.parse(dbVector);

      dbVector = Array.isArray(dbVector)
        ? dbVector.map((n: any) => Number(n))
        : [];

      if (!Array.isArray(dbVector) || dbVector.length !== queryVector.length) {
        return { answer: f.answer, similarity: 0 };
      }

      return {
        answer: f.answer,
        similarity: cosineSimilarity(queryVector, dbVector),
      };
    } catch (err) {
      return { answer: f.answer, similarity: 0 };
    }
  });

  scored.sort((a: any, b: any) => b.similarity - a.similarity);

  if (!scored.length || scored[0].similarity < 0.4) return [];

  return scored.slice(0, 3).map((s: any) => s.answer);
}

async function simplePlanner(
  strapi: any,
  question: string,
  activeCollections: any[],
  instructions: { system: string },
  currentDate: string,
  timezone: string,
  usage: any,
) {
  const openai = await getOpenAI(strapi);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
TODAY'S DATE, TIME & TIMEZONE: ${currentDate} (${timezone})

        ${instructions.system || ""}
You are a STRICT database query planner that converts user questions into Strapi query JSON.

--------------------------------
CORE TASK
--------------------------------
Return ONLY valid JSON. No text. No explanation.

--------------------------------
COLLECTION SELECTION
--------------------------------
- Choose the most relevant collection from the available list.
- Never invent collection names.

--------------------------------
FIELD RULES
--------------------------------
- Only use fields that exist in the selected collection schema.
- Never hallucinate fields.

--------------------------------
LOCATION NORMALIZATION (CRITICAL)
--------------------------------
The database stores locations in the format:
City Name (AIRPORT_CODE)

Before generating filters, you MUST normalize
all user-provided places into the nearest
major city or airport name.

RULES:

1. SMALL TOWNS / VILLAGES
- Convert to nearest major airport city.
Example:
"Kalveerampalayam" → "Coimbatore"
"Kollam" → "Trivandrum"
"Alappuzha" → "Kochi"

2. OLD OR LOCAL NAMES
- Convert to modern official city name.
Example:
"Madras" → "Chennai"
"Cochin" → "Kochi"
"Bombay" → "Mumbai"

3. SUBURBS / DISTRICTS
- Convert to main metro city.
Example:
"Brooklyn" → "New York"
"Noida" → "Delhi"

4. AIRPORT CODES
- If user provides code (COK, MAA, JFK),
search using containsi for that code.

Example:
User: "flight from COK"
Filter:
{ "origin": { "containsi": "COK" } }

5. ALWAYS MATCH DATABASE STRINGS
- Use containsi
- Never use raw spelling if DB format differs
- Prefer airport code if available

--------------------------------
TEXT FILTER RULES (VERY IMPORTANT)
--------------------------------
- For city names, titles, destinations, names → ALWAYS use "containsi"
- NEVER use "eq" for text
- NEVER use "in" for text arrays
- For multiple text values use "$or" with containsi

Example:
User: "flight to paris or amsterdam"
Filters:
{
  "$or": [
    { "destination": { "containsi": "paris" } },
    { "destination": { "containsi": "amsterdam" } }
  ]
}

--------------------------------
NUMBER FILTER RULES
--------------------------------
- For price, fare, amount → use lt, lte, gt, gte, between
- "under" → lte
- "above" → gte
- "between" → between

--------------------------------
DATE FILTER RULES
--------------------------------
- Use TODAY'S DATE above as reference for all date comparisons
- "available", "active", "not expired" → { "expiresAt": { "gte": "$currentDate}" } }
- "availability" boolean → { "availability": { "eq": true } }
- NEVER hardcode dates

--------------------------------
OPERATION RULES
--------------------------------
- "how many", "count" → operation = "count"
- otherwise → operation = "list"

--------------------------------
SORT RULES
--------------------------------
- "cheapest", "lowest" → sort ["fare:asc"]
- "highest", "expensive" → sort ["fare:desc"]
- Only add sort if user implies ranking

--------------------------------
INTENT CLASSIFICATION (CRITICAL)
--------------------------------
First decide intent:

INTENT = "realtime"
- User asks about availability, price, list, count, search, show items
- Mentions data stored in collections

INTENT = "faq"
- User asks "who is", "what is", "explain", "details about"
- General knowledge
- No clear database entity

If no clear database match → ALWAYS choose "faq"
NEVER force a collection.

OUTPUT FORMAT

Return ONLY JSON.

If no database match exists, return:

{
  "collection": null
}

Otherwise return:

{
  "collection": "name",
  "operation": "list" | "count",
  "filters": {},
  "sort": []
}

--------------------------------
AVAILABLE COLLECTIONS
--------------------------------
${JSON.stringify(activeCollections, null, 2)}
`,
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  usage.prompt_tokens += response.usage?.prompt_tokens || 0;
  usage.completion_tokens += response.usage?.completion_tokens || 0;
  usage.total_tokens += response.usage?.total_tokens || 0;

  try {
    const raw = response.choices[0].message.content || "{}";
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[PLANNER] JSON parse error:", err);
    return null;
  }
}

async function filterRelevantItems(
  strapi: any,
  question: string,
  realtimeMeta: any,
  usage: any,
): Promise<any> {
  if (
    !realtimeMeta ||
    realtimeMeta.type !== "list" ||
    !realtimeMeta.items?.length
  ) {
    return realtimeMeta;
  }

  if (realtimeMeta.items.length === 1) return realtimeMeta;

  try {
    const openai = await getOpenAI(strapi);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a data filter.
Your job is to return ONLY the items that are relevant to the user's question as a JSON array.

RULES:
- Return ONLY a valid JSON array, no text, no explanation, no markdown
- Only include items that directly answer the question
- If question asks for cheapest/lowest price → return only the single cheapest item
- If question asks for most expensive/highest → return only the single most expensive item
- If question asks for a specific title/name → return only matching items
- If question asks for all / list / show → return all items unchanged
- Never hallucinate or modify item data
- Keep all original fields exactly as they are
- If unsure → return all items unchanged`,
        },
        {
          role: "user",
          content: `QUESTION: ${question}

ITEMS:
${JSON.stringify(realtimeMeta.items, null, 2)}`,
        },
      ],
    });

    usage.prompt_tokens += response.usage?.prompt_tokens || 0;
    usage.completion_tokens += response.usage?.completion_tokens || 0;
    usage.total_tokens += response.usage?.total_tokens || 0;

    const raw = response.choices[0].message.content || "[]";
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const filteredItems = JSON.parse(cleaned);

    return {
      ...realtimeMeta,
      items: Array.isArray(filteredItems) ? filteredItems : realtimeMeta.items,
    };
  } catch (err) {
    console.error("[FILTER] Error — returning original items:", err);
    return realtimeMeta;
  }
}

async function finalAggregator(
  strapi: any,
  ctx: any,
  question: string,
  faq: any,
  realtimeMeta: any,
  contactLink: string | null,
  instructions: { response: string },
  cardStyles: any,
  currentDate: string,
  timezone: string,
  usage: any,
) {
  ctx.set("Content-Type", "text/event-stream");
  ctx.set("Cache-Control", "no-cache");
  ctx.set("Connection", "keep-alive");
  ctx.status = 200;
  ctx.res.flushHeaders?.();

  const openai = await getOpenAI(strapi);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    stream: true,
    messages: [
      {
        role: "system",
        content: `

        ${instructions.response || ""}
You are an intelligent AI Assistant for a website chatbot. If you don't know the answer based on the data you are provided, answer that honestly to the user.

INPUTS:
- FAQ semantic answers
- REALTIME_META (structured database info)
- User question

--------------------------------
RESPONSE FORMAT (CRITICAL)
--------------------------------
Always respond using simple inline HTML tags only.
- For bullet lists → use <ul><li>item</li></ul>
- For numbered lists → use <ol><li>item</li></ol>
- For bold text → use <b>text</b>
- For italic text → use <i>text</i>
- For underline → use <u>text</u>
- For strikethrough → use <s>text</s>
- For line breaks → use <br>
- For paragraphs → use <p>text</p>
- For headings → use <h1>, <h2>, <h3>, <h4> depending on importance
- For links → use <a href='url' target='_blank'>label</a>
- For inline code → use <code>text</code>
- For highlighted/important text → use <mark>text</mark>
- For small/fine print → use <small>text</small>
- For tables → use <table><tr><th>header</th></tr><tr><td>data</td></tr></table>
- NEVER use markdown (no **, no ##, no - , no \n for formatting)
- NEVER use backticks or code blocks
- Keep tags minimal and clean
- Never add inline styles

--------------------------------
RESPONSE LENGTH RULE
--------------------------------
Default → SHORT & PRECISE (2–3 lines max)

If the user's question contains:
"explain", "details", "more", "elaborate", "why", "how"
→ Provide LONGER detailed answer.

If FAQ answer is long:
→ Summarize unless user asked for detail.

--------------------------------
CORE RULE
--------------------------------
REALTIME_META decides logic.
NEVER mention image URLs, file paths, or media links in your response.
Images are handled separately by the UI.

--------------------------------
CONTACT INTENT RULE
--------------------------------
ONLY show the contact link if the user's message contains 
EXPLICIT words like: "contact", "reach", "email", "call", 
"support team", "customer service", "talk to someone", "human".

DO NOT show contact link for general greetings or 
first messages. Never show it unless user clearly 
asks to contact a person.

Example:
"You can contact us here: https://example.com/contact"

--------------------------------
ANSWER LOGIC
--------------------------------

CASE 1 — REALTIME_META.type = "count"
Return ONE sentence with the number.

CASE 2 — REALTIME_META.type = "list"
Summarize the realtime items naturally.
Note: relation fields may appear as "fieldName.subField" keys
(e.g. "author.name", "author.email") — treat them naturally.

CASE 3 — REALTIME_META = null
Use FAQ.

CASE 4 — BOTH EXIST
Use realtime items as primary source and FAQ as supporting information.

CASE 5 — NOTHING
Use the system instructions context to answer general questions about the business.
If the question is about what the business does, offers, or provides → answer using the system instructions.
If it's a follow-up about previous results with no data → ask user to be more specific.
Never hallucinate information not present in system instructions or FAQ.

Never show JSON.
Never hallucinate.
`,
      },
      {
        role: "user",
        content: `
TODAY'S DATE, TIME & TIMEZONE: ${currentDate} (${timezone})

QUESTION: ${question}

CONTACT_LINK:
${contactLink || "NOT_AVAILABLE"}

FAQ:
${JSON.stringify(faq)}

REALTIME_META:
${JSON.stringify(realtimeMeta)}
`,
      },
    ],
  });

  let fullText = "";

  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content;
    if (token) {
      fullText += token;
      ctx.res.write(`data: ${token}\n\n`);
    }
  }

  const estimatedTokens = Math.ceil(fullText.length / 4);
  usage.completion_tokens += estimatedTokens;
  usage.total_tokens += estimatedTokens;

  if (realtimeMeta && realtimeMeta.type === "list") {
    const collectionUid = `api::${realtimeMeta.collection}.${realtimeMeta.collection}`;
    const cardsPayload = {
      title: realtimeMeta.collection,
      schema: realtimeMeta.schema,
      items: realtimeMeta.items,
      cardStyle: cardStyles?.[collectionUid] || null,
    };
    ctx.res.write(`event: cards\n`);
    ctx.res.write(`data: ${JSON.stringify(cardsPayload)}\n\n`);
  }

  ctx.res.write("data: [DONE]\n\n");

  try {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });
    const existing = ((await pluginStore.get({ key: "token_usage" })) as {
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
      key: "token_usage",
      value: {
        totalTokens: existing.totalTokens + usage.total_tokens,
        promptTokens: existing.promptTokens + usage.prompt_tokens,
        completionTokens: existing.completionTokens + usage.completion_tokens,
        embeddingTokens: existing.embeddingTokens + usage.embedding_tokens,
      },
    });
  } catch (e) {
    console.error("[token_usage save error]", e);
  }

  ctx.res.end();
}

export default ({ strapi }: { strapi: any }) => ({
  async validateKey(ctx: any) {
    const { key } = ctx.request.body?.data ?? ctx.request.body;

    try {
      const temp = new OpenAI({ apiKey: key });

      await temp.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 5,
        messages: [{ role: "user", content: "2+2" }],
      });

      ctx.body = {
        valid: true,
        message: "Key is valid and gpt-4o-mini is accessible.",
      };
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code || "";
      const message = err?.message || "";

      let reason = "Unknown error. Please try again.";

      if (status === 401) {
        reason = "Invalid API key. Please check and try again.";
      } else if (status === 403) {
        reason = "API key does not have permission to use gpt-4o-mini.";
      } else if (status === 429) {
        if (message.includes("quota") || code === "insufficient_quota") {
          reason =
            "Quota exceeded. Your OpenAI account has run out of credits.";
        } else {
          reason = "Rate limit exceeded. Please wait a moment and try again.";
        }
      } else if (status === 404 || message.includes("model")) {
        reason = "gpt-4o-mini model is not available for this API key.";
      } else if (code === "invalid_api_key") {
        reason = "Invalid API key format.";
      }

      ctx.body = { valid: false, message: reason };
    }
  },

  async ask(ctx: any) {
    const {
      question,
      history = [],
      clientDate,
      clientTimezone,
    } = ctx.request.body;

    const currentDate = clientDate
      ? new Date(clientDate).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: clientTimezone || "UTC",
        })
      : "Failed to parse date";

    const timezone = clientTimezone || "UTC";

    const usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      embedding_tokens: 0,
    };

    const instructions = await getInstructions(strapi);

    let jsonContext = ctx.request.body.context || {};
    jsonContext = updateJsonContext(jsonContext, question);

    ctx.set("X-User-Context", JSON.stringify(jsonContext));

    try {
      const activeCollections = await getActiveCollections(strapi);

      const rewritten = await rephraseQuestion(
        strapi,
        history,
        question,
        usage,
      );

      const contactLink = await getContactLink(strapi);
      const cardStyles = await getCardStyles(strapi);

      const faqResults = await searchFAQ(rewritten, strapi, usage);

      let plan = null;
      if (activeCollections.length > 0) {
        plan = await simplePlanner(
          strapi,
          rewritten,
          activeCollections,
          instructions,
          currentDate,
          timezone,
          usage,
        );
      }

      let realtimeResults = null;
      if (plan && plan.collection) {
        realtimeResults = await searchRealtime(strapi, plan, activeCollections);
        realtimeResults = await filterRelevantItems(
          strapi,
          rewritten,
          realtimeResults,
          usage,
        );
      }

      await finalAggregator(
        strapi,
        ctx,
        rewritten,
        faqResults,
        realtimeResults,
        contactLink,
        instructions,
        cardStyles,
        currentDate,
        timezone,
        usage,
      );

      return;
    } catch (err) {
      console.error("[ASK] ERROR:", err);
      ctx.body = { type: "text", content: "Error occurred." };
    }
  },

  async getUsage(ctx: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "nui-strapi-chatbot-plugin",
    });
    const usage = ((await pluginStore.get({ key: "token_usage" })) as {
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

    const inputCost = (usage.promptTokens / 1_000_000) * 0.15;
    const outputCost = (usage.completionTokens / 1_000_000) * 0.6;
    const embeddingCost = (usage.embeddingTokens / 1_000_000) * 0.02;

    ctx.body = {
      tokensUsed: usage.totalTokens || 0,
      estimatedCost:
        parseFloat((inputCost + outputCost + embeddingCost).toFixed(4)) || 0,
    };
  },
});
