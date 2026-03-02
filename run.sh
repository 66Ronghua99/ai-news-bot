#!/bin/bash
# AI News Crawler 启动脚本

# 加载环境变量
cd "$(dirname "$0")"
source .env

# 运行爬虫
node crawler.js
