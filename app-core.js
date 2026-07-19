/* SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";

  const translations = window.PASTA_I18N;
  const en = translations.en;

  const $ = (id) => document.getElementById(id);
  const els = {
    language:$('language'), dropZone:$('dropZone'), fileInput:$('fileInput'), progress:$('progressPanel'), progressStage:$('progressStage'), progressPercent:$('progressPercent'), progressBar:$('progressBar'), status:$('status'),
    results:$('results'), title:$('result-title'), summary:$('resultSummary'), badge:$('resultBadge'), scoreRing:$('scoreRing'), scoreValue:$('scoreValue'), scoreCaption:$('scoreCaption'),
    pluginName:$('pluginName'), pluginVersion:$('pluginVersion'), pluginMain:$('pluginMain'), pluginApi:$('pluginApi'), inputHash:$('inputHash'), classCount:$('classCount'), patchedCount:$('patchedCount'), manualCount:$('manualCount'), nestedCount:$('nestedCount'), signatureCount:$('signatureCount'), elapsedTime:$('elapsedTime'),
    download:$('downloadButton'), json:$('jsonButton'), html:$('htmlButton'), markdown:$('markdownButton'), reset:$('resetButton'), findingList:$('findingList'), findingLimit:$('findingLimit')
  };
  const state = { language: localStorage.getItem('pasta-language') || detectLanguage(), worker:null, jar:null, jarName:'', report:null, filter:'all' };

  function detectLanguage(){ const n=navigator.language; if(n.startsWith('ja'))return'ja'; if(n.startsWith('de'))return'de'; if(n==='zh-TW'||n==='zh-HK'||n.includes('Hant'))return'zh-TW'; if(n.startsWith('zh'))return'zh-CN'; if(n.startsWith('it'))return'it'; if(n.startsWith('es'))return'es'; return'en'; }
  function t(key){ return (translations[state.language]||en)[key] || en[key] || key; }
  function applyLanguage(lang){ state.language=translations[lang]?lang:'en'; localStorage.setItem('pasta-language',state.language); document.documentElement.lang=state.language; els.language.value=state.language; document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=t(node.dataset.i18n);}); if(state.report) renderReport(state.report); }
  applyLanguage(state.language);

  els.language.addEventListener('change',e=>applyLanguage(e.target.value));
  els.dropZone.addEventListener('click',()=>els.fileInput.click());
  els.dropZone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();els.fileInput.click();}});
  ['dragenter','dragover'].forEach(name=>els.dropZone.addEventListener(name,e=>{e.preventDefault();els.dropZone.classList.add('dragging');}));
  ['dragleave','drop'].forEach(name=>els.dropZone.addEventListener(name,e=>{e.preventDefault();els.dropZone.classList.remove('dragging');}));
  els.dropZone.addEventListener('drop',e=>processFile(e.dataTransfer.files[0]));
  els.fileInput.addEventListener('change',e=>processFile(e.target.files[0]));
  els.reset.addEventListener('click',reset);
  els.download.addEventListener('click',()=>downloadBlob(state.jar,state.jarName));
  els.json.addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(state.report,null,2)],{type:'application/json'}), reportBase()+'.json'));
  els.markdown.addEventListener('click',()=>downloadBlob(new Blob([toMarkdown(state.report)],{type:'text/markdown'}), reportBase()+'.md'));
  els.html.addEventListener('click',()=>downloadBlob(new Blob([toHtml(state.report)],{type:'text/html'}), reportBase()+'.html'));
  document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===button));state.filter=button.dataset.filter;renderFindings();}));

  function reset(){ if(state.worker){state.worker.terminate();state.worker=null;} state.jar=null;state.jarName='';state.report=null;state.filter='all';els.fileInput.value='';els.progress.hidden=true;els.results.classList.add('hidden');els.status.textContent='';els.status.className='status';els.findingList.replaceChildren();[els.download,els.json,els.html,els.markdown].forEach(b=>b.disabled=true);setProgress(0,'preparing','opening'); }

  async function processFile(file){ reset(); if(!file)return; if(!file.name.toLowerCase().endsWith('.jar'))return showError(t('invalidJar')); if(file.size>200*1024*1024)return showError(t('tooLarge')); els.progress.hidden=false; setProgress(1,'preparing','opening'); try{
      const buffer=await file.arrayBuffer();
      state.worker=new Worker('bytecode-worker.js');
      state.worker.onmessage=e=>handleWorkerMessage(e.data);
      state.worker.onerror=e=>{console.error(e);showError(t('workerError'));};
      state.worker.postMessage({type:'transform',name:file.name,buffer},[buffer]);
    }catch(error){console.error(error);showError(t('invalidJar'));}
  }

  function handleWorkerMessage(message){ if(message.type==='progress'){setProgress(message.percent,message.stage,message.phase,message.detail);return;} if(message.type==='error'){showError(message.message||t('workerError'));return;} if(message.type==='result'){
      const {report,jarBuffer,jarName}=message; state.report=report; state.jar=jarBuffer?new Blob([jarBuffer],{type:'application/java-archive'}):null; state.jarName=jarName||''; setProgress(100,'done','packing'); renderReport(report); els.results.classList.remove('hidden'); els.results.scrollIntoView({behavior:'smooth',block:'start'}); [els.json,els.html,els.markdown].forEach(b=>b.disabled=false); els.download.disabled=!state.jar; state.worker?.terminate();state.worker=null;
    }}

  function setProgress(percent,stageKey,phase,detail){ const p=Math.max(0,Math.min(100,Math.round(percent||0))); els.progressPercent.textContent=p+'%';els.progressBar.style.width=p+'%';els.progressStage.textContent=t(stageKey||'preparing');els.status.textContent=detail||''; document.querySelectorAll('[data-phase]').forEach(n=>n.classList.toggle('active',n.dataset.phase===phase)); }
  function showError(message){els.progress.hidden=false;els.status.textContent=message;els.status.className='status error';}

  function renderReport(report){ const outcome=report.outcome||'blocked'; const key=outcome==='clean'?'clean':outcome==='partial'?'partial':'blocked'; els.title.textContent=t(key+'Title');els.summary.textContent=t(key+'Summary');els.badge.textContent=t(key+'Badge');els.badge.className='badge '+(key==='clean'?'success':'danger'); const score=Number(report.score||0);els.scoreValue.textContent=score;els.scoreRing.style.setProperty('--score-angle',(score*3.6)+'deg');els.scoreRing.classList.toggle('partial',key!=='clean');els.scoreCaption.textContent=t(key==='clean'?'scoreClean':key==='partial'?'scorePartial':'scoreBlocked');
    const plugin=report.plugin||{};els.pluginName.textContent=plugin.name||t('unknownPlugin');els.pluginVersion.textContent=plugin.version||'—';els.pluginMain.textContent=plugin.main||'—';els.pluginApi.textContent=plugin.apiVersion||'—';els.inputHash.textContent=shortHash(report.input?.sha256);
    els.classCount.textContent=num(report.metrics?.classes);els.patchedCount.textContent=num(report.metrics?.patched);els.manualCount.textContent=num(report.metrics?.manual);els.nestedCount.textContent=num(report.metrics?.nestedJars);els.signatureCount.textContent=num(report.metrics?.signaturesRemoved);els.elapsedTime.textContent=num(report.metrics?.elapsedMs)+' ms'; renderFindings(); }

  function renderFindings(){ if(!state.report)return; const all=state.report.findings||[]; const filtered=state.filter==='all'?all:all.filter(f=>f.status===state.filter); const shown=filtered.slice(0,250); els.findingList.replaceChildren(...shown.map(renderFinding)); if(!shown.length){const div=document.createElement('div');div.className='empty';div.textContent=t('noFindings');els.findingList.append(div);} els.findingLimit.classList.toggle('hidden',filtered.length<=shown.length); }
  function renderFinding(f){ const node=document.createElement('article');node.className='finding '+(f.status==='patched'?'patched':''); const where=[f.className,f.methodName,f.line?('line '+f.line):null].filter(Boolean).join(' · '); node.innerHTML=`<header><span class="status-pill">${escapeHtml(f.status==='patched'?t('patchedLabel'):t('manualLabel'))}</span><b>${escapeHtml(f.category||'Folia')}</b><small>${escapeHtml(f.severity||'INFO')}</small></header><code>${escapeHtml(f.original||'')}</code>${f.replacement?`<code>→ ${escapeHtml(f.replacement)}</code>`:''}<p>${escapeHtml(f.reason||'')}</p><footer>${escapeHtml(where)}${f.archive?` · ${escapeHtml(f.archive)}`:''}</footer>`; return node; }

  function reportBase(){ return (state.report?.input?.name||'plugin').replace(/\.jar$/i,'')+'-pasta-report'; }
  function shortHash(value){ return value ? value.slice(0,12)+'…'+value.slice(-8) : '—'; }
  function num(value){ return Number(value||0).toLocaleString(); }
  function downloadBlob(blob,name){ if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000); }
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]);}

  function toMarkdown(r){ const rows=(r.findings||[]).map((f,i)=>`${i+1}. **${f.status.toUpperCase()} · ${f.severity} · ${f.category}**\n   - Site: \`${f.className||'?'}#${f.methodName||'?'}${f.line?':'+f.line:''}\`\n   - Original: \`${f.original||''}\`\n   - Replacement: ${f.replacement?'`'+f.replacement+'`':'—'}\n   - Reason: ${f.reason||''}`).join('\n'); return `# Pasta's Revenge Folia Report\n\n- Input: \`${r.input?.name||''}\`\n- SHA-256: \`${r.input?.sha256||''}\`\n- Outcome: **${r.outcome}**\n- Score: **${r.score}/100**\n- Classes: ${r.metrics?.classes||0}\n- Patched sites: ${r.metrics?.patched||0}\n- Manual findings: ${r.metrics?.manual||0}\n- Elapsed: ${r.metrics?.elapsedMs||0} ms\n\n## Findings\n\n${rows||'No findings.'}\n\n> Runtime verification on a disposable Folia server is required.\n`; }
  function toHtml(r){ const rows=(r.findings||[]).map(f=>`<tr><td>${escapeHtml(f.status)}</td><td>${escapeHtml(f.severity)}</td><td>${escapeHtml(f.category)}</td><td><code>${escapeHtml(f.className)}#${escapeHtml(f.methodName)}</code></td><td><code>${escapeHtml(f.original)}</code></td><td><code>${escapeHtml(f.replacement||'—')}</code></td><td>${escapeHtml(f.reason)}</td></tr>`).join(''); return `<!doctype html><meta charset="utf-8"><title>Pasta report</title><style>body{font:14px system-ui;margin:2rem;color:#222}h1{font-family:Georgia,serif}code{font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:.55rem;text-align:left;vertical-align:top}th{background:#eee}.score{font-size:2rem;font-weight:700}</style><h1>Pasta's Revenge Folia Report</h1><p><b>${escapeHtml(r.input?.name)}</b><br><code>${escapeHtml(r.input?.sha256)}</code></p><p class="score">${r.score}/100 · ${escapeHtml(r.outcome)}</p><p>Classes ${r.metrics?.classes||0} · Patched ${r.metrics?.patched||0} · Manual ${r.metrics?.manual||0} · ${r.metrics?.elapsedMs||0} ms</p><table><thead><tr><th>Status</th><th>Severity</th><th>Category</th><th>Site</th><th>Original</th><th>Replacement</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table><p><b>Runtime verification on a disposable Folia server is required.</b></p>`; }
})();
