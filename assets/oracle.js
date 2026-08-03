const DATA_URL = 'assets/data/articles.json';
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGKQTLj_6e8cvjt01huQ4vX81v3iSnrVaY94aVGae2f7XrS9NIosb5WZYPDYIL9QE1DVax9jp6vrfR/pub?output=csv';
const STORE_KEY = 'aetheria-oracle-records-v1';

const T = {
  allCopied: '\u5df2\u8907\u88fd\u5168\u90e8\u7d00\u9304',
  article: '\u5360\u535c',
  articleEnter: '\u9032\u5165\u5360\u535c \u2192',
  cardAlt: '\u5360\u535c\u5716\u7247',
  choice: '\u9078\u9805',
  choiceLabel: '\u6211\u9019\u6b21\u9078\u5230',
  choicePlaceholder: '\u4f8b\u5982\uff1aA1B2F3\uff0c\u4e5f\u53ef\u4ee5\u91cd\u8907\u9078\u540c\u4e00\u5f35\u5716',
  clearConfirm: '\u78ba\u5b9a\u6e05\u7a7a\u6240\u6709\u7d00\u9304\u55ce\uff1f',
  copied: '\u5df2\u8907\u88fd\u7d00\u9304',
  date: '\u65e5\u671f',
  deleted: '\u5df2\u522a\u9664',
  deleteLabel: '\u522a\u9664',
  downloadName: 'Aetheria\u5360\u535c\u7d00\u9304.doc',
  emptyRecords: '\u9084\u6c92\u6709\u5132\u5b58\u7684\u5360\u535c\u7d00\u9304\u3002',
  emailInvalid: '\u8acb\u5148\u8f38\u5165\u6b63\u78ba\u7684 Email',
  emailNoRecords: '\u76ee\u524d\u9084\u6c92\u6709\u53ef\u4ee5\u5bc4\u51fa\u7684\u7d00\u9304',
  emailSubject: 'Aetheria Art Soul\uff5c\u6211\u7684\u5360\u535c\u7d00\u9304',
  fallbackExcerpt: '\u9032\u5165\u6587\u7ae0\uff0c\u6162\u6162\u770b\u898b\u9019\u6b21\u88ab\u4f60\u9078\u4e2d\u7684\u8a0a\u606f\u3002',
  hint: '\u6bcf\u7bc7\u5360\u535c\u898f\u5247\u4e0d\u540c\uff0c\u53ef\u4ee5\u586b A\u30011+3 \u6216 A1B2F3\u3002\u5982\u679c\u540c\u4e00\u5f35\u5716\u91cd\u8907\u88ab\u4f60\u9078\u5230\uff0c\u4e5f\u53ef\u4ee5\u7167\u5be6\u8a18\u4e0b\u3002',
  menu: '\u624b\u6a5f\u5c0e\u89bd',
  next: '\u4e0b\u4e00\u5f35',
  noNote: '\u672a\u586b\u5beb',
  noSelectedMessages: '\u6c92\u6709\u81ea\u52d5\u5c0d\u61c9\u5230\u9078\u9805\u5167\u5bb9\u3002',
  note: '\u7576\u4e0b\u611f\u53d7',
  noteLabel: '\u7576\u4e0b\u611f\u53d7',
  notePlaceholder: '\u9019\u6b21\u6211\u770b\u898b\u2026\u2026',
  prev: '\u4e0a\u4e00\u5f35',
  recordSaved: '\u5df2\u5132\u5b58\u9019\u6b21\u5360\u535c\u7d00\u9304',
  recordTitle: 'Aetheria Art Soul\uff5c\u5360\u535c\u7d00\u9304',
  save: '\u5132\u5b58\u5230\u6211\u7684\u7d00\u9304',
  selectedMessages: '\u9019\u6b21\u9078\u9805\u5c0d\u61c9\u7684\u8a0a\u606f',
  viewRecords: '\u67e5\u770b\u6211\u7684\u7d00\u9304',
};

const K = {
  content: '\u5360\u535c\u5167\u5bb9',
  cover: '\u5c01\u9762\u5716',
  date: '\u767c\u5e03\u65e5\u671f',
  excerpt: '\u9996\u9801\u7c21\u4ecb',
  gallery: '\u8f2a\u64ad\u5716\u7247',
  hint: '\u7d00\u9304\u63d0\u793a',
  intro: '\u524d\u8a00',
  sort: '\u6392\u5e8f',
  status: '\u72c0\u614b',
  title: '\u6a19\u984c',
  live: '\u4e0a\u67b6',
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const getRecords = () => JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
const setRecords = (items) => localStorage.setItem(STORE_KEY, JSON.stringify(items));

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[match]));
}

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
    .replace(/(?:\u54c0\u5c45|\u8106|\u5206\u9801)\s*\d*/g, '')
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
  const splitImages = (value) => String(value || '').split(/[|｜]/).map(directImageUrl).filter(Boolean);
  const splitText = (value) => String(value || '')
    .replace(/\r/g, '')
    .split(/\n+|\|/g)
    .map(sanitizeText)
    .filter(Boolean);

  return rows.slice(1)
    .map((row) => Object.fromEntries(heads.map((head, index) => [head, row[index] || ''])))
    .filter((row) => pick(row, 'id'))
    .filter((row) => {
      const status = pick(row, K.status, 'status');
      return !status || status === K.live;
    })
    .map((row) => {
      const cover = directImageUrl(pick(row, K.cover, 'cover', 'coverImage'));
      const gallery = splitImages(pick(row, K.gallery, 'images', 'gallery'));
      const introParagraphs = splitText(pick(row, K.intro, 'intro'));
      const contentParagraphs = splitText(pick(row, K.content, 'paragraphs', 'content'));
      return {
        id: pick(row, 'id'),
        code: pick(row, 'code'),
        sort: Number(pick(row, K.sort, 'sort')) || 9999,
        title: sanitizeText(pick(row, K.title, 'title')),
        excerpt: sanitizeText(pick(row, K.excerpt, 'excerpt')),
        published: pick(row, K.date, 'published'),
        coverImage: cover || gallery[0] || '',
        images: gallery.filter(Boolean),
        introParagraphs,
        contentParagraphs,
        paragraphs: [...introParagraphs, ...contentParagraphs],
        recordHint: sanitizeText(pick(row, K.hint, 'recordHint')),
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
  const excerpt = truncateText(article.excerpt || T.fallbackExcerpt, 150);
  const image = article.coverImage || article.images[0] || '';
  return `
    <a class="article-card" href="article.html?id=${encodeURIComponent(article.id)}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" loading="lazy">
      <div class="article-body">
        <div class="meta">${escapeHtml(article.code)}</div>
        <h3>${escapeHtml(article.title)}</h3>
        <p class="muted">${escapeHtml(excerpt)}</p>
        <span>${T.articleEnter}</span>
      </div>
    </a>
  `;
}

function truncateText(text, limit = 150) {
  const value = String(text || '').trim();
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}......`;
}

function renderReadingParagraph(paragraph) {
  const text = String(paragraph || '').trim();
  const optionMatch = text.match(/^[\s\u25a0\u25ae\u258d\u2022\-]*([A-H])\s*[|｜:：、.．]\s*(.+)$/i);
  if (optionMatch) {
    return `
      <section class="oracle-option-block">
        <span class="oracle-option-badge">${escapeHtml(optionMatch[1].toUpperCase())}</span>
        <p>${escapeHtml(optionMatch[2])}</p>
      </section>
    `;
  }

  const numberedMatch = text.match(/^[\s\u25a0\u25ae\u258d\u2022\-]*([1-9])\s*[|｜:：、.．]?\s*(.+)$/);
  if (numberedMatch) {
    return `
      <section class="oracle-number-block">
        <span class="oracle-number">${escapeHtml(numberedMatch[1])}</span>
        <p>${escapeHtml(numberedMatch[2])}</p>
      </section>
    `;
  }

  return `<p>${escapeHtml(text)}</p>`;
}

function renderReadingText(paragraphs) {
  return (paragraphs || []).map(renderReadingParagraph).join('');
}

async function renderIndex() {
  const root = $('#articleGrid');
  if (!root) return;
  const articles = await loadArticles();
  root.innerHTML = articles.map(card).join('');
}

function normalizeToken(token) {
  return String(token || '').trim().toUpperCase();
}

function parseChoiceTokens(choice) {
  return String(choice || '')
    .toUpperCase()
    .match(/[A-Z]|\d+/g) || [];
}

function paragraphToken(paragraph, kind = 'any') {
  const text = String(paragraph || '').trim();
  const marker = '[\\s\\u258d\\u25ae\\u25aa\\u25cf\\u2022\\-]*';
  const letter = new RegExp(`^${marker}([A-Z])\\s*(?:[^\\w]|\\s|$)`, 'i');
  const number = new RegExp(`^${marker}(\\d+)\\s*(?:\\ufe0f?\\u20e3|[^\\w]|\\s|$)`, 'i');
  const match = kind === 'letter'
    ? text.match(letter)
    : kind === 'number'
      ? text.match(number)
      : text.match(letter) || text.match(number);
  return match ? normalizeToken(match[1]) : '';
}

function selectedMessagesFromChoice(choice, paragraphs) {
  const tokens = parseChoiceTokens(choice);
  const optionMap = buildOptionMessageMap(paragraphs);
  const pairs = choicePairs(tokens);
  const matchedPairs = [];

  pairs.forEach(({ letter, number }) => {
    const message = optionMap.get(`${letter}${number}`);
    if (message) matchedPairs.push(message);
  });

  if (matchedPairs.length) return matchedPairs;

  const used = new Set();
  return tokens.reduce((matches, token) => {
    const normalized = normalizeToken(token);
    const found = Array.from(optionMap.entries()).find(([key]) => key.startsWith(normalized) && !used.has(key));
    if (found) {
      used.add(found[0]);
      matches.push(found[1]);
    }
    return matches;
  }, []);
}

function choicePairs(tokens) {
  const letters = tokens.filter((token) => /^[A-Z]$/.test(token));
  const numbers = tokens.filter((token) => /^\d+$/.test(token));
  if (letters.length && numbers.length) {
    return letters.map((letter, index) => ({ letter, number: numbers[index] || String(index + 1) }));
  }
  return letters.map((letter, index) => ({ letter, number: String(index + 1) }));
}

function buildOptionMessageMap(paragraphs) {
  const map = new Map();
  let letter = '';
  let number = '';
  let buffer = [];

  const flush = () => {
    if (letter && number && buffer.length) {
      map.set(`${letter}${number}`, buffer.join('\n'));
    }
    buffer = [];
  };

  paragraphs.forEach((paragraph) => {
    const nextLetter = paragraphToken(paragraph, 'letter');
    const nextNumber = paragraphToken(paragraph, 'number');

    if (nextLetter) {
      flush();
      letter = nextLetter;
      number = '';
      return;
    }

    if (nextNumber && letter) {
      flush();
      number = nextNumber;
      buffer = [paragraph];
      return;
    }

    if (letter && number) {
      buffer.push(paragraph);
    }
  });

  flush();
  return map;
}

async function renderArticle() {
  const root = $('#articlePage');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const articles = await loadArticles();
  const article = articles.find((item) => item.id === id) || articles[0];
  document.title = `${article.title}\uff5cAetheria Art Soul`;

  const intro = article.introParagraphs && article.introParagraphs.length ? article.introParagraphs : (article.paragraphs || []).slice(0, 1);
  const body = article.contentParagraphs && article.contentParagraphs.length ? article.contentParagraphs : (article.paragraphs || []).slice(intro.length);
  const hint = article.recordHint || T.hint;
  const carousel = (article.images || []).length
    ? `<div class="carousel-shell" data-carousel>
        <button class="carousel-arrow carousel-prev" type="button" aria-label="${T.prev}">\u2039</button>
        <div class="image-carousel" aria-label="${T.cardAlt}">
          ${article.images.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(article.title)} ${index + 1}" loading="lazy">`).join('')}
        </div>
        <button class="carousel-arrow carousel-next" type="button" aria-label="${T.next}">\u203a</button>
        <div class="carousel-dots" aria-hidden="true">
          ${article.images.map((_, index) => `<span class="${index === 0 ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>`
    : '';

  root.innerHTML = `
    <div class="article-layout">
      <main>
        <article class="reading article-reading">
          <div class="meta">${escapeHtml(article.code)}</div>
          <h1>${escapeHtml(article.title)}</h1>
          <div class="article-intro">${renderReadingText(intro)}</div>
          ${carousel}
          <div class="article-content">${renderReadingText(body)}</div>
        </article>
      </main>
      <aside class="choice-box">
        <h2>${T.save.replace('\u5132\u5b58\u5230', '\u8a18\u9304')}</h2>
        <p class="muted">${escapeHtml(hint)}</p>
        <div class="field">
          <label>${T.choiceLabel}</label>
          <input id="choiceInput" type="text" placeholder="${T.choicePlaceholder}">
        </div>
        <div class="field">
          <label>${T.noteLabel}</label>
          <textarea id="noteInput" placeholder="${T.notePlaceholder}"></textarea>
        </div>
        <div class="choice-actions">
          <button class="btn" id="saveRecord">${T.save}</button>
          <a class="btn secondary" href="records.html">${T.viewRecords}</a>
        </div>
      </aside>
    </div>
  `;

  $('#saveRecord').addEventListener('click', () => {
    const records = getRecords();
    const choice = ($('#choiceInput').value || '').trim() || T.noNote;
    const selectedMessages = selectedMessagesFromChoice(choice, body);
    records.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      articleId: article.id,
      code: article.code,
      title: article.title,
      choice,
      selectedMessages,
      note: $('#noteInput').value.trim(),
      date: new Date().toISOString(),
    });
    setRecords(records);
    toast(T.recordSaved);
  });
  initCarousels(root);
}

function initCarousels(root = document) {
  $$('[data-carousel]', root).forEach((shell) => {
    const track = $('.image-carousel', shell);
    const slides = $$('img', track);
    const dots = $$('.carousel-dots span', shell);
    const prev = $('.carousel-prev', shell);
    const next = $('.carousel-next', shell);
    if (!track || slides.length <= 1) {
      if (prev) prev.hidden = true;
      if (next) next.hidden = true;
      return;
    }
    const slideTo = (direction) => {
      const current = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      const target = Math.max(0, Math.min(slides.length - 1, current + direction));
      track.scrollTo({ left: slides[target].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };
    const update = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let active = 0;
      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        if (Math.abs(slideCenter - center) < Math.abs((slides[active].offsetLeft + slides[active].clientWidth / 2) - center)) active = index;
      });
      dots.forEach((dot, index) => dot.classList.toggle('active', index === active));
      prev.disabled = active === 0;
      next.disabled = active === slides.length - 1;
    };
    prev.addEventListener('click', () => slideTo(-1));
    next.addEventListener('click', () => slideTo(1));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();
  });
}

function selectedMessagesText(record) {
  const messages = record.selectedMessages || [];
  if (!messages.length) return T.noSelectedMessages;
  return messages.map((message) => `- ${message}`).join('\n');
}

function recordText(record) {
  return `${T.recordTitle}\n\n${T.date}\uff1a${new Date(record.date).toLocaleString('zh-TW')}\n${T.article}\uff1a${record.title}\n${T.choice}\uff1a${record.choice}\n\n${T.selectedMessages}\uff1a\n${selectedMessagesText(record)}\n\n${T.note}\uff1a\n${record.note || T.noNote}\n`;
}

function downloadDoc() {
  const records = getRecords();
  const body = records.map(recordText).join('\n------------------------------\n\n');
  const html = `<html><head><meta charset="utf-8"></head><body><pre style="font-family:'Microsoft JhengHei',sans-serif;white-space:pre-wrap;line-height:1.8">${escapeHtml(body)}</pre></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = T.downloadName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function emailRecords(event) {
  event.preventDefault();
  const email = ($('#recordEmail')?.value || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast(T.emailInvalid);
    return;
  }
  const records = getRecords();
  if (!records.length) {
    toast(T.emailNoRecords);
    return;
  }
  const body = records.map(recordText).join('\n------------------------------\n\n');
  const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(T.emailSubject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

function renderRecords() {
  const root = $('#recordList');
  if (!root) return;
  const records = getRecords();
  if (!records.length) {
    root.innerHTML = `<div class="empty">${T.emptyRecords}</div>`;
    return;
  }
  root.innerHTML = records.map((record) => `
    <article class="record-card">
      <div class="meta">${new Date(record.date).toLocaleDateString('zh-TW')}</div>
      <h3>${escapeHtml(record.title)}</h3>
      <p><strong>${escapeHtml(record.choice)}</strong></p>
      <div class="record-selected">
        <strong>${T.selectedMessages}</strong>
        ${(record.selectedMessages || []).length
          ? `<ul>${record.selectedMessages.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>`
          : `<p class="muted">${T.noSelectedMessages}</p>`}
      </div>
      <p class="muted">${escapeHtml(record.note || T.noNote)}</p>
      <div class="record-actions">
        <button class="btn secondary" data-copy="${record.id}">\u8907\u88fd</button>
        <button class="btn secondary" data-delete="${record.id}">${T.deleteLabel}</button>
      </div>
    </article>
  `).join('');
  $$('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const record = getRecords().find((item) => item.id === button.dataset.copy);
    await navigator.clipboard.writeText(recordText(record));
    toast(T.copied);
  }));
  $$('[data-delete]').forEach((button) => button.addEventListener('click', () => {
    setRecords(getRecords().filter((item) => item.id !== button.dataset.delete));
    renderRecords();
    toast(T.deleted);
  }));
}

function bindRecordsPage() {
  if ($('#downloadDoc')) $('#downloadDoc').addEventListener('click', downloadDoc);
  if ($('#recordEmailForm')) $('#recordEmailForm').addEventListener('submit', emailRecords);
  if ($('#copyAll')) $('#copyAll').addEventListener('click', async () => {
    await navigator.clipboard.writeText(getRecords().map(recordText).join('\n------------------------------\n\n'));
    toast(T.allCopied);
  });
  if ($('#clearAll')) $('#clearAll').addEventListener('click', () => {
    if (confirm(T.clearConfirm)) {
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
  panel.setAttribute('aria-label', T.menu);
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

function protectImages() {
  const lockImage = (image) => {
    image.setAttribute('draggable', 'false');
    image.addEventListener('dragstart', (event) => event.preventDefault());
    image.addEventListener('contextmenu', (event) => event.preventDefault());
  };
  $$('img').forEach(lockImage);
  document.addEventListener('contextmenu', (event) => {
    if (event.target && event.target.closest && event.target.closest('img')) {
      event.preventDefault();
    }
  });
  document.addEventListener('dragstart', (event) => {
    if (event.target && event.target.closest && event.target.closest('img')) {
      event.preventDefault();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  protectImages();
  renderIndex();
  renderArticle();
  renderRecords();
  bindRecordsPage();
  protectImages();
});
