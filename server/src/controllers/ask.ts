import OpenAI from 'openai';

async function getOpenAI(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: 'plugin',
    name: 'nui-strapi-chatbot-plugin',
  });

  const settings = await pluginStore.get({ key: 'settings' });

  const key = settings?.openaiKey;

  if (!key) {
    throw new Error('OpenAI key not configured in plugin settings');
  }

  return new OpenAI({ apiKey: key });
}

async function getContactLink(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: 'plugin',
    name: 'nui-strapi-chatbot-plugin',
  });

  const settings = await pluginStore.get({ key: 'settings' });
  return settings?.contactLink || null;
}

async function getInstructions(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: 'plugin',
    name: 'nui-strapi-chatbot-plugin',
  });

  const settings = await pluginStore.get({ key: 'settings' });

  return {
    system: settings?.systemInstructions || '',
    response: settings?.responseInstructions || '',
  };
}

async function getCardStyles(strapi: any) {
  const pluginStore = strapi.store({
    environment: null,
    type: 'plugin',
    name: 'nui-strapi-chatbot-plugin',
  });

  const settings = await pluginStore.get({ key: 'settings' });

  return settings?.cardStyles || {};
}

async function getActiveCollections(strapi: any) {
  try {
    const pluginStore = strapi.store({
      environment: null,
      type: 'plugin',
      name: 'nui-strapi-chatbot-plugin',
    });

    const settings = await pluginStore.get({ key: 'collections' });
    if (!settings) return [];

    const activeList = [];

    for (const item of settings) {
      const hasEnabledFields = item.fields?.some((f: any) => f.enabled);

      if (!hasEnabledFields) {
        console.log(`   - Skipping '${item.name}' (no enabled fields)`);
        continue;
      }

      const uid = `api::${item.name}.${item.name}`;
      const contentType = strapi.contentTypes[uid];

      if (!contentType) {
        console.warn(` [WARNING] Content type not found for UID: ${uid}`);
        continue;
      }

      const enabledFields = item.fields
        ?.filter((f: any) => f.enabled)
        ?.map((f: any) => f.name)
        ?.filter((fieldName: string) => {
          const attr = contentType.attributes[fieldName];
          return (
            attr &&
            [
              'string',
              'text',
              'email',
              'uid',
              'richtext',
              'enumeration',
              'integer',
              'biginteger',
              'decimal',
              'float',
              'date',
              'datetime',
              'time',
              'relation',
              'media',
            ].includes(attr.type)
          );
        });

      if (!enabledFields || enabledFields.length === 0) continue;

      activeList.push({
        name: item.name,
        fields: enabledFields,
      });
    }

    return activeList;
  } catch (err) {
    return [];
  }
}

async function rephraseQuestion(strapi: any, history: any[], question: string, usage: any) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return question;
  }

  try {
    const openai = await getOpenAI(strapi);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a Search Query Optimizer.
        Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question .
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
        { role: 'user', content: question },
      ],
    });
    usage.prompt_tokens += response.usage?.prompt_tokens || 0;
    usage.completion_tokens += response.usage?.completion_tokens || 0;
    usage.total_tokens += response.usage?.total_tokens || 0;
    const rewritten = response.choices[0].message.content?.trim();

    if (!rewritten) return question;

    const lower = rewritten.toLowerCase();
    if (
      lower.includes('unavailable') ||
      lower.includes('sorry') ||
      lower.includes('i am') ||
      lower.includes('cannot') ||
      rewritten.length > 120
    ) {
      return question;
    }

    return rewritten;
  } catch (err) {
    console.error('Error in rephraseQuestion:', err);
    return question;
  }
}

function sanitizeFilters(filters: any): any {
  if (!filters || typeof filters !== 'object') return filters;

  if (Array.isArray(filters)) {
    return filters.map(sanitizeFilters);
  }

  const operators = [
    'eq',
    'ne',
    'lt',
    'gt',
    'lte',
    'gte',
    'in',
    'notIn',
    'contains',
    'notContains',
    'containsi',
    'notContainsi',
    'null',
    'notNull',
    'between',
    'startsWith',
    'endsWith',
    'or',
    'and',
    'not',
  ];

  const newFilters: any = {};

  for (const key in filters) {
    let newKey = key;
    if (operators.includes(key) && !key.startsWith('$')) {
      newKey = `$${key}`;
    }

    newFilters[newKey] = sanitizeFilters(filters[key]);
  }

  return newFilters;
}

function updateJsonContext(prevContext: any, question: string) {
  const MAX_HISTORY = 10;

  const ctx = { ...(prevContext || {}) };

  // Maintain history
  ctx.history = Array.isArray(ctx.history) ? ctx.history : [];
  ctx.history.push(question);
  if (ctx.history.length > MAX_HISTORY) ctx.history.shift();

  // Simple keyword extraction
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter((w) => w.length > 3);

  ctx.keywords = [...new Set([...(ctx.keywords || []), ...words])];

  ctx.lastQuestion = question;

  return ctx;
}

function extractFilterFields(filters: any, collected: Set<string> = new Set()) {
  if (!filters || typeof filters !== 'object') return [];

  for (const key in filters) {
    if (key.startsWith('$')) {
      extractFilterFields(filters[key], collected);
    } else {
      collected.add(key);
      extractFilterFields(filters[key], collected);
    }
  }

  return Array.from(collected);
}

async function searchRealtime(strapi: any, plan: any, activeCollections: any) {
  if (!plan || !plan.collection) {
    return null;
  }
  const config = activeCollections.find((c: any) => c.name === plan.collection);

  if (!config) {
    return null;
  }
  const sanitizedFilters = sanitizeFilters(plan.filters || {});
  const requestedFields = extractFilterFields(sanitizedFilters);

  for (const field of requestedFields) {
    if (!config.fields.includes(field)) {
      return null;
    }
  }

  const uid = `api::${plan.collection}.${plan.collection}`;

  try {
    // COUNT OPERATION
    if (plan.operation === 'count') {
      const count = await strapi.entityService.count(uid, {
        filters: sanitizedFilters,
      });

      return {
        type: 'count',
        collection: plan.collection,
        value: count,
      };
    }

    // LIST / SEARCH OPERATION

    const contentType = strapi.contentTypes[uid];

    const mediaFields = config.fields.filter((field: string) => {
      const attr = contentType.attributes[field];
      return attr?.type === 'media';
    });

    let populateObj: any = undefined;

    if (mediaFields.length > 0) {
      populateObj = {};
      mediaFields.forEach((field: string) => {
        populateObj[field] = true;
      });
    }
    const result = await strapi.entityService.findMany(uid, {
      filters: sanitizedFilters,
      sort: plan.sort,
      limit: 10,
      ...(populateObj ? { populate: populateObj } : {}),
    });

    const cleaned = result.map((row: any) => {
      const clean: any = {};
      for (const f of config.fields) {
        const value = row[f];

        // If it's a populated media object
        if (value && typeof value === 'object' && value.url) {
          console.log(`🖼 Extracted image for field '${f}':`, value.url);
          clean[f] = value.url;
        } else {
          clean[f] = value;
        }
      }
      return clean;
    });

    return {
      type: 'list',
      collection: plan.collection,
      schema: config.fields,
      items: cleaned,
    };
  } catch (err) {
    console.error('Realtime search error:', err);
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
  // 1. Create embedding
  const openai = await getOpenAI(strapi);

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });

  usage.prompt_tokens += embedding.usage?.prompt_tokens || 0;
  usage.total_tokens += embedding.usage?.total_tokens || 0;

  let queryVector = embedding.data[0].embedding;

  if (!queryVector || !queryVector.length) {
    return [];
  }

  // 2. Fetch all FAQ embeddings
  const faqs = await strapi.db
    .connection('chatbot_config_faqqas')
    .select('answer', 'embedding')
    .whereNotNull('embedding')
    .whereNotNull('published_at');

  if (!faqs.length) return [];

  // 3. Score similarity
  const scored = faqs.map((f: any) => {
    let dbVector = f.embedding;

    try {
      // If stored as string JSON → parse
      if (typeof dbVector === 'string') {
        dbVector = JSON.parse(dbVector);
      }

      // Force all values to numbers
      dbVector = Array.isArray(dbVector) ? dbVector.map((n: any) => Number(n)) : [];

      // Length mismatch guard
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

  // 4. Sort by similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  // 5. Threshold check
  if (!scored.length || scored[0].similarity < 0.4) {
    return [];
  }

  // 6. Return top 3 answers
  return scored.slice(0, 3).map((s) => s.answer);
}

async function simplePlanner(
  strapi: any,
  question: string,
  activeCollections: any[],
  instructions: { system: string },
  usage: any
) {
  const openai = await getOpenAI(strapi);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `
        ${instructions.system || ''}
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
        role: 'user',
        content: question,
      },
    ],
  });

  usage.prompt_tokens += response.usage?.prompt_tokens || 0;
  usage.completion_tokens += response.usage?.completion_tokens || 0;
  usage.total_tokens += response.usage?.total_tokens || 0;

  try {
    const raw = response.choices[0].message.content || '{}';

    // Safety cleanup in case model adds ```json
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const plan = JSON.parse(cleaned);

    return plan;
  } catch (err) {
    return null;
  }
}

async function realtimeInterpreterAI(strapi: any, question: string, realtimeData: any, usage: any) {
  if (!realtimeData) return null;
  const openai = await getOpenAI(strapi);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `
You are a realtime data interpreter.

Convert database JSON into a SHORT natural language summary.

Rules:
- Do NOT output JSON
- Do NOT hallucinate
- If count → say number
- If list → summarize important fields only
- Max 3–4 lines
`,
      },
      {
        role: 'user',
        content: `
QUESTION: ${question}

REALTIME DATA:
${JSON.stringify(realtimeData)}
`,
      },
    ],
  });

  usage.prompt_tokens += response.usage?.prompt_tokens || 0;
  usage.completion_tokens += response.usage?.completion_tokens || 0;
  usage.total_tokens += response.usage?.total_tokens || 0;

  const text = response.choices[0].message.content;

  return text;
}

async function finalAggregator(
  strapi: any,
  ctx: any,
  question: string,
  faq: any,
  realtimeMeta: any,
  realtimeText: any,
  contactLink: string | null,
  instructions: { response: string },
  cardStyles: any,
  usage: any
) {
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  ctx.status = 200;
  ctx.res.flushHeaders?.();
  const openai = await getOpenAI(strapi);

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    stream: true,
    messages: [
      {
        role: 'system',
        content: `

        ${instructions.response || ''}
You are an intelligent AI Assistant for a website chatbot.

INPUTS:
- FAQ semantic answers
- REALTIME_META (structured database info)
- REALTIME_TEXT (human summary)
- User question

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
REALTIME_TEXT decides wording.

--------------------------------
CONTACT INTENT RULE
--------------------------------
If user asks about contacting support, customer service, help, or similar:

AND contactLink is provided:
Return ONLY this link in a short sentence.

Example:
"You can contact us here: https://example.com/contact"

--------------------------------
ANSWER LOGIC
--------------------------------

CASE 1 — REALTIME_META.type = "count"
Return ONE sentence with the number.

CASE 2 — REALTIME_META.type = "list"
Use REALTIME_TEXT as main answer.

CASE 3 — REALTIME_META = null
Use FAQ.

CASE 4 — BOTH EXIST
Use REALTIME_TEXT as main + FAQ as support.

CASE 5 — NOTHING
Say information unavailable.

Never show JSON.
Never hallucinate.
Max 5 lines.
`,
      },
      {
        role: 'user',
        content: `
QUESTION: ${question}

CONTACT_LINK:
${contactLink || 'NOT_AVAILABLE'}

FAQ:
${JSON.stringify(faq)}

REALTIME_META:
${JSON.stringify(realtimeMeta)}

REALTIME_TEXT:
${realtimeText}
`,
      },
    ],
  });

  let fullText = '';

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

  if (realtimeMeta && realtimeMeta.type === 'list') {
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

  ctx.res.write('data: [DONE]\n\n');

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
        totalTokens: existing.totalTokens + usage.total_tokens,
        promptTokens: existing.promptTokens + usage.prompt_tokens,
        completionTokens: existing.completionTokens + usage.completion_tokens,
        embeddingTokens: existing.embeddingTokens,
      },
    });
  } catch (e) {
    console.error('[token_usage save error]', e);
  }

  ctx.res.end();
}

export default ({ strapi }: { strapi: any }) => ({
  async validateKey(ctx: any) {
    const { key } = ctx.request.body?.data ?? ctx.request.body;

    try {
      const temp = new OpenAI({ apiKey: key });

      const response = await temp.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 5,
        messages: [{ role: 'user', content: '2+2' }],
      });

      const answer = response.choices?.[0]?.message?.content?.trim();
      ctx.body = { valid: true, message: 'Key is valid and gpt-4o-mini is accessible.' };
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code || '';
      const message = err?.message || '';

      let reason = 'Unknown error. Please try again.';

      if (status === 401) {
        reason = 'Invalid API key. Please check and try again.';
      } else if (status === 403) {
        reason = 'API key does not have permission to use gpt-4o-mini.';
      } else if (status === 429) {
        if (message.includes('quota') || code === 'insufficient_quota') {
          reason = 'Quota exceeded. Your OpenAI account has run out of credits.';
        } else {
          reason = 'Rate limit exceeded. Please wait a moment and try again.';
        }
      } else if (status === 404 || message.includes('model')) {
        reason = 'gpt-4o-mini model is not available for this API key.';
      } else if (code === 'invalid_api_key') {
        reason = 'Invalid API key format.';
      }

      ctx.body = { valid: false, message: reason };
    }
  },
  async ask(ctx: any) {
    const { question, history = [] } = ctx.request.body;

    const usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    const instructions = await getInstructions(strapi);

    let jsonContext = ctx.request.body.context || {};
    jsonContext = updateJsonContext(jsonContext, question);

    ctx.set('X-User-Context', JSON.stringify(jsonContext));

    try {
      const activeCollections = await getActiveCollections(strapi);

      if (!activeCollections || activeCollections.length === 0) {
      }

      const rewritten = await rephraseQuestion(strapi, history, question, usage);

      const contactLink = await getContactLink(strapi);
      const cardStyles = await getCardStyles(strapi);

      // FAQ
      const faqResults = await searchFAQ(rewritten, strapi, usage);

      // PLAN
      const plan = await simplePlanner(strapi, rewritten, activeCollections, instructions, usage);

      // REALTIME

      let realtimeResults = null;
      let realtimeAIText = null;

      if (plan && plan.collection) {
        realtimeResults = await searchRealtime(strapi, plan, activeCollections);

        realtimeAIText = await realtimeInterpreterAI(strapi, rewritten, realtimeResults, usage);
      } else {
      }

      await finalAggregator(
        strapi,
        ctx,
        rewritten,
        faqResults,
        realtimeResults,
        realtimeAIText,
        contactLink,
        instructions,
        cardStyles,
        usage
      );

      return;
    } catch (err) {
      console.error('[ERROR]', err);
      ctx.body = { type: 'text', content: 'Error occurred.' };
    }
  },

  async getUsage(ctx: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: 'plugin',
      name: 'nui-strapi-chatbot-plugin',
    });
    const usage = ((await pluginStore.get({ key: 'token_usage' })) as {
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

    // pricing
    // Input:  $0.150 per 1M tokens
    // Output: $0.600 per 1M tokens
    // Embeddings: $0.020 per 1M tokens
    const inputCost = (usage.promptTokens / 1_000_000) * 0.15;
    const outputCost = (usage.completionTokens / 1_000_000) * 0.6;
    const embeddingCost = (usage.embeddingTokens / 1_000_000) * 0.02;

    ctx.body = {
      tokensUsed: usage.totalTokens || 0,
      estimatedCost: parseFloat((inputCost + outputCost + embeddingCost).toFixed(4)) || 0,
    };
  },
});
