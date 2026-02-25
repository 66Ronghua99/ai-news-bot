/**
 * 使用 OpenRouter + MiniMax 2.1 生成摘要
 */

const { execSync } = require('child_process');
const fs = require('fs');

function summarizeWithMiniMax(article) {
  try {
    // 从 .zshrc 读取 API Key
    const zshrc = fs.readFileSync(process.env.HOME + '/.zshrc', 'utf8');
    const apiKeyMatch = zshrc.match(/OPENROUTER_API_KEY="([^"]+)"/);
    
    if (!apiKeyMatch) {
      throw new Error('OPENROUTER_API_KEY not found in .zshrc');
    }
    
    const apiKey = apiKeyMatch[1];

    const prompt = `请对这篇AI文章进行深度总结，采用「总分总」结构（150-250字）：

【输入信息】
标题：${article.title}
来源：${article.source}
描述：${article.description || '无'}

【输出要求】
1. **核心观点**（1句话）：文章最想表达的核心判断或洞察
2. **关键论据**（4-5点）：支撑观点的重要事实、数据或逻辑
3. **深度解读**（一到两段话）：这件事对AI领域的意义、潜在影响或趋势判断

语言：中文，专业有洞察`;

    // 使用 MiniMax-M1（MiniMax 2.1 模型）
    const model = 'minimax/minimax-m1';
    
    const body = JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的AI新闻分析专家，擅长提炼核心观点和深度洞察。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const result = execSync(
      `curl -s https://openrouter.ai/api/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${apiKey}" \
        -d ${JSON.stringify(body)}`,
      { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 }
    );

    const response = JSON.parse(result);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error(`  ❌ API 失败: ${e.message}`);
    return generateFallbackSummary(article);
  }
}

// 回退方案
function generateFallbackSummary(article) {
  const title = article.title;
  const source = article.source;
  
  return `【核心观点】${title}反映了AI领域的重要进展。

【关键论据】
1. 来源：${source}，具有一定权威性
2. 技术方向：与AI、大模型或智能应用相关

【深度解读】这体现了AI技术向实用化方向发展的趋势，值得关注其后续落地效果。`;
}

module.exports = { summarizeWithMiniMax };
