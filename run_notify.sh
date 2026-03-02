#!/bin/bash
# AI News Notify 启动脚本

# 加载环境变量
cd "$(dirname "$0")"
source .env

# 运行通知
node notify.js
