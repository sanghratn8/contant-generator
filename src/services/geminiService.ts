import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const MODEL_FLASH = "gemini-1.5-flash";
const MODEL_PRO = "gemini-1.5-pro";

export const geminiService = {
  async discoverTrends(niche: string, country: string = "Global") {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY is missing. Please add it in the Secrets panel.");
    }
    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `Perform real-time market research for the "${niche}" niche in ${country}. Current date: ${currentDate}.
    
    Research Sources to prioritize (via Google Search):
    1. Amazon Best Sellers (latest trending products/categories)
    2. Google Trends (latest breakout search terms)
    3. Pinterest Trends (visual and lifestyle trend spikes)
    
    Find the absolute latest trending topics (late 2025 - current 2026) for affiliate marketing in ${country}. 
    Focus on hyper-recent breakout trends, micro-niches, or shifting consumer behaviors that have emerged in the last 3-6 months specifically in ${country}.
    If searching globally, identify trends with cross-border appeal.
    
    For each trend, provide:
    1. Name (key: "name")
    2. Growth score (1-100) (key: "growth_score")
    3. Niche/Category (key: "niche")
    4. Competition level (key: "competition_level")
    5. Sources (key: "sources")
    6. Growth description (key: "growth_description")
    7. Trend history data: An array of 12 data points representing search interest over the last 12 months (key: "history", each point: { month: string, interest: number (0-100) })
    
    Return only valid JSON as an array of objects.`;

    try {
      const response = await ai.getGenerativeModel({ 
        model: MODEL_FLASH,
        tools: [{ googleSearch: {} }] as any
      }).generateContent(prompt);

      const text = response.response.text();
      const raw = JSON.parse(text || "[]");
      return raw.map((t: any) => ({
        ...t,
        growth_score: Number(t.growth_score) || 0,
        history: Array.isArray(t.history) ? t.history.map((h: any) => ({
          month: String(h.month || 'Jan'),
          interest: Number(h.interest) || 0
        })) : []
      }));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Failed to discover trends.");
    }
  },

  async generateKeywords(trend: string) {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY is missing.");
    }
    const prompt = `Using real-time market data, generate 5 high-potential keywords for: "${trend}". 
    
    Research Sources: Helium 10, Google Trends, Pinterest.
    
    For each keyword, provide:
    1. Keyword string (key: "keyword")
    2. Difficulty score (1-100) (key: "difficulty")
    3. Search intent (key: "intent")
    4. Monthly Search Volume (key: "volume")
    5. CPC in USD (key: "cpc")
    6. Competing Products Count (key: "competition_count")
    7. 12-month Search Volume History (key: "volume_history", each point: { month: string, volume: number })
    
    Return only valid JSON as an array of objects.`;
    
    try {
      const response = await ai.getGenerativeModel({ 
        model: MODEL_FLASH,
        tools: [{ googleSearch: {} }] as any
      }).generateContent(prompt);

      const text = response.response.text();
      const raw = JSON.parse(text || "[]");
      return raw.map((k: any) => ({
        ...k,
        difficulty: Number(k.difficulty) || 0,
        volume: Number(k.volume) || 0,
        cpc: Number(k.cpc) || 0,
        competition_count: Number(k.competition_count) || 0,
        volume_history: Array.isArray(k.volume_history) ? k.volume_history.map((vh: any) => ({
          month: String(vh.month || 'Jan'),
          volume: Number(vh.volume) || 0
        })) : []
      }));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Failed to generate keywords.");
    }
  },

  async suggestProducts(keyword: string, country: string = "Global") {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY is missing.");
    }
    const prompt = `Perform a deep marketplace audit to find the highest-performing affiliate products for the keyword: "${keyword}" in ${country}. 
    
    Priority Sources: Amazon Best Sellers (current ranking), Walmart (trending), eBay (most watched/sold).
    
    SEARCH CRITERIA:
    1. HIGH DEMAND: Only products with high search frequency or recent sales spikes.
    2. CONSISTENT SALES: Items that are currently ranking in the "Best Seller" or "Movers & Shakers" categories.
    3. TOP TIER PICK: Products with a 4.2+ star rating and lower competition for high conversion.
    4. VARIETY: Suggest a range of price points if possible.
    
    STRICT DATA RULES:
    - image_url: Use the direct, original image URL from the source platform.
    - price: Use current market price (e.g. "$24.99").
    
    For each recommended "winner" product, provide:
    1. name (Clean, clear product name)
    2. original_name (Exact platform title)
    3. platform (Amazon, Walmart, or eBay)
    4. rating (Numerical 1-5)
    5. profit_score (1-100 index based on demand/competition ratio)
    6. price
    7. image_url
    
    Return only valid JSON as an array of objects.`;

    try {
      const response = await ai.getGenerativeModel({ 
        model: MODEL_FLASH,
        tools: [{ googleSearch: {} }] as any
      }).generateContent(prompt);

      const text = response.response.text();
      const raw = JSON.parse(text || "[]");
      return raw.map((p: any) => ({
        ...p,
        rating: Number(p.rating) || 0,
        profit_score: Number(p.profit_score) || 0
      }));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Failed to suggest products.");
    }
  },

  async generateArticle(keyword: string, product: any, trend: any = {}) {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY is missing.");
    }
    const prompt = `Write a high-quality SEO-OPTIMIZED affiliate article for the keyword "${keyword}" featuring the specific best-selling product "${product.name}". 
    
    Context:
    - Trend: "${trend.name || 'General Affiliate Marketing'}"
    - Product: "${product.name}" (Rating: ${product.rating}/5, Profit Score: ${product.profit_score})
    
    The article must be SEO-ready, using natural keyword placement, H-tag hierarchy, and highly engaging copy designed to convert readers in the ${trend.country || 'selected'} market.
    
    Article Structure:
    1. A catchy H1 Title
    2. Engaging Introduction with hook
    3. Detailed Product Review section for "${product.name}" using data typically found on Amazon/Walmart/eBay (pros, features, performance)
    4. Why this product is the best for "${keyword}"
    5. A dedicated "Pros & Cons" section
    6. A clear Call-to-Action (CTA) section with the placeholder link: [AFFILIATE_LINK]
    7. A mock Comparison Table (as markdown) comparing it to 2-3 generic competitors
    8. FAQ section
    
    Return the content as a JSON object with "title" and "content" keys. 
    The "content" should be in full Markdown format.`;

    try {
      const response = await ai.getGenerativeModel({ 
        model: MODEL_PRO
      }).generateContent(prompt);

      const text = response.response.text();
      // Pro model sometimes includes markdown block backticks in response
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson || "{}");
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Failed to generate article.");
    }
  },

  async generateImagePrompt(title: string, niche: string) {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return `Hero image for ${title}`;
    const prompt = `Create a detailed image generation prompt for a high-quality hero image for an article titled "${title}" in the ${niche} niche.
    The prompt should be specific, mentioning style (photorealistic), composition, and mood.
    Return only the prompt string.`;

    try {
      const response = await ai.getGenerativeModel({ model: MODEL_FLASH }).generateContent(prompt);
      return response.response.text() || `A high-quality photorealistic hero image for ${title}`;
    } catch (e) {
      return `Photorealistic image for ${title}`;
    }
  },

  async generateSocialContent(articleTitle: string, articleContent: string) {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY is missing.");
    }
    const prompt = `Generate social media content for the following article: "${articleTitle}". 
    Provide:
    1. Pinterest: 2 Pin titles and descriptions.
    2. Instagram: 2 captions with hashtags.
    3. Facebook: 1 engaging post.
    Article Summary: ${articleContent?.substring(0, 500) || "No summary available."}...
    Return the content as a structured JSON object with keys: pinterest (array of {title, description}), instagram (array of strings), facebook (string).`;

    try {
      const response = await ai.getGenerativeModel({ model: MODEL_FLASH }).generateContent(prompt);
      const text = response.response.text();
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson || "{}");
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Failed to generate social content.");
    }
  }
};

