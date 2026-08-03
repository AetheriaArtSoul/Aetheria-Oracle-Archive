const DATA_URL = 'assets/data/articles.json';
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGKQTLj_6e8cvjt01huQ4vX81v3iSnrVaY94aVGae2f7XrS9NIosb5WZYPDYIL9QE1DVax9jp6vrfR/pub?output=csv';
const STORE_KEY = 'aetheria-oracle-records-v1';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const getRecords = () => JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
const setRecords = (items) => localStorage.setItem(STORE_KEY, JSON.stringify(items));

function toast(text) {
  const el = $('#toast') || document.createElement('div');
  el.id = 'toast';
  el.className = 'toast';
  el.textContent = text;
  if (!el.parentNode) document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => el.classList.remove('show'), 1800);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) {
      row.push(cell);
      cell = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += ch;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/(?:哀居|脆|分頁)\s*\d*/g, '')
    .replace(/[\uFE0E\uFE0F\u20E3]/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/^[\s:：，,、\-—]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function directImageUrl(url) {
  const source = String(url || '').trim();
  if (!source) return '';
  const match = source.match(/\/d\/([^/]+)/) || source.match(/[?&]id=([^&]+)/);
  if (match && source.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  }
  return source;
}

function articlesFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const heads = rows[0].map((head) => head.trim());
  const pick = (row, ...keys) => keys.map((key) => row[key]).find((value) => value !== undefined && String(value).trim() !== '') || '';
  const splitImages = (value) => String(value || '')
    .split(/[|｜]/)
    .map((item) => directImageUrl(item))
    .filter(Boolean);
  const splitText = (value) => String(value || '')
    .replace(/\r/g, '')
    .split(/\n+|\|/g)
    .map(sanitizeText)
    .filter(Boolean);

  return rows.slice(1)
    .map((row) => Object.fromEntries(heads.map((head, index) => [head, row[index] || ''])))
    .filter((row) => pick(row, 'id'))
    .filter((row) => {
      const status = pick(row, '狀態', 'status');
      return !status || status === '上架';
    })
    .map((row) => {
      const cover = directImageUrl(pick(row, '封面圖', 'cover', 'coverImage'));
      const gallery = splitImages(pick(row, '輪播圖片', 'images', 'gallery'));
      const introParagraphs = splitText(pick(row, '前言', 'intro'));
      const contentParagraphs = splitText(pick(row, '占卜內容', 'paragraphs', 'content'));

      return {
        id: pick(row, 'id'),
        code: pick(row, 'code'),
        sort: Number(pick(row, '排序', 'sort')) || 9999,
        title: sanitizeText(pick(row, '標題', 'title')),
        excerpt: sanitizeText(pick(row, '首頁簡介', 'excerpt')),
        published: pick(row, '發布日期', 'published'),
        coverImage: cover || gallery[0] || '',
        images: gallery.filter(Boolean),
        introParagraphs,
        contentParagraphs,
        paragraphs: [...introParagraphs, ...contentParagraphs],
        recordHint: sanitizeText(pick(row, '紀錄提示', 'recordHint')),
      };
    })
    .sort((a, b) => a.sort - b.sort || String(a.code).localeCompare(String(b.code)));
}

async function loadArticles() {
  if (SHEET_CSV_URL) {
    const csv = await fetch(SHEET_CSV_URL, { cache: 'no-store' }).then((response) => response.text());
    const rows = articlesFromCsv(csv);
    if (rows.length) return rows;
  }
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  return response.json();
}

function card(article) {
  const excerpt = article.excerpt || '進入文章，慢慢看見這次被你選中的訊息。';
  const image = article.coverImage || article.images[0] || '';
  return `
    <a class="article-card" href="article.html?id=${encodeURIComponent(article.id)}">
      <img src="${image}" alt="${article.title}" loading="lazy">
      <div class="article-body">
        <div class="meta">${article.code}</div>
        <h3>${article.title}</h3>
        <p class="muted">${excerpt}</p>
        <span>進入占卜 →</span>
      </div>
    </a>
  `;
}

async function renderIndex() {
  const root = $('#articleGrid');
  if (!root) return;
  const articles = await loadArticles();
  root.innerHTML = articles.map(card).join('');
}

async function renderArticle() {
  const root = $('#articlePage');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const articles = await loadArticles();
  const article = articles.find((item) => item.id === id) || articles[0];

  document.title = `${article.title}｜Aetheria Art Soul`;

  const intro = (article.introParagraphs && article.introParagraphs.length)
    ? article.introParagraphs
    : (article.paragraphs || []).slice(0, 1);
  const body = (article.contentParagraphs && article.contentParagraphs.length)
    ? article.contentParagraphs
    : (article.paragraphs || []).slice(intro.length);
  const hint = article.recordHint || '每篇占卜規則不同，可以填 A、1+3 或 A1B2F3。如果同一張圖重複被你選到，也可以照實記下。';

  const carousel = (article.images || []).length
    ? `<div class="image-carousel" aria-label="占卜圖片">
        ${article.images.map((src) => `<img src="${src}" alt="${article.title}" loading="lazy">`).join('')}
      </div>`
    : '';

  root.innerHTML = `
    <div class="article-layout">
      <main>
        <article class="reading article-reading">
          <div class="meta">${article.code}</div>
          <h1>${article.title}</h1>
          <div class="article-intro">${intro.map((paragraph) => `<p>${paragraph}</p>`).join('')}</div>
          ${carousel}
          <div class="article-content">${body.map((paragraph) => `<p>${paragraph}</p>`).join('')}</div>
        </article>
      </main>
      <aside class="choice-box">
        <h2>記錄這次訊息</h2>
        <p class="muted">${hint}</p>
        <div class="field">
          <label>我這次選到</label>
          <input id="choiceInput" type="text" placeholder="例如：A1B2F3，也可以重複選同一張圖">
        </div>
        <div class="field">
          <label>當下感受</label>
          <textarea id="noteInput" placeholder="這次我看見……"></textarea>
        </div>
        <button class="btn" id="saveRecord">儲存到我的紀錄</button>
        <a class="btn secondary" href="records.html">查看我的紀錄</a>
      </aside>
    </div>
  `;

  $('#saveRecord').addEventListener('click', () => {
    const records = getRecords();
    const choice = ($('#choiceInput').value || '').trim() || '未填寫';
    records.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      articleId: article.id,
      code: article.code,
      title: article.title,
      choice,
      note: $('#noteInput').value.trim(),
      date: new Date().toISOString(),
    });
    setRecords(records);
    toast('已儲存這次占卜紀錄');
  });
}

function recordText(record) {
  return `Aetheria Art Soul｜占卜紀錄\n\n日期：${new Date(record.date).toLocaleString('zh-TW')}\n占卜：${record.title}\n選項：${record.choice}\n\n當下感受：\n${record.note || '未填寫'}\n`;
}

function downloadDoc() {
  const records = getRecords();
  const body = records.map(recordText).join('\n------------------------------\n\n');
  const html = `<html><head><meta charset="utf-8"></head><body><pre style="font-family:'Microsoft JhengHei',sans-serif;white-space:pre-wrap;line-height:1.8">${body.replace(/[&<>]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[match]))}</pre></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Aetheria占卜紀錄.doc';
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderRecords() {
  const root = $('#recordList');
  if (!root) return;
  const records = getRecords();
  if (!records.length) {
    root.innerHTML = '<div class="empty">目前還沒有儲存的占卜紀錄。</div>';
    return;
  }

  root.innerHTML = records.map((record) => `
    <article class="record-card">
      <div class="meta">${new Date(record.date).toLocaleDateString('zh-TW')}</div>
      <h3>${record.title}</h3>
      <p><strong>${record.choice}</strong></p>
      <p class="muted">${(record.note || '未填寫感受').replace(/</g, '&lt;')}</p>
      <div class="record-actions">
        <button class="btn secondary" data-copy="${record.id}">複製</button>
        <button class="btn secondary" data-delete="${record.id}">刪除</button>
      </div>
    </article>
  `).join('');

  $$('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const record = getRecords().find((item) => item.id === button.dataset.copy);
    await navigator.clipboard.writeText(recordText(record));
    toast('已複製紀錄');
  }));

  $$('[data-delete]').forEach((button) => button.addEventListener('click', () => {
    setRecords(getRecords().filter((item) => item.id !== button.dataset.delete));
    renderRecords();
    toast('已刪除');
  }));
}

function bindRecordsPage() {
  if ($('#downloadDoc')) $('#downloadDoc').addEventListener('click', downloadDoc);
  if ($('#copyAll')) $('#copyAll').addEventListener('click', async () => {
    await navigator.clipboard.writeText(getRecords().map(recordText).join('\n------------------------------\n\n'));
    toast('已複製全部紀錄');
  });
  if ($('#clearAll')) $('#clearAll').addEventListener('click', () => {
    if (confirm('確定清空所有紀錄嗎？')) {
      setRecords([]);
      renderRecords();
    }
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (!toggle || !nav) return;

  const panel = document.createElement('nav');
  panel.className = 'mobile-nav-panel';
  panel.setAttribute('aria-label', '手機導覽');
  panel.innerHTML = nav.innerHTML;

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  backdrop.addEventListener('click', () => setOpen(false));
  panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  renderIndex();
  renderArticle();
  renderRecords();
  bindRecordsPage();
});
