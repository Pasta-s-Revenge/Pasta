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

  const state = { language:'en', worker:null, items:[], activeId:null, processing:false, filter:'all' };
  let sequence = 0;

  const batchDeck = document.createElement('section');
  batchDeck.className = 'batch-deck';
  batchDeck.hidden = true;
  batchDeck.innerHTML = '<header class="batch-head"><div><b>Plugin batch</b><small>Processed locally, one JAR at a time</small></div><span id="batchCount" class="batch-count">0</span></header><div id="batchList" class="batch-list"></div><div id="batchSummary" class="batch-summary"></div>';
  document.querySelector('.altar-grid')?.after(batchDeck);
  const batchList = batchDeck.querySelector('#batchList');
  const batchCount = batchDeck.querySelector('#batchCount');
  const batchSummary = batchDeck.querySelector('#batchSummary');

  els.fileInput.multiple = true;
  els.dropZone.dataset.batch = 'true';

  function t(key){ return (translations[state.language] || en)[key] || en[key] || key; }
  function applyLanguage(lang){
    state.language = translations[lang] ? lang : 'en';
    document.documentElement.lang = state.language;
    els.language.value = state.language;
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    const active = getActive();
    if(active?.report) renderReport(active.report);
  }
  applyLanguage('en');

  els.language.addEventListener('change', e => applyLanguage(e.target.value));
  els.dropZone.addEventListener('click', () => els.fileInput.click());
  els.dropZone.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); els.fileInput.click(); } });
  ['dragenter','dragover'].forEach(name => els.dropZone.addEventListener(name, e => { e.preventDefault(); els.dropZone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach(name => els.dropZone.addEventListener(name, e => { e.preventDefault(); els.dropZone.classList.remove('dragging'); }));
  els.dropZone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  els.fileInput.addEventListener('change', e => addFiles(e.target.files));
  els.reset.addEventListener('click', reset);
  els.download.addEventListener('click', () => { const a=getActive(); if(a?.jar) downloadBlob(a.jar,a.jarName); });
  els.json.addEventListener('click', () => { const a=getActive(); if(a?.report) downloadBlob(new Blob([JSON.stringify(a.report,null,2)],{type:'application/json'}), reportBase(a.report)+'.json'); });
  els.markdown.addEventListener('click', () => { const a=getActive(); if(a?.report) downloadBlob(new Blob([toMarkdown(a.report)],{type:'text/markdown'}), reportBase(a.report)+'.md'); });
  els.html.addEventListener('click', () => { const a=getActive(); if(a?.report) downloadBlob(new Blob([toHtml(a.report)],{type:'text/html'}), reportBase(a.report)+'.html'); });
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b===button)); state.filter=button.dataset.filter; renderFindings(); }));

  function addFiles(fileList){
    const files = [...(fileList || [])];
    if(!files.length) return;
    const known = new Set(state.items.map(item => `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
    for(const file of files){
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if(known.has(key)) continue;
      known.add(key);
      const valid = file.name.toLowerCase().endsWith('.jar') && file.size <= 200*1024*1024;
      state.items.push({ id:`plugin-${++sequence}`, file, status:valid?'queued':'error', error:valid?'':(!file.name.toLowerCase().endsWith('.jar')?t('invalidJar'):t('tooLarge')), progress:0, report:null, jar:null, jarName:'' });
    }
    els.fileInput.value='';
    batchDeck.hidden = false;
    if(!state.activeId && state.items.length) state.activeId = state.items[0].id;
    renderBatch();
    processNext();
  }

  async function processNext(){
    if(state.processing) return;
    const item = state.items.find(x => x.status === 'queued');
    if(!item){ updateBatchSummary(); return; }
    state.processing = true;
    state.activeId = item.id;
    item.status = 'processing';
    renderBatch();
    els.progress.hidden = false;
    setProgress(1,'preparing','opening',item.file.name);
    try{
      const buffer = await item.file.arrayBuffer();
      state.worker = new Worker('bytecode-worker.js');
      state.worker.onmessage = e => handleWorkerMessage(item,e.data);
      state.worker.onerror = e => finishWithError(item,e.message || t('workerError'));
      state.worker.postMessage({type:'transform',name:item.file.name,buffer},[buffer]);
    }catch(error){ finishWithError(item,error.message || t('invalidJar')); }
  }

  function handleWorkerMessage(item,message){
    if(message.type === 'progress'){
      item.progress = Math.max(0,Math.min(100,Math.round(message.percent||0)));
      setProgress(item.progress,message.stage,message.phase,`${item.file.name}${message.detail?' · '+message.detail:''}`);
      renderBatch();
      return;
    }
    if(message.type === 'error'){ finishWithError(item,message.message || t('workerError')); return; }
    if(message.type === 'result'){
      const {report,jarBuffer,jarName} = message;
      item.report = report;
      item.jar = jarBuffer ? new Blob([jarBuffer],{type:'application/java-archive'}) : null;
      item.jarName = jarName || '';
      item.status = report?.outcome || 'blocked';
      item.progress = 100;
      state.worker?.terminate(); state.worker=null; state.processing=false;
      state.activeId = item.id;
      setProgress(100,'done','packing',item.file.name);
      renderBatch();
      showItem(item,true);
      processNext();
    }
  }

  function finishWithError(item,message){
    item.status='error'; item.error=message; item.progress=100;
    state.worker?.terminate(); state.worker=null; state.processing=false;
    renderBatch();
    showError(`${item.file.name}: ${message}`);
    processNext();
  }

  function renderBatch(){
    batchCount.textContent = String(state.items.length);
    batchList.replaceChildren(...state.items.map(item => {
      const button=document.createElement('button');
      button.type='button';
      button.className=`batch-item ${item.status}${item.id===state.activeId?' active':''}`;
      const label = item.status==='processing'?`${item.progress}%`:item.status.toUpperCase();
      button.innerHTML=`<span class="batch-icon">JAR</span><span class="batch-copy"><b>${escapeHtml(item.file.name)}</b><small>${escapeHtml(label)}</small></span><span class="batch-state" aria-hidden="true"></span>`;
      button.addEventListener('click',()=>{ state.activeId=item.id; renderBatch(); showItem(item,false); });
      return button;
    }));
    updateBatchSummary();
  }

  function updateBatchSummary(){
    const done=state.items.filter(x=>['clean','partial','blocked','error'].includes(x.status)).length;
    const clean=state.items.filter(x=>x.status==='clean').length;
    const attention=state.items.filter(x=>['partial','blocked','error'].includes(x.status)).length;
    batchSummary.innerHTML=`<span>${done}/${state.items.length} complete</span><span>${clean} clean</span><span>${attention} need attention</span>`;
  }

  function showItem(item,scroll){
    if(item.report){
      renderReport(item.report);
      els.results.classList.remove('hidden');
      [els.json,els.html,els.markdown].forEach(b=>b.disabled=false);
      els.download.disabled=!item.jar;
      if(scroll) els.results.scrollIntoView({behavior:'smooth',block:'start'});
    }else{
      els.results.classList.add('hidden');
      [els.download,els.json,els.html,els.markdown].forEach(b=>b.disabled=true);
      if(item.error) showError(`${item.file.name}: ${item.error}`);
    }
  }

  function getActive(){ return state.items.find(x=>x.id===state.activeId) || null; }
  function reset(){
    state.worker?.terminate(); state.worker=null; state.items=[]; state.activeId=null; state.processing=false; state.filter='all';
    els.fileInput.value=''; els.progress.hidden=true; els.results.classList.add('hidden'); batchDeck.hidden=true;
    els.status.textContent=''; els.status.className='status'; els.findingList.replaceChildren();
    [els.download,els.json,els.html,els.markdown].forEach(b=>b.disabled=true); setProgress(0,'preparing','opening');
  }
  function setProgress(percent,stageKey,phase,detail){ const p=Math.max(0,Math.min(100,Math.round(percent||0))); els.progressPercent.textContent=p+'%'; els.progressBar.style.width=p+'%'; els.progressStage.textContent=t(stageKey||'preparing'); els.status.textContent=detail||''; els.status.className='status'; document.querySelectorAll('[data-phase]').forEach(n=>n.classList.toggle('active',n.dataset.phase===phase)); }
  function showError(message){ els.progress.hidden=false; els.status.textContent=message; els.status.className='status error'; }
  function renderReport(report){ const outcome=report.outcome||'blocked'; const key=outcome==='clean'?'clean':outcome==='partial'?'partial':'blocked'; els.title.textContent=t(key+'Title'); els.summary.textContent=t(key+'Summary'); els.badge.textContent=t(key+'Badge'); els.badge.className='badge '+(key==='clean'?'success':'danger'); const score=Number(report.score||0); els.scoreValue.textContent=score; els.scoreRing.style.setProperty('--score-angle',(score*3.6)+'deg'); els.scoreRing.classList.toggle('partial',key!=='clean'); els.scoreCaption.textContent=t(key==='clean'?'scoreClean':key==='partial'?'scorePartial':'scoreBlocked'); const plugin=report.plugin||{}; els.pluginName.textContent=plugin.name||t('unknownPlugin'); els.pluginVersion.textContent=plugin.version||'—'; els.pluginMain.textContent=plugin.main||'—'; els.pluginApi.textContent=plugin.apiVersion||'—'; els.inputHash.textContent=shortHash(report.input?.sha256); els.classCount.textContent=num(report.metrics?.classes); els.patchedCount.textContent=num(report.metrics?.patched); els.manualCount.textContent=num(report.metrics?.manual); els.nestedCount.textContent=num(report.metrics?.nestedJars); els.signatureCount.textContent=num(report.metrics?.signaturesRemoved); els.elapsedTime.textContent=num(report.metrics?.elapsedMs)+' ms'; renderFindings(); }
  function renderFindings(){ const report=getActive()?.report; if(!report)return; const all=report.findings||[]; const filtered=state.filter==='all'?all:all.filter(f=>f.status===state.filter); const shown=filtered.slice(0,250); els.findingList.replaceChildren(...shown.map(renderFinding)); if(!shown.length){const div=document.createElement('div');div.className='empty';div.textContent=t('noFindings');els.findingList.append(div);} els.findingLimit.classList.toggle('hidden',filtered.length<=shown.length); }
  function renderFinding(f){ const node=document.createElement('article'); node.className='finding '+(f.status==='patched'?'patched':''); const where=[f.className,f.methodName,f.line?('line '+f.line):null].filter(Boolean).join(' · '); node.innerHTML=`<header><span class="status-pill">${escapeHtml(f.status==='patched'?t('patchedLabel'):t('manualLabel'))}</span><b>${escapeHtml(f.category||'Folia')}</b><small>${escapeHtml(f.severity||'INFO')}</small></header><code>${escapeHtml(f.original||'')}</code>${f.replacement?`<code>→ ${escapeHtml(f.replacement)}</code>`:''}<p>${escapeHtml(f.reason||'')}</p><footer>${escapeHtml(where)}${f.archive?` · ${escapeHtml(f.archive)}`:''}</footer>`; return node; }
  function reportBase(r){ return (r?.input?.name||'plugin').replace(/\.jar$/i,'')+'-pasta-report'; }
  function shortHash(value){ return value ? value.slice(0,12)+'…'+value.slice(-8) : '—'; }
  function num(value){ return Number(value||0).toLocaleString(); }
  function downloadBlob(blob,name){ if(!blob)return; const url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000); }
  function escapeHtml(value){ return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]); }
  function toMarkdown(r){ const rows=(r.findings||[]).map((f,i)=>`${i+1}. **${f.status.toUpperCase()} · ${f.severity} · ${f.category}**\n   - Site: \`${f.className||'?'}#${f.methodName||'?'}${f.line?':'+f.line:''}\`\n   - Original: \`${f.original||''}\`\n   - Replacement: ${f.replacement?'`'+f.replacement+'`':'—'}\n   - Reason: ${f.reason||''}`).join('\n'); return `# Pasta's Revenge Folia Report\n\n- Input: \`${r.input?.name||''}\`\n- SHA-256: \`${r.input?.sha256||''}\`\n- Outcome: **${r.outcome}**\n- Score: **${r.score}/100**\n- Classes: ${r.metrics?.classes||0}\n- Patched sites: ${r.metrics?.patched||0}\n- Manual findings: ${r.metrics?.manual||0}\n- Elapsed: ${r.metrics?.elapsedMs||0} ms\n\n## Findings\n\n${rows||'No findings.'}\n`; }
  function toHtml(r){ const rows=(r.findings||[]).map(f=>`<tr><td>${escapeHtml(f.status)}</td><td>${escapeHtml(f.severity)}</td><td>${escapeHtml(f.category)}</td><td><code>${escapeHtml(f.className)}#${escapeHtml(f.methodName)}</code></td><td><code>${escapeHtml(f.original)}</code></td><td><code>${escapeHtml(f.replacement||'—')}</code></td><td>${escapeHtml(f.reason)}</td></tr>`).join(''); return `<!doctype html><meta charset="utf-8"><title>Pasta report</title><style>body{font:14px system-ui;margin:2rem;color:#222}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:.55rem;text-align:left;vertical-align:top}</style><h1>Pasta's Revenge Folia Report</h1><p><b>${escapeHtml(r.input?.name)}</b></p><p>${r.score}/100 · ${escapeHtml(r.outcome)}</p><table><thead><tr><th>Status</th><th>Severity</th><th>Category</th><th>Site</th><th>Original</th><th>Replacement</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table>`; }
})();
