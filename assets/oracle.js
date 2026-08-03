
const DATA_URL='assets/data/articles.json';
const SHEET_CSV_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vTGKQTLj_6e8cvjt01huQ4vX81v3iSnrVaY94aVGae2f7XrS9NIosb5WZYPDYIL9QE1DVax9jp6vrfR/pub?output=csv';
const STORE_KEY='aetheria-oracle-records-v1';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const getRecords=()=>JSON.parse(localStorage.getItem(STORE_KEY)||'[]');
const setRecords=(items)=>localStorage.setItem(STORE_KEY,JSON.stringify(items));
function toast(text){const el=$('#toast')||document.createElement('div');el.id='toast';el.className='toast';el.textContent=text;if(!el.parentNode)document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>el.classList.remove('show'),1800)}
function parseCsv(text){
  const rows=[];let row=[];let cell='';let quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;continue}
    if(ch==='"'){quoted=!quoted;continue}
    if(ch===','&&!quoted){row.push(cell);cell='';continue}
    if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';continue}
    cell+=ch;
  }
  row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
}
function articlesFromCsv(text){
  const rows=parseCsv(text);if(rows.length<2)return[];
  const heads=rows[0].map(h=>h.trim());
  const pick=(r,...keys)=>keys.map(k=>r[k]).find(v=>v!==undefined&&String(v).trim()!=='')||'';
  const splitImages=(value)=>String(value||'').split(/[|｜]/).map(s=>s.trim()).filter(Boolean);
  const splitText=(value)=>String(value||'')
    .replace(/\r/g,'')
    .split(/\n\s*\.\s*\n|\n{2,}|\|/g)
    .map(sanitizeText)
    .map(s=>s.trim())
    .filter(Boolean);
  return rows.slice(1)
    .map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]||''])))
    .filter(r=>pick(r,'id'))
    .filter(r=>!pick(r,'狀態','status')||pick(r,'狀態','status')==='\u4e0a\u67b6')
    .map(r=>{
      const cover=directImageUrl(pick(r,'封面圖','cover','coverImage'));
      const images=splitImages(pick(r,'輪播圖片','images','gallery')).map(directImageUrl);
      const intro=splitText(pick(r,'前言','intro'));
      const content=splitText(pick(r,'占卜內容','paragraphs','content'));
      return {
        id:pick(r,'id'),
        code:pick(r,'code'),
        sort:Number(pick(r,'排序','sort'))||9999,
        title:sanitizeText(pick(r,'標題','title')),
        excerpt:sanitizeText(pick(r,'首頁簡介','excerpt')),
        published:pick(r,'發布日期','published'),
        images:[cover,...images].filter(Boolean),
        paragraphs:[...intro,...content].filter(Boolean),
        recordHint:sanitizeText(pick(r,'紀錄提示','recordHint'))
      };
    })
    .sort((a,b)=>a.sort-b.sort||String(a.code).localeCompare(String(b.code)));
}
function sanitizeText(value){
  return String(value||'')
    .replace(/哀居|脆|分頁\s*\d*/g,'')
    .replace(/[\uFE0E\uFE0F\u20E3]/g,'')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu,'')
    .replace(/[\u2600-\u27BF]/g,'')
    .replace(/^[\s　:：,，。．\-—~～]+/g,'')
    .trim();
}
function directImageUrl(url){
  url=String(url||'').trim();
  if(!url)return '';
  const match=url.match(/\/d\/([^/]+)/)||url.match(/[?&]id=([^&]+)/);
  if(match&&url.includes('drive.google.com')){
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  }
  return url;
}
async function loadArticles(){
  if(SHEET_CSV_URL){
    const csv=await fetch(SHEET_CSV_URL,{cache:'no-store'}).then(r=>r.text());
    const rows=articlesFromCsv(csv);
    if(rows.length)return rows;
  }
  const res=await fetch(DATA_URL,{cache:'no-store'});
  return await res.json();
}
function card(article){return `<a class="article-card" href="article.html?id=${encodeURIComponent(article.id)}"><img src="${article.images[0]||''}" alt="${article.title}" loading="lazy"><div class="article-body"><div class="meta">${article.code}</div><h3>${article.title}</h3><p class="muted">${article.excerpt||'\u9032\u5165\u6587\u7ae0\u5f8c\u8a18\u9304\u4f60\u7684\u9078\u9805\u8207\u611f\u53d7\u3002'}</p><span>\u9032\u5165\u5360\u535c \u2192</span></div></a>`}
async function renderIndex(){const root=$('#articleGrid');if(!root)return;const articles=await loadArticles();root.innerHTML=articles.map(card).join('')}
async function renderArticle(){
  const root=$('#articlePage');
  if(!root)return;
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const articles=await loadArticles();
  const a=articles.find(x=>x.id===id)||articles[0];
  document.title=a.title+'\uff5cAetheria Oracle Archive';
  const paragraphs=(a.paragraphs||[]).slice(0,80);
  const intro=paragraphs.slice(0,2);
  const body=paragraphs.slice(2);
  const hint=a.recordHint||'\u6bcf\u7bc7\u5360\u535c\u898f\u5247\u4e0d\u540c\uff0c\u53ef\u4ee5\u586b A\u30011+3 \u6216 A1B2F3\u3002\u5982\u679c\u540c\u4e00\u5f35\u5716\u91cd\u8907\u88ab\u4f60\u9078\u5230\uff0c\u4e5f\u53ef\u4ee5\u7167\u5be6\u8a18\u4e0b\u3002';
  root.innerHTML=`<div class="article-layout"><main><article class="reading article-reading"><div class="meta">${a.code}</div><h1>${a.title}</h1><div class="article-intro">${intro.map(p=>`<p>${p}</p>`).join('')}</div><div class="image-carousel" aria-label="\u5360\u535c\u5716\u7247">${(a.images||[]).map(src=>`<img src="${src}" alt="${a.title}" loading="lazy">`).join('')}</div><div class="article-content">${body.map(p=>`<p>${p}</p>`).join('')}</div></article></main><aside class="choice-box"><h2>\u8a18\u9304\u9019\u6b21\u8a0a\u606f</h2><p class="muted">${hint}</p><div class="field"><label>\u6211\u9019\u6b21\u9078\u5230</label><input id="choiceInput" type="text" placeholder="\u4f8b\u5982\uff1aA1B2F3\uff0c\u4e5f\u53ef\u4ee5\u91cd\u8907\u9078\u540c\u4e00\u5f35\u5716"></div><div class="field"><label>\u7576\u4e0b\u611f\u53d7</label><textarea id="noteInput" placeholder="\u9019\u6b21\u6211\u770b\u898b\u2026\u2026"></textarea></div><button class="btn" id="saveRecord">\u5132\u5b58\u5230\u6211\u7684\u7d00\u9304</button><a class="btn secondary" href="records.html">\u67e5\u770b\u6211\u7684\u7d00\u9304</a></aside></div>`;
  $('#saveRecord').addEventListener('click',()=>{
    const records=getRecords();
    const choice=($('#choiceInput').value||'').trim()||'\u672a\u586b\u5beb';
    records.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),articleId:a.id,code:a.code,title:a.title,choice,note:$('#noteInput').value.trim(),date:new Date().toISOString()});
    setRecords(records);
    toast('\u5df2\u5132\u5b58\u9019\u6b21\u5360\u535c\u7d00\u9304');
  });
}
function recordText(r){return `Aetheria Art Soul\uff5c\u5360\u535c\u7d00\u9304\n\n\u65e5\u671f\uff1a${new Date(r.date).toLocaleString('zh-TW')}\n\u5360\u535c\uff1a${r.title}\n\u9078\u9805\uff1a${r.choice}\n\n\u7576\u4e0b\u611f\u53d7\uff1a\n${r.note||'\u672a\u586b\u5beb'}\n`}
function downloadDoc(){const records=getRecords();const body=records.map(recordText).join('\n------------------------------\n\n');const html=`<html><head><meta charset="utf-8"></head><body><pre style="font-family:'Microsoft JhengHei',sans-serif;white-space:pre-wrap;line-height:1.8">${body.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</pre></body></html>`;const blob=new Blob([html],{type:'application/msword'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Aetheria\u5360\u535c\u7d00\u9304.doc';a.click();URL.revokeObjectURL(a.href)}
function renderRecords(){const root=$('#recordList');if(!root)return;const records=getRecords();if(!records.length){root.innerHTML='<div class="empty">\u76ee\u524d\u9084\u6c92\u6709\u5132\u5b58\u7684\u5360\u535c\u7d00\u9304\u3002</div>';return}root.innerHTML=records.map(r=>`<article class="record-card"><div class="meta">${new Date(r.date).toLocaleDateString('zh-TW')}</div><h3>${r.title}</h3><p><strong>${r.choice}</strong></p><p class="muted">${(r.note||'\u672a\u586b\u5beb\u611f\u53d7').replace(/</g,'&lt;')}</p><div class="record-actions"><button class="btn secondary" data-copy="${r.id}">\u8907\u88fd</button><button class="btn secondary" data-delete="${r.id}">\u522a\u9664</button></div></article>`).join('');$$('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{const r=getRecords().find(x=>x.id===btn.dataset.copy);await navigator.clipboard.writeText(recordText(r));toast('\u5df2\u8907\u88fd\u7d00\u9304')}));$$('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>{setRecords(getRecords().filter(x=>x.id!==btn.dataset.delete));renderRecords();toast('\u5df2\u522a\u9664')}))}
function bindRecordsPage(){if($('#downloadDoc'))$('#downloadDoc').addEventListener('click',downloadDoc);if($('#copyAll'))$('#copyAll').addEventListener('click',async()=>{await navigator.clipboard.writeText(getRecords().map(recordText).join('\n------------------------------\n\n'));toast('\u5df2\u8907\u88fd\u5168\u90e8\u7d00\u9304')});if($('#clearAll'))$('#clearAll').addEventListener('click',()=>{if(confirm('\u78ba\u5b9a\u6e05\u7a7a\u6240\u6709\u7d00\u9304\u55ce\uff1f')){setRecords([]);renderRecords()}})}
function initMobileMenu(){
  const toggle=document.querySelector('.mobile-menu-toggle');
  const nav=document.querySelector('.nav-links');
  if(!toggle||!nav)return;
  const panel=document.createElement('nav');
  panel.className='mobile-nav-panel';
  panel.setAttribute('aria-label','Mobile menu');
  panel.innerHTML=nav.innerHTML;
  const backdrop=document.createElement('div');
  backdrop.className='mobile-nav-backdrop';
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  const setOpen=(open)=>{
    toggle.setAttribute('aria-expanded',String(open));
    panel.classList.toggle('is-open',open);
    backdrop.classList.toggle('is-open',open);
    document.body.classList.toggle('menu-open',open);
  };
  toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
  backdrop.addEventListener('click',()=>setOpen(false));
  panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
}
document.addEventListener('DOMContentLoaded',()=>{initMobileMenu();renderIndex();renderArticle();renderRecords();bindRecordsPage()});
