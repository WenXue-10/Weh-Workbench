# -*- coding: utf-8 -*-
# 修复markdown初始化的问题
path = 'D:/Obsidian/Weh-Workbench/build_site.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''_md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"])

def md_to_html(text):
    _md.reset()
    html = _md.convert(text)
    html = re.sub(r"\\[\\[([^\\]|]+)(\\|[^\\]]+)?\\]\\]", r"\\1", html)
    return html'''

new = '''try:
    _md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"]) if markdown else None
except Exception:
    _md = None

def md_to_html(text):
    if _md is None:
        return text
    _md.reset()
    html = _md.convert(text)
    html = re.sub(r"\\[\\[([^\\]|]+)(\\|[^\\]]+)?\\]\\]", r"\\1", html)
    return html'''

if old in content:
    content = content.replace(old, new)
    print('✅ markdown初始化修复成功')
else:
    print('⚠️ 未找到目标代码，尝试简单替换')
    content = content.replace(
        '_md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"])',
        '_md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"]) if markdown else None'
    )
    print('✅ 简单替换成功')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('✅ 完成')
