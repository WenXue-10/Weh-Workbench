#!/usr/bin/env node
/**
 * 灵感收件箱 —— 把网页上标记「📚 存入知识库」的灵感，写成 md 落到 Obsidian 00-灵感库
 *
 * 用法：
 *   node inspire-inbox.mjs            正常拉取并写入
 *   node inspire-inbox.mjs --dry      只看会做什么，不写文件
 *   node inspire-inbox.mjs --setup    交互式填写 Token / Gist ID
 *   node inspire-inbox.mjs --help     看帮助
 *
 * 安全边界：只往 00-灵感库 新增/覆盖本脚本自己写过的笔记，绝不删除任何文件。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";

const CONFIG_PATH = path.join(os.homedir(), ".weh-atelier", "inspire-inbox.json");
const VAULT = process.env.WEH_VAULT || "D:\\Obsidian\\Weh-Brain";
const TARGET_DIR = path.join(VAULT, "00-灵感库");
const GIST_FILE = "weh-atelier-data.json";
const API = "https://api.github.com";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const optVal = (name) => {
  const hit = args.find((a) => a.startsWith(name + "="));
  return hit ? hit.slice(name.length + 1) : null;
};

function say(s = "") { console.log(s); }
function die(msg) { say("✗ " + msg); process.exit(1); }

/* ---------------- 配置 ---------------- */
function loadConfig() {
  const t = optVal("--token"), g = optVal("--gist");
  if (t && g) return { token: t, gistId: g };
  try {
    const c = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    if (c && c.token && c.gistId) return c;
  } catch (_) { /* 没配置，走下面的提示 */ }
  return null;
}

async function setup() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  say("=== 灵感收件箱 首次配置 ===");
  say("Token 用你网页「设置 → ☁️ 云同步」里那个（gist 权限就够），Gist ID 就是设置页里那串。");
  const token = (await ask("GitHub Token: ")).trim();
  const gistId = (await ask("Gist ID     : ")).trim();
  rl.close();
  if (!token || !gistId) die("两项都要填，未写入");
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ token, gistId }, null, 2), "utf8");
  say("✓ 已保存：" + CONFIG_PATH);
  say("（这个文件在仓库外，不会被提交；里面是你的 Token，别外发）");
}

/* ---------------- 拉 Gist ---------------- */
async function fetchGist(cfg) {
  const r = await fetch(API + "/gists/" + cfg.gistId, {
    headers: { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = (j && j.message) || ("HTTP " + r.status);
    if (r.status === 401 || r.status === 404) die("拉取失败（" + r.status + "）：" + m + "\n  → Token 无效/过期，或这个 Gist 不属于该 Token");
    die("拉取失败：" + m);
  }
  const f = j.files && j.files[GIST_FILE];
  if (!f || !f.content) die("这个 Gist 里没有 " + GIST_FILE + "（是不是填错 Gist ID 了？）");
  return JSON.parse(f.content);
}

/* ---------------- 落盘 ---------------- */
const safeName = (s) => String(s || "").replace(/[\\/:*?"<>|\r\n\t]/g, "_").replace(/\s+/g, " ").trim();

function scanExisting() {
  const byId = {};
  if (!fs.existsSync(TARGET_DIR)) return byId;
  for (const name of fs.readdirSync(TARGET_DIR)) {
    if (!name.toLowerCase().endsWith(".md")) continue;
    const full = path.join(TARGET_DIR, name);
    let head = "";
    try { head = fs.readFileSync(full, "utf8").slice(0, 800); } catch (_) { continue; }
    const m = head.match(/^---\s*$[\s\S]*?^id:\s*(.+?)\s*$[\s\S]*?^---\s*$/m);
    if (m) byId[m[1].trim()] = { file: full, name };
  }
  return byId;
}

function buildFileName(rec) {
  const head = safeName(String(rec.content || "灵感").slice(0, 10));
  const date = safeName(rec.date || new Date().toISOString().slice(0, 10));
  return "灵感-" + date + "-" + (head || "无标题") + ".md";
}

/* ---------------- 主流程 ---------------- */
async function main() {
  if (has("--help") || has("-h")) {
    say("灵感收件箱：把网页上标记「📚 存入知识库」的灵感写成笔记到 " + TARGET_DIR);
    say("  --dry    只看会做什么，不写文件");
    say("  --setup  交互式填写 Token / Gist ID");
    say("配置：支持 --token=xxx --gist=xxx 临时覆盖；也可用环境变量 WEH_VAULT 换 vault 路径");
    return;
  }
  if (has("--setup")) return setup();

  const dry = has("--dry");
  const cfg = loadConfig();
  if (!cfg) {
    say("✗ 还没配置。有两条路：");
    say("  ① 双击 tools\\拉取灵感.bat → 首次会自动进入配置");
    say("  ② 或手动创建 " + CONFIG_PATH);
    say('     内容：{ "token": "<你的 GitHub Token>", "gistId": "<Gist ID>" }');
    process.exit(1);
  }

  say("→ 拉取云端数据…");
  const data = await fetchGist(cfg);
  const records = (data.inspire && data.inspire.records) || [];
  const marked = records.filter((r) => r.kb && r.kb.variant && r.kb.md);
  const cancelled = records.filter((r) => r.kb && r.kb.variant === null).length;
  say("  灵感共 " + records.length + " 条，其中标记入库 " + marked.length + " 条"
      + (cancelled ? "（另有 " + cancelled + " 条已取消标记，跳过）" : ""));

  if (!fs.existsSync(TARGET_DIR)) {
    if (dry) { say("（dry-run）目录不存在，将创建：" + TARGET_DIR); }
    else { fs.mkdirSync(TARGET_DIR, { recursive: true }); say("  已创建目录：" + TARGET_DIR); }
  }
  const existing = scanExisting();
  say("  00-灵感库 现有笔记 " + Object.keys(existing).length + " 篇");

  let created = 0, updated = 0, skipped = 0, failed = 0;
  for (const r of marked) {
    const id = String(r.id);
    const md = r.kb.md;
    const cur = existing[id];
    if (cur) {
      let same = false;
      try { same = fs.readFileSync(cur.file, "utf8") === md; } catch (_) { same = false; }
      if (same) { skipped++; continue; }
      if (dry) { say("  [dry] 更新 " + cur.name); updated++; continue; }
      try { fs.writeFileSync(cur.file, md, "utf8"); updated++; say("  ↻ 更新 " + cur.name); }
      catch (e) { failed++; say("  ✗ 更新失败 " + cur.name + "：" + e.message); }
      continue;
    }
    let name = buildFileName(r);
    let full = path.join(TARGET_DIR, name);
    if (fs.existsSync(full)) name = name.replace(/\.md$/, "-" + id.slice(-4) + ".md"), full = path.join(TARGET_DIR, name);
    if (dry) { say("  [dry] 新增 " + name); created++; continue; }
    try {
      fs.writeFileSync(full, md, "utf8");
      existing[id] = { file: full, name };
      created++;
      say("  + 新增 " + name);
    } catch (e) { failed++; say("  ✗ 写入失败 " + name + "：" + e.message); }
  }

  say("");
  say("完成：" + (dry ? "[预演] " : "") + "新增 " + created + " · 更新 " + updated + " · 跳过 " + skipped + (failed ? " · 失败 " + failed : ""));
  if (!dry && (created || updated)) {
    say("目录：" + TARGET_DIR);
    say("提示：vault 是 git 仓库，笔记还没提交；要留痕的话在 Obsidian 里提交一次即可。");
  }
  if (!marked.length) say("（网页上还没标记入库的灵感 —— 在灵感详情里点「📚 存原话」或「📚 存原话+延伸」）");
}

main().catch((e) => die((e && e.message) || String(e)));
