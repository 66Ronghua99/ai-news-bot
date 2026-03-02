/**
 * AI News 飞书通知
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { FEISHU_WEBHOOK } = require('./config');

// 读取 AI News 文件
function readAINews() {
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw/workspace/memory/ai-news.md');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ AI News 文件不存在');
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 按 ## 分割获取每个来源
  const sections = content.split(/^## /m);
  const items = [];
  
  for (const section of sections) {
    if (!section.trim() || section.startsWith('AI News Summary')) continue;
    
    const lines = section.split('\n');
    const source = lines[0]?.trim() || 'Unknown';
    
    // 提取标题
    const titleMatch = section.match(/\*\*([^*]+)\*\*/);
    const title = titleMatch?.[1] || '';
    
    // 提取摘要（MiniMax生成的完整内容）
    const summaryMatch = section.match(/📝 \*\*MiniMax摘要\*\*:([\s\S]*?)(?=🔗|$)/);
    let summary = summaryMatch?.[1]?.trim() || '';
    
    // 提取链接
    const linkMatch = section.match(/🔗 \[原文链接\]\(([^)]+)\)/);
    const link = linkMatch?.[1] || '';
    
    if (title && summary) {
      items.push({ source, title, summary, link });
    }
  }
  
  return items;
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
  
  // 构建消息 - 完整显示摘要
  let text = `🤖 **AI News - ${new Date().toLocaleDateString('zh-CN')}**\n\n`;
  
  for (const item of items.slice(0, 5)) {
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `📰 ${item.source}\n`;
    text += `💡 ${item.title}\n\n`;
    
    // 提取核心观点（摘要的第一句或一段）
    const corePoints = item.summary.split('\n').slice(0, 5).join('\n');
    text += `${corePoints.substring(0, 800)}\n`;
    
    if (item.link) {
      text += `\n🔗 ${item.link}\n`;
    }
    text += '\n';
  }
  
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `共 ${items.length} 条`;
  
  // 发送
  try {
    const payload = JSON.stringify({ 
      msg_type: 'text', 
      content: { text: text.substring(0, 8000) }  // 飞书限制8000字
    });
    execSync(
      `curl -sL -X POST -H "Content-Type: application/json" -d '${payload.replace(/'/g, "\\'")}' "${FEISHU_WEBHOOK}"`,
      { encoding: 'utf8' }
    );
    console.log('✅ 飞书通知已发送');
  } catch (e) {
    console.log('❌ 飞书通知失败:', e.message);
  }
}

// 主函数
function main() {
  console.log('\n📰 AI News Notify\n');
  
  const items = readAINews();
  console.log(`找到 ${items.length} 条内容`);
  
  sendToFeishu(items);
}

main();
