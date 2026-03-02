#!/usr/bin/env python3
"""
Google Sheets 写入工具
用于将 AI News 写入 Google Sheets
"""

import os
import sys
import json
from datetime import datetime

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    print("需要安装: pip install gspread google-auth")
    sys.exit(1)

def get_credentials(service_account_path):
    """加载 Google Service Account 凭证"""
    if not os.path.exists(service_account_path):
        print(f"❌ 凭证文件不存在: {service_account_path}")
        return None
    
    try:
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        credentials = Credentials.from_service_account_file(
            service_account_path,
            scopes=scopes
        )
        return gspread.authorize(credentials)
    except Exception as e:
        print(f"❌ 凭证加载失败: {e}")
        return None

def write_to_sheet(spreadsheet_id, items):
    """写入 Google Sheets"""
    try:
        gc = get_credentials(os.environ.get('GOOGLE_SERVICE_ACCOUNT', 'service_account.json'))
        if not gc:
            return False
        
        # 打开表格
        spreadsheet = gc.open_by_key(spreadsheet_id)
        
        # 获取或创建工作表
        try:
            worksheet = spreadsheet.sheet1
        except:
            worksheet = spreadsheet.add_worksheet('AI News', rows=1000, cols=5)
        
        # 写入标题
        headers = ['时间', '来源', '标题', '摘要', '链接']
        worksheet.append_row(headers)
        
        # 写入数据
        for item in items:
            row = [
                datetime.now().strftime('%Y-%m-%d %H:%M'),
                item.get('source', ''),
                item.get('title', ''),
                item.get('summary', '').replace('\n', ' ')[:500],
                item.get('link', '')
            ]
            worksheet.append_row(row)
        
        print(f"✅ 已写入 {len(items)} 条到 Google Sheets")
        return True
        
    except Exception as e:
        print(f"❌ 写入失败: {e}")
        return False

def main():
    """主函数"""
    service_account = os.environ.get('GOOGLE_SERVICE_ACCOUNT', 'service_account.json')
    spreadsheet_id = os.environ.get('GOOGLE_SHEET_ID', '')
    
    if not spreadsheet_id:
        print("⚠️ 未设置 GOOGLE_SHEET_ID")
        return
    
    # 测试数据
    test_items = [
        {
            'source': 'Test',
            'title': '测试标题',
            'summary': '测试摘要',
            'link': 'https://example.com'
        }
    ]
    
    write_to_sheet(spreadsheet_id, test_items)

if __name__ == '__main__':
    main()
