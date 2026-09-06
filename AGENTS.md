# AGENTS.md - Weh Atelier 网页工作台项目

## 项目概述

Weh Atelier（AI 工作室）是个人AI工作台网页应用，整合存钱记账、饮食健康、工作汇报、任务管理、知识库浏览等模块。本目录是**代码仓库**，所有网页代码和构建脚本在这里。

- **代码路径**：`D:\Obsidian\Weh-Workbench\`
- **知识库文档**：`D:\Obsidian\Weh-Brain\01-Projects\Weh Atelier\`（架构、规范、问题日志、维护记录、设计决策）
- **部署平台**：GitHub Pages
- **发布目录**：`docs/`

---

## 每次启动必须读取

1. 本文件（AGENTS.md）——了解项目规则和维护记录要求
2. `D:\Obsidian\Weh-Brain\01-Projects\Weh Atelier\02-模块设计规范.md`——设计规范，修改前必读
3. `D:\Obsidian\Weh-Brain\01-Projects\Weh Atelier\03-问题与解决方案日志.md`——已知问题，避免重复踩坑

---

## 代码结构

```
D:\Obsidian\Weh-Workbench\
├── docs/                    ← GitHub Pages发布目录
│   ├── index.html          ← 最终单页网站（所有代码和数据内嵌）
│   ├── manifest.json       ← PWA配置
│   ├── sw.js               ← Service Worker
│   ├── assets/             ← 图片资源（背景图、图标）
│   └── files/              ← 附件（简历PDF、背调报告等）
├── build_site.py           ← 核心构建脚本：扫描Weh-Brain知识库 → 生成网页数据 → 写入index.html
├── update_site.ps1         ← 一键同步脚本：拉取→构建→提交→推送
└── AGENTS.md               ← 本文件
```

---

## 常用命令

### 本地构建（修改知识库后必须运行）
```powershell
cd D:\Obsidian\Weh-Workbench
python build_site.py
```

### 一键部署
```powershell
cd D:\Obsidian\Weh-Workbench
.\update_site.ps1
```

### 本地预览
浏览器直接打开 `docs/index.html`

---

## ⚠️ 维护记录同步规则（强制）

**每次对网页进行任何修改、优化、功能新增、问题解决后，必须同步更新 `D:\Obsidian\Weh-Brain\01-Projects\Weh Atelier\` 下的对应文档：**

| 操作类型 | 必须更新的文档 |
|---|---|
| 新增功能 / 修改功能 / 优化体验 | `04-维护记录.md`（追加一条记录） |
| 遇到问题并解决 | `03-问题与解决方案日志.md`（追加一条问题+解决方案） |
| 重要设计选择 / 技术方案决策 | `05-设计决策记录.md`（追加一条决策） |
| 架构变更 / 技术栈变更 / 模块增减 | `01-架构与搭建流程.md`（更新对应章节） |
| 设计规范变更 / 配色布局调整 | `02-模块设计规范.md`（更新对应章节） |

**记录格式**：日期 + 操作内容 + 原因 + 涉及文件。

**为什么要同步**：代码仓库只存代码，知识库存文档和决策，两者分离但必须保持一致。后续维护时先看知识库文档就能了解历史，不用翻代码commit。

---

## 修改原则

1. **先读规范再改**：修改前先读 `02-模块设计规范.md`，遵守配色、布局、交互规范
2. **改完必须构建**：修改 `build_site.py` 或知识库内容后，必须运行 `python build_site.py` 重新生成 `index.html`
3. **改完必须记录**：按上方"维护记录同步规则"更新知识库文档
4. **改完必须commit**：每次完成一个完整修改后，自动执行 `git add .` + `git commit`，commit message清晰描述改了什么
5. **数据安全**：用户数据存在浏览器localStorage，代码修改不能破坏已有数据的读取
6. **Electron兼容**：桌面端（Electron）不支持 `prompt()` 和 `confirm()`，必须用自定义弹窗

---

## Git版本控制规则

### 自动commit（强制）
每次完成一个完整的修改/任务后，自动执行：
```powershell
cd D:\Obsidian\Weh-Workbench
git add .
git commit -m "[类型] 清晰描述本次修改"
```
- 类型可选：新增/更新/修复/优化/重构/删除
- 不要每次小修改都commit，攒成一个完整修改再commit

### 推送前询问（强制）
- push不自动执行，每次会话结束时主动检查是否有未推送的commit，询问用户"是否推送到GitHub？"
- 用户明确说"推送"时才执行 `git push`
- 用户说"提交并推送"时直接commit + push

### 部署注意
- 推送后GitHub Pages会自动部署，约1-2分钟生效
- 如果修改了知识库内容，必须先运行 `python build_site.py` 重新生成index.html，再commit推送，否则线上不会更新

---

## 已知坑（避免重复踩）

1. Electron的iframe不支持原生 `prompt()` / `confirm()`，会导致按钮点击无反应
2. localStorage数据在桌面端和浏览器端不互通（两个独立存储环境）
3. GitHub推送经常连接超时，失败后重试即可，本地提交不会丢
4. 滚动条圆角在Chromium里设置了可能不生效，当前用细滚动条+主题色跟随
5. AI对话刷新后停在顶部，需要用MutationObserver监听DOM变化后再滚动

完整问题记录见：`D:\Obsidian\Weh-Brain\01-Projects\Weh Atelier\03-问题与解决方案日志.md`
