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

/* ===== 通用输入/确认弹窗（替代原生 prompt/confirm，Electron 兼容） ===== */
var _promptResolve=null, _promptIsConfirm=false;
function showPrompt(opts){
  opts = opts || {};
  var fields = (opts.fields && opts.fields.length) ? opts.fields : [{label:"", value:"", placeholder:""}];
  _promptIsConfirm = false;
  document.getElementById("wehPromptTitle").textContent = opts.title || "请输入";
  document.getElementById("wehPromptMsg").style.display = "none";
  var fieldsEl = document.getElementById("wehPromptFields");
  fieldsEl.innerHTML = fields.map(function(f,i){
    return '<div class="prompt-field"><label>'+(f.label||"")+'</label>'
      +'<input type="'+(f.type||"text")+'" id="wehPromptInput'+i+'" value="'+esc(f.value||"")+'" placeholder="'+esc(f.placeholder||"")+'"></div>';
  }).join("");
  document.getElementById("wehPromptOk").textContent = opts.okText || "确定";
  openWehPrompt();
  var first = document.getElementById("wehPromptInput0");
  if(first) setTimeout(function(){ first.focus(); first.select(); }, 60);
  return new Promise(function(resolve){ _promptResolve = resolve; });
}
function showConfirm(msg, opts){
  opts = opts || {};
  _promptIsConfirm = true;
  document.getElementById("wehPromptTitle").textContent = opts.title || "确认";
  document.getElementById("wehPromptFields").innerHTML = "";
  var msgEl = document.getElementById("wehPromptMsg");
  msgEl.style.display = "block";
  msgEl.textContent = msg;
  document.getElementById("wehPromptOk").textContent = opts.okText || "确定";
  openWehPrompt();
  return new Promise(function(resolve){ _promptResolve = resolve; });
}
function openWehPrompt(){
  var m = document.getElementById("wehPromptModal");
  m.style.display = "flex";
  setTimeout(function(){ m.classList.add("show"); }, 10);
}
function hideWehPrompt(){
  var m = document.getElementById("wehPromptModal");
  m.classList.remove("show");
  setTimeout(function(){ m.style.display = "none"; }, 150);
}
function submitWehPrompt(){
  if(!_promptResolve) return;
  var resolve = _promptResolve; _promptResolve = null;
  if(_promptIsConfirm){ hideWehPrompt(); resolve(true); return; }
  var inputs = document.getElementById("wehPromptFields").querySelectorAll("input");
  var vals = [];
  for(var i=0;i<inputs.length;i++){ vals.push(inputs[i].value); }
  hideWehPrompt();
  resolve(vals);
}
function cancelWehPrompt(){
  if(!_promptResolve) return;
  var resolve = _promptResolve; _promptResolve = null;
  hideWehPrompt();
  resolve(null);
}
document.addEventListener("keydown", function(e){
  var m = document.getElementById("wehPromptModal");
  if(m && m.style.display === "flex"){
    if(e.key === "Enter"){ e.preventDefault(); submitWehPrompt(); }
    else if(e.key === "Escape"){ cancelWehPrompt(); }
  }
});

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
  var allKbs = [].concat(KBS, BCKBS, CET6KBS, SOPKBS);
  allKbs.forEach(function(k){
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
function saveMoney(data){ markLocalChange(); localStorage.setItem(MONEY_KEY, JSON.stringify(data)); }

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
  var spent = cycleRecords.reduce(function(s,r){ return s + (Number(r.amount) || 0); }, 0);
  var impulse = cycleRecords.filter(function(r){ return r.impulse; }).reduce(function(s,r){ return s + (Number(r.amount) || 0); }, 0);
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
      var daySpent = data.records.filter(function(r){ return r.date===ds; }).reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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
    el.innerHTML = cycleRecords.slice().sort(sortByDateTime).map(function(r){
      var cat = QUICK_CATEGORIES.find(function(c){ return c.name===r.category; }) || {icon:"💰"};
      var impCls = r.impulse ? "" : " off";
      var impTxt = r.impulse ? "⚠️冲动" : "普通";
      return '<div class="exp-item">'
        +'<div class="exp-icon">'+cat.icon+'</div>'
        +'<div class="exp-info"><div class="exp-cat">'+esc(r.category)+(r.note?' · '+esc(r.note):'')+'</div><div class="exp-date">'+r.date+' '+(r.time||"")+'</div></div>'
        +'<div class="exp-amount" onclick="editExpAmount('+r.id+')">¥'+r.amount+'</div>'
        +'<div class="exp-impulse'+impCls+'" onclick="toggleImpulse('+r.id+')">'+impTxt+'</div>'
        +'<div class="exp-del" onclick="delExpense('+r.id+')">✕</div>'
        +'</div>';
    }).join("");
  }
  // 类别占比
  var catTotals = {};
  cycleRecords.forEach(function(r){ catTotals[r.category] = (catTotals[r.category]||0) + (Number(r.amount) || 0); });
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

async function quickExpense(cat, amount){
  var vals = await showPrompt({
    title: cat+" 记一笔",
    fields: [
      {label:"日期时间", value:nowDateTime(), placeholder:"YYYY-MM-DD HH:MM"},
      {label:"备注", value:"", placeholder:"如：午餐/公司楼下/和朋友"}
    ]
  });
  if(!vals) return;
  var dt = parseDateTime(vals[0] || nowDateTime());
  var note = vals[1] || "";
  var data = loadMoney();
  var id = Date.now();
  data.records.push({id:id, category:cat, amount:amount, date:dt.date, time:dt.time, impulse:!!IMPULSE_CATS[cat], note:note});
  saveMoney(data);
  renderMoney();
  toast(cat+" ¥"+amount+" 已记入");
  if(isHealthCategory(cat)){
    try{
      var health = loadHealth();
      if(!health.records.find(function(r){ return r.id===id; })){
        health.records.push({id:id, type:getHealthType(cat), category:cat, amount:amount, date:dt.date, time:dt.time, note:note});
        saveHealth(health);
      }
    }catch(e){ console.log("同步到饮食台失败:", e.message); }
  }
}
async function addCustomExpense(){
  var vals = await showPrompt({
    title: "记一笔自定义消费",
    fields: [
      {label:"消费类别", value:"", placeholder:"如：打车/奶茶/其他"},
      {label:"金额", value:"", placeholder:"数字，如 25"},
      {label:"日期时间", value:nowDateTime(), placeholder:"YYYY-MM-DD HH:MM"},
      {label:"备注", value:"", placeholder:"可选"}
    ]
  });
  if(!vals) return;
  var cat = (vals[0]||"").trim();
  if(!cat) return;
  var amount = Number(vals[1]);
  if(!vals[1] || isNaN(amount)) return;
  var dt = parseDateTime(vals[2] || nowDateTime());
  var note = vals[3] || "";
  var data = loadMoney();
  var id = Date.now();
  data.records.push({id:id, category:cat, amount:amount, date:dt.date, time:dt.time, impulse:false, note:note});
  saveMoney(data);
  renderMoney();
  toast(cat+" ¥"+amount+" 已记入");
  if(isHealthCategory(cat)){
    try{
      var health = loadHealth();
      if(!health.records.find(function(r){ return r.id===id; })){
        health.records.push({id:id, type:getHealthType(cat), category:cat, amount:amount, date:dt.date, time:dt.time, note:note});
        saveHealth(health);
      }
    }catch(e){ console.log("同步到饮食台失败:", e.message); }
  }
}
async function editExpAmount(id){
  var data = loadMoney();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  var vals = await showPrompt({
    title: "修改金额",
    fields: [{label:"金额", value:String(r.amount), placeholder:"数字"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  var newAmt = Number(vals[0]);
  r.amount = newAmt;
  saveMoney(data);
  renderMoney();
  if(isHealthCategory(r.category)){
    try{
      var health = loadHealth();
      var hr = health.records.find(function(x){ return x.id===id; });
      if(hr){ hr.amount = newAmt; saveHealth(health); }
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
  showConfirm("确定删除这笔记录？（饮食台的对应记录也会同步删除）").then(function(ok){
    if(!ok) return;
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
  });
}
async function editMoneyBudget(){
  var data = loadMoney();
  var vals = await showPrompt({
    title: "修改本月预算",
    fields: [{label:"预算金额", value:String(data.budget), placeholder:"数字"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  data.budget = Number(vals[0]);
  saveMoney(data); renderMoney();
}
async function editMoneyFixedSave(){
  var data = loadMoney();
  var vals = await showPrompt({
    title: "修改固定存款",
    fields: [{label:"固定存款", value:String(data.fixedSave), placeholder:"数字"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  data.fixedSave = Number(vals[0]);
  saveMoney(data); renderMoney();
}
async function editMoneyCycleStart(){
  var data = loadMoney();
  var vals = await showPrompt({
    title: "修改账单日",
    fields: [{label:"账单日（1-28号）", value:String(data.cycleStart), placeholder:"如 20"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  var v = Number(vals[0]);
  if(v<1 || v>28) return;
  data.cycleStart = v;
  saveMoney(data); renderMoney();
}

/* AI说真话（基于数据生成） */
function runMoneyTruth(){
  var data = loadMoney();
  var cycleRecords = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart); });
  var spent = cycleRecords.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
  var impulse = cycleRecords.filter(function(r){ return r.impulse; });
  var impulseAmt = impulse.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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
  var spent = cycleRecords.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
  var remain = data.budget - data.fixedSave - spent;
  var daysLeft = daysLeftInCycle(data.cycleStart);
  var catTotals = {};
  cycleRecords.forEach(function(r){ catTotals[r.category]=(catTotals[r.category]||0)+(Number(r.amount) || 0); });
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
    var spent = cycleRecords.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
    var remain = data.budget - data.fixedSave - spent;
    if(remain < 0) return "是的，已经超支¥"+Math.abs(remain).toFixed(0)+"。建议：1. 后面非必要消费全停；2. 看看冲动消费里哪笔能退；3. 下个月预算调高或固定存款调低。";
    return "还没超支，还能花¥"+remain.toFixed(0)+"。但要注意节奏，别最后几天紧巴巴。";
  }
  if(lower.indexOf("省")>=0 || lower.indexOf("省钱")>=0){
    return "省钱建议：1. 奶茶/咖啡从每天一杯减到每周3杯，一年省¥2000+；2. 直播间下单前等24小时，80%会不想买；3. 外卖改自己做，每月省¥500+。先从最容易的一项开始。";
  }
  if(lower.indexOf("冲动")>=0){
    var imp = data.records.filter(function(r){ return inCycle(r.date, data.cycleStart) && r.impulse; });
    var impAmt = imp.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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

function nowTimeStr(){
  var d = new Date();
  var h = String(d.getHours()).padStart(2,"0");
  var m = String(d.getMinutes()).padStart(2,"0");
  return h+":"+m;
}
function sortByDateTime(a, b){
  var ta = (a.date || "") + " " + (a.time || "00:00");
  var tb = (b.date || "") + " " + (b.time || "00:00");
  return tb.localeCompare(ta);
}

function nowDateTime(){
  var d = new Date();
  return d.toISOString().slice(0,10) + " " + nowTimeStr();
}
function parseDateTime(input){
  // 解析 "YYYY-MM-DD HH:MM" 或 "YYYY-MM-DD"
  input = (input||"").trim();
  var parts = input.split(/\s+/);
  var date = parts[0] || new Date().toISOString().slice(0,10);
  var time = parts[1] || nowTimeStr();
  // 验证日期格式
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
    date = new Date().toISOString().slice(0,10);
  }
  // 验证时间格式
  if(!/^\d{2}:\d{2}$/.test(time)){
    time = nowTimeStr();
  }
  return {date:date, time:time};
}

function loadHealth(){
  try{
    var d = JSON.parse(localStorage.getItem(HEALTH_KEY));
    if(!d) return JSON.parse(JSON.stringify(HEALTH_DEFAULTS));
    for(var k in HEALTH_DEFAULTS){ if(d[k]===undefined) d[k]=HEALTH_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(HEALTH_DEFAULTS)); }
}
function saveHealth(data){ markLocalChange(); localStorage.setItem(HEALTH_KEY, JSON.stringify(data)); }

var healthWeekOffset = 0;
function getHealthWeekRange(){
  var now = new Date();
  var day = now.getDay() || 7;
  var monday = new Date(now); monday.setDate(now.getDate() - day + 1 + healthWeekOffset*7); monday.setHours(0,0,0,0);
  var sunday = new Date(monday); sunday.setDate(monday.getDate()+7);
  return {start:monday, end:sunday};
}
function healthWeekLabelText(){
  if(healthWeekOffset === 0) return "本周";
  return healthWeekOffset < 0 ? "上"+(-healthWeekOffset)+"周" : "下"+healthWeekOffset+"周";
}
function prevHealthWeek(){ healthWeekOffset--; renderHealth(); }
function nextHealthWeek(){ healthWeekOffset++; renderHealth(); }
function resetHealthWeek(){ if(healthWeekOffset!==0){ healthWeekOffset=0; renderHealth(); } }
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
  // 选中周记录
  var hr = getHealthWeekRange();
  var weekRecords = data.records.filter(function(r){ var d=new Date(r.date); return d>=hr.start && d<hr.end; });
  var drinks = weekRecords.filter(function(r){ return r.type==="drink"; });
  var meals = weekRecords.filter(function(r){ return r.type==="meal"; });
  var drinkCups = drinks.length;
  var drinkSpent = drinks.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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
    if(healthWeekOffset === 0){
      var dl = daysLeftInWeek();
      hlEl.textContent = dl > 0 ? "本周还剩"+dl+"天" : "本周最后一天";
    } else {
      var sun = new Date(hr.end); sun.setDate(sun.getDate()-1);
      function p(n){ return (n<10?"0":"")+n; }
      hlEl.textContent = (hr.start.getMonth()+1)+"."+p(hr.start.getDate())+" - "+(sun.getMonth()+1)+"."+p(sun.getDate());
    }
  }
  var wt = document.getElementById("healthWeekTitle");
  if(wt) wt.textContent = healthWeekLabelText();
  var wl = document.getElementById("healthWeekLabel");
  if(wl) wl.textContent = healthWeekLabelText();
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
    el.innerHTML = weekRecords.slice().sort(sortByDateTime).map(function(r){
      var cat = (r.type==="drink"?DRINKS:MEALS).find(function(c){ return c.name===r.category; }) || {icon:"🍽️"};
      var amt = "¥"+r.amount;
      return '<div class="exp-item">'
        +'<div class="exp-icon">'+cat.icon+'</div>'
        +'<div class="exp-info"><div class="exp-cat">'+esc(r.category)+(r.note?' · '+esc(r.note):'')+'</div><div class="exp-date">'+r.date+' '+(r.time||"")+' · '+(r.type==="drink"?"饮品":"吃法")+'</div></div>'
        +'<div class="exp-amount" onclick="editHealthAmount('+r.id+')">'+amt+'</div>'
        +'<div class="exp-del" onclick="delHealthRecord('+r.id+')">✕</div>'
        +'</div>';
    }).join("");
  }
  // 吃法占比
  var mealTotals = {};
  meals.forEach(function(r){ mealTotals[r.category]=(mealTotals[r.category]||0)+(Number(r.amount) || 0); });
  var mealArr = Object.keys(mealTotals).map(function(k){ return {name:k, amount:mealTotals[k]}; }).sort(function(a,b){ return b.amount-a.amount; });
  var mb = document.getElementById("mealBars");
  if(mealArr.length === 0){
    mb.innerHTML = '<div style="text-align:center;color:var(--muted);padding:16px;font-size:12px">暂无数据</div>';
  } else {
    var totalMealAmt = meals.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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

async function quickDrink(cat, amount){
  var vals = await showPrompt({
    title: cat+" 记一杯",
    fields: [
      {label:"日期时间", value:nowDateTime(), placeholder:"YYYY-MM-DD HH:MM"},
      {label:"备注", value:"", placeholder:"如：便利店/美式/大杯"}
    ]
  });
  if(!vals) return;
  var dt = parseDateTime(vals[0] || nowDateTime());
  var note = vals[1] || "";
  var data = loadHealth();
  var recId = Date.now();
  data.records.push({id:recId, type:"drink", category:cat, amount:amount, date:dt.date, time:dt.time, note:note});
  saveHealth(data); renderHealth();
  toast(cat+" ¥"+amount+" 已记入");
  // 同步到存钱记账
  try{
    var money = loadMoney();
    money.records.push({id:recId, category:cat, amount:amount, date:dt.date, time:dt.time, impulse:!!IMPULSE_CATS[cat], note:note});
    saveMoney(money);
  }catch(e){ console.log("同步到记账失败:", e.message); }
}
async function quickMeal(cat){
  var mealDef = MEALS.find(function(m){ return m.name===cat; }) || {amount:20};
  var vals = await showPrompt({
    title: cat+" 记一餐",
    fields: [
      {label:"金额", value:String(mealDef.amount), placeholder:"数字"},
      {label:"日期时间", value:nowDateTime(), placeholder:"YYYY-MM-DD HH:MM"},
      {label:"备注", value:"", placeholder:"如：三明治/黄焖鸡/公司楼下"}
    ]
  });
  if(!vals) return;
  var amount = vals[0];
  if(isNaN(amount) || Number(amount)<=0) amount = mealDef.amount;
  var dt = parseDateTime(vals[1] || nowDateTime());
  var note = vals[2] || "";
  var data = loadHealth();
  var recId = Date.now();
  data.records.push({id:recId, type:"meal", category:cat, amount:Number(amount), date:dt.date, time:dt.time, note:note});
  saveHealth(data); renderHealth();
  toast(cat+" ¥"+Number(amount)+" 已记入");
  try{
    var money = loadMoney();
    money.records.push({id:recId, category:cat, amount:Number(amount), date:dt.date, time:dt.time, impulse:false, note:note});
    saveMoney(money);
  }catch(e){ console.log("同步到记账失败:", e.message); }
}
async function addCustomMeal(){
  var vals = await showPrompt({
    title: "记一笔饮食",
    fields: [
      {label:"记录类型", value:"drink", placeholder:"drink=饮品 / meal=吃法"},
      {label:"类别", value:"", placeholder:"如：咖啡/奶茶/外卖轻食"},
      {label:"金额", value:"", placeholder:"饮品必填，吃法可留空"},
      {label:"日期时间", value:nowDateTime(), placeholder:"YYYY-MM-DD HH:MM"},
      {label:"备注", value:"", placeholder:"可选"}
    ]
  });
  if(!vals) return;
  var type = (vals[0]||"").trim();
  if(type!=="drink" && type!=="meal") type = "meal";
  var cat = (vals[1]||"").trim();
  if(!cat) return;
  var amount = 0;
  if(type==="drink"){
    amount = Number(vals[2]);
    if(!vals[2] || isNaN(amount)) return;
  } else if(vals[2] && !isNaN(Number(vals[2]))){
    amount = Number(vals[2]);
  }
  var dt = parseDateTime(vals[3] || nowDateTime());
  var note = vals[4] || "";
  var data = loadHealth();
  var recId = Date.now();
  data.records.push({id:recId, type:type, category:cat, amount:Number(amount), date:dt.date, time:dt.time, note:note});
  saveHealth(data); renderHealth();
  toast(cat+" ¥"+Number(amount)+" 已记入");
  // 只要是饮食记录（drink或meal），都同步到记账台
  try{
    var money = loadMoney();
    money.records.push({id:recId, category:cat, amount:Number(amount), date:dt.date, time:dt.time, impulse:false, note:note});
    saveMoney(money);
  }catch(e){ console.log("同步到记账失败:", e.message); }
}
async function editHealthAmount(id){
  var data = loadHealth();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  var vals = await showPrompt({
    title: "修改金额",
    fields: [{label:"金额", value:String(r.amount), placeholder:"数字"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  var v = Number(vals[0]);
  r.amount = v;
  saveHealth(data); renderHealth();
  // 同步修改记账金额
  try{
    var money = loadMoney();
    var mr = money.records.find(function(x){ return x.id===id; });
    if(mr){ mr.amount = v; saveMoney(money); }
  }catch(e){ console.log("同步修改记账失败:", e.message); }
}
function delHealthRecord(id){
  showConfirm("确定删除这条记录？（记账模块的对应记录也会同步删除）").then(function(ok){
    if(!ok) return;
    var data = loadHealth();
    data.records = data.records.filter(function(x){ return x.id!==id; });
    saveHealth(data); renderHealth();
    // 同步删除记账记录
    try{
      var money = loadMoney();
      money.records = money.records.filter(function(x){ return x.id!==id; });
      saveMoney(money);
    }catch(e){ console.log("同步删除记账失败:", e.message); }
  });
}
async function editHealthBudget(){
  var data = loadHealth();
  var vals = await showPrompt({
    title: "修改每周饮品预算",
    fields: [{label:"预算金额", value:String(data.drinkBudget), placeholder:"数字"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  data.drinkBudget = Number(vals[0]);
  saveHealth(data); renderHealth();
}
async function editHealthGoal(){
  var data = loadHealth();
  var vals = await showPrompt({
    title: "修改每周目标杯数",
    fields: [{label:"目标杯数", value:String(data.drinkGoal), placeholder:"数字"}]
  });
  if(!vals || !vals[0] || isNaN(Number(vals[0]))) return;
  data.drinkGoal = Number(vals[0]);
  saveHealth(data); renderHealth();
}

/* AI说真话 */
function runHealthTruth(){
  var data = loadHealth();
  var weekRecords = data.records.filter(function(r){ return inThisWeek(r.date); });
  var drinks = weekRecords.filter(function(r){ return r.type==="drink"; });
  var drinkCups = drinks.length;
  var drinkSpent = drinks.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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
  var drinkSpent = drinks.reduce(function(s,r){ return s+(Number(r.amount) || 0); },0);
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
function saveDecision(data){ markLocalChange(); localStorage.setItem(DECISION_KEY, JSON.stringify(data)); }

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
  toast("设置已保存："+data.identity+" · "+data.stage+" · "+data.depth+"轮拷问");
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
  showConfirm("确定重新开始？当前拷问记录会清空。").then(function(ok){
    if(!ok) return;
    var data = loadDecision();
    data.chatHistory = [];
    data.score = null;
    data.round = 0;
    data.started = false;
    saveDecision(data);
    document.getElementById("decScoreCard").style.display = "none";
    renderDecisionChat();
    updateRoundInfo();
  });
}


/* ========== 灵感捕捉模块 ========== */
var INSPIRE_KEY = "weh_inspire_data_v1";
var INSPIRE_DEFAULTS = {records:[]};
var currentInspireId = null;

function loadInspire(){
  try{
    var d = JSON.parse(localStorage.getItem(INSPIRE_KEY));
    if(!d) return JSON.parse(JSON.stringify(INSPIRE_DEFAULTS));
    for(var k in INSPIRE_DEFAULTS){ if(d[k]===undefined) d[k]=INSPIRE_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(INSPIRE_DEFAULTS)); }
}
function saveInspire(data){ markLocalChange(); localStorage.setItem(INSPIRE_KEY, JSON.stringify(data)); }

function addInspire(){
  var input = document.getElementById("inspireInput");
  var content = input.value.trim();
  if(!content) return;
  var data = loadInspire();
  var now = new Date();
  data.records.push({
    id: Date.now(),
    content: content,
    date: now.toISOString().slice(0,10),
    time: nowTimeStr(),
    status: "pending",
    aiExtension: null
  });
  saveInspire(data);
  input.value = "";
  renderInspire();
}

function renderInspire(){
  var data = loadInspire();
  var list = document.getElementById("inspireList");
  var count = document.getElementById("inspireCount");
  if(count) count.textContent = data.records.length + " 条";
  if(!list) return;
  if(data.records.length === 0){
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:32px 16px;font-size:13px">还没有灵感<br>在上方输入框记录第一条吧～</div>';
    return;
  }
  var sorted = data.records.slice().sort(function(a,b){
    var ta = (a.date||"") + " " + (a.time||"00:00");
    var tb = (b.date||"") + " " + (b.time||"00:00");
    return tb.localeCompare(ta);
  });
  list.innerHTML = sorted.map(function(r){
    var statusText = {pending:"待处理", recorded:"已记录", action:"已行动"}[r.status] || "待处理";
    var activeCls = r.id === currentInspireId ? " active" : "";
    return '<div class="inspire-item'+activeCls+'" onclick="selectInspire('+r.id+')">'
      +'<div class="inspire-item-text">'+esc(r.content)+'</div>'
      +'<div class="inspire-item-meta"><span>'+r.date+' '+(r.time||"")+'</span>'
      +'<span class="inspire-tag '+r.status+'">'+statusText+'</span></div>'
      +'</div>';
  }).join("");
}

function selectInspire(id){
  currentInspireId = id;
  renderInspire();
  var data = loadInspire();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  document.getElementById("inspireDetailTitle").textContent = r.date + " " + (r.time||"");
  document.getElementById("inspireActions").style.display = "flex";
  // 如果还没有AI延伸，生成一个
  if(!r.aiExtension){
    r.aiExtension = generateInspireExtension(r.content);
    saveInspire(data);
  }
  renderInspireDetail(r.aiExtension);
}

function renderInspireDetail(ext){
  var box = document.getElementById("inspireDetail");
  if(!box) return;
  box.innerHTML = ''
    +'<div class="d-section"><div class="d-label">💭 原始想法</div><div class="d-content">'+esc(ext.original)+'</div></div>'
    +'<div class="d-section"><div class="d-label">❓ 值得追问的</div><div class="d-content">'+ext.questions.map(function(q){return '· '+esc(q);}).join('<br>')+'</div></div>'
    +'<div class="d-section"><div class="d-label">🚀 可以延伸的方向</div><div class="d-content">'+ext.directions.map(function(d){return '· '+esc(d);}).join('<br>')+'</div></div>'
    +'<div class="d-section"><div class="d-label">⚖️ 值不值得做</div><div class="d-content">'+esc(ext.judgment)+'</div></div>'
    +'<div class="d-section"><div class="d-label">🔗 可能关联</div><div class="d-content">'+esc(ext.related)+'</div></div>';
}

function generateInspireExtension(content){
  var lower = content.toLowerCase();
  var questions = [];
  var directions = [];
  var judgment = "";
  var related = "";

  // 根据灵感内容生成不同的延伸
  if(lower.indexOf("做")>=0 || lower.indexOf("创业")>=0 || lower.indexOf("项目")>=0){
    questions = ["这个想法的核心价值是什么？谁会为此付费/花时间？", "最小可行版本是什么？能不能一周内做出来验证？", "最大的风险是什么？如果失败了损失有多大？"];
    directions = ["先写一页纸的商业画布，把价值、用户、成本想清楚", "找3个目标用户聊聊，验证需求是不是真的", "做一个最小原型，哪怕是PPT或草图，先拿给别人看"];
    judgment = "有行动潜力，但需要先验证需求，别一上来就all in。建议用最小成本试错，验证了再投入。";
    related = "可能关联：求职/创业/项目管理。可以转到决策顾问模块做更深入的拷问。";
  } else if(lower.indexOf("学")>=0 || lower.indexOf("考")>=0 || lower.indexOf("技能")>=0){
    questions = ["学这个的目的是什么？是兴趣还是职业需要？", "有没有明确的学习路径和时间规划？", "学完之后怎么用？有没有输出的场景？"];
    directions = ["列一个3个月的学习计划，每周固定时间", "找一个学习搭子或社群，互相监督", "边学边输出，写笔记或做小项目，学以致用"];
    judgment = "值得投入，但要避免'收藏等于学会'的错觉。制定明确计划和输出场景，才能真正学到。";
    related = "可能关联：六级学习/求职/工作SOP。可以把学习计划加入待办清单。";
  } else if(lower.indexOf("写")>=0 || lower.indexOf("文章")>=0 || lower.indexOf("内容")>=0){
    questions = ["想写给谁看？目标读者的痛点是什么？", "核心观点是什么？一句话能说清吗？", "有没有独特的视角或案例？还是只是重复别人说过的？"];
    directions = ["先写一个大纲，把核心观点和结构定下来", "找3篇同主题的爆款文章，分析它们的结构和角度", "定一个截止日期，先写完再改，别追求完美"];
    judgment = "有创作潜力，但要避免完美主义导致迟迟不动笔。先完成再完美，写出来才有修改的基础。";
    related = "可能关联：百川智库/求职。可以把素材存入知识库，或者作为简历项目的素材。";
  } else {
    questions = ["这个想法为什么现在出现？是看到了什么还是经历了什么？", "如果不做，三个月后会后悔吗？", "这个想法跟你目前的大目标一致吗？"];
    directions = ["先放一放，过一周再看，如果还觉得有价值就行动", "跟一个信任的朋友聊聊，听听外部视角", "把想法拆成最小的一步，今天就能做的那种"];
    judgment = "暂时不确定价值，建议先沉淀一下。好的想法会反复出现，一时冲动的想法会很快遗忘。";
    related = "可能关联：决策顾问/待办清单。如果决定行动，可以加入待办清单跟踪进度。";
  }

  return {
    original: content,
    questions: questions,
    directions: directions,
    judgment: judgment,
    related: related
  };
}

function markInspire(status){
  if(!currentInspireId) return;
  var data = loadInspire();
  var r = data.records.find(function(x){ return x.id===currentInspireId; });
  if(!r) return;
  r.status = status;
  saveInspire(data);
  renderInspire();
  var statusText = {recorded:"已记录", action:"已行动"}[status] || status;
  toast("已标记为：" + statusText);
}

function deleteCurrentInspire(){
  if(!currentInspireId) return;
  showConfirm("确定删除这条灵感？").then(function(ok){
    if(!ok) return;
    var data = loadInspire();
    data.records = data.records.filter(function(x){ return x.id!==currentInspireId; });
    saveInspire(data);
    currentInspireId = null;
    document.getElementById("inspireDetailTitle").textContent = "选一条灵感看看";
    document.getElementById("inspireActions").style.display = "none";
    document.getElementById("inspireDetail").innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px 20px;font-size:13px;line-height:1.8">从左边选一条灵感<br>AI会帮你：追问、延伸、关联、判断值不值得做<br><span style="color:var(--pink-deep);font-weight:700">碎片化想法不记录就溜走了</span></div>';
    renderInspire();
  });
}

function inspireToMarkdown(r){
  var statusText = {pending:"待处理", recorded:"已记录", action:"已行动"}[r.status] || "待处理";
  var ext = r.aiExtension || generateInspireExtension(r.content);
  var title = r.content.length > 30 ? r.content.slice(0,30) + "..." : r.content;
  var md = "---\n";
  md += "title: " + title.replace(/"/g, "\'") + "\n";
  md += "date: " + r.date + "\n";
  md += "time: " + (r.time || "") + "\n";
  md += "status: " + statusText + "\n";
  md += "tags: [灵感, 碎片化想法]\n";
  md += "---\n\n";
  md += "# 💡 原始想法\n\n";
  md += r.content + "\n\n";
  md += "# 🤖 AI延伸\n\n";
  md += "## ❓ 值得追问的\n\n";
  ext.questions.forEach(function(q){ md += "- " + q + "\n"; });
  md += "\n";
  md += "## 🚀 可以延伸的方向\n\n";
  ext.directions.forEach(function(d){ md += "- " + d + "\n"; });
  md += "\n";
  md += "## ⚖️ 值不值得做\n\n";
  md += ext.judgment + "\n\n";
  md += "## 🔗 可能关联\n\n";
  md += ext.related + "\n\n";
  md += "---\n";
  md += "*由 Weh Atelier 灵感捕捉模块导出 · " + new Date().toISOString().slice(0,10) + "*\n";
  return md;
}

function downloadMD(filename, content){
  var blob = new Blob([content], {type: "text/markdown;charset=utf-8"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportInspire(id){
  if(!id) return;
  var data = loadInspire();
  var r = data.records.find(function(x){ return x.id===id; });
  if(!r) return;
  var md = inspireToMarkdown(r);
  var filename = "灵感-" + r.date + "-" + (r.content.slice(0,10).replace(/[\\/:*?"<>|]/g,"_")) + ".md";
  downloadMD(filename, md);
}

function exportAllInspire(){
  var data = loadInspire();
  if(data.records.length === 0){
    toast("还没有灵感可以导出");
    return;
  }
  showConfirm("确定导出全部 " + data.records.length + " 条灵感？每条会生成一个MD文件。").then(function(ok){
    if(!ok) return;
    var sorted = data.records.slice().sort(function(a,b){
      var ta = (a.date||"") + " " + (a.time||"00:00");
      var tb = (b.date||"") + " " + (b.time||"00:00");
      return ta.localeCompare(tb);
    });
    sorted.forEach(function(r, i){
      setTimeout(function(){
        var md = inspireToMarkdown(r);
        var filename = "灵感-" + r.date + "-" + (r.content.slice(0,10).replace(/[\\/:*?"<>|]/g,"_")) + ".md";
        downloadMD(filename, md);
      }, i * 300);
    });
    setTimeout(function(){
      toast("已导出 " + sorted.length + " 条灵感，请检查下载文件夹，然后放到 Weh-Brain 的 00-灵感库 目录里。");
    }, sorted.length * 300 + 500);
  });
}

/* ========== 待办清单模块 ========== */
var TODO_KEY = "weh_todo_data_v1";
var TODO_DEFAULTS = {items:[]};
var PRIORITY_ORDER = {high:0, medium:1, low:2};
var PRIORITY_TEXT = {high:"🔴 高", medium:"🟡 中", low:"🟢 低"};
var CATEGORY_TEXT = {work:"💼 工作", study:"📖 学习", life:"🏠 生活", other:"📌 其他"};

function loadTodo(){
  try{
    var d = JSON.parse(localStorage.getItem(TODO_KEY));
    if(!d) return JSON.parse(JSON.stringify(TODO_DEFAULTS));
    for(var k in TODO_DEFAULTS){ if(d[k]===undefined) d[k]=TODO_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(TODO_DEFAULTS)); }
}
function saveTodo(data){ markLocalChange(); localStorage.setItem(TODO_KEY, JSON.stringify(data)); }

function addTodo(){
  var input = document.getElementById("todoInput");
  var title = input.value.trim();
  if(!title) return;
  var priority = document.getElementById("todoPriority").value;
  var category = document.getElementById("todoCategory").value;
  var dueDate = document.getElementById("todoDueDate").value || "";
  var data = loadTodo();
  data.items.push({
    id: Date.now(),
    title: title,
    priority: priority,
    category: category,
    dueDate: dueDate,
    done: false,
    createdAt: new Date().toISOString().slice(0,10)
  });
  saveTodo(data);
  input.value = "";
  document.getElementById("todoDueDate").value = "";
  renderTodo();
}

function toggleTodo(id){
  var data = loadTodo();
  var item = data.items.find(function(x){ return x.id===id; });
  if(!item) return;
  item.done = !item.done;
  saveTodo(data);
  renderTodo();
}

function deleteTodo(id){
  showConfirm("确定删除这个待办？").then(function(ok){
    if(!ok) return;
    var data = loadTodo();
    data.items = data.items.filter(function(x){ return x.id!==id; });
    saveTodo(data);
    renderTodo();
  });
}

async function editTodo(id){
  var data = loadTodo();
  var item = data.items.find(function(x){ return x.id===id; });
  if(!item) return;
  var vals = await showPrompt({
    title: "修改待办内容",
    fields: [{label:"待办内容", value:item.title, placeholder:""}]
  });
  if(!vals || !vals[0] || !vals[0].trim()) return;
  item.title = vals[0].trim();
  saveTodo(data);
  renderTodo();
}

function getDueStatus(dueDate){
  if(!dueDate) return {text:"", cls:""};
  var today = new Date().toISOString().slice(0,10);
  if(dueDate < today) return {text:"⚠️ 已逾期 "+dueDate, cls:"overdue"};
  if(dueDate === today) return {text:"📅 今日到期", cls:"today"};
  return {text:"📅 "+dueDate, cls:""};
}

function renderTodo(){
  var data = loadTodo();
  var items = data.items;
  // 统计
  var total = items.length;
  var done = items.filter(function(i){ return i.done; }).length;
  var pending = total - done;
  var today = new Date().toISOString().slice(0,10);
  var todayDue = items.filter(function(i){ return !i.done && i.dueDate === today; }).length;
  document.getElementById("todoTotal").textContent = total;
  document.getElementById("todoPending").textContent = pending;
  document.getElementById("todoDone").textContent = done;
  document.getElementById("todoToday").textContent = todayDue;
  document.getElementById("todoListCount").textContent = pending + " 项待完成";

  var list = document.getElementById("todoList");
  if(!list) return;
  if(items.length === 0){
    list.innerHTML = '<div class="todo-empty">还没有待办事项<br>在上方输入框添加第一个吧～</div>';
    return;
  }
  // 排序：未完成的按优先级+截止日期，完成的放底部
  var sorted = items.slice().sort(function(a,b){
    if(a.done !== b.done) return a.done ? 1 : -1;
    if(PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if(a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if(a.dueDate) return -1;
    if(b.dueDate) return 1;
    return b.id - a.id;
  });

  list.innerHTML = sorted.map(function(item){
    var due = getDueStatus(item.dueDate);
    var doneCls = item.done ? " done" : "";
    var checkedCls = item.done ? " checked" : "";
    var checkIcon = item.done ? "✓" : "";
    return '<div class="todo-item'+doneCls+'">'
      +'<div class="todo-check'+checkedCls+'" onclick="toggleTodo('+item.id+')">'+checkIcon+'</div>'
      +'<div class="todo-content">'
        +'<div class="todo-text">'+esc(item.title)+'</div>'
        +'<div class="todo-meta">'
          +'<span class="todo-cat-tag '+item.category+'">'+CATEGORY_TEXT[item.category]+'</span>'
          +'<span class="todo-priority-tag">'+PRIORITY_TEXT[item.priority]+'</span>'
          +(due.text ? '<span class="todo-due '+due.cls+'">'+due.text+'</span>' : '')
          +'<span style="color:var(--muted)">创建于 '+item.createdAt+'</span>'
        +'</div>'
      +'</div>'
      +'<div class="todo-actions">'
        +'<div class="todo-action-btn" onclick="addToDailyFromTodo('+item.id+')" title="加到今日计划">📅</div>'
        +'<div class="todo-action-btn" onclick="editTodo('+item.id+')" title="编辑">✏️</div>'
        +'<div class="todo-action-btn" onclick="deleteTodo('+item.id+')" title="删除">🗑️</div>'
      +'</div>'
      +'</div>';
  }).join("");
}


/* ========== 首页统计更新 ========== */
function updateHomeStats(){
  try{
    // 存钱记账：本期消费笔数
    var moneyData = JSON.parse(localStorage.getItem("weh_money_data_v1"));
    var moneyCount = moneyData && moneyData.records ? moneyData.records.length : 0;
    var el1 = document.getElementById("homeMoneyCount");
    if(el1) el1.textContent = moneyCount;
  }catch(e){}
  try{
    // 吃饭健康：本周饮食记录数
    var healthData = JSON.parse(localStorage.getItem("weh_health_data_v1"));
    var healthCount = healthData && healthData.records ? healthData.records.length : 0;
    var el2 = document.getElementById("homeHealthCount");
    if(el2) el2.textContent = healthCount;
  }catch(e){}
  try{
    // 灵感捕捉：灵感总数
    var inspireData = JSON.parse(localStorage.getItem("weh_inspire_data_v1"));
    var inspireCount = inspireData && inspireData.records ? inspireData.records.length : 0;
    var el3 = document.getElementById("homeInspireCount");
    if(el3) el3.textContent = inspireCount;
  }catch(e){}
  try{
    // 决策顾问：拷问次数
    var decData = JSON.parse(localStorage.getItem("weh_decision_data_v1"));
    var decCount = decData && decData.chatHistory ? decData.chatHistory.length : 0;
    var el4 = document.getElementById("homeDecisionCount");
    if(el4) el4.textContent = decCount;
  }catch(e){}
}

/* ========== 工作汇报台模块 ========== */
var REPORT_KEY = "weh_report_data_v1";
var REPORT_DEFAULTS = {currentType:"weekly", currentAudience:"leader", history:[]};
var currentReportId = null;

function loadReport(){
  try{
    var d = JSON.parse(localStorage.getItem(REPORT_KEY));
    if(!d) return JSON.parse(JSON.stringify(REPORT_DEFAULTS));
    for(var k in REPORT_DEFAULTS){ if(d[k]===undefined) d[k]=REPORT_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(REPORT_DEFAULTS)); }
}
function saveReport(data){ markLocalChange(); localStorage.setItem(REPORT_KEY, JSON.stringify(data)); }

function selectReportType(type){
  var data = loadReport();
  data.currentType = type;
  saveReport(data);
  document.querySelectorAll(".report-option[data-type]").forEach(function(el){
    el.classList.toggle("active", el.dataset.type === type);
  });
}

function selectReportAudience(audience){
  var data = loadReport();
  data.currentAudience = audience;
  saveReport(data);
  document.querySelectorAll(".report-option[data-audience]").forEach(function(el){
    el.classList.toggle("active", el.dataset.audience === audience);
  });
}

function generateReport(){
  var input = document.getElementById("reportInput").value.trim();
  if(!input){
    toast("请先输入碎碎念内容");
    return;
  }
  var data = loadReport();
  var type = data.currentType;
  var audience = data.currentAudience;

  // 解析输入，提取要点
  var lines = input.split(/[\n。；;]/).map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 0; });
  var typeText = {weekly:"周报", project:"项目进展", review:"复盘总结"}[type];
  var audienceText = {leader:"直系领导", client:"甲方", teacher:"老师"}[audience];

  // 生成精简汇报要点
  var highlights = [];
  if(type === "weekly"){
    highlights = lines.slice(0, 5).map(function(l, i){
      var prefix = ["✅ 完成", "🔄 进行中", "📌 重点", "💡 亮点", "⚠️ 风险"][i] || "📌";
      return prefix + "：" + (l.length > 40 ? l.slice(0,40)+"..." : l);
    });
  } else if(type === "project"){
    highlights = [
      "📊 项目进度：" + (lines[0] ? lines[0].slice(0,30) : "按计划推进中"),
      "✅ 已完成：" + (lines[1] ? lines[1].slice(0,30) : "核心功能开发"),
      "🔄 进行中：" + (lines[2] ? lines[2].slice(0,30) : "测试与优化"),
      "⚠️ 风险与问题：" + (lines[3] ? lines[3].slice(0,30) : "暂无重大风险"),
      "📅 下一步：" + (lines[4] ? lines[4].slice(0,30) : "继续按计划推进")
    ];
  } else {
    highlights = [
      "🎯 目标回顾：" + (lines[0] ? lines[0].slice(0,30) : "原定目标达成情况"),
      "✅ 做得好的：" + (lines[1] ? lines[1].slice(0,30) : "流程优化、效率提升"),
      "❌ 不足与教训：" + (lines[2] ? lines[2].slice(0,30) : "沟通不及时、预估偏差"),
      "💡 改进措施：" + (lines[3] ? lines[3].slice(0,30) : "建立同步机制、优化预估方法"),
      "📌 下次重点：" + (lines[4] ? lines[4].slice(0,30) : "落实改进措施")
    ];
  }

  // 生成预判追问
  var questions = [];
  if(audience === "leader"){
    questions = [
      {q: "这个事情的优先级是什么？跟其他任务比怎么排？", a: "建议回答：目前优先级是P0，因为直接影响下周上线；其他任务已协调顺延，不影响整体节奏。"},
      {q: "遇到的这个问题，你打算怎么解决？需要什么支持？", a: "建议回答：已初步定位原因，计划本周内出解决方案；需要XX部门配合提供数据，已在协调中。"},
      {q: "下一步的时间节点能保证吗？风险点在哪里？", a: "建议回答：按目前进度可以保证；主要风险在XX环节，已准备Plan B，最坏情况延迟1天，不影响最终交付。"}
    ];
  } else if(audience === "client"){
    questions = [
      {q: "目前的进度是否符合合同约定？会不会延期？", a: "建议回答：目前进度符合预期，关键节点均按时完成；整体不会延期，后续会每周同步进度。"},
      {q: "这个方案的效果怎么衡量？有没有数据支撑？", a: "建议回答：效果通过XX指标衡量，上线后会提供数据周报；目前已有小范围测试数据，效果符合预期。"},
      {q: "后续维护和支持怎么安排？", a: "建议回答：上线后提供3个月免费维护，之后按年度服务合同执行；有专属对接人，响应时间不超过4小时。"}
    ];
  } else {
    questions = [
      {q: "这个项目的核心创新点是什么？", a: "建议回答：核心创新在于XX方法的应用，相比传统方案效率提升30%；已有初步实验数据验证。"},
      {q: "参考文献和理论依据是什么？", a: "建议回答：主要参考XX等人2023年的研究，以及XX理论框架；文献清单已整理在附录中。"},
      {q: "下一步的研究计划是什么？", a: "建议回答：下一步计划扩大样本量做验证，同时探索XX方向的延伸应用；预计3个月内出阶段性成果。"}
    ];
  }

  var result = {
    type: type,
    audience: audience,
    typeText: typeText,
    audienceText: audienceText,
    input: input,
    highlights: highlights,
    questions: questions,
    createdAt: new Date().toISOString().slice(0,16).replace("T", " ")
  };

  // 保存到历史
  var reportId = Date.now();
  data.history.unshift({
    id: reportId,
    type: type,
    audience: audience,
    typeText: typeText,
    audienceText: audienceText,
    input: input,
    highlights: highlights,
    questions: questions,
    createdAt: result.createdAt
  });
  if(data.history.length > 20) data.history = data.history.slice(0, 20);
  saveReport(data);
  currentReportId = reportId;

  renderReportResult(result);
  renderReportHistory();
}

function renderReportResult(result){
  var box = document.getElementById("reportResult");
  var title = document.getElementById("reportResultTitle");
  var exportBtn = document.getElementById("reportExportBtn");
  if(!box) return;
  title.textContent = result.typeText + " · 汇报对象：" + result.audienceText + " · " + result.createdAt;
  exportBtn.style.display = "inline-block";

  var highlightsHtml = result.highlights.map(function(h){ return "<li>" + esc(h) + "</li>"; }).join("");
  var questionsHtml = result.questions.map(function(q){
    return '<div class="report-question"><div class="report-question-q">❓ ' + esc(q.q) + '</div><div class="report-question-a">💡 ' + esc(q.a) + '</div></div>';
  }).join("");

  box.innerHTML = ''
    + '<div class="report-section"><div class="report-section-title">📝 精简汇报（' + result.typeText + '）</div>'
    + '<div class="report-section-content"><ul>' + highlightsHtml + '</ul></div></div>'
    + '<div class="report-section"><div class="report-section-title">🎯 预判' + result.audienceText + '会追问的3个问题</div>'
    + '<div>' + questionsHtml + '</div></div>'
    + '<div class="report-section"><div class="report-section-title">💡 原始碎碎念</div>'
    + '<div class="report-section-content" style="color:var(--muted);font-size:12px">' + esc(result.input).replace(/\n/g, "<br>") + '</div></div>';
}

function renderReportHistory(){
  var data = loadReport();
  var box = document.getElementById("reportHistory");
  var count = document.getElementById("reportHistoryCount");
  if(count) count.textContent = data.history.length + " 份";
  if(!box) return;
  if(data.history.length === 0){
    box.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px">还没有历史汇报</div>';
    return;
  }
  box.innerHTML = data.history.map(function(r){
    var activeCls = r.id === currentReportId ? " active" : "";
    return '<div class="report-history-item'+activeCls+'" onclick="loadReportHistory('+r.id+')">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start">'
      +'<div style="flex:1">'
      +'<div class="report-history-title">'+r.typeText+' · '+r.audienceText+'</div>'
      +'<div class="report-history-meta">'+r.createdAt+' · '+(r.input.length>20?r.input.slice(0,20)+"...":r.input)+'</div>'
      +'</div>'
      +'<div class="report-delete-btn" onclick="event.stopPropagation();deleteReport('+r.id+')" title="删除">🗑️</div>'
      +'</div>'
      +'</div>';
  }).join("");
}

function loadReportHistory(id){
  var data = loadReport();
  var r = data.history.find(function(x){ return x.id===id; });
  if(!r) return;
  currentReportId = id;
  renderReportResult(r);
  renderReportHistory();
}

function exportReport(){
  if(!currentReportId){
    toast("请先生成或选择一份汇报");
    return;
  }
  var data = loadReport();
  var r = data.history.find(function(x){ return x.id===currentReportId; });
  if(!r) return;

  var md = "---\n";
  md += "title: " + r.typeText + " - " + r.createdAt.slice(0,10) + "\n";
  md += "type: " + r.type + "\n";
  md += "audience: " + r.audience + "\n";
  md += "date: " + r.createdAt.slice(0,10) + "\n";
  md += "tags: [工作汇报, " + r.typeText + "]\n";
  md += "---\n\n";
  md += "# " + r.typeText + "（汇报对象：" + r.audienceText + "）\n\n";
  md += "> 生成时间：" + r.createdAt + "\n\n";
  md += "## 📝 精简汇报\n\n";
  r.highlights.forEach(function(h){ md += "- " + h + "\n"; });
  md += "\n";
  md += "## 🎯 预判追问\n\n";
  r.questions.forEach(function(q, i){
    md += "### " + (i+1) + ". " + q.q + "\n\n";
    md += "**建议回答**：" + q.a + "\n\n";
  });
  md += "## 💡 原始碎碎念\n\n";
  md += r.input + "\n\n";
  md += "---\n";
  md += "*由 Weh Atelier 工作汇报台生成 · 参考工作SOP知识库模板*\n";

  var filename = "汇报-" + r.typeText + "-" + r.createdAt.slice(0,10) + ".md";
  var blob = new Blob([md], {type: "text/markdown;charset=utf-8"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function deleteReport(id){
  showConfirm("确定删除这份汇报？").then(function(ok){
    if(!ok) return;
    var data = loadReport();
    data.history = data.history.filter(function(x){ return x.id!==id; });
    saveReport(data);
    if(currentReportId === id){
      currentReportId = null;
      document.getElementById("reportResultTitle").textContent = "在左边填写后点生成";
      document.getElementById("reportExportBtn").style.display = "none";
      document.getElementById("reportResult").innerHTML = '<div style="text-align:center;color:var(--muted);padding:60px 20px;font-size:13px;line-height:1.8">选择汇报类型和对象<br>在左边输入碎碎念（做了什么、遇到什么问题、下一步计划）<br>点"✨ 生成精简汇报"<br><span style="color:var(--pink-deep);font-weight:700">AI会参考工作SOP的模板，把"做了一大堆"翻译成"做出了什么"</span></div>';
    }
    renderReportHistory();
  });
}



/* ========== 日计划台模块 ========== */
var DAILY_KEY = "weh_daily_data_v1";
var DAILY_DEFAULTS = {date:"", tasks:[], review:""};
var DAILY_PRIORITY = {high:{text:"🔴 高", color:"#e05050"}, medium:{text:"🟡 中", color:"#ffa94d"}, low:{text:"🟢 低", color:"#72b05e"}};

function loadDaily(){
  try{
    var d = JSON.parse(localStorage.getItem(DAILY_KEY));
    var today = new Date().toISOString().slice(0,10);
    if(!d || d.date !== today){
      // 新的一天，重置
      return JSON.parse(JSON.stringify(DAILY_DEFAULTS));
    }
    for(var k in DAILY_DEFAULTS){ if(d[k]===undefined) d[k]=DAILY_DEFAULTS[k]; }
    return d;
  }catch(e){ return JSON.parse(JSON.stringify(DAILY_DEFAULTS)); }
}
function saveDaily(data){ markLocalChange();
  data.date = new Date().toISOString().slice(0,10);
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
}

function addDailyTask(){
  var input = document.getElementById("dailyInput");
  var title = input.value.trim();
  if(!title) return;
  var priority = document.getElementById("dailyPriority").value;
  var duration = parseInt(document.getElementById("dailyDuration").value);
  var data = loadDaily();
  data.tasks.push({
    id: Date.now(),
    title: title,
    priority: priority,
    duration: duration,
    done: false
  });
  saveDaily(data);
  input.value = "";
  renderDaily();
}

function toggleDailyTask(id){
  var data = loadDaily();
  var task = data.tasks.find(function(t){ return t.id===id; });
  if(!task) return;
  task.done = !task.done;
  saveDaily(data);
  renderDaily();
}

function deleteDailyTask(id){
  var data = loadDaily();
  data.tasks = data.tasks.filter(function(t){ return t.id!==id; });
  saveDaily(data);
  renderDaily();
}

function saveDailyReview(){
  var review = document.getElementById("dailyReview").value;
  var data = loadDaily();
  data.review = review;
  saveDaily(data);
}

function renderDaily(){
  var data = loadDaily();
  var today = new Date();
  var weekdays = ["周日","周一","周二","周三","周四","周五","周六"];
  document.getElementById("dailyDateNum").textContent = today.getDate();
  document.getElementById("dailyWeekday").textContent = weekdays[today.getDay()];
  document.getElementById("dailyMonth").textContent = (today.getMonth()+1) + "月";

  // 进度
  var total = data.tasks.length;
  var done = data.tasks.filter(function(t){ return t.done; }).length;
  document.getElementById("dailyProgressText").textContent = done + "/" + total;
  var percent = total > 0 ? Math.round(done/total*100) : 0;
  document.getElementById("dailyProgressFill").style.width = percent + "%";

  // 任务列表
  document.getElementById("dailyTaskCount").textContent = total + " 项";
  var list = document.getElementById("dailyTaskList");
  if(total === 0){
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px;font-size:12px">还没有任务，在上方添加第一个吧～</div>';
  } else {
    // 按优先级排序
    var sorted = data.tasks.slice().sort(function(a,b){
      var order = {high:0, medium:1, low:2};
      if(order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return a.id - b.id;
    });
    list.innerHTML = sorted.map(function(t){
      var doneCls = t.done ? " done" : "";
      var checkedCls = t.done ? " checked" : "";
      var p = DAILY_PRIORITY[t.priority];
      return '<div class="daily-task-item'+doneCls+'">'
        +'<div class="daily-task-check'+checkedCls+'" onclick="toggleDailyTask('+t.id+')">'+(t.done?"✓":"")+'</div>'
        +'<div class="daily-task-content">'
          +'<div class="daily-task-text">'+esc(t.title)+'</div>'
          +'<div class="daily-task-meta"><span>'+p.text+'</span><span>⏱️ '+t.duration+'分钟</span></div>'
        +'</div>'
        +'<div class="daily-task-delete" onclick="deleteDailyTask('+t.id+')">🗑️</div>'
        +'</div>';
    }).join("");
  }

  // 时间轴
  var timeline = document.getElementById("dailyTimeline");
  var pendingTasks = data.tasks.filter(function(t){ return !t.done; });
  if(pendingTasks.length === 0){
    timeline.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px">今日任务全部完成啦！🎉</div>';
  } else {
    var startHour = 9; // 从9点开始
    var currentMin = startHour * 60;
    timeline.innerHTML = pendingTasks.map(function(t){
      var startH = Math.floor(currentMin/60);
      var startM = currentMin % 60;
      var endMin = currentMin + t.duration;
      var endH = Math.floor(endMin/60);
      var endM = endMin % 60;
      var timeStr = (startH<10?"0":"")+startH+":"+(startM<10?"0":"")+startM+" - "+(endH<10?"0":"")+endH+":"+(endM<10?"0":"")+endM;
      currentMin = endMin;
      var p = DAILY_PRIORITY[t.priority];
      return '<div class="daily-time-block" style="border-left-color:'+p.color+'">'
        +'<span class="daily-time-range">'+timeStr+'</span>'
        +'<span class="daily-time-title">'+esc(t.title)+'</span>'
        +'<span class="daily-time-duration">'+t.duration+'分钟</span>'
        +'</div>';
    }).join("");
  }

  // AI说真话
  var truthBox = document.getElementById("dailyTruth");
  if(total === 0){
    truthBox.innerHTML = '<div style="text-align:center;color:var(--muted);padding:12px;font-size:13px">添加任务后AI会给你实话实说～</div>';
  } else {
    var totalMin = data.tasks.reduce(function(sum,t){ return sum + t.duration; }, 0);
    var totalHour = (totalMin/60).toFixed(1);
    var truth = "";
    if(total > 8){
      truth = '<div class="truth-label">⚠️ 排太多了</div>你今天排了 '+total+' 件事，预计需要 '+totalHour+' 小时，明显做不完。建议砍掉 '+Math.ceil(total*0.3)+' 件低优先级的，先保证高优先级的完成质量。';
    } else if(totalHour > 8){
      truth = '<div class="truth-label">⏰ 时间太紧</div>全部任务预计需要 '+totalHour+' 小时，超过了正常工作时长。建议把一些任务移到明天，或者降低预期。';
    } else if(done === total && total > 0){
      truth = '<div class="truth-label">🎉 全部完成</div>今天 '+total+' 件任务全部完成，效率很高！记得复盘一下哪些做得好，哪些可以改进。';
    } else if(done > 0){
      truth = '<div class="truth-label">💪 继续加油</div>已完成 '+done+'/'+total+' 件，进度 '+percent+'%。保持节奏，高优先级的先做完。';
    } else {
      truth = '<div class="truth-label">🚀 开始吧</div>今天有 '+total+' 件任务，预计 '+totalHour+' 小时。先从高优先级的开始，一件一件来。';
    }
    truthBox.innerHTML = truth;
  }

  // 复盘
  document.getElementById("dailyReview").value = data.review || "";
}


function addToDailyFromTodo(todoId){
  var todoData = JSON.parse(localStorage.getItem("weh_todo_data_v1"));
  if(!todoData || !todoData.items) return;
  var todo = todoData.items.find(function(t){ return t.id===todoId; });
  if(!todo) return;
  if(todo.done){
    toast("该任务已完成，无需加到今日计划");
    return;
  }
  var dailyData = loadDaily();
  // 检查是否已经加过
  var exists = dailyData.tasks.some(function(t){ return t.title === todo.title; });
  if(exists){
    toast("该任务已在今日计划中");
    return;
  }
  dailyData.tasks.push({
    id: Date.now(),
    title: todo.title,
    priority: todo.priority,
    duration: 30,
    done: false
  });
  saveDaily(dailyData);
  toast("已加到今日计划：" + todo.title);
  if(document.getElementById("dailyInput")){
    renderDaily();
  }
}

function addInspireToTodo(inspireId){
  var inspireData = loadInspire();
  var r = inspireData.records.find(function(x){ return x.id===inspireId; });
  if(!r) return;
  var todoData = JSON.parse(localStorage.getItem("weh_todo_data_v1"));
  if(!todoData) todoData = {items:[]};
  var exists = todoData.items.some(function(t){ return t.title === r.content; });
  if(exists){
    toast("该灵感已在待办清单中");
    return;
  }
  todoData.items.push({
    id: Date.now(),
    title: r.content,
    priority: "medium",
    category: "other",
    dueDate: "",
    done: false,
    createdAt: new Date().toISOString().slice(0,10)
  });
  localStorage.setItem("weh_todo_data_v1", JSON.stringify(todoData));
  toast("已转到待办清单：" + (r.content.length>20?r.content.slice(0,20)+"...":r.content));
}

function addInspireToDaily(inspireId){
  var inspireData = loadInspire();
  var r = inspireData.records.find(function(x){ return x.id===inspireId; });
  if(!r) return;
  var dailyData = loadDaily();
  var exists = dailyData.tasks.some(function(t){ return t.title === r.content; });
  if(exists){
    toast("该灵感已在今日计划中");
    return;
  }
  dailyData.tasks.push({
    id: Date.now(),
    title: r.content,
    priority: "medium",
    duration: 30,
    done: false
  });
  saveDaily(dailyData);
  toast("已加到今日计划：" + (r.content.length>20?r.content.slice(0,20)+"...":r.content));
  if(document.getElementById("dailyInput")){
    renderDaily();
  }
}

function initDaily(){
  renderDaily();
}
function initReport(){
  var data = loadReport();
  // 恢复选中状态
  document.querySelectorAll(".report-option[data-type]").forEach(function(el){
    el.classList.toggle("active", el.dataset.type === data.currentType);
  });
  document.querySelectorAll(".report-option[data-audience]").forEach(function(el){
    el.classList.toggle("active", el.dataset.audience === data.currentAudience);
  });
  renderReportHistory();
}

/* ========== 设置页 ========== */
var SETTINGS_KEY = "weh_settings_v1";
var SETTINGS_DEFAULTS = {theme:"pink", glassOpacity:75, veilOpacity:50, blurRadius:18, fontSize:"medium", preferences:{}};
var DATA_KEYS = {
  money: "weh_money_data_v1",
  health: "weh_health_data_v1",
  inspire: "weh_inspire_data_v1",
  decision: "weh_decision_data_v1",
  report: "weh_report_data_v1",
  daily: "weh_daily_data_v1",
  todo: "weh_todo_data_v1"
};

function loadSettings(){
  try{
    var s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if(!s) return JSON.parse(JSON.stringify(SETTINGS_DEFAULTS));
    for(var k in SETTINGS_DEFAULTS){ if(s[k]===undefined) s[k]=SETTINGS_DEFAULTS[k]; }
    return s;
  }catch(e){ return JSON.parse(JSON.stringify(SETTINGS_DEFAULTS)); }
}
function saveSettings(s){ markLocalChange(); localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

function switchSettingsTab(tab){
  document.querySelectorAll(".settings-nav-item").forEach(function(el){
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  document.querySelectorAll(".settings-tab").forEach(function(el){
    el.classList.toggle("active", el.id === "settings-"+tab);
  });
}

function setTheme(theme){
  var s = loadSettings();
  s.theme = theme;
  saveSettings(s);
  document.querySelectorAll(".theme-dot").forEach(function(el){
    el.classList.toggle("active", el.classList.contains("theme-"+theme));
  });
  // 应用主题色（通过CSS变量）
  var colors = {
    pink: {primary:"#db7093", secondary:"#b48ed9"},
    blue: {primary:"#74b9ff", secondary:"#a29bfe"},
    green: {primary:"#00b894", secondary:"#81ecec"},
    orange: {primary:"#ffa502", secondary:"#ff6348"}
  };
  var c = colors[theme] || colors.pink;
  document.documentElement.style.setProperty("--pink-deep", c.primary);
  document.documentElement.style.setProperty("--purple", c.secondary);
  // 同时设置渐变相关变量，让左侧栏、按钮等也跟着主题色变化
  document.documentElement.style.setProperty("--grad-from", c.primary);
  document.documentElement.style.setProperty("--grad-to", c.secondary);
  // hex转rgb，设置阴影
  var r = parseInt(c.primary.slice(1,3),16);
  var g = parseInt(c.primary.slice(3,5),16);
  var b = parseInt(c.primary.slice(5,7),16);
  document.documentElement.style.setProperty("--grad-shadow", "rgba("+r+","+g+","+b+",0.3)");
  // 同时设置pink/lav系列变量，让hover等效果也跟着变
  document.documentElement.style.setProperty("--pink", c.primary);
  document.documentElement.style.setProperty("--lav", c.secondary);
}

function setGlassOpacity(value){
  var s = loadSettings();
  s.glassOpacity = parseInt(value);
  saveSettings(s);
  document.getElementById("glassOpacityValue").textContent = value + "%";
  // 应用透明度
  document.documentElement.style.setProperty("--glass-opacity", value/100);
}

function setVeilOpacity(value){
  var s = loadSettings();
  s.veilOpacity = parseInt(value);
  saveSettings(s);
  document.getElementById("veilOpacityValue").textContent = value + "%";
  var base = value / 100;
  document.documentElement.style.setProperty("--veil-alpha", base);
  // 直接用全局色相变量重新设置遮罩，不需要重新加载背景图
  var H = currentHueH || 0;
  var topAlpha = (base * 0.7).toFixed(2);
  var botAlpha = base.toFixed(2);
  document.documentElement.style.setProperty("--veil-top", "hsla("+Math.round(H)+",50%,97%,"+topAlpha+")");
  document.documentElement.style.setProperty("--veil-bot", "hsla("+Math.round(H)+",50%,97%,"+botAlpha+")");
}

function setBlurRadius(value){
  var s = loadSettings();
  s.blurRadius = parseInt(value);
  saveSettings(s);
  document.getElementById("blurRadiusValue").textContent = value + "px";
  document.documentElement.style.setProperty("--blur-radius", value + "px");
}

function setFontSize(size){
  var s = loadSettings();
  s.fontSize = size;
  saveSettings(s);
  var sizes = {small:"13px", medium:"14px", large:"15px"};
  document.documentElement.style.fontSize = sizes[size] || "14px";
}


/* ========== Gist 云同步 ========== */
var SYNC_CONFIG_KEY = "weh_sync_config_v1";
var SYNC_META_KEY = "weh_sync_meta_v1";
var SYNC_FILE = "weh-atelier-data.json";
var _syncUploadTimer = null;

function loadSyncConfig(){
  try{ var c = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)); return c && typeof c==="object" ? c : {}; }catch(e){ return {}; }
}
function loadSyncMeta(){
  try{ var m = JSON.parse(localStorage.getItem(SYNC_META_KEY)); return m && typeof m==="object" ? m : {}; }catch(e){ return {}; }
}
function saveSyncMeta(m){ localStorage.setItem(SYNC_META_KEY, JSON.stringify(m)); }

function readSyncInputs(){
  var c = loadSyncConfig();
  var t = document.getElementById("syncToken");
  var g = document.getElementById("syncGistId");
  var a = document.getElementById("syncAuto");
  if(t) c.token = t.value.trim();
  if(g) c.gistId = g.value.trim();
  if(a) c.auto = !!a.checked;
  return c;
}

function fmtSyncTime(ts){
  var d = new Date(ts);
  function p(n){ return (n<10?"0":"")+n; }
  return (d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes());
}

function renderSyncStatus(){
  var c = loadSyncConfig();
  var el = document.getElementById("syncStatus");
  if(!el) return;
  if(!c.token){ el.textContent = "未配置"; el.style.color = "var(--muted)"; return; }
  if(!c.gistId){ el.textContent = "已填 Token，尚未连接（点“保存并连接”）"; el.style.color = "var(--muted)"; return; }
  var parts = ["已连接 Gist " + c.gistId.slice(0,8) + "…"];
  if(c.lastSync){ parts.push("上次同步 " + fmtSyncTime(c.lastSync)); }
  el.textContent = parts.join(" · ");
  el.style.color = c.auto ? "#2e7d32" : "var(--muted)";
}

function saveSyncConfig(){
  var c = readSyncInputs();
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c));
  renderSyncStatus();
  if(c.auto && c.token && c.gistId){ toast("自动同步已开启"); }
}

function markLocalChange(){
  var m = loadSyncMeta();
  m.lastLocalChange = Date.now();
  saveSyncMeta(m);
  var c = loadSyncConfig();
  if(c.auto && c.token && c.gistId){
    if(_syncUploadTimer) clearTimeout(_syncUploadTimer);
    _syncUploadTimer = setTimeout(function(){ syncNow("upload", true); }, 3000);
  }
}

function collectAllData(){
  var data = {};
  for(var key in DATA_KEYS){
    try{
      var val = localStorage.getItem(DATA_KEYS[key]);
      if(val) data[key] = JSON.parse(val);
    }catch(e){}
  }
  data.settings = loadSettings();
  data.syncTime = Date.now();
  return data;
}

function writeAllData(data){
  for(var key in DATA_KEYS){
    if(data[key] !== undefined){ localStorage.setItem(DATA_KEYS[key], JSON.stringify(data[key])); }
  }
  if(data.settings){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings)); }
}

function syncNow(action, silent){
  var c = readSyncInputs();
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c));
  if(!c.token){ toast("请先填写 GitHub Token"); switchSettingsTab("sync"); return; }
  var btn = document.getElementById("syncBtn-" + action);
  if(btn){ btn.disabled = true; btn.textContent = "同步中…"; }
  var p = action === "upload" ? syncUpload(c, !!silent) : syncDownload(c, !!silent);
  if(p && p.then){ p.then(function(){
    if(btn){ btn.disabled = false; btn.textContent = action === "upload" ? "☁️ 上传" : "📥 下载"; }
    renderSyncStatus();
  }); }
}

function syncUpload(c, silent){
  var data = collectAllData();
  var body = { files: {} };
  body.files[SYNC_FILE] = { content: JSON.stringify(data, null, 2) };
  var url, method;
  if(c.gistId){ url = "https://api.github.com/gists/" + c.gistId; method = "PATCH"; }
  else { url = "https://api.github.com/gists"; method = "POST"; body.description = "Weh Atelier 数据同步"; body.public = false; }
  return fetch(url, {
    method: method,
    headers: { "Authorization": "Bearer " + c.token, "Accept": "application/vnd.github+json" },
    body: JSON.stringify(body)
  }).then(function(r){ return r.json().then(function(j){ return {ok: r.ok, j: j}; }); })
  .then(function(res){
    if(!res.ok){ throw new Error((res.j && res.j.message) || ("HTTP " + (res.j && res.j.status || ""))); }
    if(!c.gistId && res.j && res.j.id){
      c.gistId = res.j.id;
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c));
      var g = document.getElementById("syncGistId");
      if(g) g.value = c.gistId;
      toast("已创建 Gist：" + c.gistId.slice(0,8) + "…");
    }
    c.lastSync = Date.now();
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c));
    var m = loadSyncMeta();
    m.lastUpload = Date.now();
    saveSyncMeta(m);
    if(!silent){ toast("已上传到云端"); }
    return true;
  }).catch(function(e){
    toast("上传失败：" + e.message);
    console.error(e);
    return false;
  });
}

function syncDownload(c, silent){
  if(!c.gistId){ toast("还没有 Gist，先点“保存并连接”"); return Promise.resolve(false); }
  return fetch("https://api.github.com/gists/" + c.gistId, {
    headers: { "Authorization": "Bearer " + c.token, "Accept": "application/vnd.github+json" }
  }).then(function(r){ return r.json().then(function(j){ return {ok: r.ok, j: j}; }); })
  .then(function(res){
    if(!res.ok){ throw new Error((res.j && res.j.message) || "HTTP 错误"); }
    var f = res.j && res.j.files && res.j.files[SYNC_FILE];
    if(!f || !f.content){ throw new Error("云端没有数据文件"); }
    var data = JSON.parse(f.content);
    var m = loadSyncMeta();
    var localDirty = (m.lastLocalChange || 0) > (m.lastUpload || 0);
    if(localDirty){
      if(!silent){ toast("本地有未上传的修改，跳过下载"); }
      return false;
    }
    writeAllData(data);
    m.lastDownload = Date.now();
    saveSyncMeta(m);
    var c2 = loadSyncConfig();
    c2.lastSync = Date.now();
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c2));
    try{ if(typeof renderHome === "function") renderHome(); }catch(e){}
    try{ if(typeof renderMoney === "function") renderMoney(); }catch(e){}
    try{ if(typeof renderHealth === "function") renderHealth(); }catch(e){}
    try{ if(typeof renderInspire === "function") renderInspire(); }catch(e){}
    try{ if(typeof renderTodo === "function") renderTodo(); }catch(e){}
    try{ if(typeof renderDaily === "function") renderDaily(); }catch(e){}
    if(!silent){ toast("已从云端同步最新数据"); }
    return true;
  }).catch(function(e){
    if(!silent){ toast("下载失败：" + e.message); }
    console.error(e);
    return false;
  });
}

function findExistingGist(token){
  return fetch("https://api.github.com/user/gists", {
    headers: { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" }
  }).then(function(r){ return r.json().then(function(j){ return {ok: r.ok, j: j}; }); })
  .then(function(res){
    if(!res.ok || !Array.isArray(res.j)) return null;
    for(var i = 0; i < res.j.length; i++){
      if(res.j[i].files && res.j[i].files[SYNC_FILE]){ return res.j[i].id; }
    }
    return null;
  }).catch(function(){ return null; });
}

function syncConnect(){
  var c = readSyncInputs();
  if(!c.token){ toast("请先填写 Token"); switchSettingsTab("sync"); return; }
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c));
  renderSyncStatus();
  if(c.gistId){ syncNow("download", true); return; }
  // 没有 Gist ID：先查找已有的 Weh Atelier 同步 Gist，找到则复用，避免多设备数据分叉
  toast("正在查找已有的同步 Gist…");
  findExistingGist(c.token).then(function(id){
    if(id){
      c.gistId = id;
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(c));
      var g = document.getElementById("syncGistId");
      if(g) g.value = id;
      toast("已连接已有的 Gist：" + id.slice(0,8) + "…");
      syncNow("download", true);
    } else {
      syncNow("upload", true);
    }
  });
}

function syncInit(){
  var c = loadSyncConfig();
  var t = document.getElementById("syncToken");
  var g = document.getElementById("syncGistId");
  var a = document.getElementById("syncAuto");
  if(t) t.value = c.token || "";
  if(g) g.value = c.gistId || "";
  if(a) a.checked = !!c.auto;
  renderSyncStatus();
  if(c.auto && c.token && c.gistId){
    setTimeout(function(){ syncDownload(c, true); }, 1500);
  }
}

function exportAllData(){
  var data = {};
  for(var key in DATA_KEYS){
    try{
      var val = localStorage.getItem(DATA_KEYS[key]);
      if(val) data[key] = JSON.parse(val);
    }catch(e){}
  }
  data.settings = loadSettings();
  data.exportTime = new Date().toISOString();
  var blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "weh-atelier-backup-" + new Date().toISOString().slice(0,10) + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("数据已导出");
}

function importAllData(event){
  var file = event.target.files[0];
  if(!file) return;
  showConfirm("导入数据会覆盖当前所有数据，确定继续？").then(function(ok){
    if(!ok) return;
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var data = JSON.parse(e.target.result);
        for(var key in DATA_KEYS){
          if(data[key]){
            localStorage.setItem(DATA_KEYS[key], JSON.stringify(data[key]));
          }
        }
        if(data.settings){
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
        }
        markLocalChange();
  toast("数据导入成功，页面即将刷新");
        setTimeout(function(){ location.reload(); }, 1000);
      }catch(err){
        toast("导入失败：文件格式错误");
      }
    };
    reader.readAsText(file);
  });
}

function clearModuleData(){
  var module = document.getElementById("clearModuleSelect").value;
  if(!module){
    toast("请先选择要清空的模块");
    return;
  }
  var moduleNames = {money:"存钱记账", health:"吃饭健康", inspire:"灵感捕捉", decision:"决策顾问", report:"工作汇报台", daily:"日计划台", todo:"Weh Tasks"};
  showConfirm("确定清空「" + (moduleNames[module]||module) + "」的所有数据？此操作不可恢复！").then(function(ok){
    if(!ok) return;
    localStorage.removeItem(DATA_KEYS[module]);
    markLocalChange();
  toast("已清空，页面即将刷新");
    setTimeout(function(){ location.reload(); }, 1000);
  });
}

function resetAllData(){
  showConfirm("确定重置全部数据？所有模块的数据和设置都会被清空，此操作不可恢复！").then(function(ok){
    if(!ok) return;
    showConfirm("再次确认：真的要重置全部数据吗？").then(function(ok2){
      if(!ok2) return;
      for(var key in DATA_KEYS){
        localStorage.removeItem(DATA_KEYS[key]);
      }
      localStorage.removeItem(SETTINGS_KEY);
      markLocalChange();
  toast("已重置全部数据，页面即将刷新");
      setTimeout(function(){ location.reload(); }, 1000);
    });
  });
}

function applyPrefsToModules(silent, markChange){
  if(markChange === undefined) markChange = true;
  var s = loadSettings();
  var p = s.preferences || {};
  try{
    var money = loadMoney();
    var changed = false;
    if(money.budget !== p.moneyBudget){ money.budget = p.moneyBudget; changed = true; }
    if(money.fixedSave !== p.moneySave){ money.fixedSave = p.moneySave; changed = true; }
    if(money.cycleStart !== p.moneyCycle){ money.cycleStart = p.moneyCycle; changed = true; }
    if(changed){
      if(markChange) saveMoney(money);
      else localStorage.setItem(MONEY_KEY, JSON.stringify(money));
      if(typeof renderMoney === "function") renderMoney();
    }
  }catch(e){}
  try{
    var health = loadHealth();
    var hc = false;
    if(health.drinkBudget !== p.healthBudget){ health.drinkBudget = p.healthBudget; hc = true; }
    if(health.drinkGoal !== p.healthGoal){ health.drinkGoal = p.healthGoal; hc = true; }
    if(hc){
      if(markChange) saveHealth(health);
      else localStorage.setItem(HEALTH_KEY, JSON.stringify(health));
      if(typeof renderHealth === "function") renderHealth();
    }
  }catch(e){}
  if(typeof renderDaily === "function") renderDaily();
}

function savePreference(){
  var s = loadSettings();
  s.preferences.moneyBudget = parseInt(document.getElementById("prefMoneyBudget").value) || 3000;
  s.preferences.moneySave = parseInt(document.getElementById("prefMoneySave").value) || 600;
  s.preferences.moneyCycle = parseInt(document.getElementById("prefMoneyCycle").value) || 20;
  s.preferences.healthBudget = parseInt(document.getElementById("prefHealthBudget").value) || 100;
  s.preferences.healthGoal = parseInt(document.getElementById("prefHealthGoal").value) || 7;
  s.preferences.dailyStart = parseInt(document.getElementById("prefDailyStart").value) || 9;
  saveSettings(s);
  applyPrefsToModules();
  toast("偏好已保存并同步到模块");
}

function loadPreference(){
  var s = loadSettings();
  var p = s.preferences || {};
  if(document.getElementById("prefMoneyBudget")) document.getElementById("prefMoneyBudget").value = p.moneyBudget || 3000;
  if(document.getElementById("prefMoneySave")) document.getElementById("prefMoneySave").value = p.moneySave || 600;
  if(document.getElementById("prefMoneyCycle")) document.getElementById("prefMoneyCycle").value = p.moneyCycle || 20;
  if(document.getElementById("prefHealthBudget")) document.getElementById("prefHealthBudget").value = p.healthBudget || 100;
  if(document.getElementById("prefHealthGoal")) document.getElementById("prefHealthGoal").value = p.healthGoal || 7;
  if(document.getElementById("prefDailyStart")) document.getElementById("prefDailyStart").value = p.dailyStart || 9;
  if(document.getElementById("glassOpacity")) document.getElementById("glassOpacity").value = s.glassOpacity || 75;
  if(document.getElementById("glassOpacityValue")) document.getElementById("glassOpacityValue").textContent = (s.glassOpacity || 75) + "%";
  if(document.getElementById("blurRadius")) document.getElementById("blurRadius").value = s.blurRadius || 18;
  if(document.getElementById("blurRadiusValue")) document.getElementById("blurRadiusValue").textContent = (s.blurRadius || 18) + "px";
  document.documentElement.style.setProperty("--blur-radius", (s.blurRadius || 18) + "px");
  if(document.getElementById("veilOpacity")) document.getElementById("veilOpacity").value = s.veilOpacity || 50;
  if(document.getElementById("veilOpacityValue")) document.getElementById("veilOpacityValue").textContent = (s.veilOpacity || 50) + "%";
  var veilBase = (s.veilOpacity || 50) / 100;
  document.documentElement.style.setProperty("--veil-alpha", veilBase);
  // 如果applyThemeByHue已经运行过（currentHueH有值），直接设置遮罩
  if(currentHueH > 0){
    document.documentElement.style.setProperty("--veil-top", "hsla("+Math.round(currentHueH)+",50%,97%,"+(veilBase*0.7).toFixed(2)+")");
    document.documentElement.style.setProperty("--veil-bot", "hsla("+Math.round(currentHueH)+",50%,97%,"+veilBase.toFixed(2)+")");
  }
  if(document.getElementById("fontSize")) document.getElementById("fontSize").value = s.fontSize || "medium";
  // 应用已保存的设置
  if(s.theme && s.theme !== "pink") setTheme(s.theme);
  if(s.glassOpacity) document.documentElement.style.setProperty("--glass-opacity", s.glassOpacity/100);
  if(s.fontSize && s.fontSize !== "medium"){
    var sizes = {small:"13px", medium:"14px", large:"15px"};
    document.documentElement.style.fontSize = sizes[s.fontSize] || "14px";
  }
}

function initSettings(){
  applyCardTheme(savedCardTheme);
  loadPreference();
  applyPrefsToModules(true, false);
  syncInit();
}

/* ---------- 全局搜索 ---------- */
function plainText(html){
  var d = document.createElement("div"); d.innerHTML = html || ""; return (d.textContent||"").replace(/\s+/g," ").trim();
}
var GSEARCH_IDX = null, gsList = [];
function buildSearchIndex(){
  var idx = [];
  // 求职岗位
  JOBS.forEach(function(j){
    idx.push({type:"求职", icon:"🐾", title: j.company+" · "+j.pos, sub: (j.city+" ｜ "+j.statusTxt+" ｜ 评分"+j.score),
      keys: (j.company+j.pos+j.city).toLowerCase(),
      open: function(){ closeModal(); go("jobs"); openJob(JOBS.indexOf(j)); }});
  });
  // 简历
  var allRes = (RESUMES.general||[]).slice();
  (RESUMES.custom||[]).forEach(function(cg){ allRes = allRes.concat(cg.items); });
  allRes.forEach(function(r){
    idx.push({type:"简历", icon:"📄", title: r.name, sub: r.desc||"", keys: (r.name+(r.desc||"")).toLowerCase(),
      open: function(){ closeModal(); go("resume"); }});
  });
  // 公司池
  COMPS.forEach(function(g){ g.groups.forEach(function(c){
    (c.name||"").split(/[、，,]/).forEach(function(nm){ nm=nm.trim(); if(!nm) return;
      idx.push({type:"公司", icon:"🐈", title: nm, sub: g.title+" ｜ "+c.cat, keys: (nm+g.title+c.cat).toLowerCase(),
        open: function(){ closeModal(); go("companies"); }});
    });
  });});
  // 知识库笔记
  KBS.forEach(function(k){
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
      (function walk(ns){ ns.forEach(function(n){
        if(n.children){ walk(n.children); }
        else {
          var txt = plainText(n.html);
          idx.push({type:"知识库", icon:n.icon||"📚", title:n.title, sub: txt.slice(0,60), keys: (n.title+" "+txt).toLowerCase(),
            open: function(){ closeModal(); go("knowledge"); }});
        }
      }); })(g.notes||[]);
    });
  });
  // 记账记录
  try{
    var moneyData = JSON.parse(localStorage.getItem("weh_money_data_v1"));
    if(moneyData && moneyData.records){
      moneyData.records.forEach(function(r){
        idx.push({type:"记账", icon:"💰", title: r.category+" ¥"+r.amount, sub: (r.date+(r.time?" "+r.time:"")+(r.note?" · "+r.note:"")),
          keys: (r.category+(r.note||"")).toLowerCase(),
          open: function(){ closeModal(); go("money"); }});
      });
    }
  }catch(e){}
  // 饮食记录
  try{
    var healthData = JSON.parse(localStorage.getItem("weh_health_data_v1"));
    if(healthData && healthData.records){
      healthData.records.forEach(function(r){
        var typeName = r.type==="drink" ? "饮品" : "饮食";
        idx.push({type:"饮食", icon:"🍱", title: r.category+" ¥"+r.amount, sub: (typeName+" ｜ "+r.date+(r.time?" "+r.time:"")+(r.note?" · "+r.note:"")),
          keys: (r.category+(r.note||"")).toLowerCase(),
          open: function(){ closeModal(); go("health"); }});
      });
    }
  }catch(e){}
  // 灵感记录
  try{
    var inspireData = JSON.parse(localStorage.getItem("weh_inspire_data_v1"));
    if(inspireData && inspireData.records){
      inspireData.records.forEach(function(r){
        idx.push({type:"灵感", icon:"💡", title: (r.content||"").slice(0,30), sub: (r.date||"")+(r.tag?" · "+r.tag:""),
          keys: (r.content||"").toLowerCase(),
          open: function(){ closeModal(); go("inspiration"); }});
      });
    }
  }catch(e){}
  // 待办任务
  try{
    var todoData = JSON.parse(localStorage.getItem("weh_todo_data_v1"));
    if(todoData && todoData.items){
      todoData.items.forEach(function(r){
        idx.push({type:"任务", icon:"✅", title: r.title, sub: (r.done?"已完成":"待完成")+(r.dueDate?" · 截止"+r.dueDate:"")+(r.category?" · "+r.category:""),
          keys: (r.title+(r.category||"")).toLowerCase(),
          open: function(){ closeModal(); go("todo"); }});
      });
    }
  }catch(e){}
  // 日计划
  try{
    var dailyData = JSON.parse(localStorage.getItem("weh_daily_data_v1"));
    if(dailyData && dailyData.tasks){
      dailyData.tasks.forEach(function(r){
        var pText = {high:"🔴高", medium:"🟡中", low:"🟢低"}[r.priority] || r.priority;
        idx.push({type:"计划", icon:"📅", title: r.title, sub: (pText+" ｜ "+r.duration+"分钟"+(r.done?" ｜ 已完成":"")),
          keys: r.title.toLowerCase(),
          open: function(){ closeModal(); go("daily"); }});
      });
    }
  }catch(e){}
  // 工作汇报
  try{
    var reportData = JSON.parse(localStorage.getItem("weh_report_data_v1"));
    if(reportData && reportData.history){
      reportData.history.forEach(function(r){
        idx.push({type:"汇报", icon:"📝", title: (r.typeText||"")+" · "+(r.audienceText||""), sub: (r.createdAt||"")+" ｜ "+(r.input||"").slice(0,30),
          keys: ((r.input||"")+(r.typeText||"")).toLowerCase(),
          open: function(){ closeModal(); go("report"); }});
      });
    }
  }catch(e){}
  return idx;
}
function openGlobalSearch(){
  GSEARCH_IDX = buildSearchIndex();
  setModal('<h2>✨ 全域搜索</h2><div class="m-sub">搜记账 / 饮食 / 灵感 / 任务 / 求职 / 知识库，工作台所有内容一键直达</div>'
    + '<div class="search" style="margin-bottom:14px"><span>🔍</span><input id="gsInput" placeholder="输入关键词，如：奶茶 / 面试 / 灵感 / 供应链 / 比亚迪…" autofocus></div>'
    + '<div id="gsResults"></div>');
  var inp = document.getElementById("gsInput");
  function doSearch(){
    var q = (inp.value||"").toLowerCase();
    gsList = q ? GSEARCH_IDX.filter(function(x){ return x.keys.indexOf(q) >= 0; }) : [];
    var html = gsList.slice(0,30).map(function(x,i){
      return '<div class="note-item" onclick="gsOpen('+i+')"><span class="ni-ic">'+x.icon+'</span><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13.5px">'+esc(x.title)+'</div><div style="font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(x.sub)+'</div></div><span style="font-size:11px;color:var(--pink-deep);background:var(--pink-soft);padding:2px 8px;border-radius:20px;flex-shrink:0">'+x.type+'</span></div>';
    }).join("");
    document.getElementById("gsResults").innerHTML = q ? (html || '<div style="text-align:center;color:var(--muted);padding:28px 20px;line-height:1.8">🐾 没有找到相关内容<br><span style="font-size:12px">换个关键词试试，或检查拼写～</span></div>') : '<div style="text-align:center;color:var(--muted);padding:28px 20px;line-height:1.8">🔍 输入关键词开始搜索<br><span style="font-size:12px">支持搜索：记账 / 饮食 / 灵感 / 任务 / 求职 / 知识库等所有模块</span></div>';
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
var currentHueH = 0, currentHueH2 = 38;
function applyThemeByHue(H,H2){
  if(H==null) return;
  if(H2==null) H2=(H+38)%360;
  currentHueH = H; currentHueH2 = H2;
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
  root.setProperty("--card-bg","hsla("+Math.round(H)+",40%,99%,var(--glass-opacity))");
  root.setProperty("--topbar-bg","hsla("+Math.round(H)+",45%,98%,var(--glass-opacity))");
  root.setProperty("--nav-bg","hsla("+Math.round(H)+",45%,99%,var(--glass-opacity))");
  // 整体柔光层（很淡，让背景图透出来），透明度由--veil-alpha控制
  var veilAlpha = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--veil-alpha")) || 0.5;
  root.setProperty("--veil-top","hsla("+Math.round(H)+",50%,97%,"+(veilAlpha*0.7).toFixed(2)+")");
  root.setProperty("--veil-bot","hsla("+Math.round(H)+",50%,97%,"+veilAlpha.toFixed(2)+")");
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
var CARD_THEMES = [
  {key:"pink", name:"樱花粉", bg:"rgba(255,227,238,.8)", border:"#ffd0e2", color:"#c2185b"},
  {key:"purple", name:"香芋紫", bg:"rgba(237,230,255,.8)", border:"#d4c4ff", color:"#6a1b9a"},
  {key:"blue", name:"海盐蓝", bg:"rgba(227,242,255,.8)", border:"#c4e0ff", color:"#1565c0"},
  {key:"green", name:"薄荷绿", bg:"rgba(227,255,238,.8)", border:"#c4ffd4", color:"#2e7d32"},
  {key:"white", name:"云朵白", bg:"rgba(255,255,255,.6)", border:"rgba(255,255,255,.8)", color:"#4a4a4a"}
];
var savedCardTheme = "pink";
try{ savedCardTheme = localStorage.getItem("atelier_card_theme") || "pink"; }catch(e){}
function applyCardTheme(k){
  var t = CARD_THEMES.find(function(x){ return x.key===k; }) || CARD_THEMES[0];
  var r = document.documentElement.style;
  r.setProperty("--quick-bg", t.bg);
  r.setProperty("--quick-border", t.border);
  r.setProperty("--quick-color", t.color);
}
function setCardTheme(k){
  savedCardTheme = k;
  try{ localStorage.setItem("atelier_card_theme", k); }catch(e){}
  applyCardTheme(k); openPersonalize();
}
function cardThemePickHtml(cur){
  var h = '<div class="pick-grid">';
  CARD_THEMES.forEach(function(t){
    h += '<div class="pick-item '+(t.key===cur?" active":"")+'" onclick="setCardTheme(\''+t.key+'\')">'
      + '<div style="width:100%;height:60px;border-radius:12px;background:'+t.bg+';border:1px solid '+t.border+';display:flex;align-items:center;justify-content:center;color:'+t.color+';font-weight:700;font-size:12px">'+t.name+'</div>'
      + '<div class="pn">'+t.name+'</div></div>';
  });
  return h+'</div>';
}
function openPersonalize(){
  setModal('<h2>🐱 换个风格</h2><div class="m-sub">点下面的图片，实时换背景和头像，你的选择会被记住；换左上角Logo请直接点它</div>'
    + '<div class="pick-sec"><div class="m-sec">🖼️ 背景图</div><div class="pick-hint">选一张做整站背景（会自动提取主色调）</div>'+pickHtml("Bg", BG_IMGS, savedBg)+'</div>'
    + '<div class="pick-sec"><div class="m-sec">😺 小头像</div><div class="pick-hint">右上角头像，点它随时能换</div>'+pickHtml("Av", AV_IMGS, savedAv)+'</div>'
    + '<div class="pick-sec"><div class="m-sec">🎨 卡片配色</div><div class="pick-hint">首页内层按钮的颜色</div>'+cardThemePickHtml(savedCardTheme)+'</div>');
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
  inspiration:"💡 灵感捕捉", decision:"🎯 决策顾问", report:"📝 工作汇报台",
  baichuan:"📚 灵犀库", career:"💼 SCM Career", cet6:"📖 CET-6备战", sop:"🛠️ 工作SOP",
  daily:"📅 日计划台", todo:"✅ 待办清单", settings:"⚙️ 设置",
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
  // 底栏显示控制（SCM Career / CET-6 / 灵犀库 / 工作SOP）
  document.body.classList.toggle("career-active", view==="career");
  document.body.classList.toggle("cet6-active", view==="cet6");
  document.body.classList.toggle("baichuan-active", view==="baichuan");
  document.body.classList.toggle("sop-active", view==="sop");
  var backBtn = document.getElementById("backBtn");
  if(backBtn){
    var _mobile = window.matchMedia && window.matchMedia("(max-width:820px)").matches;
    backBtn.style.display = (view==="home" || !_mobile) ? "none" : "flex";
  }
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
      // 初始化灵犀库底栏子模块
      initBaichuanSubTabs();
    }
    if(document.getElementById("cet6KbGrid")){
      flattenKb(); renderGenericKb("cet6KbGrid", CET6KBS, {_total:"cet6KbCount","词汇":"cet6WordCount","错题":"cet6ErrorCount","学习资料":"cet6MatCount"});
      // 初始化六级底栏子模块
      initCet6SubTabs();
    }
    if(document.getElementById("sopKbGrid")){
      flattenKb(); renderGenericKb("sopKbGrid", SOPKBS, {_total:"sopKbCount","工作流程":"sopFlowCount","岗位知识":"sopKnowCount","错题":"sopErrorCount"});
      // 初始化工作SOP底栏子模块
      initSopSubTabs();
    }
    if(document.getElementById("moneyRemain")){
      renderMoney();
    }
    if(document.getElementById("healthSpent")){
      renderHealth();
    }
    if(document.getElementById("decChatMessages")){
      initDecision();
    }
    if(document.getElementById("inspireList")){
      renderInspire();
    }
    if(document.getElementById("todoList")){
      renderTodo();
    }
    updateHomeStats();
    if(document.getElementById("reportInput")){
      initReport();
    }
    if(document.getElementById("dailyInput")){
      initDaily();
    }
    if(document.getElementById("settings-profile")){
      initSettings();
    }
    // 更新统计数字
    function countAllNotes(notes){
      var count = 0;
      (notes||[]).forEach(function(n){
        count += n.children ? countAllNotes(n.children) : 1;
      });
      return count;
    }
    var kbTotal = 0;
    KBS.forEach(function(k){
      (k.groups||[{notes:k.notes||[]}]).forEach(function(g){
        kbTotal += countAllNotes(g.notes);
      });
    });
    if(document.getElementById("kbCount")) document.getElementById("kbCount").textContent = kbTotal;
      if(document.getElementById("jobCount")) document.getElementById("jobCount").textContent = (JOBS||[]).length;
      var resTotal = (RESUMES.general||[]).length;
      (RESUMES.custom||[]).forEach(function(c){ resTotal += (c.items||[]).length; });
      if(document.getElementById("resumeCount")) document.getElementById("resumeCount").textContent = resTotal;
      var compTotal = 0;
      (COMPS||[]).forEach(function(g){ (g.groups||[]).forEach(function(c){ compTotal += ((c.name||"").split(/[、，,]/).filter(function(x){return x.trim()}).length); }); });
      if(document.getElementById("companyCount")) document.getElementById("companyCount").textContent = compTotal;
      // 初始化底栏子模块
      initCareerSubTabs();
      // 旧版求职首页的渲染
      if(document.getElementById("statJobs")){
        renderHome(); renderJobs(); renderCompanies(); renderTimeline(); renderResumes();
      }
  }catch(e){ console.log("求职模块渲染跳过:", e.message); }


/* ===== SCM Career 底栏子模块导航 ===== */
function initCareerSubTabs(){
  var tabs = document.querySelectorAll('#module-career .sub-tab');
  if(!tabs.length) return;
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var sub = this.getAttribute('data-sub');
      switchCareerSub(sub);
    });
  });
  // 渲染各子模块内容
  renderCareerJobs();
  renderCareerResumes();
  renderCareerKbCategory();
}

function switchCareerSub(sub){
  // 切换tab激活状态
  document.querySelectorAll('#module-career .sub-tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('data-sub') === sub);
  });
  // 切换内容显示
  document.querySelectorAll('#module-career .career-sub').forEach(function(el){
    el.style.display = (el.id === 'career-sub-' + sub) ? '' : 'none';
  });
}

function careerListItem(icon, title, sub, badge, onclick){
  return '<div class="career-list-item" onclick="'+onclick+'">'
    + '<div class="career-list-icon">'+icon+'</div>'
    + '<div class="career-list-info">'
    + '<div class="career-list-title">'+esc(title)+'</div>'
    + (sub ? '<div class="career-list-sub">'+esc(sub)+'</div>' : '')
    + '</div>'
    + (badge ? '<div class="career-list-badge">'+esc(badge)+'</div>' : '')
    + '</div>';
}

function renderCareerJobs(){
  var listEl = document.getElementById('careerJobsList');
  var countEl = document.getElementById('careerJobsCount');
  if(!listEl) return;
  if(!JOBS || !JOBS.length){
    listEl.innerHTML = '<div class="career-list-empty">🐾 还没有搜集岗位，去知识库添加吧～</div>';
    if(countEl) countEl.textContent = '';
    return;
  }
  if(countEl) countEl.textContent = JOBS.length + ' 个';
  var html = JOBS.map(function(j, i){
    var badge = j.score + '分';
    var sub = '📍 ' + (j.city||'') + ' · 💰 ' + (j.salary||'') + ' · ' + (j.statusTxt||'');
    return careerListItem('🐾', j.company + ' · ' + j.pos, sub, badge, 'openJob('+i+')');
  }).join('');
  listEl.innerHTML = html;
}

function renderCareerResumes(){
  // 先初始化RESUME_LIST（openResume依赖它）
  RESUME_LIST = [];
  (RESUMES.general||[]).forEach(function(r){ r._i = RESUME_LIST.length; RESUME_LIST.push(r); });
  (RESUMES.custom||[]).forEach(function(cg){ (cg.items||[]).forEach(function(r){ r._i = RESUME_LIST.length; RESUME_LIST.push(r); }); });
  // 通用简历
  var genEl = document.getElementById('careerResumesGeneral');
  if(genEl){
    if(!RESUMES.general || !RESUMES.general.length){
      genEl.innerHTML = '<div class="career-list-empty">📄 还没有通用简历模板</div>';
    } else {
      genEl.innerHTML = RESUMES.general.map(function(r, i){
        return careerListItem('📄', r.name, r.desc, '', 'openResume('+i+')');
      }).join('');
    }
  }
  // 定制简历
  var cusEl = document.getElementById('careerResumesCustom');
  var cusCountEl = document.getElementById('careerResumesCustomCount');
  if(cusEl){
    var allCustom = [];
    (RESUMES.custom||[]).forEach(function(cg){
      (cg.items||[]).forEach(function(r){
        allCustom.push({r:r, company:cg.company});
      });
    });
    if(cusCountEl) cusCountEl.textContent = allCustom.length ? allCustom.length + ' 份' : '';
    if(!allCustom.length){
      cusEl.innerHTML = '<div class="career-list-empty">🎯 还没有定制简历，针对目标岗位生成吧～</div>';
    } else {
      cusEl.innerHTML = allCustom.map(function(item, i){
        var r = item.r;
        var idx = RESUMES.general.length + i;
        return careerListItem('🎯', r.name, '💙 ' + item.company + ' · ' + (r.desc||''), '', 'openResume('+idx+')');
      }).join('');
    }
  }
}

function renderCareerKbCategory(){
  // 从KBS中找到对应分类并渲染
  var categories = {
    'careerInterviewList': '03_笔面试题库',
    'careerReviewList': '04_实战复盘',
    'careerSupplyChainList': '05_供应链知识库',
    'careerCertList': '06_证书与附件',
    'careerPersonalList': '08_个人资料库'
  };
  Object.keys(categories).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    var catName = categories[elId];
    var kb = (KBS||[]).find(function(k){ return k.name && k.name.indexOf(catName) >= 0; });
    if(!kb || !kb.groups || !kb.groups.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容</div>';
      return;
    }
    var allNotes = [];
    kb.groups.forEach(function(g){
      (g.notes||[]).forEach(function(n){ allNotes.push(n); });
    });
    if(!allNotes.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容</div>';
      return;
    }
    // 找到在KB_FLAT中的索引
    el.innerHTML = allNotes.map(function(n){
      var idx = KB_FLAT.indexOf(n);
      var onclick = idx >= 0 ? 'openKbNote('+idx+')' : '';
      return careerListItem(n.icon || '📄', n.title, '', '', onclick);
    }).join('');
  });
}


/* ===== CET-6 六级底栏子模块导航 ===== */
function initCet6SubTabs(){
  var tabs = document.querySelectorAll('#module-cet6 .sub-tab');
  if(!tabs.length) return;
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var sub = this.getAttribute('data-sub');
      switchCet6Sub(sub);
    });
  });
  // 渲染各子模块内容
  renderCet6Category();
  // 初始化概览子模块（倒计时 + 打卡 + 进度）
  initCet6Overview();
}

function switchCet6Sub(sub){
  // 切换tab激活状态
  document.querySelectorAll('#module-cet6 .sub-tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('data-sub') === sub);
  });
  // 切换内容显示
  document.querySelectorAll('#module-cet6 .cet6-sub').forEach(function(el){
    el.style.display = (el.id === 'cet6-sub-' + sub) ? '' : 'none';
  });
}

function renderCet6Category(){
  // 从CET6KBS中找到对应分类并渲染
  var categories = {
    'cet6WordsList': '01-词汇',
    'cet6ListeningList': '02-听力',
    'cet6ReadingList': '03-阅读',
    'cet6WritingList': '04-写作',
    'cet6TranslationList': '05-翻译',
    'cet6ErrorsList': '06-错题本',
    'cet6MaterialsList': '07-学习资料'
  };
  var countMap = {
    'cet6WordsList': 'cet6WordsCount',
    'cet6ListeningList': 'cet6ListeningCount',
    'cet6ReadingList': 'cet6ReadingCount',
    'cet6WritingList': 'cet6WritingCount',
    'cet6TranslationList': 'cet6TranslationCount',
    'cet6ErrorsList': 'cet6ErrorsCount',
    'cet6MaterialsList': 'cet6MaterialsCount'
  };
  Object.keys(categories).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    var catName = categories[elId];
    var kb = (CET6KBS||[]).find(function(k){ return k.name && k.name.indexOf(catName) >= 0; });
    var countEl = document.getElementById(countMap[elId]);
    if(!kb || !kb.groups || !kb.groups.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容，去知识库添加吧～</div>';
      if(countEl) countEl.textContent = '';
      return;
    }
    var allNotes = [];
    kb.groups.forEach(function(g){
      (g.notes||[]).forEach(function(n){ allNotes.push(n); });
    });
    if(countEl) countEl.textContent = allNotes.length + ' 篇';
    if(!allNotes.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容</div>';
      return;
    }
    // 找到在KB_FLAT中的索引
    el.innerHTML = allNotes.map(function(n){
      var idx = KB_FLAT.indexOf(n);
      var onclick = idx >= 0 ? 'openKbNote('+idx+')' : '';
      var sub = n.date ? '📅 ' + n.date : '';
      return careerListItem(n.icon || '📄', n.title, sub, '', onclick);
    }).join('');
  });
}


/* ===== 六级模块 - 概览子模块增强功能 ===== */

// 考试日期
var CET6_EXAM_DATE = new Date('2026-12-12');

// 初始化六级概览（倒计时 + 打卡 + 进度）
function initCet6Overview(){
  updateCet6Countdown();
  loadCet6CheckinData();
  renderCet6WeekCalendar();
  updateCet6TrainingProgress();
  // 初始化词汇模块
  renderCet6Vocab();
  renderCet6ReviewList();
  updateCet6VocabStats();
  // 初始化错题模块
  renderCet6Errors();
  renderCet6ErrorReviewList();
  renderCet6ErrorTagsDist();
  updateCet6ErrorStats();
  // 初始化听力模块
  renderCet6Listen();
  updateCet6ListenStats();
  // 初始化阅读模块
  renderCet6Read();
  updateCet6ReadStats();
  // 初始化写译模块
  renderCet6Write();
  updateCet6WriteStats();
}

// 更新倒计时
function updateCet6Countdown(){
  var now = new Date();
  var diff = Math.ceil((CET6_EXAM_DATE - now) / (1000 * 60 * 60 * 24));
  var el = document.getElementById('cet6Countdown');
  if(el) el.textContent = diff > 0 ? diff : 0;
  var aiEl = document.getElementById('cet6AiDays');
  if(aiEl) aiEl.textContent = diff > 0 ? diff : 0;
}

// 打卡数据存储 key: cet6_checkin_YYYY-MM-DD, value: {words:bool, listening:bool, reading:bool, writing:bool, review:bool}
function getCet6CheckinKey(date){
  var d = date || new Date();
  return 'cet6_checkin_' + d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getCet6CheckinData(date){
  var key = getCet6CheckinKey(date);
  try{
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {words:false, listening:false, reading:false, writing:false, review:false};
  }catch(e){
    return {words:false, listening:false, reading:false, writing:false, review:false};
  }
}

function saveCet6CheckinData(date, data){ markLocalChange();
  var key = getCet6CheckinKey(date);
  localStorage.setItem(key, JSON.stringify(data));
}

// 切换任务完成状态
function toggleCet6Task(task){
  var today = new Date();
  var data = getCet6CheckinData(today);
  data[task] = !data[task];
  saveCet6CheckinData(today, data);
  loadCet6CheckinData();
  renderCet6WeekCalendar();
}

// 加载今日打卡数据并渲染
function loadCet6CheckinData(){
  var today = new Date();
  var data = getCet6CheckinData(today);
  var tasks = ['words', 'listening', 'reading', 'writing', 'review'];
  var doneCount = 0;
  tasks.forEach(function(task){
    var item = document.querySelector('.cet6-task-item[data-task="'+task+'"]');
    if(item){
      if(data[task]){
        item.classList.add('done');
        doneCount++;
      }else{
        item.classList.remove('done');
      }
    }
  });
  var progressEl = document.getElementById('cet6TodayProgress');
  if(progressEl) progressEl.textContent = doneCount + '/5';
  // 更新本周打卡和连续打卡
  updateCet6WeekAndStreak();
}

// 渲染本周打卡日历
function renderCet6WeekCalendar(){
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0=周日, 1=周一
  // 计算本周一的日期
  var monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  // 渲染每一天
  for(var i = 0; i < 7; i++){
    var date = new Date(monday);
    date.setDate(monday.getDate() + i);
    var dayNum = date.getDay(); // 0=周日
    var dayEl = document.querySelector('.cet6-week-day[data-day="'+dayNum+'"]');
    if(dayEl){
      // 检查这一天是否打卡（5项全完成才算打卡）
      var data = getCet6CheckinData(date);
      var allDone = data.words && data.listening && data.reading && data.writing && data.review;
      if(allDone){
        dayEl.classList.add('checked');
      }else{
        dayEl.classList.remove('checked');
      }
      // 标记今天
      if(date.toDateString() === today.toDateString()){
        dayEl.classList.add('today');
      }else{
        dayEl.classList.remove('today');
      }
    }
  }
}

// 更新本周打卡天数和连续打卡天数
function updateCet6WeekAndStreak(){
  var today = new Date();
  var dayOfWeek = today.getDay();
  var monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  // 计算本周打卡天数
  var weekCount = 0;
  for(var i = 0; i < 7; i++){
    var date = new Date(monday);
    date.setDate(monday.getDate() + i);
    if(date > today) break; // 未来的不算
    var data = getCet6CheckinData(date);
    if(data.words && data.listening && data.reading && data.writing && data.review){
      weekCount++;
    }
  }
  var weekEl = document.getElementById('cet6WeekCheckin');
  if(weekEl) weekEl.textContent = weekCount;
  // 计算连续打卡天数（从今天往前数）
  var streak = 0;
  var checkDate = new Date(today);
  while(true){
    var data = getCet6CheckinData(checkDate);
    if(data.words && data.listening && data.reading && data.writing && data.review){
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }else{
      break;
    }
  }
  var streakEl = document.getElementById('cet6Streak');
  if(streakEl) streakEl.textContent = streak;
}

// 更新分项训练进度（从知识库笔记数量估算）
function updateCet6TrainingProgress(){
  // 听力：从02-听力分类的笔记数估算
  var listeningKb = (CET6KBS||[]).find(function(k){ return k.name && k.name.indexOf('02-听力') >= 0; });
  var listeningCount = 0;
  if(listeningKb && listeningKb.groups){
    listeningKb.groups.forEach(function(g){ listeningCount += (g.notes||[]).length; });
  }
  updateCet6Progress('cet6Listening', listeningCount, 40);
  // 阅读：从03-阅读分类
  var readingKb = (CET6KBS||[]).find(function(k){ return k.name && k.name.indexOf('03-阅读') >= 0; });
  var readingCount = 0;
  if(readingKb && readingKb.groups){
    readingKb.groups.forEach(function(g){ readingCount += (g.notes||[]).length; });
  }
  updateCet6Progress('cet6Reading', readingCount, 80);
  // 写作：从04-写作分类
  var writingKb = (CET6KBS||[]).find(function(k){ return k.name && k.name.indexOf('04-写作') >= 0; });
  var writingCount = 0;
  if(writingKb && writingKb.groups){
    writingKb.groups.forEach(function(g){ writingCount += (g.notes||[]).length; });
  }
  updateCet6Progress('cet6Writing', writingCount, 30);
  // 翻译：从05-翻译分类
  var translationKb = (CET6KBS||[]).find(function(k){ return k.name && k.name.indexOf('05-翻译') >= 0; });
  var translationCount = 0;
  if(translationKb && translationKb.groups){
    translationKb.groups.forEach(function(g){ translationCount += (g.notes||[]).length; });
  }
  updateCet6Progress('cet6Translation', translationCount, 60);
}

function updateCet6Progress(prefix, done, total){
  var doneEl = document.getElementById(prefix + 'Done');
  var progressEl = document.getElementById(prefix + 'Progress');
  if(doneEl) doneEl.textContent = done;
  if(progressEl) progressEl.style.width = Math.min(100, (done / total * 100)) + '%';
}


/* ===== 六级模块 - 词汇管理功能 ===== */

// 单词数据存储 key: cet6_vocab_words, value: [{id, word, phonetic, meaning, example, addedDate, mastered, reviewDate, reviewCount}]
var CET6_VOCAB_KEY = 'cet6_vocab_words';
var cet6VocabFilter = 'all';
var cet6VocabSearchTerm = '';

// 艾宾浩斯记忆曲线复习间隔（天）
var REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

function getCet6VocabWords(){
  try{
    var data = localStorage.getItem(CET6_VOCAB_KEY);
    return data ? JSON.parse(data) : [];
  }catch(e){
    return [];
  }
}

function saveCet6VocabWords(words){ markLocalChange();
  localStorage.setItem(CET6_VOCAB_KEY, JSON.stringify(words));
}

// 显示添加单词弹窗
function showCet6AddWordModal(){
  var modal = document.getElementById('cet6AddWordModal');
  if(modal) modal.style.display = 'flex';
  // 清空表单
  document.getElementById('cet6NewWord').value = '';
  document.getElementById('cet6NewPhonetic').value = '';
  document.getElementById('cet6NewMeaning').value = '';
  document.getElementById('cet6NewExample').value = '';
  setTimeout(function(){ document.getElementById('cet6NewWord').focus(); }, 100);
}

function hideCet6AddWordModal(event){
  if(event && event.target !== event.currentTarget) return;
  var modal = document.getElementById('cet6AddWordModal');
  if(modal) modal.style.display = 'none';
}

// 添加单词
function addCet6Word(){
  var word = document.getElementById('cet6NewWord').value.trim();
  var phonetic = document.getElementById('cet6NewPhonetic').value.trim();
  var meaning = document.getElementById('cet6NewMeaning').value.trim();
  var example = document.getElementById('cet6NewExample').value.trim();
  if(!word || !meaning){
    toast('请填写单词和释义');
    return;
  }
  var words = getCet6VocabWords();
  var now = new Date();
  var newWord = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    word: word,
    phonetic: phonetic,
    meaning: meaning,
    example: example,
    addedDate: now.toISOString(),
    mastered: false,
    reviewDate: now.toISOString(),
    reviewCount: 0
  };
  words.unshift(newWord);
  saveCet6VocabWords(words);
  hideCet6AddWordModal();
  renderCet6Vocab();
  updateCet6VocabStats();
}

// 删除单词
function deleteCet6Word(id){
  showConfirm('确定要删除这个单词吗？').then(function(ok){
    if(!ok) return;
    var words = getCet6VocabWords();
    words = words.filter(function(w){ return w.id !== id; });
    saveCet6VocabWords(words);
    renderCet6Vocab();
    updateCet6VocabStats();
  });
}

// 切换掌握状态
function toggleCet6WordMastered(id){
  var words = getCet6VocabWords();
  var word = words.find(function(w){ return w.id === id; });
  if(word){
    word.mastered = !word.mastered;
    if(word.mastered){
      word.reviewCount = REVIEW_INTERVALS.length;
    }else{
      word.reviewCount = 0;
      word.reviewDate = new Date().toISOString();
    }
    saveCet6VocabWords(words);
    renderCet6Vocab();
    updateCet6VocabStats();
  }
}

// 复习单词（认识/不认识）
function reviewCet6Word(id, know){
  var words = getCet6VocabWords();
  var word = words.find(function(w){ return w.id === id; });
  if(word){
    if(know){
      word.reviewCount = Math.min(word.reviewCount + 1, REVIEW_INTERVALS.length);
      if(word.reviewCount >= REVIEW_INTERVALS.length){
        word.mastered = true;
      }else{
        var nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[word.reviewCount]);
        word.reviewDate = nextReview.toISOString();
      }
    }else{
      word.reviewCount = 0;
      word.reviewDate = new Date().toISOString();
    }
    saveCet6VocabWords(words);
    renderCet6Vocab();
    renderCet6ReviewList();
    updateCet6VocabStats();
  }
}

// 获取今日待复习单词
function getCet6ReviewWords(){
  var words = getCet6VocabWords();
  var now = new Date();
  return words.filter(function(w){
    if(w.mastered) return false;
    var reviewDate = new Date(w.reviewDate);
    return reviewDate <= now;
  });
}

// 渲染待复习列表
function renderCet6ReviewList(){
  var reviewWords = getCet6ReviewWords();
  var card = document.getElementById('cet6ReviewCard');
  var list = document.getElementById('cet6ReviewList');
  var count = document.getElementById('cet6ReviewCount');
  if(!card || !list) return;
  if(reviewWords.length === 0){
    card.style.display = 'none';
    return;
  }
  card.style.display = '';
  if(count) count.textContent = reviewWords.length + ' 个';
  list.innerHTML = reviewWords.slice(0, 10).map(function(w){
    return '<div class="cet6-review-item">' +
      '<div class="cet6-review-word">' + escapeHtml(w.word) + '</div>' +
      (w.phonetic ? '<div class="cet6-review-phonetic">' + escapeHtml(w.phonetic) + '</div>' : '') +
      '<div class="cet6-review-meaning">' + escapeHtml(w.meaning) + '</div>' +
      '<div class="cet6-review-actions">' +
      '<button class="cet6-review-btn know" onclick="reviewCet6Word(\'' + w.id + '\', true)">认识</button>' +
      '<button class="cet6-review-btn dont-know" onclick="reviewCet6Word(\'' + w.id + '\', false)">不认识</button>' +
      '</div></div>';
  }).join('');
}

// 筛选单词
function filterCet6Vocab(filter){
  cet6VocabFilter = filter;
  document.querySelectorAll('.cet6-filter-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderCet6Vocab();
}

// 搜索单词
function searchCet6Vocab(){
  var input = document.getElementById('cet6VocabSearch');
  cet6VocabSearchTerm = input ? input.value.trim().toLowerCase() : '';
  renderCet6Vocab();
}

// 渲染单词列表
function renderCet6Vocab(){
  var list = document.getElementById('cet6VocabList');
  if(!list) return;
  var words = getCet6VocabWords();
  // 筛选
  if(cet6VocabFilter === 'mastered'){
    words = words.filter(function(w){ return w.mastered; });
  }else if(cet6VocabFilter === 'unmastered'){
    words = words.filter(function(w){ return !w.mastered; });
  }
  // 搜索
  if(cet6VocabSearchTerm){
    words = words.filter(function(w){
      return w.word.toLowerCase().indexOf(cet6VocabSearchTerm) >= 0 ||
             w.meaning.toLowerCase().indexOf(cet6VocabSearchTerm) >= 0;
    });
  }
  if(words.length === 0){
    list.innerHTML = '<div class="cet6-vocab-empty">📖 没有找到匹配的单词</div>';
    return;
  }
  list.innerHTML = words.map(function(w){
    return '<div class="cet6-vocab-item' + (w.mastered ? ' mastered' : '') + '">' +
      '<div class="cet6-vocab-word">' + escapeHtml(w.word) + '</div>' +
      (w.phonetic ? '<div class="cet6-vocab-phonetic">' + escapeHtml(w.phonetic) + '</div>' : '') +
      '<div style="flex:1;min-width:0">' +
      '<div class="cet6-vocab-meaning">' + escapeHtml(w.meaning) + '</div>' +
      (w.example ? '<div class="cet6-vocab-example">' + escapeHtml(w.example) + '</div>' : '') +
      '</div>' +
      '<div class="cet6-vocab-actions">' +
      '<button class="cet6-vocab-action-btn mastered-btn" title="' + (w.mastered ? '取消掌握' : '标记掌握') + '" onclick="toggleCet6WordMastered(\'' + w.id + '\')">' + (w.mastered ? '✅' : '⬜') + '</button>' +
      '<button class="cet6-vocab-action-btn delete-btn" title="删除" onclick="deleteCet6Word(\'' + w.id + '\')">🗑️</button>' +
      '</div></div>';
  }).join('');
}

// 更新词汇统计
function updateCet6VocabStats(){
  var words = getCet6VocabWords();
  var total = words.length;
  var mastered = words.filter(function(w){ return w.mastered; }).length;
  var reviewWords = getCet6ReviewWords();
  var review = reviewWords.length;
  // 今日新增
  var today = new Date();
  var todayStr = today.toDateString();
  var todayCount = words.filter(function(w){
    return new Date(w.addedDate).toDateString() === todayStr;
  }).length;
  // 更新统计卡片
  var totalEl = document.getElementById('cet6VocabTotal');
  if(totalEl) totalEl.textContent = total;
  var masteredEl = document.getElementById('cet6VocabMastered');
  if(masteredEl) masteredEl.textContent = mastered;
  var reviewEl = document.getElementById('cet6VocabReview');
  if(reviewEl) reviewEl.textContent = review;
  var todayEl = document.getElementById('cet6VocabToday');
  if(todayEl) todayEl.textContent = todayCount;
  // 更新今日进度
  var todayCountEl = document.getElementById('cet6VocabTodayCount');
  if(todayCountEl) todayCountEl.textContent = todayCount;
  var progressEl = document.getElementById('cet6VocabTodayProgress');
  if(progressEl) progressEl.style.width = Math.min(100, (todayCount / 100 * 100)) + '%';
  // 更新概览的生词统计
  var wordTotalEl = document.getElementById('cet6WordTotal');
  if(wordTotalEl) wordTotalEl.textContent = total;
  var wordMasteredEl = document.getElementById('cet6WordMastered');
  if(wordMasteredEl) wordMasteredEl.textContent = mastered;
}

// HTML转义
function escapeHtml(text){
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


/* ===== 六级模块 - 错题管理功能 ===== */

var CET6_ERROR_KEY = 'cet6_error_questions';
var cet6ErrorFilter = 'all';
var cet6ErrorSearchTerm = '';
var cet6SelectedErrorTag = '';

function getCet6Errors(){
  try{
    var data = localStorage.getItem(CET6_ERROR_KEY);
    return data ? JSON.parse(data) : [];
  }catch(e){
    return [];
  }
}

function saveCet6Errors(errors){ markLocalChange();
  localStorage.setItem(CET6_ERROR_KEY, JSON.stringify(errors));
}

// 显示添加错题弹窗
function showCet6AddErrorModal(){
  var modal = document.getElementById('cet6AddErrorModal');
  if(modal) modal.style.display = 'flex';
  cet6SelectedErrorTag = '';
  document.querySelectorAll('.cet6-error-tag-option').forEach(function(el){
    el.classList.remove('selected');
  });
  document.getElementById('cet6ErrorType').value = '听力';
  document.getElementById('cet6ErrorQuestion').value = '';
  document.getElementById('cet6ErrorAnswer').value = '';
  document.getElementById('cet6ErrorAnalysis').value = '';
  document.getElementById('cet6ErrorSource').value = '';
  setTimeout(function(){ document.getElementById('cet6ErrorQuestion').focus(); }, 100);
}

function hideCet6AddErrorModal(event){
  if(event && event.target !== event.currentTarget) return;
  var modal = document.getElementById('cet6AddErrorModal');
  if(modal) modal.style.display = 'none';
}

// 选择错因标签
function selectCet6ErrorTag(tag){
  cet6SelectedErrorTag = tag;
  document.querySelectorAll('.cet6-error-tag-option').forEach(function(el){
    el.classList.toggle('selected', el.getAttribute('data-tag') === tag);
  });
}

// 添加错题
function addCet6Error(){
  var type = document.getElementById('cet6ErrorType').value;
  var question = document.getElementById('cet6ErrorQuestion').value.trim();
  var answer = document.getElementById('cet6ErrorAnswer').value.trim();
  var analysis = document.getElementById('cet6ErrorAnalysis').value.trim();
  var source = document.getElementById('cet6ErrorSource').value.trim();
  if(!cet6SelectedErrorTag){
    toast('请选择错因标签');
    return;
  }
  if(!question){
    toast('请填写题目内容');
    return;
  }
  var errors = getCet6Errors();
  var now = new Date();
  var newError = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: type,
    tag: cet6SelectedErrorTag,
    question: question,
    answer: answer,
    analysis: analysis,
    source: source,
    addedDate: now.toISOString(),
    mastered: false,
    reviewDate: now.toISOString(),
    reviewCount: 0
  };
  errors.unshift(newError);
  saveCet6Errors(errors);
  hideCet6AddErrorModal();
  renderCet6Errors();
  renderCet6ErrorReviewList();
  renderCet6ErrorTagsDist();
  updateCet6ErrorStats();
}

// 删除错题
function deleteCet6Error(id){
  showConfirm('确定要删除这道错题吗？').then(function(ok){
    if(!ok) return;
    var errors = getCet6Errors();
    errors = errors.filter(function(e){ return e.id !== id; });
    saveCet6Errors(errors);
    renderCet6Errors();
    renderCet6ErrorReviewList();
    renderCet6ErrorTagsDist();
    updateCet6ErrorStats();
  });
}

// 切换掌握状态
function toggleCet6ErrorMastered(id){
  var errors = getCet6Errors();
  var error = errors.find(function(e){ return e.id === id; });
  if(error){
    error.mastered = !error.mastered;
    if(error.mastered){
      error.reviewCount = REVIEW_INTERVALS.length;
    }else{
      error.reviewCount = 0;
      error.reviewDate = new Date().toISOString();
    }
    saveCet6Errors(errors);
    renderCet6Errors();
    renderCet6ErrorReviewList();
    updateCet6ErrorStats();
  }
}

// 复习错题
function reviewCet6Error(id, know){
  var errors = getCet6Errors();
  var error = errors.find(function(e){ return e.id === id; });
  if(error){
    if(know){
      error.reviewCount = Math.min(error.reviewCount + 1, REVIEW_INTERVALS.length);
      if(error.reviewCount >= REVIEW_INTERVALS.length){
        error.mastered = true;
      }else{
        var nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[error.reviewCount]);
        error.reviewDate = nextReview.toISOString();
      }
    }else{
      error.reviewCount = 0;
      error.reviewDate = new Date().toISOString();
    }
    saveCet6Errors(errors);
    renderCet6Errors();
    renderCet6ErrorReviewList();
    updateCet6ErrorStats();
  }
}

// 获取待复习错题
function getCet6ErrorReviewWords(){
  var errors = getCet6Errors();
  var now = new Date();
  return errors.filter(function(e){
    if(e.mastered) return false;
    var reviewDate = new Date(e.reviewDate);
    return reviewDate <= now;
  });
}

// 渲染待复习列表
function renderCet6ErrorReviewList(){
  var reviewErrors = getCet6ErrorReviewWords();
  var card = document.getElementById('cet6ErrorReviewCard');
  var list = document.getElementById('cet6ErrorReviewList');
  var count = document.getElementById('cet6ErrorReviewCount');
  if(!card || !list) return;
  if(reviewErrors.length === 0){
    card.style.display = 'none';
    return;
  }
  card.style.display = '';
  if(count) count.textContent = reviewErrors.length + ' 道';
  list.innerHTML = reviewErrors.slice(0, 5).map(function(e){
    return '<div class="cet6-error-review-item">' +
      '<div class="cet6-error-review-header">' +
      '<span class="cet6-error-tag-badge ' + e.tag + '">' + e.tag + '</span>' +
      '<span class="cet6-error-type-badge">' + e.type + '</span>' +
      '</div>' +
      '<div class="cet6-error-review-question">' + escapeHtml(e.question.substring(0, 100)) + (e.question.length > 100 ? '...' : '') + '</div>' +
      (e.answer ? '<div class="cet6-error-review-answer">答案：' + escapeHtml(e.answer) + '</div>' : '') +
      '<div class="cet6-error-review-actions">' +
      '<button class="cet6-review-btn know" onclick="reviewCet6Error(\'' + e.id + '\', true)">掌握了</button>' +
      '<button class="cet6-review-btn dont-know" onclick="reviewCet6Error(\'' + e.id + '\', false)">还不会</button>' +
      '</div></div>';
  }).join('');
}

// 渲染错因分布
function renderCet6ErrorTagsDist(){
  var errors = getCet6Errors();
  var tags = ['词汇', '定位', '理解', '逻辑', '粗心', '其他'];
  var dist = document.getElementById('cet6ErrorTagsDist');
  if(!dist) return;
  var total = errors.length;
  dist.innerHTML = tags.map(function(tag){
    var count = errors.filter(function(e){ return e.tag === tag; }).length;
    if(count === 0) return '';
    var cls = tag === '词汇' ? 'vocab' : tag;
    return '<span class="cet6-error-tag-dist ' + cls + '">' + tag + ' ' + count + '</span>';
  }).join('');
}

// 筛选错题
function filterCet6Errors(filter){
  cet6ErrorFilter = filter;
  document.querySelectorAll('#cet6ErrorFilters .cet6-filter-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderCet6Errors();
}

// 搜索错题
function searchCet6Errors(){
  var input = document.getElementById('cet6ErrorSearch');
  cet6ErrorSearchTerm = input ? input.value.trim().toLowerCase() : '';
  renderCet6Errors();
}

// 渲染错题列表
function renderCet6Errors(){
  var list = document.getElementById('cet6ErrorList');
  if(!list) return;
  var errors = getCet6Errors();
  // 筛选
  if(cet6ErrorFilter !== 'all'){
    errors = errors.filter(function(e){ return e.tag === cet6ErrorFilter; });
  }
  // 搜索
  if(cet6ErrorSearchTerm){
    errors = errors.filter(function(e){
      return e.question.toLowerCase().indexOf(cet6ErrorSearchTerm) >= 0 ||
             e.answer.toLowerCase().indexOf(cet6ErrorSearchTerm) >= 0 ||
             e.analysis.toLowerCase().indexOf(cet6ErrorSearchTerm) >= 0;
    });
  }
  if(errors.length === 0){
    list.innerHTML = '<div class="cet6-vocab-empty">📝 没有找到匹配的错题</div>';
    return;
  }
  list.innerHTML = errors.map(function(e){
    return '<div class="cet6-error-item' + (e.mastered ? ' mastered' : '') + '" data-tag="' + e.tag + '">' +
      '<div class="cet6-error-header">' +
      '<div class="cet6-error-meta">' +
      '<span class="cet6-error-type-badge">' + e.type + '</span>' +
      '<span class="cet6-error-tag-badge ' + e.tag + '">' + e.tag + '</span>' +
      (e.source ? '<span class="cet6-error-source">📌 ' + escapeHtml(e.source) + '</span>' : '') +
      '</div>' +
      '<div class="cet6-error-actions">' +
      '<button class="cet6-vocab-action-btn mastered-btn" title="' + (e.mastered ? '取消掌握' : '标记掌握') + '" onclick="toggleCet6ErrorMastered(\'' + e.id + '\')">' + (e.mastered ? '✅' : '⬜') + '</button>' +
      '<button class="cet6-vocab-action-btn delete-btn" title="删除" onclick="deleteCet6Error(\'' + e.id + '\')">🗑️</button>' +
      '</div></div>' +
      '<div class="cet6-error-question">' + escapeHtml(e.question) + '</div>' +
      (e.answer ? '<div class="cet6-error-answer">✅ 答案：' + escapeHtml(e.answer) + '</div>' : '') +
      (e.analysis ? '<div class="cet6-error-analysis">💡 ' + escapeHtml(e.analysis) + '</div>' : '') +
      '</div>';
  }).join('');
}

// 更新错题统计
function updateCet6ErrorStats(){
  var errors = getCet6Errors();
  var total = errors.length;
  var mastered = errors.filter(function(e){ return e.mastered; }).length;
  var reviewErrors = getCet6ErrorReviewWords();
  var review = reviewErrors.length;
  // 今日新增
  var today = new Date();
  var todayStr = today.toDateString();
  var todayCount = errors.filter(function(e){
    return new Date(e.addedDate).toDateString() === todayStr;
  }).length;
  // 更新统计卡片
  var totalEl = document.getElementById('cet6ErrorTotal');
  if(totalEl) totalEl.textContent = total;
  var reviewEl = document.getElementById('cet6ErrorReview');
  if(reviewEl) reviewEl.textContent = review;
  var masteredEl = document.getElementById('cet6ErrorMastered');
  if(masteredEl) masteredEl.textContent = mastered;
  var todayEl = document.getElementById('cet6ErrorToday');
  if(todayEl) todayEl.textContent = todayCount;
  // 更新概览的错题统计
  var errorTotalEl = document.getElementById('cet6ErrorTotal');
  var errorPendingEl = document.getElementById('cet6ErrorPending');
  if(errorPendingEl) errorPendingEl.textContent = review;
}


/* ===== 六级模块 - 听力管理功能 ===== */

var CET6_LISTEN_KEY = 'cet6_listen_records';
var cet6ListenFilter = 'all';
var cet6ListenSearchTerm = '';

var LISTEN_TYPE_NAMES = {
  conversation: '长对话',
  passage: '听力篇章',
  lecture: '讲座/报道',
  dictation: '听写填空',
  full: '全套听力'
};

function getCet6ListenRecords(){
  try{
    var data = localStorage.getItem(CET6_LISTEN_KEY);
    return data ? JSON.parse(data) : [];
  }catch(e){
    return [];
  }
}

function saveCet6ListenRecords(records){ markLocalChange();
  localStorage.setItem(CET6_LISTEN_KEY, JSON.stringify(records));
}

// 显示添加听力记录弹窗
function showCet6AddListenModal(){
  var modal = document.getElementById('cet6AddListenModal');
  if(modal) modal.style.display = 'flex';
  document.getElementById('cet6ListenName').value = '';
  document.getElementById('cet6ListenType').value = 'conversation';
  document.getElementById('cet6ListenCorrect').value = '';
  document.getElementById('cet6ListenTotalQ').value = '';
  document.getElementById('cet6ListenDuration').value = '';
  document.getElementById('cet6ListenNote').value = '';
  // 默认日期为今天
  var today = new Date();
  var dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  document.getElementById('cet6ListenDate').value = dateStr;
  setTimeout(function(){ document.getElementById('cet6ListenName').focus(); }, 100);
}

function hideCet6AddListenModal(event){
  if(event && event.target !== event.currentTarget) return;
  var modal = document.getElementById('cet6AddListenModal');
  if(modal) modal.style.display = 'none';
}

// 添加听力记录
function addCet6Listen(){
  var name = document.getElementById('cet6ListenName').value.trim();
  var type = document.getElementById('cet6ListenType').value;
  var correct = parseInt(document.getElementById('cet6ListenCorrect').value) || 0;
  var totalQ = parseInt(document.getElementById('cet6ListenTotalQ').value) || 0;
  var duration = parseInt(document.getElementById('cet6ListenDuration').value) || 0;
  var date = document.getElementById('cet6ListenDate').value;
  var note = document.getElementById('cet6ListenNote').value.trim();
  if(!name){
    toast('请填写套题名称');
    return;
  }
  var records = getCet6ListenRecords();
  var newRecord = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: name,
    type: type,
    correct: correct,
    total: totalQ,
    duration: duration,
    date: date || new Date().toISOString().split('T')[0],
    note: note,
    addedDate: new Date().toISOString()
  };
  records.unshift(newRecord);
  saveCet6ListenRecords(records);
  hideCet6AddListenModal();
  renderCet6Listen();
  updateCet6ListenStats();
}

// 删除听力记录
function deleteCet6Listen(id){
  showConfirm('确定要删除这条听力记录吗？').then(function(ok){
    if(!ok) return;
    var records = getCet6ListenRecords();
    records = records.filter(function(r){ return r.id !== id; });
    saveCet6ListenRecords(records);
    renderCet6Listen();
    updateCet6ListenStats();
  });
}

// 筛选听力记录
function filterCet6Listen(filter){
  cet6ListenFilter = filter;
  document.querySelectorAll('#cet6ListenFilters .cet6-filter-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderCet6Listen();
}

// 搜索听力记录
function searchCet6Listen(){
  var input = document.getElementById('cet6ListenSearch');
  cet6ListenSearchTerm = input ? input.value.trim().toLowerCase() : '';
  renderCet6Listen();
}

// 渲染听力记录列表
function renderCet6Listen(){
  var list = document.getElementById('cet6ListenList');
  if(!list) return;
  var records = getCet6ListenRecords();
  // 筛选
  if(cet6ListenFilter !== 'all'){
    records = records.filter(function(r){ return r.type === cet6ListenFilter; });
  }
  // 搜索
  if(cet6ListenSearchTerm){
    records = records.filter(function(r){
      return r.name.toLowerCase().indexOf(cet6ListenSearchTerm) >= 0 ||
             r.note.toLowerCase().indexOf(cet6ListenSearchTerm) >= 0;
    });
  }
  if(records.length === 0){
    list.innerHTML = '<div class="cet6-vocab-empty">🎧 没有找到匹配的听力记录</div>';
    return;
  }
  list.innerHTML = records.map(function(r){
    var accuracy = r.total > 0 ? Math.round(r.correct / r.total * 100) : 0;
    var accuracyClass = accuracy >= 70 ? 'cet6-listen-accuracy-high' : (accuracy >= 50 ? 'cet6-listen-accuracy-mid' : 'cet6-listen-accuracy-low');
    var typeName = LISTEN_TYPE_NAMES[r.type] || r.type;
    return '<div class="cet6-listen-item" data-type="' + r.type + '">' +
      '<div class="cet6-listen-header">' +
      '<div class="cet6-listen-meta">' +
      '<span class="cet6-listen-type-badge ' + r.type + '">' + typeName + '</span>' +
      '<span class="cet6-listen-date">📅 ' + r.date + '</span>' +
      '</div>' +
      '<div class="cet6-listen-actions">' +
      '<button class="cet6-vocab-action-btn delete-btn" title="删除" onclick="deleteCet6Listen(\'' + r.id + '\')">🗑️</button>' +
      '</div></div>' +
      '<div class="cet6-listen-name">' + escapeHtml(r.name) + '</div>' +
      '<div class="cet6-listen-stats">' +
      '<div class="cet6-listen-stat">正确率：<strong class="' + accuracyClass + '">' + accuracy + '%</strong>（' + r.correct + '/' + r.total + '）</div>' +
      (r.duration > 0 ? '<div class="cet6-listen-stat">用时：<strong>' + r.duration + '分钟</strong></div>' : '') +
      '</div>' +
      (r.note ? '<div class="cet6-listen-note">💡 ' + escapeHtml(r.note) + '</div>' : '') +
      '</div>';
  }).join('');
}

// 更新听力统计
function updateCet6ListenStats(){
  var records = getCet6ListenRecords();
  var total = records.length;
  var done = records.filter(function(r){ return r.total > 0 && r.correct >= 0; }).length;
  // 平均正确率
  var totalAccuracy = 0;
  var countWithAccuracy = 0;
  records.forEach(function(r){
    if(r.total > 0){
      totalAccuracy += r.correct / r.total * 100;
      countWithAccuracy++;
    }
  });
  var avgAccuracy = countWithAccuracy > 0 ? Math.round(totalAccuracy / countWithAccuracy) : 0;
  // 今日新增
  var today = new Date();
  var todayStr = today.toDateString();
  var todayCount = records.filter(function(r){
    return new Date(r.addedDate).toDateString() === todayStr;
  }).length;
  // 更新统计卡片
  var totalEl = document.getElementById('cet6ListenTotal');
  if(totalEl) totalEl.textContent = total;
  var doneEl = document.getElementById('cet6ListenDone');
  if(doneEl) doneEl.textContent = done;
  var accuracyEl = document.getElementById('cet6ListenAccuracy');
  if(accuracyEl) accuracyEl.textContent = avgAccuracy + '%';
  var todayEl = document.getElementById('cet6ListenToday');
  if(todayEl) todayEl.textContent = todayCount;
  // 更新进度
  var progressCountEl = document.getElementById('cet6ListenProgressCount');
  if(progressCountEl) progressCountEl.textContent = total;
  var progressEl = document.getElementById('cet6ListenProgress');
  if(progressEl) progressEl.style.width = Math.min(100, (total / 40 * 100)) + '%';
}


/* ===== 六级模块 - 阅读管理功能 ===== */

var CET6_READ_KEY = 'cet6_read_records';
var cet6ReadFilter = 'all';
var cet6ReadSearchTerm = '';

var READ_TYPE_NAMES = {
  detail: '仔细阅读',
  match: '段落匹配',
  cloze: '选词填空',
  full: '全套阅读'
};

function getCet6ReadRecords(){
  try{
    var data = localStorage.getItem(CET6_READ_KEY);
    return data ? JSON.parse(data) : [];
  }catch(e){
    return [];
  }
}

function saveCet6ReadRecords(records){ markLocalChange();
  localStorage.setItem(CET6_READ_KEY, JSON.stringify(records));
}

// 显示添加阅读记录弹窗
function showCet6AddReadModal(){
  var modal = document.getElementById('cet6AddReadModal');
  if(modal) modal.style.display = 'flex';
  document.getElementById('cet6ReadName').value = '';
  document.getElementById('cet6ReadType').value = 'detail';
  document.getElementById('cet6ReadCorrect').value = '';
  document.getElementById('cet6ReadTotalQ').value = '';
  document.getElementById('cet6ReadDuration').value = '';
  document.getElementById('cet6ReadNote').value = '';
  // 默认日期为今天
  var today = new Date();
  var dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  document.getElementById('cet6ReadDate').value = dateStr;
  setTimeout(function(){ document.getElementById('cet6ReadName').focus(); }, 100);
}

function hideCet6AddReadModal(event){
  if(event && event.target !== event.currentTarget) return;
  var modal = document.getElementById('cet6AddReadModal');
  if(modal) modal.style.display = 'none';
}

// 添加阅读记录
function addCet6Read(){
  var name = document.getElementById('cet6ReadName').value.trim();
  var type = document.getElementById('cet6ReadType').value;
  var correct = parseInt(document.getElementById('cet6ReadCorrect').value) || 0;
  var totalQ = parseInt(document.getElementById('cet6ReadTotalQ').value) || 0;
  var duration = parseInt(document.getElementById('cet6ReadDuration').value) || 0;
  var date = document.getElementById('cet6ReadDate').value;
  var note = document.getElementById('cet6ReadNote').value.trim();
  if(!name){
    toast('请填写文章/套题名称');
    return;
  }
  var records = getCet6ReadRecords();
  var newRecord = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: name,
    type: type,
    correct: correct,
    total: totalQ,
    duration: duration,
    date: date || new Date().toISOString().split('T')[0],
    note: note,
    addedDate: new Date().toISOString()
  };
  records.unshift(newRecord);
  saveCet6ReadRecords(records);
  hideCet6AddReadModal();
  renderCet6Read();
  updateCet6ReadStats();
}

// 删除阅读记录
function deleteCet6Read(id){
  showConfirm('确定要删除这条阅读记录吗？').then(function(ok){
    if(!ok) return;
    var records = getCet6ReadRecords();
    records = records.filter(function(r){ return r.id !== id; });
    saveCet6ReadRecords(records);
    renderCet6Read();
    updateCet6ReadStats();
  });
}

// 筛选阅读记录
function filterCet6Read(filter){
  cet6ReadFilter = filter;
  document.querySelectorAll('#cet6ReadFilters .cet6-filter-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderCet6Read();
}

// 搜索阅读记录
function searchCet6Read(){
  var input = document.getElementById('cet6ReadSearch');
  cet6ReadSearchTerm = input ? input.value.trim().toLowerCase() : '';
  renderCet6Read();
}

// 渲染阅读记录列表
function renderCet6Read(){
  var list = document.getElementById('cet6ReadList');
  if(!list) return;
  var records = getCet6ReadRecords();
  // 筛选
  if(cet6ReadFilter !== 'all'){
    records = records.filter(function(r){ return r.type === cet6ReadFilter; });
  }
  // 搜索
  if(cet6ReadSearchTerm){
    records = records.filter(function(r){
      return r.name.toLowerCase().indexOf(cet6ReadSearchTerm) >= 0 ||
             r.note.toLowerCase().indexOf(cet6ReadSearchTerm) >= 0;
    });
  }
  if(records.length === 0){
    list.innerHTML = '<div class="cet6-vocab-empty">📖 没有找到匹配的阅读记录</div>';
    return;
  }
  list.innerHTML = records.map(function(r){
    var accuracy = r.total > 0 ? Math.round(r.correct / r.total * 100) : 0;
    var accuracyClass = accuracy >= 70 ? 'cet6-listen-accuracy-high' : (accuracy >= 50 ? 'cet6-listen-accuracy-mid' : 'cet6-listen-accuracy-low');
    var typeName = READ_TYPE_NAMES[r.type] || r.type;
    return '<div class="cet6-read-item" data-type="' + r.type + '">' +
      '<div class="cet6-read-header">' +
      '<div class="cet6-read-meta">' +
      '<span class="cet6-read-type-badge ' + r.type + '">' + typeName + '</span>' +
      '<span class="cet6-read-date">📅 ' + r.date + '</span>' +
      '</div>' +
      '<div class="cet6-read-actions">' +
      '<button class="cet6-vocab-action-btn delete-btn" title="删除" onclick="deleteCet6Read(\'' + r.id + '\')">🗑️</button>' +
      '</div></div>' +
      '<div class="cet6-read-name">' + escapeHtml(r.name) + '</div>' +
      '<div class="cet6-read-stats">' +
      '<div class="cet6-read-stat">正确率：<strong class="' + accuracyClass + '">' + accuracy + '%</strong>（' + r.correct + '/' + r.total + '）</div>' +
      (r.duration > 0 ? '<div class="cet6-read-stat">用时：<strong>' + r.duration + '分钟</strong></div>' : '') +
      '</div>' +
      (r.note ? '<div class="cet6-read-note">💡 ' + escapeHtml(r.note) + '</div>' : '') +
      '</div>';
  }).join('');
}

// 更新阅读统计
function updateCet6ReadStats(){
  var records = getCet6ReadRecords();
  var total = records.length;
  var done = records.filter(function(r){ return r.total > 0 && r.correct >= 0; }).length;
  // 平均正确率
  var totalAccuracy = 0;
  var countWithAccuracy = 0;
  records.forEach(function(r){
    if(r.total > 0){
      totalAccuracy += r.correct / r.total * 100;
      countWithAccuracy++;
    }
  });
  var avgAccuracy = countWithAccuracy > 0 ? Math.round(totalAccuracy / countWithAccuracy) : 0;
  // 今日新增
  var today = new Date();
  var todayStr = today.toDateString();
  var todayCount = records.filter(function(r){
    return new Date(r.addedDate).toDateString() === todayStr;
  }).length;
  // 更新统计卡片
  var totalEl = document.getElementById('cet6ReadTotal');
  if(totalEl) totalEl.textContent = total;
  var doneEl = document.getElementById('cet6ReadDone');
  if(doneEl) doneEl.textContent = done;
  var accuracyEl = document.getElementById('cet6ReadAccuracy');
  if(accuracyEl) accuracyEl.textContent = avgAccuracy + '%';
  var todayEl = document.getElementById('cet6ReadToday');
  if(todayEl) todayEl.textContent = todayCount;
  // 更新进度
  var progressCountEl = document.getElementById('cet6ReadProgressCount');
  if(progressCountEl) progressCountEl.textContent = total;
  var progressEl = document.getElementById('cet6ReadProgress');
  if(progressEl) progressEl.style.width = Math.min(100, (total / 80 * 100)) + '%';
}


/* ===== 六级模块 - 写译管理功能 ===== */

var CET6_WRITE_KEY = 'cet6_write_records';
var cet6WriteFilter = 'all';
var cet6WriteSearchTerm = '';

var WRITE_TYPE_NAMES = {
  writing: '写作',
  translation: '翻译'
};

function getCet6WriteRecords(){
  try{
    var data = localStorage.getItem(CET6_WRITE_KEY);
    return data ? JSON.parse(data) : [];
  }catch(e){
    return [];
  }
}

function saveCet6WriteRecords(records){ markLocalChange();
  localStorage.setItem(CET6_WRITE_KEY, JSON.stringify(records));
}

// 显示添加写译记录弹窗
function showCet6AddWriteModal(){
  var modal = document.getElementById('cet6AddWriteModal');
  if(modal) modal.style.display = 'flex';
  document.getElementById('cet6WriteTopic').value = '';
  document.getElementById('cet6WriteType').value = 'writing';
  document.getElementById('cet6WriteScoreInput').value = '';
  document.getElementById('cet6WriteDuration').value = '';
  document.getElementById('cet6WriteNote').value = '';
  // 默认日期为今天
  var today = new Date();
  var dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  document.getElementById('cet6WriteDate').value = dateStr;
  setTimeout(function(){ document.getElementById('cet6WriteTopic').focus(); }, 100);
}

function hideCet6AddWriteModal(event){
  if(event && event.target !== event.currentTarget) return;
  var modal = document.getElementById('cet6AddWriteModal');
  if(modal) modal.style.display = 'none';
}

// 添加写译记录
function addCet6Write(){
  var topic = document.getElementById('cet6WriteTopic').value.trim();
  var type = document.getElementById('cet6WriteType').value;
  var score = parseFloat(document.getElementById('cet6WriteScoreInput').value) || 0;
  var duration = parseInt(document.getElementById('cet6WriteDuration').value) || 0;
  var date = document.getElementById('cet6WriteDate').value;
  var note = document.getElementById('cet6WriteNote').value.trim();
  if(!topic){
    toast('请填写题目/主题');
    return;
  }
  var records = getCet6WriteRecords();
  var newRecord = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    topic: topic,
    type: type,
    score: score,
    duration: duration,
    date: date || new Date().toISOString().split('T')[0],
    note: note,
    addedDate: new Date().toISOString()
  };
  records.unshift(newRecord);
  saveCet6WriteRecords(records);
  hideCet6AddWriteModal();
  renderCet6Write();
  updateCet6WriteStats();
}

// 删除写译记录
function deleteCet6Write(id){
  showConfirm('确定要删除这条写译记录吗？').then(function(ok){
    if(!ok) return;
    var records = getCet6WriteRecords();
    records = records.filter(function(r){ return r.id !== id; });
    saveCet6WriteRecords(records);
    renderCet6Write();
    updateCet6WriteStats();
  });
}

// 筛选写译记录
function filterCet6Write(filter){
  cet6WriteFilter = filter;
  document.querySelectorAll('#cet6WriteFilters .cet6-filter-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderCet6Write();
}

// 搜索写译记录
function searchCet6Write(){
  var input = document.getElementById('cet6WriteSearch');
  cet6WriteSearchTerm = input ? input.value.trim().toLowerCase() : '';
  renderCet6Write();
}

// 渲染写译记录列表
function renderCet6Write(){
  var list = document.getElementById('cet6WriteList');
  if(!list) return;
  var records = getCet6WriteRecords();
  // 筛选
  if(cet6WriteFilter !== 'all'){
    records = records.filter(function(r){ return r.type === cet6WriteFilter; });
  }
  // 搜索
  if(cet6WriteSearchTerm){
    records = records.filter(function(r){
      return r.topic.toLowerCase().indexOf(cet6WriteSearchTerm) >= 0 ||
             r.note.toLowerCase().indexOf(cet6WriteSearchTerm) >= 0;
    });
  }
  if(records.length === 0){
    list.innerHTML = '<div class="cet6-vocab-empty">✍️ 没有找到匹配的写译记录</div>';
    return;
  }
  list.innerHTML = records.map(function(r){
    var scoreClass = r.score >= 12 ? 'cet6-write-score-high' : (r.score >= 9 ? 'cet6-write-score-mid' : 'cet6-write-score-low');
    var typeName = WRITE_TYPE_NAMES[r.type] || r.type;
    return '<div class="cet6-write-item" data-type="' + r.type + '">' +
      '<div class="cet6-write-header">' +
      '<div class="cet6-write-meta">' +
      '<span class="cet6-write-type-badge ' + r.type + '">' + typeName + '</span>' +
      '<span class="cet6-write-date">📅 ' + r.date + '</span>' +
      '</div>' +
      '<div class="cet6-write-actions">' +
      '<button class="cet6-vocab-action-btn delete-btn" title="删除" onclick="deleteCet6Write(\'' + r.id + '\')">🗑️</button>' +
      '</div></div>' +
      '<div class="cet6-write-topic">' + escapeHtml(r.topic) + '</div>' +
      '<div class="cet6-write-stats">' +
      (r.score > 0 ? '<div class="cet6-write-stat">得分：<strong class="' + scoreClass + '">' + r.score + '/15</strong></div>' : '') +
      (r.duration > 0 ? '<div class="cet6-write-stat">用时：<strong>' + r.duration + '分钟</strong></div>' : '') +
      '</div>' +
      (r.note ? '<div class="cet6-write-note">💡 ' + escapeHtml(r.note) + '</div>' : '') +
      '</div>';
  }).join('');
}

// 更新写译统计
function updateCet6WriteStats(){
  var records = getCet6WriteRecords();
  var total = records.length;
  var done = records.filter(function(r){ return r.score > 0; }).length;
  // 平均得分
  var totalScore = 0;
  var countWithScore = 0;
  records.forEach(function(r){
    if(r.score > 0){
      totalScore += r.score;
      countWithScore++;
    }
  });
  var avgScore = countWithScore > 0 ? (totalScore / countWithScore).toFixed(1) : 0;
  // 今日新增
  var today = new Date();
  var todayStr = today.toDateString();
  var todayCount = records.filter(function(r){
    return new Date(r.addedDate).toDateString() === todayStr;
  }).length;
  // 更新统计卡片
  var totalEl = document.getElementById('cet6WriteTotal');
  if(totalEl) totalEl.textContent = total;
  var doneEl = document.getElementById('cet6WriteDone');
  if(doneEl) doneEl.textContent = done;
  var scoreEl = document.getElementById('cet6WriteScore');
  if(scoreEl) scoreEl.textContent = avgScore;
  var todayEl = document.getElementById('cet6WriteToday');
  if(todayEl) todayEl.textContent = todayCount;
  // 更新进度
  var progressCountEl = document.getElementById('cet6WriteProgressCount');
  if(progressCountEl) progressCountEl.textContent = total;
  var progressEl = document.getElementById('cet6WriteProgress');
  if(progressEl) progressEl.style.width = Math.min(100, (total / 30 * 100)) + '%';
}


/* ===== 六级模块 - 资料搜索功能 ===== */

function searchCet6Materials(){
  var input = document.getElementById('cet6MaterialsSearch');
  var searchTerm = input ? input.value.trim().toLowerCase() : '';
  var list = document.getElementById('cet6MaterialsList');
  if(!list) return;
  var items = list.querySelectorAll('.career-item, .m-item');
  items.forEach(function(item){
    var text = item.textContent.toLowerCase();
    if(searchTerm === '' || text.indexOf(searchTerm) >= 0){
      item.style.display = '';
    }else{
      item.style.display = 'none';
    }
  });
}


/* ===== 灵犀库（百川智库）底栏子模块导航 ===== */
function initBaichuanSubTabs(){
  var tabs = document.querySelectorAll('#module-baichuan .sub-tab');
  if(!tabs.length) return;
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var sub = this.getAttribute('data-sub');
      switchBaichuanSub(sub);
    });
  });
  // 渲染各子模块内容
  renderBaichuanCategory();
}

function switchBaichuanSub(sub){
  // 切换tab激活状态
  document.querySelectorAll('#module-baichuan .sub-tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('data-sub') === sub);
  });
  // 切换内容显示
  document.querySelectorAll('#module-baichuan .baichuan-sub').forEach(function(el){
    el.style.display = (el.id === 'baichuan-sub-' + sub) ? '' : 'none';
  });
}

function renderBaichuanCategory(){
  // 从BCKBS中找到对应分类并渲染
  var categories = {
    'bcSkillsList': '01-技能技巧',
    'bcTasksList': '02-任务流程',
    'bcToolsList': '03-工具方法',
    'bcIdeasList': '04-灵感碎片'
  };
  var countMap = {
    'bcSkillsList': 'bcSkillsCount',
    'bcTasksList': 'bcTasksCount',
    'bcToolsList': 'bcToolsCount',
    'bcIdeasList': 'bcIdeasCount'
  };
  Object.keys(categories).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    var catName = categories[elId];
    var kb = (BCKBS||[]).find(function(k){ return k.name && k.name.indexOf(catName) >= 0; });
    var countEl = document.getElementById(countMap[elId]);
    if(!kb || !kb.groups || !kb.groups.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容，去知识库添加吧～</div>';
      if(countEl) countEl.textContent = '';
      return;
    }
    var allNotes = [];
    kb.groups.forEach(function(g){
      (g.notes||[]).forEach(function(n){ allNotes.push(n); });
    });
    if(countEl) countEl.textContent = allNotes.length + ' 篇';
    if(!allNotes.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容</div>';
      return;
    }
    // 找到在KB_FLAT中的索引
    el.innerHTML = allNotes.map(function(n){
      var idx = KB_FLAT.indexOf(n);
      var onclick = idx >= 0 ? 'openKbNote('+idx+')' : '';
      var sub = n.date ? '📅 ' + n.date : '';
      return careerListItem(n.icon || '📄', n.title, sub, '', onclick);
    }).join('');
  });
}


/* ===== 工作SOP底栏子模块导航 ===== */
function initSopSubTabs(){
  var tabs = document.querySelectorAll('#module-sop .sub-tab');
  if(!tabs.length) return;
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var sub = this.getAttribute('data-sub');
      switchSopSub(sub);
    });
  });
  // 渲染各子模块内容
  renderSopCategory();
}

function switchSopSub(sub){
  // 切换tab激活状态
  document.querySelectorAll('#module-sop .sub-tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('data-sub') === sub);
  });
  // 切换内容显示
  document.querySelectorAll('#module-sop .sop-sub').forEach(function(el){
    el.style.display = (el.id === 'sop-sub-' + sub) ? '' : 'none';
  });
}

function renderSopCategory(){
  // 从SOPKBS中找到对应分类并渲染
  var categories = {
    'sopFlowList': '03_日常工作流程',
    'sopKnowList': '05_岗位知识',
    'sopErrorList': '07_错题本',
    'sopHandoverList': '01_交接文件',
    'sopToolsList': '02_网栈工具',
    'sopTermsList': '04_行业术语',
    'sopProjectsList': '06_项目成果',
    'sopAssetsList': '08_素材库'
  };
  var countMap = {
    'sopFlowList': 'sopFlowListCount',
    'sopKnowList': 'sopKnowListCount',
    'sopErrorList': 'sopErrorListCount',
    'sopHandoverList': 'sopHandoverCount',
    'sopToolsList': 'sopToolsCount',
    'sopTermsList': 'sopTermsCount',
    'sopProjectsList': 'sopProjectsCount',
    'sopAssetsList': 'sopAssetsCount'
  };
  Object.keys(categories).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    var catName = categories[elId];
    var kb = (SOPKBS||[]).find(function(k){ return k.name && k.name.indexOf(catName) >= 0; });
    var countEl = document.getElementById(countMap[elId]);
    if(!kb || !kb.groups || !kb.groups.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容，去知识库添加吧～</div>';
      if(countEl) countEl.textContent = '';
      return;
    }
    var allNotes = [];
    kb.groups.forEach(function(g){
      (g.notes||[]).forEach(function(n){ allNotes.push(n); });
    });
    if(countEl) countEl.textContent = allNotes.length + ' 篇';
    if(!allNotes.length){
      el.innerHTML = '<div class="career-list-empty">📂 这个分类还没有内容</div>';
      return;
    }
    // 找到在KB_FLAT中的索引
    el.innerHTML = allNotes.map(function(n){
      var idx = KB_FLAT.indexOf(n);
      var onclick = idx >= 0 ? 'openKbNote('+idx+')' : '';
      var sub = n.date ? '📅 ' + n.date : '';
      return careerListItem(n.icon || '📄', n.title, sub, '', onclick);
    }).join('');
  });
}

  applyBg(); applyAv(); applyIcon();
})();