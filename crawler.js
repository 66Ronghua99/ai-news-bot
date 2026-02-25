/**
 * AI News Crawler - Kimi Enhanced Version
 * 抓取 AI 新闻并用 Kimi 生成浓缩摘要
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { RSS_SOURCES } = require('./config');
const { summarizeWithMiniMax } = require('./summarize');

const OUTPUT_FILE = path.join(process.env.HOME, '.openclaw/workspace/memory/ai-news.md');

// ============ 工具函数 ============

function fetchURL(url, timeout = 30000) {
  try {
    const result = execSync(
      `curl -sL -H "User-Agent: Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', timeout, maxBuffer: 10 * 1024 * 1024 }
    );
    return result;
  } catch (e) {
    console.error(`  ❌ ${e.message}`);
    return null;
  }
}

function parseRSS(xml, sourceName) {
  const items = [];
  if (!xml) return items;

  // 简单正则提取
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  
  for (const item of itemMatches.slice(0, 5)) { // 只取前5条
    const title = (item.match(/<title>(.*?)<\/title>/i) || [])[1] || '';
    const link = (item.match(/<link>(.*?)<\/link>/i) || [])[1] || '';
    const desc = (item.match(/<description>(.*?)<\/description>/i) || [])[1] || '';
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/i) || [])[1] || new Date().toISOString();
    
    // 清理CDATA和HTML标签
    const cleanTitle = title.replace(/<!\[CDATA\[/, '').replace(/\]\]>/, '').replace(/<[^>]+>/g, '');
    const cleanDesc = desc.replace(/<!\[CDATA\[/, '').replace(/\]\]>/, '').replace(/<[^>]+>/g, '').substring(0, 200);
    
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

function isRecent(date, days = 14) {
  const now = new Date();
  const diff = (now - date) / (1000 * 60 * 60 * 24);
  return diff <= days;
}

function containsAIKeywords(text) {
  const keywords = [
    'ai', 'llm', 'gpt', 'claude', 'openai', 'anthropic', 'gemini',
    'transformer', 'neural', 'deep learning', 'machine learning',
    'agent', 'copilot', 'embedding', 'fine-tuning', 'prompt',
    'llama', 'mistral', 'model', 'training', 'inference',
    'rag', 'vector', 'semantic', 'token', 'api', 'sdk'
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ============ Kimi 摘要功能 ============

function summarizeWithKimi(article) {
  try {
    const prompt = `请对这篇AI文章进行深度总结，采用「总分总」结构：

【输入信息】
标题：${article.title}
来源：${article.source}
描述：${article.description || '无'}

【输出要求】
1. **核心观点**（1句话）：文章最想表达的核心判断或洞察
2. **关键论据**（2-3点）：支撑观点的重要事实、数据或逻辑
3. **深度解读**（1-2句话）：这件事对AI领域的意义、潜在影响或趋势判断

字数：150-250字
语言：中文
风格：专业、有洞察、适合快速掌握精华`

    // 使用 kimi 命令行工具
    const result = execSync(
      `kimi -p "${prompt.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
      { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 }
    );
    
    return result.trim();
  } catch (e) {
    console.error(`  ❌ Kimi摘要失败: ${e.message}`);
    return null;
  }
}

// ============ 主函数 ============

async function main() {
  console.log('\n🤖 AI News Crawler (Kimi Enhanced)\n');
  
  const allContent = [];
  
  // 抓取 RSS
  console.log('📡 抓取 RSS 源...\n');
  for (const source of RSS_SOURCES) {
    process.stdout.write(`  → ${source.name}... `);
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
  
  console.log(`\n📊 共 ${unique.length} 条内容`);
  
  // 用 MiniMax 生成摘要
  console.log('\n🤖 用 MiniMax 2.1 生成浓缩摘要...\n');
  
  // 每条摘要完成后立即写入文件
  for (let i = 0; i < Math.min(unique.length, 20); i++) {
    const item = unique[i];
    process.stdout.write(`  [${i + 1}/${Math.min(unique.length, 20)}] ${item.source}: ${item.title.substring(0, 40)}... `);
    
    const summary = summarizeWithMiniMax(item);
    let finalSummary;
    if (summary) {
      console.log('✅');
      finalSummary = summary;
    } else {
      console.log('⚠️ 保留原文');
      finalSummary = item.description || '暂无摘要';
    }
    
    // 立即写入文件
    const summarizedItem = { ...item, summary: finalSummary };
    appendOrWriteFile(OUTPUT_FILE, summarizedItem, i === 0);
  }
  
  console.log(`\n✅ 已保存到 ${OUTPUT_FILE}`);
}

function generateMarkdown(item, isFirst) {
  const now = new Date().toLocaleString('zh-CN');
  let md = isFirst ? `# AI News Summary - ${now}\n\n> 共 20 条，由 MiniMax 2.1 浓缩摘要\n\n---\n\n` : '';
  
  const currentSource = item.source;
  md += `## ${currentSource}\n\n`;
  md += `**${item.title}**\n\n`;
  md += `📝 **MiniMax摘要**: ${item.summary}\n\n`;
  md += `🔗 [原文链接](${item.link})\n\n`;
  md += `📅 ${item.pubDate.toLocaleDateString('zh-CN')}\n\n`;
  md += `---\n\n`;
  
  return md;
}

function appendOrWriteFile(filePath, item, isFirst) {
  const content = generateMarkdown(item, isFirst);
  if (isFirst) {
    fs.writeFileSync(filePath, content);
  } else {
    fs.appendFileSync(filePath, content);
  }
}

// 运行
main().catch(console.error);
