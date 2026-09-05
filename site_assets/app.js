/* ===== 文雪求职小窝 · 前端逻辑（数据由生成器自动注入） ===== */
var D = window.SITE_DATA || {};
var JOBS = D.jobs || [], COMPS = D.companies || [], TL = D.timeline || [];
var RESUMES = D.resumes || {general:[], custom:[]}, KBS = D.kb || [], BCKBS = D.baichuanKb || [], CET6KBS = D.cet6Kb || [], SOPKBS = D.sopKb || [];
var IMGS = D.images || {bg:{}, av:{}};
/* 快捷操作中转站（Cloudflare Worker），接入后由助手填写 */
var BRIDGE = { url: "https://1473705102-gh71l7a70a.ap-shanghai.tencentscf.com", key: "XNTbRx7spQJHDGWfKjchz8iSL2OIwoFY" };
var STATUS_LABEL = {ready:"📮 待投递", sent:"✉️ 已投递", interview:"📞 面试中", dead:"❌ 已挂", backup:"🗂️ 备选", done:"✅ 已背调"};

/* ---------- 工具 ---------- */
function scoreClass(s){ if(s==="—"||s===""||s==null) return "gray"; s=parseFloat(s); if(isNaN(s)) return "gray"; if(s>=80) return "green"; if(s>=70) return "blue"; if(s>=60) return "amber"; return "red"; }
function statusClass(s){ return {done:"done",warn:"warn",backup:"backup",new:"new",interview:"interview",dead:"dead"}[s]||"backup"; }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function setModal(html){ document.getElementById("modalBody").innerHTML = html; document.getElementById("modal").classList.add("show"); }
function closeModal(){ document.getElementById("modal").classList.remove("show"); }
var toastTimer=null;
function toast(msg){ var t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove("show");},2200); }

/* ---------- 首页 ---------- */
function renderHome(){
  var st = D.stats||{};
  document.getElementById("statJobs").textContent = st.jobs||0;
  document.getElementById("statRec").textContent = st.rec||0;
  document.getElementById("statInt").textContent = st.interview||0;
  document.getElementById("statOff").textContent = st.offer||0;
  var todo = D.todo||[];
  var todoHtml = todo.length ? todo.map(function(t){ return '<li><input type="checkbox"><span>'+esc(t)+'</span></li>'; }).join("") : '<li style="color:var(--muted)">今天没有待办，轻松一下 🐾</li>';
  document.getElementById("todoList").innerHTML = todoHtml;
  var last = TL.slice(-2).reverse(); // 取最新两条（数组末尾为最新，倒序让最新置顶）
  var tlHtml = last.length ? last.map(function(t){
    return '<div class="tl-item"><span class="tl-date">'+esc(t.date.slice(5))+'</span>'+esc((t.items&&t.items[0])||t.title)+'</div>';
  }).join("") : '<div class="tl-item" style="color:var(--muted)">还没有日报记录</div>';
  document.getElementById("homeTl").innerHTML = tlHtml;
}

/* ---------- 岗位看板 ---------- */
var curFilter="all", curQuery="";
function renderJobs(){
  var STATUS_FILTERS = ["done","ready","sent","interview","offer","backup","dead","warn"];
  var list = JOBS.filter(function(j){
    if(curFilter==="rec" && !(parseFloat(j.score)>=70)) return false;
    if(STATUS_FILTERS.indexOf(curFilter)>=0 && j.status!==curFilter) return false;
    if(curQuery){ var q=curQuery.toLowerCase(); if((j.company+j.pos+j.city).toLowerCase().indexOf(q)<0) return false; }
    return true;
  });
  var html = "";
  list.forEach(function(j){
    html += '<div class="job-card" onclick="openJob('+JOBS.indexOf(j)+')">'
      + '<div class="job-top"><div class="job-title"><span class="company">'+esc(j.company)+'</span><span class="pos">'+esc(j.pos)+'</span></div>'
      + '<span class="badge '+scoreClass(j.score)+'">'+esc(j.score)+'</span></div>'
      + '<div class="job-meta">📍 '+esc(j.city)+' &nbsp;·&nbsp; 💰 '+esc(j.salary)+' &nbsp;·&nbsp; 🗓 截止 '+esc(j.deadline)+'</div>'
      + '<div class="job-tags"><span class="status '+statusClass(j.status)+'">'+esc(j.statusTxt)+'</span><span class="level">匹配等级 '+esc(j.level)+'</span>'
      + '<span class="link-btn">🔗 原始链接</span></div></div>';
  });
  document.getElementById("jobList").innerHTML = html || '<div class="card" style="text-align:center;color:var(--muted)">🐾 没有符合条件的岗位哦～</div>';
}
function fileLinks(j, i){
  var out = "";
  if(j.report){
    if(j.report.pdf) out += '<a href="'+j.report.pdf+'" target="_blank">📄 背调报告 PDF</a>';
    else if(j.report.html) out += '<a onclick="openJobNote('+i+',\'report\')">📄 查看背调报告</a>';
  }
  if(j.resume){
    if(j.resume.pdf) out += '<a href="'+j.resume.pdf+'" target="_blank">📄 定制简历 PDF</a>';
    if(j.resume.doc) out += '<a href="'+j.resume.doc+'">📄 定制简历 Word</a>';
  }
  if(j.jd){
    if(j.jd.pdf) out += '<a href="'+j.jd.pdf+'" target="_blank">🗃️ JD 原文 PDF</a>';
    else if(j.jd.pdfs) j.jd.pdfs.forEach(function(u,k){ out += '<a href="'+u+'" target="_blank">🗃️ JD PDF '+(k+1)+'</a>'; });
    else if(j.jd.html) out += '<a onclick="openJobNote('+i+',\'jd\')">🗃️ 查看 JD 原文</a>';
  }
  return out || '<span style="color:var(--muted)">暂无关联文件</span>';
}
function openJob(i){
  var j = JOBS[i];
  var rows = (j.detail||[]).map(function(d){ return "<tr><td>"+esc(d[0])+"</td><td>"+esc(d[2])+" / "+esc(d[1])+"</td></tr>"; }).join("");
  setModal(
    '<h2>'+esc(j.company)+' · '+esc(j.pos)+'</h2>'
    + '<div class="m-sub">📍 '+esc(j.city)+' ｜ 💰 '+esc(j.salary)+' ｜ 🗓 截止 '+esc(j.deadline)+'</div>'
    + '<div class="job-tags"><span class="status '+statusClass(j.status)+'">'+esc(j.statusTxt)+'</span><span class="level">匹配等级 '+esc(j.level)+'</span></div>'
    + '<div class="m-sec">📄 JD 摘要</div><p style="font-size:13.5px;color:var(--muted)">'+esc(j.summary)+'</p>'
    + '<div class="m-sec">📊 匹配度评分明细</div>'
    + '<table class="m-table"><tbody>'+rows+'<tr style="background:var(--pink-soft)"><td><b>总分</b></td><td><b>'+esc(j.score)+' / 100</b></td></tr></tbody></table>'
    + '<div class="m-sec">🧩 关联资料</div><div class="m-links">'+fileLinks(j, i)
    + (j.link?'<a href="'+j.link+'" target="_blank">🔗 投递/原始链接</a>':'')
    + '</div>'
    + '<div class="m-sec">⚡ 快捷操作</div>'
    + '<div class="m-links" style="margin-bottom:4px">'
    + '<a onclick="quickAction('+i+',\'ready\')">📮 待投递</a>'
    + '<a onclick="quickAction('+i+',\'sent\')">✉️ 已投递</a>'
    + '<a onclick="quickAction('+i+',\'interview\')">📞 面试中</a>'
    + '<a onclick="quickAction('+i+',\'dead\')">❌ 已挂</a>'
    + '</div>'
    + '<p style="font-size:11.5px;color:var(--muted)">点一下即可更新知识库状态，自动同步到电脑和网站</p>'
    + (j.note?'<div class="m-sec">📝 备注</div><p style="font-size:13px;color:var(--muted)">'+esc(j.note)+'</p>':''));
}
function quickAction(i, status){
  var j = JOBS[i];
  if(!j.file){ toast("这个岗位暂不支持快捷操作"); return; }
  var label = STATUS_LABEL[status] || "";
  function okUpdate(){
    toast("✅ 已更新为「" + label + "」，自动同步中～");
    j.statusTxt = label;
    j.status = status;
    renderJobs();
  }
  function fallback(){
    var editUrl = "https://github.com/WenXue-10/SCM-Career-Dashboard/edit/main/" + encodeURIComponent(j.file);
    var msg = "更新岗位状态：" + j.company + "-" + j.pos + " → " + label;
    try { if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(msg); } } catch(e){}
    setModal('<h2>⚡ 快捷更新「' + label + '」</h2>'
      + '<p style="font-size:13.5px;color:var(--muted);margin-top:8px">中转站当前不可达（国内网络限制）。给你两个手动办法（都很快）：</p>'
      + '<div class="m-links" style="margin-top:12px"><a href="' + editUrl + '" target="_blank">✏️ 用 GitHub 直接改状态</a></div>'
      + '<p style="font-size:12.5px;color:var(--muted);margin-top:12px">已复制一句话：<b>' + esc(msg) + '</b>。也可以到电脑上的 Codex 里粘贴这句话，我 1 分钟帮你改好。</p>');
  }
  if(!BRIDGE.url || !BRIDGE.key){ fallback(); return; }
  fetch(BRIDGE.url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ key: BRIDGE.key, file: j.file, status: status })
  }).then(function(r){ return r.json(); }).then(function(res){
    if(res.ok){ okUpdate(); } else { toast("❌ 更新失败：" + (res.error || "未知错误")); }
  }).catch(function(){ fallback(); });
}
function openJobNote(i, which){
  var j = JOBS[i];
  var h = (which==="report") ? (j.report?j.report.html:"") : (j.jd?j.jd.html:"");
  var t = (which==="report") ? "背调报告" : "JD 原文";
  setModal('<h2>'+esc(j.company)+' · '+esc(t)+'</h2><div class="note-body" style="margin-top:12px">'+(h||'<p>暂无内容</p>')+'</div>');
}

/* ---------- 公司池 ---------- */
function renderCompanies(){
  var html = COMPS.map(function(g){
    var cards = g.groups.map(function(c){
      return '<div class="cmp-card" onclick="openCmp('+COMPS.indexOf(g)+','+g.groups.indexOf(c)+')">'
        + '<div class="cn">'+esc(c.cat)+'</div><div class="why">'+esc(c.name)+'</div>'
        + (c.why?'<div class="why" style="margin-top:6px">💡 '+esc(c.why)+'</div>':'')
        + '<div class="more">点开看理由 →</div></div>';
    }).join("");
    return '<div class="cmp-sec"><h3>'+esc(g.title)+'</h3><div class="cmp-grid">'+cards+'</div></div>';
  }).join("");
  document.getElementById("cmpList").innerHTML = html;
}
function openCmp(gi, ci){
  var g = COMPS[gi], c = g.groups[ci];
  var items = [];
  c.name.split(/[、，,]/).forEach(function(n){ n=n.trim(); if(n) items.push(n); });
  var rows = items.map(function(n,i){
    return '<div class="note-item" onclick="openCmpDetail('+gi+','+ci+','+i+')"><span class="ni-ic">🏢</span>'+esc(n)+'<span class="ni-more">详情 →</span></div>';
  }).join("");
  setModal('<h2>'+esc(g.title)+' · '+esc(c.cat)+'</h2>'
    + '<div class="m-sub">'+esc(c.why||"")+'</div>'
    + '<div class="m-sec">🏢 公司清单（点开看详情）</div>'+rows);
}
function openCmpDetail(gi, ci, i){
  var c = COMPS[gi].groups[ci];
  var items = c.name.split(/[、，,]/).map(function(n){ return n.trim(); }).filter(Boolean);
  var nm = items[i] || c.name;
  setModal('<h2>🏢 '+esc(nm)+'</h2>'
    + '<div class="m-sec">📌 所属类别</div><p style="font-size:13.5px">'+esc(COMPS[gi].title)+' · '+esc(c.cat)+'</p>'
    + '<div class="m-sec">💡 入选理由</div><p style="font-size:13.5px;color:var(--muted)">'+esc(c.why||"（暂无详细理由）")+'</p>'
    + '<div class="m-sec">📋 说明</div><p style="font-size:12.5px;color:var(--muted)">该公司的详细背调报告，会在该岗位被收录并执行 Skill 2 后自动生成并出现在这里。</p>');
}

/* ---------- 日报 ---------- */
function renderTimeline(){
  var html = TL.map(function(t){
    var items = (t.items||[]).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("");
    return '<div class="tl-card"><div class="tl-head"><span class="tl-title">'+esc(t.title)+'</span><span class="tl-badge">'+esc(t.date)+'</span></div><ul class="tl-body">'+items+'</ul></div>';
  }).join("");
  document.getElementById("tlList").innerHTML = html || '<div class="card" style="text-align:center;color:var(--muted)">🐾 还没有日报记录</div>';
}

/* ---------- 简历库 ---------- */
var RESUME_LIST = [];
function resumeCard(r){
  return '<div class="resume-card" onclick="openResume('+r._i+')">'
    + '<div class="resume-top"><div class="resume-ic">📄</div><div><div class="rn">'+esc(r.name)+'</div><div class="rd">'+esc(r.desc)+'</div></div></div>'
    + '<div class="resume-actions">'
    + (r.pdf?'<a class="pill g" href="'+r.pdf+'" download onclick="event.stopPropagation()">⬇ 下载 PDF</a>':'')
    + (r.doc?'<a class="pill o" href="'+r.doc+'" download onclick="event.stopPropagation()">📄 下载 Word</a>':'')
    + '<span class="pill o" onclick="event.stopPropagation();openResume('+r._i+')">👀 预览</span>'
    + '</div></div>';
}
function renderResumes(){
  RESUME_LIST = [];
  var general = [];
  (RESUMES.general||[]).forEach(function(r){ r._i = RESUME_LIST.length; RESUME_LIST.push(r); general.push(resumeCard(r)); });
  var custom = [];
  (RESUMES.custom||[]).forEach(function(cg){
    var cards = cg.items.map(function(r){ r._i = RESUME_LIST.length; RESUME_LIST.push(r); return resumeCard(r); }).join("");
    custom.push('<div class="company-group"><div class="cg-name">💙 '+esc(cg.company)+'</div><div class="resume-list">'+cards+'</div></div>');
  });
  document.getElementById("resumeGeneral").innerHTML = general.join("");
  document.getElementById("resumeCustom").innerHTML = custom.join("");
}
function openResume(i){
  var r = RESUME_LIST[i]; if(!r) return;
  var links = "";
  if(r.pdf) links += '<a href="'+r.pdf+'" target="_blank">⬇️ 下载 PDF</a><a href="'+r.pdf+'" target="_blank">👀 在线预览</a>';
  if(r.doc) links += '<a href="'+r.doc+'" target="_blank">📄 下载 Word 版</a>';
  setModal('<h2>📄 '+esc(r.name)+'</h2><div class="m-sub">手机可直接下载或预览 PDF，投递时发给 HR 即可</div>'
    + (r.pdf?'<div class="pdf-ph">🖨️<br>点击下方「在线预览」查看 PDF 内容</div>':'<div class="pdf-ph">🖨️<br>该简历暂无 PDF 版（生成器会自动补齐）</div>')
    + '<div class="m-links">'+links+'</div>');
}

/* ---------- 知识库 ---------- */
var KB_FLAT = [];
function flattenKb(){
  KB_FLAT = [];
  KBS.forEach(function(k){
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
      (function walk(ns){ ns.forEach(function(n){ if(n.children){ walk(n.children); } else { KB_FLAT.push(n); } }); })(g.notes||[]);
    });
  });
}
function kbNoteItem(n){
  var idx = KB_FLAT.indexOf(n);
  return '<div class="note-item" onclick="openKbNote('+idx+')"><span class="ni-ic">'+esc(n.icon)+'</span>'+esc(n.title)+'<span class="ni-more">打开 →</span></div>';
}
function countNotes(ns){ var c=0; (ns||[]).forEach(function(n){ c += n.children ? countNotes(n.children) : 1; }); return c; }
function renderKb(){
  document.getElementById("kbGrid").innerHTML = KBS.map(function(k,i){
    var cnt = 0;
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){ cnt += countNotes(g.notes); });
    return '<div class="kb-card" onclick="openKb('+i+')"><div class="ic">'+k.icon+'</div><div class="kb-info"><div class="kn">'+esc(k.name)+'</div><div class="kd">'+esc(k.desc)+'</div></div><span class="ncount">'+cnt+' 项</span></div>';
  }).join("");
}
function renderNotes(ns){
  return (ns||[]).map(function(n){
    if(n.children){
      return '<div class="kb-folder"><div class="kf-name">'+n.icon+' '+esc(n.title)+'</div>'
        + renderNotes(n.children) + '</div>';
    }
    return kbNoteItem(n);
  }).join("");
}
function openKb(i){
  var k = KBS[i];
  var html = "";
  (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
    if(g.title) html += '<div class="kb-section">'+esc(g.title)+'</div>';
    var items = renderNotes(g.notes);
    html += items || '<div style="color:var(--muted);font-size:13px;margin:4px 0">（空）🐾</div>';
  });
  setModal('<h2>'+k.icon+' '+esc(k.name)+'</h2><div class="m-sub">'+esc(k.desc)+' · 点击查看</div>'+(html||'<div class="m-sub">这个文件夹还没有内容 🐾</div>'));
}
function openKbNote(idx){
  var n = KB_FLAT[idx];
  if(!n) return;
  setModal('<h2>'+n.icon+' '+esc(n.title)+'</h2><div style="margin-top:12px" class="note-body">'+(n.html||'<p>暂无内容</p>')+'</div>');
}

function renderBcKb(){
  var grid = document.getElementById("bcKbGrid");
  if(!grid) return;
  grid.innerHTML = BCKBS.map(function(k,i){
    var cnt = 0;
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){ cnt += countNotes(g.notes); });
    return '<div class="kb-card" onclick="openBcKb('+i+')"><div class="ic">'+k.icon+'</div><div class="kb-info"><div class="kn">'+esc(k.name)+'</div><div class="kd">'+esc(k.desc)+'</div></div><span class="ncount">'+cnt+' 项</span></div>';
  }).join("");
  // 更新统计数字
  var total = 0, skill = 0, tool = 0, idea = 0;
  BCKBS.forEach(function(k){
    var cnt = 0;
    (k.groups||[{notes:k.notes||[]}]).forEach(function(g){ cnt += countNotes(g.notes); });
    total += cnt;
    if(k.name.indexOf("技能") >= 0) skill = cnt;
    if(k.name.indexOf("工具") >= 0) tool = cnt;
    if(k.name.indexOf("灵感") >= 0) idea = cnt;
  });
  if(document.getElementById("bcKbCount")) document.getElementById("bcKbCount").textContent = total;
  if(document.getElementById("bcSkillCount")) document.getElementById("bcSkillCount").textContent = skill;
  if(document.getElementById("bcToolCount")) document.getElementById("bcToolCount").textContent = tool;
  if(document.getElementById("bcIdeaCount")) document.getElementById("bcIdeaCount").textContent = idea;
}
function openBcKb(i){
  var k = BCKBS[i];
  var html = "";
  (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
    if(g.title) html += '<div class="kb-section">'+esc(g.title)+'</div>';
    var items = renderNotes(g.notes);
    html += items || '<div style="color:var(--muted);font-size:13px;margin:4px 0">（空）🐾</div>';
  });
  setModal('<h2>'+k.icon+' '+esc(k.name)+'</h2><div class="m-sub">'+esc(k.desc)+' · 点击查看</div>'+(html||'<div class="m-sub">这个文件夹还没有内容 🐾</div>'));
}

function renderGenericKb(gridId, data, countIds){
  var grid = document.getElementById(gridId);
  if(!grid || !data) return;
  grid.innerHTML = data.map(function(k,i){
    var cnt = 0;
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){ cnt += countNotes(g.notes); });
    return '<div class="kb-card" onclick="openGenericKb(\''+gridId+'\','+i+')"><div class="ic">'+k.icon+'</div><div class="kb-info"><div class="kn">'+esc(k.name)+'</div><div class="kd">'+esc(k.desc)+'</div></div><span class="ncount">'+cnt+' 项</span></div>';
  }).join("");
  // 更新统计
  if(countIds){
    var total = 0;
    data.forEach(function(k){
      var cnt = 0;
      (k.groups||[{notes:k.notes||[]}]).forEach(function(g){ cnt += countNotes(g.notes); });
      total += cnt;
      for(var key in countIds){
        if(k.name.indexOf(key) >= 0 && countIds[key]){
          var el = document.getElementById(countIds[key]);
          if(el) el.textContent = cnt;
        }
      }
    });
    if(countIds._total){
      var tel = document.getElementById(countIds._total);
      if(tel) tel.textContent = total;
    }
  }
}
function openGenericKb(gridId, i){
  var data = gridId === "cet6KbGrid" ? CET6KBS : (gridId === "sopKbGrid" ? SOPKBS : BCKBS);
  var k = data[i];
  var html = "";
  (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
    if(g.title) html += '<div class="kb-section">'+esc(g.title)+'</div>';
    var items = renderNotes(g.notes);
    html += items || '<div style="color:var(--muted);font-size:13px;margin:4px 0">（空）🐾</div>';
  });
  setModal('<h2>'+k.icon+' '+esc(k.name)+'</h2><div class="m-sub">'+esc(k.desc)+' · 点击查看</div>'+(html||'<div class="m-sub">这个文件夹还没有内容 🐾</div>'));
}


/* ========== 存钱记账模块 ========== */
var MONEY_KEY = "weh_money_data_v1";
var MONEY_DEFAULTS = {budget:3000, fixedSave:600, cycleStart:20, records:[], chatHistory:[]};
var QUICK_CATEGORIES = [
  {name:"打车", icon:"🚕", amount:15},
  {name:"地铁", icon:"🚇", amount:6},
  {name:"外卖", icon:"🍱", amount:25},
  {name:"买菜", icon:"🥬", amount:30},
  {name:"奶茶", icon:"🧋", amount:15},
  {name:"聚餐", icon:"🍲", amount:80},
  {name:"直播间", icon:"📱", amount:50},
  {name:"会员", icon:"💳", amount:20},
];
var IMPULSE_CATS = {"奶茶":true, "聚餐":true, "直播间":true};
var DRINK_CATS = {"咖啡":true, "奶茶":true, "含糖饮料":true, "无糖饮料":true, "果汁":true, "养生饮品":true, "奶制品":true};
var MEAL_CATS = {"外卖轻食":true, "重油外卖":true, "外食聚餐":true, "自己做":true};
function isHealthCategory(cat){
  if(!!DRINK_CATS[cat] || !!MEAL_CATS[cat]) return true;
  // 自定义类别关键词判断
  var keywords = ["咖啡","奶茶","饮料","可乐","气泡水","果汁","牛奶","酸奶","桃胶","红枣","桂圆","红糖","养生","外卖","轻食","餐","饭","三明治","沙拉","便当","便利店","早餐","午餐","晚餐","夜宵","零食","水果"];
  for(var i=0;i<keywords.length;i++){
    if(cat.indexOf(keywords[i]) >= 0) return true;
  }
  return false;
}
function getHealthType(cat){ return DRINK_CATS[cat] ? "drink" : "meal"; }

function loadMoney(){
  try{
    var d = JSON.parse(localStorage.getItem(MONEY_KEY));
    if(!d) return JSON.parse(JSON.stringify(MONEY_DEFAULTS));
    for(var k in MONEY_DEFAULTS){ if(d[k]===undefined) d[k]=MONEY_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(MONEY_DEFAULTS)); }
}
function saveMoney(data){ localStorage.setItem(MONEY_KEY, JSON.stringify(data)); }

function getCycleRange(cycleStart){
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth();
  var start = new Date(y, m, cycleStart);
  if(now.getDate() < cycleStart) start = new Date(y, m-1, cycleStart);
  var end = new Date(start); end.setMonth(end.getMonth()+1);
  return {start:start, end:end};
}
function inCycle(dateStr, cycleStart){
  var d = new Date(dateStr);
  var r = getCycleRange(cycleStart);
  return d >= r.start && d < r.end;
}
function daysLeftInCycle(cycleStart){
  var r = getCycleRange(cycleStart);
  var now = new Date();
  var diff = Math.ceil((r.end - now) / (1000*60*60*24));
  return Math.max(diff, 1);
}

function renderMoney(){
  var data = loadMoney();
  // 顶部设置
  document.getElementById("moneyBudget").textContent = "¥" + data.budget;
  document.getElementById("moneyFixedSave").textContent = "¥" + data.fixedSave;
  document.getElementById("moneyCycleStart").textContent = "每月" + data.cycleStart + "号";
  // 本期记录
  var cycleRecords = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart); });
  var spent = cycleRecords.reduce(function(s,r){ return s + Number(r.amount); }, 0);
  var impulse = cycleRecords.filter(function(r){ return r.impulse; }).reduce(function(s,r){ return s + Number(r.amount); }, 0);
  var remain = data.budget - data.fixedSave - spent;
  var daysLeft = daysLeftInCycle(data.cycleStart);
  var perDay = Math.max(remain / daysLeft, 0);
  document.getElementById("moneyRemain").textContent = "¥" + remain.toFixed(0);
  document.getElementById("moneyPerDay").textContent = "¥" + perDay.toFixed(0);
  document.getElementById("moneySpent").textContent = "¥" + spent.toFixed(0);
  document.getElementById("moneyImpulse").textContent = "¥" + impulse.toFixed(0);
  document.getElementById("recordCount").textContent = cycleRecords.length + " 笔";
  // 环形进度条（已花/可用预算）
  var usable = data.budget - data.fixedSave;
  var spendPct = usable > 0 ? Math.min(spent / usable * 100, 100) : 0;
  var ring = document.getElementById("moneyRing");
  if(ring){
    var ringColor = spendPct > 90 ? "#ff6b6b" : (spendPct > 70 ? "#ffa94d" : "var(--pink-deep)");
    ring.style.background = "conic-gradient("+ringColor+" "+spendPct.toFixed(1)+"%, rgba(255,255,255,.5) "+spendPct.toFixed(1)+"%)";
  }
  var ringPct = document.getElementById("moneyRingPct");
  if(ringPct) ringPct.textContent = spendPct.toFixed(0) + "%";
  // 账单日倒计时
  var cdEl = document.getElementById("moneyCountdown");
  if(cdEl){
    var cycleR = getCycleRange(data.cycleStart);
    var cdDays = Math.ceil((cycleR.end - new Date()) / (1000*60*60*24));
    cdEl.textContent = cdDays > 0 ? "距账单日 "+cdDays+"天" : "今天账单日";
  }
  // 最近7天消费柱状图
  var weekChart = document.getElementById("moneyWeekChart");
  if(weekChart){
    var today = new Date();
    var weekBars = [];
    var maxDay = 1;
    for(var wi=6; wi>=0; wi--){
      var d = new Date(today); d.setDate(d.getDate()-wi);
      var ds = d.toISOString().slice(0,10);
      var daySpent = data.records.filter(function(r){ return r.date===ds; }).reduce(function(s,r){ return s+Number(r.amount); },0);
      var hasImpulse = data.records.some(function(r){ return r.date===ds && r.impulse; });
      maxDay = Math.max(maxDay, daySpent);
      weekBars.push({date:ds, day:["日","一","二","三","四","五","六"][d.getDay()], spent:daySpent, impulse:hasImpulse, isToday:wi===0});
    }
    weekChart.innerHTML = weekBars.map(function(b){
      var h = b.spent > 0 ? Math.max(b.spent/maxDay*100, 8) : 2;
      var impCls = b.impulse ? " impulse-day" : "";
      var todayCls = b.isToday ? " today" : "";
      return '<div class="m-week-bar'+todayCls+'"><div class="m-week-bar-amt">'+(b.spent>0?"¥"+b.spent.toFixed(0):"")+'</div>'
        +'<div class="m-week-bar-fill'+impCls+'" style="height:'+h+'%"></div>'
        +'<div class="m-week-bar-day">'+b.day+'</div></div>';
    }).join("");
  }
  // 快捷按钮
  var qg = document.getElementById("quickExpenseGrid");
  qg.innerHTML = QUICK_CATEGORIES.map(function(c){
    return '<div class="qe-btn" onclick="quickExpense(\''+c.name+'\','+c.amount+')"><div class="qe-icon">'+c.icon+'</div><div class="qe-name">'+c.name+'</div><div class="qe-amount">¥'+c.amount+'</div></div>';
  }).join("");
  // 消费记录（倒序）
  var el = document.getElementById("expenseList");
  if(cycleRecords.length === 0){
    el.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px;font-size:13px">还没有消费记录，点上方快捷按钮开始记账～</div>';
  } else {
    el.innerHTML = cycleRecords.slice().reverse().map(function(r){
      var cat = QUICK_CATEGORIES.find(function(c){ return c.name===r.category; }) || {icon:"💰"};
      var impCls = r.impulse ? "" : " off";
      var impTxt = r.impulse ? "⚠️冲动" : "普通";
      return '<div class="exp-item">'
        +'<div class="exp-icon">'+cat.icon+'</div>'
        +'<div class="exp-info"><div class="exp-cat">'+esc(r.category)+(r.note?' · '+esc(r.note):'')+'</div><div class="exp-date">'+r.date+'</div></div>'
        +'<div class="exp-amount" onclick="editExpAmount('+r.id+')">¥'+r.amount+'</div>'
        +'<div class="exp-impulse'+impCls+'" onclick="toggleImpulse('+r.id+')">'+impTxt+'</div>'
        +'<div class="exp-del" onclick="delExpense('+r.id+')">✕</div>'
        +'</div>';
    }).join("");
  }
  // 类别占比
  var catTotals = {};
  cycleRecords.forEach(function(r){ catTotals[r.category] = (catTotals[r.category]||0) + Number(r.amount); });
  var catArr = Object.keys(catTotals).map(function(k){ return {name:k, amount:catTotals[k]}; }).sort(function(a,b){ return b.amount-a.amount; });
  var cb = document.getElementById("categoryBars");
  if(catArr.length === 0){
    cb.innerHTML = '<div style="text-align:center;color:var(--muted);padding:16px;font-size:12px">暂无数据</div>';
  } else {
    cb.innerHTML = catArr.map(function(c){
      var pct = spent > 0 ? (c.amount/spent*100) : 0;
      var cat = QUICK_CATEGORIES.find(function(q){ return q.name===c.name; }) || {icon:"💰"};
      var isImpCat = !!IMPULSE_CATS[c.name];
      var impCls2 = isImpCat ? " impulse-cat" : "";
      return '<div class="cat-bar-row"><div class="cat-bar-name">'+cat.icon+' '+c.name+(isImpCat?' ⚠️':'')+'</div>'
        +'<div class="cat-bar-track"><div class="cat-bar-fill'+impCls2+'" style="width:'+pct.toFixed(1)+'%"></div></div>'
        +'<div class="cat-bar-amt">¥'+c.amount.toFixed(0)+' ('+pct.toFixed(0)+'%)</div></div>';
    }).join("");
  }
  // 渲染AI对话
  renderMoneyChat();
}

function quickExpense(cat, amount){
  var data = loadMoney();
  var today = new Date().toISOString().slice(0,10);
  var id = Date.now();
  var note = prompt(cat+" 备注（可选，如：午餐/公司楼下/和朋友，不填直接点确定）：") || "";
  data.records.push({id:id, category:cat, amount:amount, date:today, impulse:!!IMPULSE_CATS[cat], note:note});
  saveMoney(data);
  renderMoney();
  if(isHealthCategory(cat)){
    try{
      var health = loadHealth();
      if(!health.records.find(function(r){ return r.id===id; })){
        health.records.push({id:id, type:getHealthType(cat), category:cat, amount:amount, date:today, note:note});
        saveHealth(health);
      }
    }catch(e){ console.log("同步到饮食台失败:", e.message); }
  }
}
function addCustomExpense(){
  var cat = prompt("消费类别（如：打车/奶茶/其他）：");
  if(!cat) return;
  var amount = prompt("金额：");
  if(!amount || isNaN(amount)) return;
  var note = prompt("备注（可选）：") || "";
  var data = loadMoney();
  var today = new Date().toISOString().slice(0,10);
  var id = Date.now();
  data.records.push({id:id, category:cat, amount:Number(amount), date:today, impulse:false, note:note});
  saveMoney(data);
  renderMoney();
  if(isHealthCategory(cat)){
    try{
      var health = loadHealth();
      if(!health.records.find(function(r){ return r.id===id; })){
        health.records.push({id:id, type:getHealthType(cat), category:cat, amount:Number(amount), date:today, note:note});
        saveHealth(health);
      }
    }catch(e){ console.log("同步到饮食台失败:", e.message); }
  }
}
function editExpAmount(id){
  var data = loadMoney();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  var newAmt = prompt("修改金额（当前 ¥"+r.amount+"）：");
  if(!newAmt || isNaN(newAmt)) return;
  r.amount = Number(newAmt);
  saveMoney(data);
  renderMoney();
  if(isHealthCategory(r.category)){
    try{
      var health = loadHealth();
      var hr = health.records.find(function(x){ return x.id===id; });
      if(hr){ hr.amount = Number(newAmt); saveHealth(health); }
    }catch(e){ console.log("同步修改饮食台失败:", e.message); }
  }
}
function toggleImpulse(id){
  var data = loadMoney();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  r.impulse = !r.impulse;
  saveMoney(data);
  renderMoney();
}
function delExpense(id){
  if(!confirm("确定删除这笔记录？（饮食台的对应记录也会同步删除）")) return;
  var data = loadMoney();
  var r = data.records.find(function(x){ return x.id===id; });
  data.records = data.records.filter(function(x){ return x.id!==id; });
  saveMoney(data);
  renderMoney();
  if(r && isHealthCategory(r.category)){
    try{
      var health = loadHealth();
      health.records = health.records.filter(function(x){ return x.id!==id; });
      saveHealth(health);
    }catch(e){ console.log("同步删除饮食台失败:", e.message); }
  }
}
function editMoneyBudget(){
  var data = loadMoney();
  var v = prompt("本月预算（当前 ¥"+data.budget+"）：");
  if(!v || isNaN(v)) return;
  data.budget = Number(v);
  saveMoney(data); renderMoney();
}
function editMoneyFixedSave(){
  var data = loadMoney();
  var v = prompt("固定存款（当前 ¥"+data.fixedSave+"）：");
  if(!v || isNaN(v)) return;
  data.fixedSave = Number(v);
  saveMoney(data); renderMoney();
}
function editMoneyCycleStart(){
  var data = loadMoney();
  var v = prompt("账单日（每月几号，当前 "+data.cycleStart+" 号）：");
  if(!v || isNaN(v) || v<1 || v>28) return;
  data.cycleStart = Number(v);
  saveMoney(data); renderMoney();
}

/* AI说真话（基于数据生成） */
function runMoneyTruth(){
  var data = loadMoney();
  var cycleRecords = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart); });
  var spent = cycleRecords.reduce(function(s,r){ return s+Number(r.amount); },0);
  var impulse = cycleRecords.filter(function(r){ return r.impulse; });
  var impulseAmt = impulse.reduce(function(s,r){ return s+Number(r.amount); },0);
  var box = document.getElementById("aiTruth");
  if(cycleRecords.length === 0){
    box.textContent = "还没有消费记录，先记几笔我再帮你分析～";
    return;
  }
  var truths = [];
  var impPct = spent > 0 ? (impulseAmt/spent*100) : 0;
  if(impPct > 30){
    truths.push("⚠️ 本期"+impPct.toFixed(0)+"%的钱是冲动消费花掉的（¥"+impulseAmt.toFixed(0)+"），手指动一动就没了。");
  } else if(impPct > 0){
    truths.push("冲动消费占比"+impPct.toFixed(0)+"%（¥"+impulseAmt.toFixed(0)+"），还算克制，继续保持。");
  }
  var remain = data.budget - data.fixedSave - spent;
  var daysLeft = daysLeftInCycle(data.cycleStart);
  var perDay = remain / daysLeft;
  if(remain < 0){
    truths.push("🚨 已经超支 ¥"+Math.abs(remain).toFixed(0)+"了！后面"+daysLeft+"天每天只能花0元，想想哪笔最不该花？");
  } else if(perDay < 20){
    truths.push("⏰ 还剩"+daysLeft+"天，每天只能花¥"+perDay.toFixed(0)+"，紧巴巴的，非必要别花了。");
  } else {
    truths.push("还剩"+daysLeft+"天，每天可花¥"+perDay.toFixed(0)+"，节奏不错，别突然大手大脚。");
  }
  // 找最不该花的一笔
  if(impulse.length > 0){
    var worst = impulse.reduce(function(a,b){ return Number(a.amount)>Number(b.amount)?a:b; });
    var yearly = worst.amount * 12;
    truths.push("💡 最不该花的是「"+worst.category+" ¥"+worst.amount+"」，每月少一笔，一年省¥"+yearly.toFixed(0)+"，差不多一趟短途机票了。");
  }
  box.innerHTML = truths.map(function(t){ return '<div style="margin-bottom:8px">'+t+'</div>'; }).join("");
}

/* AI财务顾问对话 */
function renderMoneyChat(){
  var data = loadMoney();
  var box = document.getElementById("moneyChatMessages");
  if(!box) return;
  box.innerHTML = (data.chatHistory||[]).map(function(m){
    return '<div class="m-chat-msg '+m.role+'">'+esc(m.content).replace(/\n/g,"<br>")+'</div>';
  }).join("");
  // 自动滚到底
  setTimeout(function(){ box.scrollTop = box.scrollHeight; }, 50);
}
function getMoneyContext(){
  var data = loadMoney();
  var cycleRecords = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart); });
  var spent = cycleRecords.reduce(function(s,r){ return s+Number(r.amount); },0);
  var remain = data.budget - data.fixedSave - spent;
  var daysLeft = daysLeftInCycle(data.cycleStart);
  var catTotals = {};
  cycleRecords.forEach(function(r){ catTotals[r.category]=(catTotals[r.category]||0)+Number(r.amount); });
  var topCats = Object.keys(catTotals).map(function(k){return{k:k,v:catTotals[k]};}).sort(function(a,b){return b.v-a.v;}).slice(0,3);
  return "【本期消费概览】预算¥"+data.budget+"，固定存款¥"+data.fixedSave+"，已花¥"+spent.toFixed(0)+"，还能花¥"+remain.toFixed(0)+"，还剩"+daysLeft+"天，每天¥"+(remain/daysLeft).toFixed(0)+"。花最多的："+topCats.map(function(c){return c.k+"¥"+c.v.toFixed(0);}).join("、")+"。";
}
function sendMoneyChat(){
  var input = document.getElementById("moneyChatInput");
  var msg = input.value.trim();
  if(!msg) return;
  var data = loadMoney();
  data.chatHistory = data.chatHistory || [];
  data.chatHistory.push({role:"user", content:msg});
  input.value = "";
  saveMoney(data);
  renderMoneyChat();
  // 模拟AI回复（基于消费数据）
  setTimeout(function(){
    var reply = generateMoneyReply(msg, data);
    data.chatHistory.push({role:"ai", content:reply});
    saveMoney(data);
    renderMoneyChat();
  }, 600);
}
function generateMoneyReply(msg, data){
  var ctx = getMoneyContext();
  var lower = msg.toLowerCase();
  if(lower.indexOf("超支")>=0 || lower.indexOf("花超")>=0){
    var cycleRecords = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart); });
    var spent = cycleRecords.reduce(function(s,r){ return s+Number(r.amount); },0);
    var remain = data.budget - data.fixedSave - spent;
    if(remain < 0) return "是的，已经超支¥"+Math.abs(remain).toFixed(0)+"。建议：1. 后面非必要消费全停；2. 看看冲动消费里哪笔能退；3. 下个月预算调高或固定存款调低。";
    return "还没超支，还能花¥"+remain.toFixed(0)+"。但要注意节奏，别最后几天紧巴巴。";
  }
  if(lower.indexOf("省")>=0 || lower.indexOf("省钱")>=0){
    return "省钱建议：1. 奶茶/咖啡从每天一杯减到每周3杯，一年省¥2000+；2. 直播间下单前等24小时，80%会不想买；3. 外卖改自己做，每月省¥500+。先从最容易的一项开始。";
  }
  if(lower.indexOf("冲动")>=0){
    var imp = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart) && r.impulse; });
    var impAmt = imp.reduce(function(s,r){ return s+Number(r.amount); },0);
    if(imp.length===0) return "本期还没有冲动消费记录，很棒！继续保持。";
    return "本期冲动消费"+imp.length+"笔，共¥"+impAmt.toFixed(0)+"。最多的是「"+imp.reduce(function(a,b){return Number(a.amount)>Number(b.amount)?a:b;}).category+"」。下次买之前问自己：不买会怎样？72小时后还想要吗？";
  }
  if(lower.indexOf("预算")>=0 || lower.indexOf("多少钱")>=0){
    return ctx + " 点顶部「本月预算」可以修改，「固定存款」是发工资先划走的钱，「账单日」决定本期从哪天算起。";
  }
  // 默认回复
  var cycleRecords = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart); });
  if(cycleRecords.length===0) return "还没有消费记录，先点上方快捷按钮记几笔，我再帮你分析。记账的关键不是记多细，而是让你看清钱去哪了。";
  return ctx + " 你可以问我：超支了吗？怎么省钱？冲动消费有哪些？或者直接说你的消费困惑，我帮你出主意。说人话，不绕弯。";
}


/* ========== 吃饭健康模块 ========== */
var HEALTH_KEY = "weh_health_data_v1";
var HEALTH_DEFAULTS = {drinkBudget:100, drinkGoal:7, records:[], chatHistory:[]};
var DRINKS = [
  {name:"咖啡", icon:"☕", amount:18},
  {name:"奶茶", icon:"🧋", amount:15},
  {name:"无糖饮料", icon:"🫧", amount:5},
  {name:"果汁", icon:"🧃", amount:12},
  {name:"养生饮品", icon:"🍵", amount:10},
  {name:"奶制品", icon:"🥛", amount:8},
  {name:"含糖饮料", icon:"🥤", amount:6},
];
var MEALS = [
  {name:"外卖轻食", icon:"🥗", amount:25},
  {name:"重油外卖", icon:"🍔", amount:30},
  {name:"外食聚餐", icon:"🍲", amount:80},
  {name:"自己做", icon:"👩‍🍳", amount:15},
];

function loadHealth(){
  try{
    var d = JSON.parse(localStorage.getItem(HEALTH_KEY));
    if(!d) return JSON.parse(JSON.stringify(HEALTH_DEFAULTS));
    for(var k in HEALTH_DEFAULTS){ if(d[k]===undefined) d[k]=HEALTH_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(HEALTH_DEFAULTS)); }
}
function saveHealth(data){ localStorage.setItem(HEALTH_KEY, JSON.stringify(data)); }

function getWeekRange(){
  var now = new Date();
  var day = now.getDay() || 7;
  var monday = new Date(now); monday.setDate(now.getDate() - day + 1); monday.setHours(0,0,0,0);
  var sunday = new Date(monday); sunday.setDate(monday.getDate()+7);
  return {start:monday, end:sunday};
}
function inThisWeek(dateStr){
  var d = new Date(dateStr);
  var r = getWeekRange();
  return d >= r.start && d < r.end;
}
function daysLeftInWeek(){
  var r = getWeekRange();
  var now = new Date();
  return Math.max(Math.ceil((r.end - now)/(1000*60*60*24)), 0);
}

function renderHealth(){
  var data = loadHealth();
  document.getElementById("healthBudget").textContent = "¥" + data.drinkBudget;
  document.getElementById("healthGoal").textContent = data.drinkGoal + "杯";
  document.getElementById("healthBudgetShow").textContent = "¥" + data.drinkBudget;
  // 本周记录
  var weekRecords = data.records.filter(function(r){ return inThisWeek(r.date); });
  var drinks = weekRecords.filter(function(r){ return r.type==="drink"; });
  var meals = weekRecords.filter(function(r){ return r.type==="meal"; });
  var drinkCups = drinks.length;
  var drinkSpent = drinks.reduce(function(s,r){ return s+Number(r.amount); },0);
  var remain = data.drinkBudget - drinkSpent;
  var over = Math.max(-remain, 0);
  document.getElementById("healthSpent").textContent = "¥" + drinkSpent.toFixed(0);
  document.getElementById("healthRemain").textContent = "¥" + Math.max(remain,0).toFixed(0);
  document.getElementById("healthOver").textContent = "¥" + over.toFixed(0);
  document.getElementById("healthRecordCount").textContent = weekRecords.length + " 条";
  // 环形进度条（已喝杯数/目标）
  var cupPct = data.drinkGoal > 0 ? Math.min(drinkCups/data.drinkGoal*100, 100) : 0;
  var hRing = document.getElementById("healthRing");
  if(hRing){
    var hColor = cupPct > 100 ? "#ff6b6b" : (cupPct > 70 ? "#ffa94d" : "var(--pink-deep)");
    hRing.style.background = "conic-gradient("+hColor+" "+cupPct.toFixed(1)+"%, rgba(255,255,255,.5) "+cupPct.toFixed(1)+"%)";
  }
  var hRingPct = document.getElementById("healthRingPct");
  if(hRingPct) hRingPct.textContent = drinkCups + "/" + data.drinkGoal;
  // 本周剩余天数
  var hlEl = document.getElementById("healthWeekLeft");
  if(hlEl){
    var dl = daysLeftInWeek();
    hlEl.textContent = dl > 0 ? "本周还剩"+dl+"天" : "本周最后一天";
  }
  // 饮品计数器
  var dg = document.getElementById("drinkGrid");
  dg.innerHTML = DRINKS.map(function(d){
    var weekCount = drinks.filter(function(r){ return r.category===d.name; }).length;
    return '<div class="qe-btn" onclick="quickDrink(\''+d.name+'\','+d.amount+')"><div class="qe-icon">'+d.icon+'</div><div class="qe-name">'+d.name+'</div><div class="qe-amount">¥'+d.amount+' · 本周'+weekCount+'杯</div></div>';
  }).join("");
  // 吃法标签
  var mg = document.getElementById("mealGrid");
  mg.innerHTML = MEALS.map(function(m){
    var weekCount = meals.filter(function(r){ return r.category===m.name; }).length;
    return '<div class="qe-btn" onclick="quickMeal(\''+m.name+'\')"><div class="qe-icon">'+m.icon+'</div><div class="qe-name">'+m.name+'</div><div class="qe-amount">¥'+m.amount+' · 本周'+weekCount+'次</div></div>';
  }).join("");
  // 记录列表（倒序）
  var el = document.getElementById("healthRecordList");
  if(weekRecords.length === 0){
    el.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px;font-size:13px">还没有记录，点上方按钮开始～</div>';
  } else {
    el.innerHTML = weekRecords.slice().reverse().map(function(r){
      var cat = (r.type==="drink"?DRINKS:MEALS).find(function(c){ return c.name===r.category; }) || {icon:"🍽️"};
      var amt = "¥"+r.amount;
      return '<div class="exp-item">'
        +'<div class="exp-icon">'+cat.icon+'</div>'
        +'<div class="exp-info"><div class="exp-cat">'+esc(r.category)+(r.note?' · '+esc(r.note):'')+'</div><div class="exp-date">'+r.date+' · '+(r.type==="drink"?"饮品":"吃法")+'</div></div>'
        +'<div class="exp-amount" onclick="editHealthAmount('+r.id+')">'+amt+'</div>'
        +'<div class="exp-del" onclick="delHealthRecord('+r.id+')">✕</div>'
        +'</div>';
    }).join("");
  }
  // 吃法占比
  var mealTotals = {};
  meals.forEach(function(r){ mealTotals[r.category]=(mealTotals[r.category]||0)+Number(r.amount); });
  var mealArr = Object.keys(mealTotals).map(function(k){ return {name:k, amount:mealTotals[k]}; }).sort(function(a,b){ return b.amount-a.amount; });
  var mb = document.getElementById("mealBars");
  if(mealArr.length === 0){
    mb.innerHTML = '<div style="text-align:center;color:var(--muted);padding:16px;font-size:12px">暂无数据</div>';
  } else {
    var totalMealAmt = meals.reduce(function(s,r){ return s+Number(r.amount); },0);
    mb.innerHTML = mealArr.map(function(c){
      var pct = totalMealAmt>0 ? (c.amount/totalMealAmt*100) : 0;
      var cat = MEALS.find(function(m){ return m.name===c.name; }) || {icon:"🍽️"};
      return '<div class="cat-bar-row"><div class="cat-bar-name">'+cat.icon+' '+c.name+'</div>'
        +'<div class="cat-bar-track"><div class="cat-bar-fill" style="width:'+pct.toFixed(1)+'%"></div></div>'
        +'<div class="cat-bar-amt">¥'+c.amount.toFixed(0)+' ('+pct.toFixed(0)+'%)</div></div>';
    }).join("");
  }
  renderHealthChat();
}

function quickDrink(cat, amount){
  var data = loadHealth();
  var today = new Date().toISOString().slice(0,10);
  var recId = Date.now();
  var note = prompt(cat+" 备注（可选，如：便利店/美式/大杯，不填直接点确定）：") || "";
  data.records.push({id:recId, type:"drink", category:cat, amount:amount, date:today, note:note});
  saveHealth(data); renderHealth();
  // 同步到存钱记账
  try{
    var money = loadMoney();
    money.records.push({id:recId, category:cat, amount:amount, date:today, impulse:!!IMPULSE_CATS[cat], note:note});
    saveMoney(money);
  }catch(e){ console.log("同步到记账失败:", e.message); }
}
function quickMeal(cat){
  var mealDef = MEALS.find(function(m){ return m.name===cat; }) || {amount:20};
  var amount = prompt(cat+" 金额（默认 ¥"+mealDef.amount+"，可修改）：", String(mealDef.amount));
  if(amount===null) return;
  if(isNaN(amount) || Number(amount)<=0) amount = mealDef.amount;
  var note = prompt(cat+" 备注（可选，如：三明治/黄焖鸡/公司楼下，不填直接点确定）：") || "";
  var data = loadHealth();
  var today = new Date().toISOString().slice(0,10);
  var recId = Date.now();
  data.records.push({id:recId, type:"meal", category:cat, amount:Number(amount), date:today, note:note});
  saveHealth(data); renderHealth();
  try{
    var money = loadMoney();
    money.records.push({id:recId, category:cat, amount:Number(amount), date:today, impulse:false, note:note});
    saveMoney(money);
  }catch(e){ console.log("同步到记账失败:", e.message); }
}
function addCustomMeal(){
  var type = prompt("记录类型（drink=饮品，meal=吃法）：");
  if(!type) return;
  var cat = prompt("类别（如：咖啡/奶茶/外卖轻食）：");
  if(!cat) return;
  var amount = 0;
  if(type==="drink"){
    amount = prompt("金额：");
    if(!amount || isNaN(amount)) return;
  }
  var note = prompt("备注（可选）：") || "";
  var data = loadHealth();
  var today = new Date().toISOString().slice(0,10);
  var recId = Date.now();
  data.records.push({id:recId, type:type, category:cat, amount:Number(amount), date:today, note:note});
  saveHealth(data); renderHealth();
  // 只要是饮食记录（drink或meal），都同步到记账台
  if(type==="drink" || type==="meal"){
    try{
      var money = loadMoney();
      money.records.push({id:recId, category:cat, amount:Number(amount), date:today, impulse:false, note:note});
      saveMoney(money);
    }catch(e){ console.log("同步到记账失败:", e.message); }
  }
}
function editHealthAmount(id){
  var data = loadHealth();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  var v = prompt("修改金额（当前 ¥"+r.amount+"）：");
  if(!v || isNaN(v)) return;
  r.amount = Number(v);
  saveHealth(data); renderHealth();
  // 同步修改记账金额
  try{
    var money = loadMoney();
    var mr = money.records.find(function(x){ return x.id===id; });
    if(mr){ mr.amount = Number(v); saveMoney(money); }
  }catch(e){ console.log("同步修改记账失败:", e.message); }
}
function delHealthRecord(id){
  if(!confirm("确定删除这条记录？（记账模块的对应记录也会同步删除）")) return;
  var data = loadHealth();
  data.records = data.records.filter(function(x){ return x.id!==id; });
  saveHealth(data); renderHealth();
  // 同步删除记账记录
  try{
    var money = loadMoney();
    money.records = money.records.filter(function(x){ return x.id!==id; });
    saveMoney(money);
  }catch(e){ console.log("同步删除记账失败:", e.message); }
}
function editHealthBudget(){
  var data = loadHealth();
  var v = prompt("每周饮品预算（当前 ¥"+data.drinkBudget+"）：");
  if(!v || isNaN(v)) return;
  data.drinkBudget = Number(v);
  saveHealth(data); renderHealth();
}
function editHealthGoal(){
  var data = loadHealth();
  var v = prompt("每周目标杯数（当前 "+data.drinkGoal+" 杯）：");
  if(!v || isNaN(v)) return;
  data.drinkGoal = Number(v);
  saveHealth(data); renderHealth();
}

/* AI说真话 */
function runHealthTruth(){
  var data = loadHealth();
  var weekRecords = data.records.filter(function(r){ return inThisWeek(r.date); });
  var drinks = weekRecords.filter(function(r){ return r.type==="drink"; });
  var drinkCups = drinks.length;
  var drinkSpent = drinks.reduce(function(s,r){ return s+Number(r.amount); },0);
  var box = document.getElementById("healthTruth");
  if(weekRecords.length === 0){
    box.textContent = "还没有记录，先记几笔我再帮你分析～";
    return;
  }
  var truths = [];
  if(drinkCups > data.drinkGoal){
    truths.push("⚠️ 本周已经喝了"+drinkCups+"杯，超过目标"+data.drinkGoal+"杯了！手又伸出去了吧？");
  } else if(drinkCups > data.drinkGoal*0.7){
    truths.push("本周已喝"+drinkCups+"/"+data.drinkGoal+"杯，快到目标了，后面几天悠着点。");
  } else {
    truths.push("本周喝了"+drinkCups+"杯，控制得不错，继续保持。");
  }
  if(drinkSpent > data.drinkBudget){
    truths.push("🚨 饮品已经花了¥"+drinkSpent.toFixed(0)+"，超预算¥"+(drinkSpent-data.drinkBudget).toFixed(0)+"！想想这些钱能买多少菜。");
  } else {
    truths.push("饮品花了¥"+drinkSpent.toFixed(0)+"/¥"+data.drinkBudget+"，还在预算内。");
  }
  // 最亏的一杯
  if(drinks.length > 0){
    var worst = drinks.reduce(function(a,b){ return Number(a.amount)>Number(b.amount)?a:b; });
    var yearly = worst.amount * 52;
    truths.push("💡 最贵的一杯是「"+worst.category+" ¥"+worst.amount+"」，每周少一杯，一年省¥"+yearly.toFixed(0)+"，差不多一顿火锅了。");
  }
  // 吃法建议
  var meals = weekRecords.filter(function(r){ return r.type==="meal"; });
  if(meals.length > 0){
    var heavy = meals.filter(function(r){ return r.category==="重油外卖" || r.category==="外食聚餐"; }).length;
    var heavyPct = meals.length>0 ? (heavy/meals.length*100) : 0;
    if(heavyPct > 50){
      truths.push("🍔 本周"+heavyPct.toFixed(0)+"%是重油/外食，肠胃和钱包都在抗议，试试自己做两顿？");
    }
  }
  box.innerHTML = truths.map(function(t){ return '<div style="margin-bottom:8px">'+t+'</div>'; }).join("");
}

/* AI饮食顾问对话 */
function renderHealthChat(){
  var data = loadHealth();
  var box = document.getElementById("healthChatMessages");
  if(!box) return;
  box.innerHTML = (data.chatHistory||[]).map(function(m){
    return '<div class="m-chat-msg '+m.role+'">'+esc(m.content).replace(/\n/g,"<br>")+'</div>';
  }).join("");
  setTimeout(function(){ box.scrollTop = box.scrollHeight; }, 50);
}
function getHealthContext(){
  var data = loadHealth();
  var weekRecords = data.records.filter(function(r){ return inThisWeek(r.date); });
  var drinks = weekRecords.filter(function(r){ return r.type==="drink"; });
  var meals = weekRecords.filter(function(r){ return r.type==="meal"; });
  var drinkSpent = drinks.reduce(function(s,r){ return s+Number(r.amount); },0);
  return "【本周饮食概览】饮品"+drinks.length+"杯，花了¥"+drinkSpent.toFixed(0)+"/预算¥"+data.drinkBudget+"，目标"+data.drinkGoal+"杯；吃饭"+meals.length+"次。";
}
function sendHealthChat(){
  var input = document.getElementById("healthChatInput");
  var msg = input.value.trim();
  if(!msg) return;
  var data = loadHealth();
  data.chatHistory = data.chatHistory || [];
  data.chatHistory.push({role:"user", content:msg});
  input.value = "";
  saveHealth(data);
  renderHealthChat();
  setTimeout(function(){
    var reply = generateHealthReply(msg, data);
    data.chatHistory.push({role:"ai", content:reply});
    saveHealth(data);
    renderHealthChat();
  }, 600);
}
function generateHealthReply(msg, data){
  var lower = msg.toLowerCase();
  if(lower.indexOf("超")>=0 || lower.indexOf("喝多")>=0){
    var weekRecords = data.records.filter(function(r){ return inThisWeek(r.date); });
    var drinks = weekRecords.filter(function(r){ return r.type==="drink"; });
    if(drinks.length > data.drinkGoal) return "是的，超了"+(drinks.length-data.drinkGoal)+"杯。建议：1. 把咖啡换成美式（便宜且低卡）；2. 奶茶改成每周固定1-2杯；3. 含糖饮料直接戒，那是纯糖+纯花钱。";
    return "还没超，喝了"+drinks.length+"/"+data.drinkGoal+"杯。但别得意，后面几天别报复性喝。";
  }
  if(lower.indexOf("省")>=0 || lower.indexOf("省钱")>=0){
    return "省钱建议：1. 咖啡从每天1杯减到每周3杯，一年省¥2000+；2. 奶茶自己做，成本¥3 vs 外面¥15；3. 含糖饮料直接不买，那是智商税。先从最容易的一项开始。";
  }
  if(lower.indexOf("健康")>=0 || lower.indexOf("胖")>=0){
    return "健康建议：1. 奶茶选三分糖或无糖，一杯少50大卡；2. 重油外卖每周不超过2次；3. 自己做饭时多放蔬菜少放油。不用一步到位，先改一个习惯。";
  }
  var weekRecords = data.records.filter(function(r){ return inThisWeek(r.date); });
  if(weekRecords.length===0) return "还没有记录，先点上方按钮记几笔，我再帮你分析。记录的意义不是惩罚自己，是让你看清自己实际怎么吃的。";
  return getHealthContext() + " 你可以问我：喝超了吗？怎么省钱？怎么吃更健康？或者直接说你的困惑，我帮你出主意。说人话，不绕弯。";
}


/* ========== 决策顾问模块 ========== */
var DECISION_KEY = "weh_decision_data_v1";
var DECISION_DEFAULTS = {identity:"上班族", stage:"起步摸索期", depth:3, chatHistory:[], score:null, round:0, started:false};

function loadDecision(){
  try{
    var d = JSON.parse(localStorage.getItem(DECISION_KEY));
    if(!d) return JSON.parse(JSON.stringify(DECISION_DEFAULTS));
    for(var k in DECISION_DEFAULTS){ if(d[k]===undefined) d[k]=DECISION_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(DECISION_DEFAULTS)); }
}
function saveDecision(data){ localStorage.setItem(DECISION_KEY, JSON.stringify(data)); }

function initDecision(){
  var data = loadDecision();
  document.getElementById("decIdentity").value = data.identity;
  document.getElementById("decStage").value = data.stage;
  document.getElementById("decDepth").value = String(data.depth);
  renderDecisionChat();
  if(data.score){
    showDecisionScore(data.score);
  }
  updateRoundInfo();
}

function saveDecisionSettings(){
  var data = loadDecision();
  data.identity = document.getElementById("decIdentity").value;
  data.stage = document.getElementById("decStage").value;
  data.depth = Number(document.getElementById("decDepth").value);
  saveDecision(data);
  alert("设置已保存："+data.identity+" · "+data.stage+" · "+data.depth+"轮拷问");
}

function updateRoundInfo(){
  var data = loadDecision();
  var el = document.getElementById("decRoundInfo");
  if(el){
    if(!data.started){
      el.textContent = "还没开始";
    } else if(data.score){
      el.textContent = "拷问完成 · "+data.score.score+"/10分";
    } else {
      el.textContent = "第 "+(data.round+1)+"/"+data.depth+" 轮";
    }
  }
}

function renderDecisionChat(){
  var data = loadDecision();
  var box = document.getElementById("decChatMessages");
  if(!box) return;
  if((data.chatHistory||[]).length === 0){
    box.innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px 20px;font-size:13px;line-height:1.8">把你的方案、想法或决定丢进来<br>我会结合你的身份（'+data.identity+' · '+data.stage+'）往死里挑<br><span style="color:#e05050;font-weight:700">低于7分让你重做，不许客气</span></div>';
  } else {
    box.innerHTML = data.chatHistory.map(function(m){
      var content = esc(m.content).replace(/\n/g,"<br>");
      if(m.role==="ai" && m.question){
        content += '<span class="ai-question">💥 '+esc(m.question)+'</span>';
      }
      return '<div class="dec-chat-msg '+m.role+'">'+content+'</div>';
    }).join("");
  }
  setTimeout(function(){ box.scrollTop = box.scrollHeight; }, 50);
}

function sendDecisionChat(){
  var input = document.getElementById("decChatInput");
  var msg = input.value.trim();
  if(!msg) return;
  var data = loadDecision();
  data.chatHistory = data.chatHistory || [];
  data.started = true;
  data.chatHistory.push({role:"user", content:msg});
  input.value = "";
  saveDecision(data);
  renderDecisionChat();
  updateRoundInfo();

  setTimeout(function(){
    var result = generateDecisionResponse(msg, data);
    data.chatHistory.push({role:"ai", content:result.content, question:result.question||null});
    data.round += 1;
    // 达到拷问轮数，打分
    if(data.round >= data.depth && !data.score){
      var score = generateDecisionScore(data);
      data.score = score;
      setTimeout(function(){
        data.chatHistory.push({role:"ai", content:"拷问结束，我给你打分。"});
        saveDecision(data);
        renderDecisionChat();
        showDecisionScore(score);
        updateRoundInfo();
      }, 800);
    }
    saveDecision(data);
    renderDecisionChat();
    updateRoundInfo();
  }, 700);
}

function generateDecisionResponse(msg, data){
  var round = data.round;
  var identity = data.identity;
  var responses = [
    {
      content: "作为一个"+identity+"，你这个方案的第一反应是：听起来不错，但我要问你——你凭什么觉得这个能成？你做过最坏情况的推演吗？",
      question: "如果一切都往最坏的方向走，你能承受的底线是什么？"
    },
    {
      content: "好，你回答了底线问题。但我注意到你刚才的回答里有个漏洞——你把希望寄托在了一个你控制不了的变量上。这叫乐观偏差。",
      question: "你方案里哪个环节是你完全控制不了的？如果那个环节掉链子，你的Plan B是什么？"
    },
    {
      content: "Plan B？你确定那不是Plan A的换皮？很多人的Plan B只是把同样的错误换个方式再犯一遍。还有，你为这个方案投入了多少？投入越多，越容易陷入沉没成本。",
      question: "老实说，你现在是不是已经投入了太多（时间/钱/面子），所以哪怕知道有问题也不想放弃？"
    },
    {
      content: "你看，你犹豫了。这就是自我感动——你觉得自己努力了这么久不能白费，但努力的方向错了，越努力亏得越多。我再问你一个更扎心的。",
      question: "如果今天是你朋友拿着跟你一模一样的方案来问你，你会真心建议他做吗？还是会劝他再想想？"
    },
    {
      content: "你看，你对朋友诚实，对自己宽容。这就是决策最大的敌人——对自己 double standard。好了，拷问差不多了，我给你打个分。",
      question: null
    },
  ];
  var idx = Math.min(round, responses.length-1);
  return responses[idx];
}

function generateDecisionScore(data){
  // 根据对话轮数和用户回答的"质量"模拟打分
  // 纯前端模拟，分数在4-8之间波动
  var base = 5;
  var history = data.chatHistory || [];
  var userMsgs = history.filter(function(m){ return m.role==="user"; });
  // 用户回答越长，分数略高（说明认真想了）
  var avgLen = userMsgs.reduce(function(s,m){ return s+m.content.length; },0) / Math.max(userMsgs.length,1);
  var lenBonus = Math.min(avgLen/50, 2);
  // 随机波动
  var random = (Math.random()*2 - 1);
  var score = Math.round(Math.min(Math.max(base + lenBonus + random, 3), 9));
  var fatal, fix, pass;
  if(score >= 7){
    pass = true;
    fatal = "没有致命伤，但有优化空间";
    fix = "方向是对的，把拷问中暴露的薄弱环节补强，然后小步快跑验证";
  } else if(score >= 5){
    pass = false;
    fatal = "有明显漏洞，风险大于收益";
    fix = "先别急着all in，把拷问中提到的Plan B、最坏情况、控制不了的变量这三件事想清楚，再决定";
  } else {
    pass = false;
    fatal = "方向可能就错了，现在停手比继续亏好";
    fix = "建议彻底重新评估，或者换一个方向。沉没成本不是成本，及时止损也是一种能力";
  }
  return {score:score, fatal:fatal, fix:fix, pass:pass};
}

function showDecisionScore(score){
  var card = document.getElementById("decScoreCard");
  if(!card) return;
  card.style.display = "block";
  document.getElementById("decScoreNum").textContent = score.score;
  document.getElementById("decFatal").textContent = score.fatal;
  document.getElementById("decFix").textContent = score.fix;
  var verdict = document.getElementById("decVerdict");
  if(score.pass){
    verdict.textContent = "✅ 通过，可以做，但要注意风险";
    verdict.className = "dec-score-verdict pass";
  } else {
    verdict.textContent = "❌ 不通过，建议重做或重新评估";
    verdict.className = "dec-score-verdict fail";
  }
  // 环形进度条
  var ring = document.getElementById("decScoreRing");
  if(ring){
    var pct = score.score * 10;
    var color = score.score >= 7 ? "#2d8a5e" : (score.score >= 5 ? "#ffa94d" : "#e05050");
    ring.style.background = "conic-gradient("+color+" "+pct+"%, rgba(255,255,255,.5) "+pct+"%)";
  }
}

function resetDecision(){
  if(!confirm("确定重新开始？当前拷问记录会清空。")) return;
  var data = loadDecision();
  data.chatHistory = [];
  data.score = null;
  data.round = 0;
  data.started = false;
  saveDecision(data);
  document.getElementById("decScoreCard").style.display = "none";
  renderDecisionChat();
  updateRoundInfo();
}

/* ---------- 全局搜索 ---------- */
function plainText(html){
  var d = document.createElement("div"); d.innerHTML = html || ""; return (d.textContent||"").replace(/\s+/g," ").trim();
}
var GSEARCH_IDX = null, gsList = [];
function buildSearchIndex(){
  var idx = [];
  JOBS.forEach(function(j){
    idx.push({type:"岗位", icon:"🐾", title: j.company+" · "+j.pos, sub: (j.city+" ｜ "+j.statusTxt+" ｜ 分"+j.score),
      keys: (j.company+j.pos+j.city).toLowerCase(),
      open: function(){ closeModal(); go("jobs"); openJob(JOBS.indexOf(j)); }});
  });
  var allRes = (RESUMES.general||[]).slice();
  (RESUMES.custom||[]).forEach(function(cg){ allRes = allRes.concat(cg.items); });
  allRes.forEach(function(r){
    idx.push({type:"简历", icon:"📄", title: r.name, sub: r.desc||"", keys: (r.name+(r.desc||"")).toLowerCase(),
      open: function(){ closeModal(); go("resume"); }});
  });
  COMPS.forEach(function(g){ g.groups.forEach(function(c){
    (c.name||"").split(/[、，,]/).forEach(function(nm){ nm=nm.trim(); if(!nm) return;
      idx.push({type:"公司", icon:"🐈", title: nm, sub: g.title+" ｜ "+c.cat, keys: (nm+g.title+c.cat).toLowerCase(),
        open: function(){ closeModal(); go("companies"); }});
    });
  });});
  KBS.forEach(function(k){
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
      (function walk(ns){ ns.forEach(function(n){
        if(n.children){ walk(n.children); }
        else {
          var txt = plainText(n.html);
          idx.push({type:"笔记", icon:n.icon||"📄", title:n.title, sub: txt.slice(0,60), keys: (n.title+" "+txt).toLowerCase(),
            open: function(){ closeModal(); go("knowledge"); }});
        }
      }); })(g.notes||[]);
    });
  });
  return idx;
}
function openGlobalSearch(){
  if(!GSEARCH_IDX) GSEARCH_IDX = buildSearchIndex();
  setModal('<h2>🔍 全局搜索</h2><div class="m-sub">搜岗位 / 笔记 / 公司 / 简历，全部知识库内容</div>'
    + '<div class="search" style="margin-bottom:12px"><span>🔍</span><input id="gsInput" placeholder="输入关键词，如：供应链 / 济南 / 比亚迪…" autofocus></div>'
    + '<div id="gsResults"></div>');
  var inp = document.getElementById("gsInput");
  function doSearch(){
    var q = (inp.value||"").toLowerCase();
    gsList = q ? GSEARCH_IDX.filter(function(x){ return x.keys.indexOf(q) >= 0; }) : [];
    var html = gsList.slice(0,30).map(function(x,i){
      return '<div class="note-item" onclick="gsOpen('+i+')"><span class="ni-ic">'+x.icon+'</span><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13.5px">'+esc(x.title)+'</div><div style="font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(x.sub)+'</div></div><span style="font-size:11px;color:var(--pink-deep);background:var(--pink-soft);padding:2px 8px;border-radius:20px;flex-shrink:0">'+x.type+'</span></div>';
    }).join("");
    document.getElementById("gsResults").innerHTML = q ? (html || '<div style="text-align:center;color:var(--muted);padding:20px">🐾 没有找到相关结果</div>') : '<div style="text-align:center;color:var(--muted);padding:20px">输入关键词开始搜索～</div>';
  }
  inp.addEventListener("input", doSearch);
  inp.addEventListener("keydown", function(e){ if(e.key==="Enter") doSearch(); });
  setTimeout(function(){ inp.focus(); }, 100);
  doSearch();
}
function gsOpen(i){
  var x = gsList[i];
  if(x && x.open) x.open();
}

/* ---------- 头像 & 背景 ---------- */
var BG_IMGS = IMGS.bg||{}, AV_IMGS = IMGS.av||{};
var savedBg = Object.keys(BG_IMGS)[0]||"img4", savedAv = Object.keys(AV_IMGS)[0]||"img1";
try{ savedBg = localStorage.getItem("atelier_bg")||localStorage.getItem("scm_bg") || Object.keys(BG_IMGS)[0] || "img4"; savedAv = localStorage.getItem("atelier_av")||localStorage.getItem("scm_av") || Object.keys(AV_IMGS)[0] || "img1"; }catch(e){}
/* ===== 🎨 根据预计算主色相应用主题（颜色在 build_site.py 构建时提取，无CORS问题） ===== */
function hsl(h,s,l){return "hsl("+Math.round(h)+","+Math.round(s*100)+"%,"+Math.round(l*100)+"%)";}
function hsla(h,s,l,a){return "hsla("+Math.round(h)+","+Math.round(s*100)+"%,"+Math.round(l*100)+"%,"+a+")";}
function applyThemeByHue(H,H2){
  if(H==null) return;
  if(H2==null) H2=(H+38)%360;
  var root=document.documentElement.style;
  root.setProperty("--pink",hsl(H,0.66,0.66));
  root.setProperty("--pink-deep",hsl(H,0.62,0.55));
  root.setProperty("--pink-soft",hsl(H,0.62,0.93));
  root.setProperty("--lav",hsl(H2,0.6,0.7));
  root.setProperty("--lav-soft",hsl(H2,0.55,0.94));
  root.setProperty("--grad-from",hsl(H,0.72,0.7));
  root.setProperty("--grad-to",hsl(H2,0.68,0.72));
  root.setProperty("--grad-shadow",hsla(H,0.7,0.6,0.35));
  root.setProperty("--grad-ring",hsl(H,0.6,0.88));
  root.setProperty("--line",hsl(H,0.5,0.88));
  root.setProperty("--shadow","0 8px 24px "+hsla(H,0.65,0.55,0.14));
  root.setProperty("--shadow-sm","0 4px 14px "+hsla(H,0.65,0.55,0.1));
  root.setProperty("--text",hsl(H,0.28,0.34));
  root.setProperty("--muted",hsl(H,0.18,0.58));
  // 卡片/侧栏：半透明毛玻璃，透出背景图
  root.setProperty("--card-bg",hsla(H,0.4,0.99,0.58));
  root.setProperty("--topbar-bg",hsla(H,0.45,0.98,0.48));
  root.setProperty("--nav-bg",hsla(H,0.45,0.99,0.62));
  // 整体柔光层（很淡，让背景图透出来）
  root.setProperty("--veil-top",hsla(H,0.5,0.97,0.28));
  root.setProperty("--veil-bot",hsla(H,0.5,0.97,0.38));
  // 4个统计卡：全部基于主色/辅助色的深浅，最和谐不跳色
  root.setProperty("--stat1a",hsla(H,0.68,0.91,0.6));   root.setProperty("--stat1b",hsla(H,0.68,0.84,0.6));
  root.setProperty("--stat2a",hsla(H,0.5,0.94,0.6));    root.setProperty("--stat2b",hsla(H,0.5,0.88,0.6));
  root.setProperty("--stat3a",hsla(H2,0.62,0.92,0.6));  root.setProperty("--stat3b",hsla(H2,0.62,0.85,0.6));
  root.setProperty("--stat4a",hsla(H2,0.45,0.95,0.6));  root.setProperty("--stat4b",hsla(H2,0.45,0.89,0.6));
  console.log("🎨 主题已跟随背景图，主色相:",Math.round(H),"辅助:",Math.round(H2));
}
function applyBg(){
  var url=BG_IMGS[savedBg];
  document.documentElement.style.setProperty("--bg-img", "url('"+url+"')");
  var mobiles=(IMGS&&IMGS.bgMobile)||{};
  var m=mobiles[savedBg]||url;  // 没配竖屏图就用横屏图cover自适应
  document.documentElement.style.setProperty("--bg-img-mobile", "url('"+m+"')");
  var themes=(IMGS&&IMGS.theme)||{};
  var th=themes[savedBg];
  if(th) applyThemeByHue(th.h, th.h2);
}
function applyAv(){ var a=document.getElementById("avatarImg"); if(a) a.src = AV_IMGS[savedAv]; }
function pickHtml(type, imgs, cur){
  var h = '<div class="pick-grid">';
  Object.keys(imgs).forEach(function(k){
    h += '<div class="pick-item '+(type==="Av"?"av":"")+(k===cur?" active":"")+'" onclick="set'+type+'(\''+k+'\')">'
       + '<img src="'+imgs[k]+'" alt=""><div class="pn">图'+(String(k).replace(/\D/g,"")||"")+'</div></div>';
  });
  return h + '</div>';
}
function openPersonalize(){
  setModal('<h2>🐱 换个风格</h2><div class="m-sub">点下面的图片，实时换背景和头像，你的选择会被记住；换左上角Logo请直接点它</div>'
    + '<div class="pick-sec"><div class="m-sec">🖼️ 背景图</div><div class="pick-hint">选一张做整站背景（会自动提取主色调）</div>'+pickHtml("Bg", BG_IMGS, savedBg)+'</div>'
    + '<div class="pick-sec"><div class="m-sec">😺 小头像</div><div class="pick-hint">右上角头像，点它随时能换</div>'+pickHtml("Av", AV_IMGS, savedAv)+'</div>');
}
function setBg(k){ savedBg=k; try{localStorage.setItem("atelier_bg",k);}catch(e){} applyBg(); openPersonalize(); }
function setAv(k){ savedAv=k; try{localStorage.setItem("atelier_av",k);}catch(e){} applyAv(); openPersonalize(); }

/* ---------- 应用图标可选 ---------- */
var APP_ICONS = (SITE_DATA && SITE_DATA.appIcons) || [];
var savedIcon = "star";
try{ savedIcon = localStorage.getItem("atelier_icon") || "star"; }catch(e){}
function findIcon(k){ for(var i=0;i<APP_ICONS.length;i++){ if(APP_ICONS[i].key===k) return APP_ICONS[i]; } return APP_ICONS[0]; }
function iconPickHtml(cur, type){
  var h='<div class="pick-grid">';
  APP_ICONS.forEach(function(it){
    var isPhoto=!it.emoji;
    if(type==="symbol"&&isPhoto) return;
    if(type==="photo"&&!isPhoto) return;
    h+='<div class="pick-item '+(it.key===cur?" active":"")+'" onclick="setIcon(\''+it.key+'\')">'
      +'<img src="'+it.i192+'" alt=""><div class="pn">'+it.name+'</div></div>';
  });
  return h+'</div>';
}
function openIconPicker(){
  setModal('<h2>🎨 选择应用图标</h2><div class="m-sub">点选即可更换左上角Logo、浏览器标签图标；手机桌面需重新"添加到主屏幕"</div>'
    +'<div class="pick-sec"><div class="m-sec">✨ 符号图标</div>'+iconPickHtml(savedIcon,"symbol")+'</div>'
    +'<div class="pick-sec"><div class="m-sec">📷 照片图标</div>'+iconPickHtml(savedIcon,"photo")+'</div>');
}
function applyManifest(icon){
  try{
    var mani={name:"Weh Atelier",short_name:"Atelier",description:"Weh Atelier · 文雪的AI个人工作室",
      start_url:"./",scope:"./",display:"standalone",orientation:"portrait",
      background_color:"#fff7fa",theme_color:"#ffd0e2",
      icons:[{src:icon.i192,sizes:"192x192",type:"image/png"},{src:icon.i512,sizes:"512x512",type:"image/png"}]};
    var url=URL.createObjectURL(new Blob([JSON.stringify(mani)],{type:"application/manifest+json"}));
    var link=document.querySelector('link[rel="manifest"]');
    if(link) link.href=url;
  }catch(e){ console.log("manifest切换失败:",e.message); }
}
function applyIcon(){
  var it=findIcon(savedIcon); if(!it) return;
  var fav=document.querySelector('link[rel="icon"]');
  if(fav) fav.href=it.i192;
  var at=document.querySelector('link[rel="apple-touch-icon"]');
  if(!at){ at=document.createElement("link"); at.rel="apple-touch-icon"; document.head.appendChild(at); }
  at.href=it.i192;
  var lg=document.getElementById("logoIcon");
  if(lg){
    if(it.emoji){ lg.innerHTML=it.emoji; lg.classList.remove("photo"); }
    else { lg.innerHTML='<img src="'+it.i192+'" alt="">'; lg.classList.add("photo"); }
  }
  applyManifest(it);
}
function setIcon(k){
  savedIcon=k;
  try{ localStorage.setItem("atelier_icon",k); }catch(e){}
  applyIcon(); openIconPicker();
}

/* ---------- 页面切换 ---------- */
var TITLES = {
  home:"🏠 首页总览", money:"💰 存钱记账", health:"🍱 吃饭健康",
  inspiration:"💡 灵感捕捉", decision:"🎯 决策顾问", baichuan:"📚 百川智库",
  career:"💼 求职小窝", cet6:"📖 六级学习", sop:"🛠️ 工作SOP",
  todo:"✅ 待办清单", settings:"⚙️ 设置",
  jobs:"🐾 岗位看板", companies:"🐈 目标公司池", timeline:"😺 每日日报",
  resume:"📄 简历库", knowledge:"📚 知识库"
};
function go(view){
  var newModule = document.getElementById("module-"+view);
  var oldView = document.getElementById("view-"+view);
  if(newModule || oldView){
    document.querySelectorAll(".view").forEach(function(v){ v.classList.remove("active"); });
    if(newModule) newModule.classList.add("active");
    else if(oldView) oldView.classList.add("active");
  }
  document.querySelectorAll(".nav-item,.bn-item").forEach(function(n){
    var attr = n.getAttribute("data-module") || n.getAttribute("data-go");
    n.classList.toggle("active", attr===view);
  });
  var titleEl = document.getElementById("pageTitle");
  if(titleEl) titleEl.textContent = TITLES[view] || view;
  window.scrollTo({top:0});
}
document.addEventListener("click", function(e){
  var t = e.target.closest("[data-module],[data-go]");
  if(t){
    var module = t.getAttribute("data-module");
    var page = t.getAttribute("data-go");
    go(module || page);
  }
});
document.querySelectorAll(".chip").forEach(function(c){
  c.addEventListener("click", function(){
    document.querySelectorAll(".chip").forEach(function(x){ x.classList.remove("active"); });
    c.classList.add("active");
    curFilter = c.getAttribute("data-f");
    renderJobs();
  });
});
var _searchInp=document.getElementById("search");
if(_searchInp){ _searchInp.addEventListener("input", function(e){ curQuery=e.target.value; renderJobs(); }); }
document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeModal(); });

/* ---------- 漂浮小元素 ---------- */
(function(){
  var emojis=["🐱","🐾","🐈","🧶","🐟","😺","🌸"];
  function spawn(){
    var s=document.createElement("span");
    s.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    s.style.left=(Math.random()*96)+"vw";
    s.style.fontSize=(12+Math.random()*15)+"px";
    s.style.animationDuration=(7+Math.random()*7)+"s";
    document.getElementById("floats").appendChild(s);
    setTimeout(function(){s.remove()},16000);
  }
  spawn();spawn();
  setInterval(spawn,1500);
})();

/* ---------- 初始化 ---------- */
(function(){
  var upd = document.getElementById("syncText");
  if(upd && D.updated) upd.textContent = "自动同步 · " + D.updated;
  // 求职相关渲染（只有页面上有对应元素时才执行）
  try{
    var hasCareer = document.getElementById("kbGrid") || document.getElementById("statJobs");
    if(hasCareer){
      flattenKb(); renderKb();
    }
    if(document.getElementById("bcKbGrid")){
      flattenKb(); renderBcKb();
    }
    if(document.getElementById("cet6KbGrid")){
      flattenKb(); renderGenericKb("cet6KbGrid", CET6KBS, {_total:"cet6KbCount","词汇":"cet6WordCount","错题":"cet6ErrorCount","学习资料":"cet6MatCount"});
    }
    if(document.getElementById("sopKbGrid")){
      flattenKb(); renderGenericKb("sopKbGrid", SOPKBS, {_total:"sopKbCount","工作流程":"sopFlowCount","岗位知识":"sopKnowCount","错题":"sopErrorCount"});
    }
    if(document.getElementById("moneyRemain")){
      renderMoney();
    }
    if(document.getElementById("healthSpent")){
      renderHealth();
    }
    if(document.getElementById("decChatMessages")){
      initDecision();
      // 更新统计数字
      var kbTotal = 0;
      KBS.forEach(function(k){ (k.groups||[{notes:k.notes||[]}]).forEach(function(g){ (function walk(ns){ ns.forEach(function(n){ kbTotal += n.children ? (function(){var c=0;(function w2(x){x.forEach(function(z){c+=z.children?w2(z.children):1});return c;})(n.children)})() : 1; }); })(g.notes||[]); }); });
      if(document.getElementById("kbCount")) document.getElementById("kbCount").textContent = kbTotal;
      if(document.getElementById("jobCount")) document.getElementById("jobCount").textContent = (JOBS||[]).length;
      var resTotal = (RESUMES.general||[]).length;
      (RESUMES.custom||[]).forEach(function(c){ resTotal += (c.items||[]).length; });
      if(document.getElementById("resumeCount")) document.getElementById("resumeCount").textContent = resTotal;
      var compTotal = 0;
      (COMPS||[]).forEach(function(g){ (g.groups||[]).forEach(function(c){ compTotal += ((c.name||"").split(/[、，,]/).filter(function(x){return x.trim()}).length); }); });
      if(document.getElementById("companyCount")) document.getElementById("companyCount").textContent = compTotal;
      // 旧版求职首页的渲染
      if(document.getElementById("statJobs")){
        renderHome(); renderJobs(); renderCompanies(); renderTimeline(); renderResumes();
      }
    }
  }catch(e){ console.log("求职模块渲染跳过:", e.message); }
  applyBg(); applyAv(); applyIcon();
})();