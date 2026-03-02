/**
 * AI News 飞书通知
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { FEISHU_WEBHOOK, GOOGLE_SERVICE_ACCOUNT, GOOGLE_SHEET_ID } = require('./config');

// 读取 AI News 文件
function readAINews() {
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw/workspace/memory/ai-news.md');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ AI News 文件不存在');
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 提取今天的内容
  const today = new Date().toLocaleDateString('zh-CN');
  const sections = content.split(/^## /m);
  
  const todayItems = [];
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    const lines = section.split('\n');
    const source = lines[0]?.trim();
    if (!source) continue;
    
    // 查找今日内容
    const hasToday = section.includes(today) || section.includes(new Date().toISOString().split('T')[0]);
    
    if (hasToday || source.includes('AI News')) {
      // 提取摘要
      const summaryMatch = section.match(/📝 \*\*MiniMax摘要\*\*: ([^\n]+)/);
      const linkMatch = section.match(/🔗 \[原文链接\]\(([^)]+)\)/);
      const titleMatch = section.match(/\*\*([^*]+)\*\*/);
      
      if (titleMatch) {
        todayItems.push({
          source: source,
          title: titleMatch[1],
          summary: summaryMatch?.[1] || '',
          link: linkMatch?.[1] || ''
        });
      }
    }
  }
  
  return todayItems;
}

// 发送到飞书
function sendToFeishu(items) {
  if (!FEISHU_WEBHOOK) {
    console.log('⚠️ 未配置飞书 Webhook');
    return;
  }
  
  if (items.length === 0) {
    console.log('📭 今日无新内容');
    return;
  }
  
  // 构建消息
  let text = `🤖 **AI News - ${new Date().toLocaleDateString('zh-CN')}**\n\n`;
  
  for (const item of items.slice(0, 5)) {
    // 提取核心观点
    const core = item.summary.split('。')[0] || item.summary.substring(0, 50);
    text += `**${item.source}**\n`;
    text += `${core}...\n`;
    if (item.link) {
      text += `<${item.link}> 链接\n`;
    }
    text += '\n';
  }
  
  // 发送
  try {
    const payload = JSON.stringify({ msg_type: 'text', content: { text } });
    execSync(
      `curl -sL -X POST -H "Content-Type: application/json" -d '${payload.replace(/'/g, "\\'")}' "${FEISHU_WEBHOOK}"`,
      { encoding: 'utf8' }
    );
    console.log('✅ 飞书通知已发送');
  } catch (e) {
    console.log('❌ 飞书通知失败:', e.message);
  }
}

// 写入 Google Sheets
function writeToSheets(items) {
  if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_SHEET_ID) {
    console.log('⚠️ 未配置 Google Sheets');
    return;
  }
  
  console.log('📊 写入 Google Sheets...');
  // 这里可以调用 gsheet.py
}

// 主函数
function main() {
  console.log('\n📰 AI News Notify\n');
  
  const items = readAINews();
  console.log(`找到 ${items.length} 条今日内容`);
  
  sendToFeishu(items);
  writeToSheets(items);
}

main();
