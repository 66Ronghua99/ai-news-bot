/**
 * AI News Crawler V2 - 精简版
 * 1. 抓取 RSS
 * 2. 生成 MiniMax 摘要
 * 3. 输出到 ai-news-latest.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { RSS_SOURCES } = require('./config');
const { summarizeWithMiniMax } = require('./summarize');

// 目录配置
const BASE_DIR = path.join(process.env.HOME, '.openclaw/workspace/memory');
const SUMMARY_FILE = path.join(BASE_DIR, 'ai-news-latest.md');

// ============ 工具函数 ============

function fetchURL(url, timeout = 10000) {
  try {
    const result = execSync(
      `curl -sL -m 10 -H "User-Agent: Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', timeout, maxBuffer: 5 * 1024 * 1024 }
    );
    return result;
  } catch (e) {
    return null;
  }
}

function parseRSS(xml, sourceName) {
  const items = [];
  if (!xml) return items;

  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  
  for (const item of itemMatches.slice(0, 3)) {
    const title = (item.match(/<title>(.*?)<\/title>/i) || [])[1] || '';
    const link = (item.match(/<link>(.*?)<\/link>/i) || [])[1] || '';
    const desc = (item.match(/<description>(.*?)<\/description>/i) || [])[1] || '';
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/i) || [])[1] || new Date().toISOString();
    
    const cleanTitle = title.replace(/<!\[CDATA\[/, '').replace(/\]\]>/, '').replace(/<[^>]+>/g, '');
    const cleanDesc = desc.replace(/<!\[CDATA\[/, '').replace(/\]\]>/, '').replace(/<[^>]+>/g, '').substring(0, 300);
    
    if (cleanTitle && link) {
      items.push({
        title: cleanTitle,
        link: link.replace(/<!\[CDATA\[/, '').replace(/\]\]>/, ''),
        description: cleanDesc,
        pubDate: new Date(pubDate),
        source: sourceName
      });
    }
  }
  
  return items;
}

function isRecent(date, days = 7) {
  const now = new Date();
  const diff = (now - date) / (1000 * 60 * 60 * 24);
  return diff <= days;
}

function containsAIKeywords(text) {
  const keywords = [
    'ai', 'llm', 'gpt', 'claude', 'openai', 'anthropic', 'gemini',
    'transformer', 'neural', 'deep learning', 'machine learning',
    'agent', 'copilot', 'embedding', 'fine-tuning', 'prompt',
    'llama', 'mistral', 'model', 'training', 'inference'
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ============ 主函数 ============

async function main() {
  const today = new Date().toLocaleDateString('zh-CN', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  console.log(`\n🤖 AI News - ${today}\n`);
  
  const allContent = [];
  
  // 抓取 RSS（只取前10个源，加速）
  console.log('📡 抓取中...\n');
  for (const source of RSS_SOURCES.slice(0, 12)) {
    process.stdout.write(`  ${source.name}... `);
    const xml = fetchURL(source.rss);
    if (xml) {
      const items = parseRSS(xml, source.name);
      const filtered = items.filter(item => {
        const recent = isRecent(item.pubDate);
        const ai = containsAIKeywords(item.title + ' ' + item.description);
        return recent && (source.aiOnly ? ai : true);
      });
      console.log(`${filtered.length} 条`);
      allContent.push(...filtered);
    } else {
      console.log('❌');
    }
  }
  
  // 去重排序
  const seen = new Set();
  const unique = allContent.filter(item => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  }).sort((a, b) => b.pubDate - a.pubDate);
  
  console.log(`\n📊 共 ${unique.length} 条新闻`);
  
  // 生成摘要
  console.log('\n🤖 MiniMax 摘要生成中...\n');
  
  const TOP_N = 10;
  const summaries = [];
  
  for (let i = 0; i < Math.min(unique.length, TOP_N); i++) {
    const item = unique[i];
    process.stdout.write(`  [${i + 1}/${TOP_N}] ${item.title.substring(0, 30)}... `);
    
    const summary = summarizeWithMiniMax(item);
    const finalSummary = summary || item.description || '暂无摘要';
    
    console.log('✅');
    
    summaries.push({
      index: i + 1,
      source: item.source,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate.toLocaleDateString('zh-CN'),
      summary: finalSummary
    });
  }
  
  // 生成文件
  generateSummaryFile(summaries, today);
}

function generateSummaryFile(summaries, today) {
  let md = `# AI News - ${today}\n\n`;
  md += `> 共 ${summaries.length} 条 | 由 MiniMax 2.1 浓缩\n\n`;
  md += `---\n\n`;
  
  for (const s of summaries) {
    md += `## ${s.index}. ${s.title}\n\n`;
    md += `**来源**: ${s.source}\n\n`;
    md += `**摘要**: ${s.summary}\n\n`;
    md += `[阅读全文](${s.link})\n\n`;
    md += `---\n\n`;
  }
  
  md += `\n---\n*本摘要由 AI 自动生成*\n`;
  
  fs.writeFileSync(SUMMARY_FILE, md);
  console.log(`\n✅ 已保存到: ${SUMMARY_FILE}`);
}

// 运行
main().catch(console.error);
