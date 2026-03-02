// ============ 配置 ============

require('dotenv').config();

const RSS_SOURCES = [
  { name: 'Google DeepMind', rss: 'https://blog.google/technology/ai/rss/', aiOnly: true },
  { name: 'Meta AI', rss: 'https://ai.meta.com/blog/rss.xml', aiOnly: true },
  { name: 'Microsoft AI', rss: 'https://blogs.microsoft.com/ai/feed/', aiOnly: true },
  { name: 'OpenAI News', rss: 'https://openai.com/news/rss', aiOnly: true },
  { name: 'Anthropic Blog', rss: 'https://www.anthropic.com/rss.xml', aiOnly: true },
  { name: 'Vercel AI Blog', rss: 'https://vercel.com/blog/rss.xml', aiOnly: true },
  { name: 'Hacker News', rss: 'https://hnrss.org/frontpage', aiOnly: false },
  { name: 'TechCrunch AI', rss: 'https://techcrunch.com/category/artificial-intelligence/feed/', aiOnly: true },
  { name: 'VentureBeat AI', rss: 'https://venturebeat.com/category/ai/feed/', aiOnly: true },
  { name: 'Peter Steinberger', rss: 'https://steipete.me/rss.xml', aiOnly: true },
  { name: 'Gwern Branwen', rss: 'https://www.gwern.net/index.rss', aiOnly: true },
  { name: 'Andrej Karpathy', rss: 'https://karpathy.ai/feed.xml', aiOnly: true },
  { name: 'Chip Huyen', rss: 'https://huyenchip.com/feed.xml', aiOnly: true },
  { name: 'Jay Alammar', rss: 'https://jalamar.github.io/feed.xml', aiOnly: true },
  { name: 'Sebastian Ruder', rss: 'https://ruder.io/feed.xml', aiOnly: true },
  { name: 'Simon Willison', rss: 'https://simonwillison.net/atom.xml', aiOnly: true },
  { name: 'Benedict Evans', rss: 'https://www.ben-evans.com/benedictevans?format=rss', aiOnly: true },
  { name: 'The Gradient', rss: 'https://thegradient.pub/feed/', aiOnly: true },
  { name: 'Hugging Face Blog', rss: 'https://huggingface.co/blog/feed.xml', aiOnly: true },
  { name: 'DeepLearning.AI', rss: 'https://www.deeplearning.ai/feed/', aiOnly: true },
  { name: 'Latent Space', rss: 'https://latent.space/feed.xml', aiOnly: true },
  { name: 'Interconnect', rss: 'https://interconnect.fm/feed.xml', aiOnly: true },
];

// Twitter API 配置
const TWITTER_API = {
  key: process.env.TWITTER_API_KEY || '',
  baseUrl: 'https://api.twitterapi.io',
  // 更精准的AI相关关键词，过滤掉杂七杂八的内容
  searchQueries: [
    'AI OR LLM OR GPT OR Claude OR "ChatGPT" OR "OpenAI" OR Anthropic OR Gemini OR "deep learning" OR "machine learning"',
    'AI model OR "AI startup" OR "AI funding" OR "AI product" OR "AI release"'
  ],
};

// 飞书配置
const FEISHU_WEBHOOK = process.env.FEISHU_WEBHOOK || '';

// Google Sheets 配置
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT || '';
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

module.exports = { 
  RSS_SOURCES, 
  TWITTER_API, 
  FEISHU_WEBHOOK,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_SHEET_ID
};
