const inputText = document.getElementById('inputText');
const cleanedText = document.getElementById('cleanedText');
const resultsBody = document.getElementById('resultsBody');
const visualizedText = document.getElementById('visualizedText');
const suspiciousCount = document.getElementById('suspiciousCount');
const typeCount = document.getElementById('typeCount');
const changeCount = document.getElementById('changeCount');
const charCount = document.getElementById('charCount');
const toast = document.getElementById('toast');

const KNOWN = new Map([
  [0x00AD, { name: 'SOFT HYPHEN', category: 'Cf', action: 'remove', level: 'safe' }],
  [0x00A0, { name: 'NO-BREAK SPACE', category: 'Zs', action: 'space', level: 'normalize' }],
  [0x061C, { name: 'ARABIC LETTER MARK', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x180E, { name: 'MONGOLIAN VOWEL SEPARATOR', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2007, { name: 'FIGURE SPACE', category: 'Zs', action: 'space', level: 'normalize' }],
  [0x200B, { name: 'ZERO WIDTH SPACE', category: 'Cf', action: 'remove', level: 'safe' }],
  [0x200C, { name: 'ZERO WIDTH NON-JOINER', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x200D, { name: 'ZERO WIDTH JOINER', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x200E, { name: 'LEFT-TO-RIGHT MARK', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x200F, { name: 'RIGHT-TO-LEFT MARK', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x202A, { name: 'LEFT-TO-RIGHT EMBEDDING', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x202B, { name: 'RIGHT-TO-LEFT EMBEDDING', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x202C, { name: 'POP DIRECTIONAL FORMATTING', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x202D, { name: 'LEFT-TO-RIGHT OVERRIDE', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x202E, { name: 'RIGHT-TO-LEFT OVERRIDE', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x202F, { name: 'NARROW NO-BREAK SPACE', category: 'Zs', action: 'space', level: 'normalize' }],
  [0x2060, { name: 'WORD JOINER', category: 'Cf', action: 'remove', level: 'safe' }],
  [0x2061, { name: 'FUNCTION APPLICATION', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2062, { name: 'INVISIBLE TIMES', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2063, { name: 'INVISIBLE SEPARATOR', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2064, { name: 'INVISIBLE PLUS', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2066, { name: 'LEFT-TO-RIGHT ISOLATE', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2067, { name: 'RIGHT-TO-LEFT ISOLATE', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2068, { name: 'FIRST STRONG ISOLATE', category: 'Cf', action: 'remove', level: 'extended' }],
  [0x2069, { name: 'POP DIRECTIONAL ISOLATE', category: 'Cf', action: 'remove', level: 'extended' }],
  [0xFEFF, { name: 'ZERO WIDTH NO-BREAK SPACE / BOM', category: 'Cf', action: 'remove', level: 'safe' }]
]);

function codePointLabel(cp) {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

function isKnownSuspicious(cp) {
  return KNOWN.has(cp);
}

function getSelectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function shouldTransform(info, mode) {
  if (mode === 'safe') return info.level === 'safe';
  if (mode === 'extended') return info.level === 'safe' || info.level === 'extended';
  return true;
}

function analyze(text) {
  const found = new Map();
  let utf16Index = 0;

  for (const ch of text) {
    const cp = ch.codePointAt(0);

    if (isKnownSuspicious(cp)) {
      const info = KNOWN.get(cp);
      const key = cp;

      if (!found.has(key)) {
        found.set(key, {
          cp,
          ...info,
          count: 0,
          positions: []
        });
      }

      const item = found.get(key);
      item.count += 1;

      if (item.positions.length < 8) {
        item.positions.push(utf16Index);
      }
    }

    utf16Index += ch.length;
  }

  return [...found.values()].sort((a, b) => a.cp - b.cp);
}

function clean(text, mode) {
  let output = '';
  let changes = 0;

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const info = KNOWN.get(cp);

    if (!info || !shouldTransform(info, mode)) {
      output += ch;
      continue;
    }

    changes += 1;

    if (info.action === 'space') {
      output += ' ';
    }
  }

  return { output, changes };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function visualize(text) {
  let html = '';

  for (const ch of text) {
    const cp = ch.codePointAt(0);

    if (KNOWN.has(cp)) {
      html += `<span class="marker" title="${KNOWN.get(cp).name}">⟦${codePointLabel(cp)}⟧</span>`;
    } else {
      html += escapeHtml(ch);
    }
  }

  return html;
}

function renderResults(items) {
  if (!items.length) {
    resultsBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Şübhəli Unicode simvolu aşkarlanmadı.</td>
      </tr>`;
    return;
  }

  resultsBody.innerHTML = items.map(item => {
    const actionText = item.action === 'space' ? 'Adi boşluqla əvəz edilir' : 'Silinir';
    const actionClass = item.action === 'space' ? 'action-replace' : 'action-remove';
    const pos = item.positions.join(', ') + (item.count > item.positions.length ? ', …' : '');

    return `
      <tr>
        <td><span class="code-pill">${codePointLabel(item.cp)}</span></td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.count}</td>
        <td>${pos}</td>
        <td class="${actionClass}">${actionText}</td>
      </tr>`;
  }).join('');
}

function runAnalysis() {
  const text = inputText.value;
  const items = analyze(text);
  const mode = getSelectedMode();
  const cleaned = clean(text, mode);

  const total = items.reduce((sum, x) => sum + x.count, 0);

  suspiciousCount.textContent = total;
  typeCount.textContent = items.length;
  changeCount.textContent = cleaned.changes;
  cleanedText.value = cleaned.output;

  renderResults(items);

  if (text.length === 0) {
    visualizedText.classList.add('placeholder');
    visualizedText.textContent = 'Analiz nəticəsi burada görünəcək.';
  } else {
    visualizedText.classList.remove('placeholder');
    visualizedText.innerHTML = visualize(text);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
  runAnalysis();
  showToast('Analiz tamamlandı');
});

document.getElementById('cleanBtn').addEventListener('click', () => {
  runAnalysis();
  showToast('Mətn təmizləndi');
});

document.getElementById('copyBtn').addEventListener('click', async () => {
  runAnalysis();

  if (!cleanedText.value) {
    showToast('Kopyalanacaq mətn yoxdur');
    return;
  }

  try {
    await navigator.clipboard.writeText(cleanedText.value);
    showToast('Təmiz mətn kopyalandı');
  } catch {
    cleanedText.select();
    document.execCommand('copy');
    showToast('Təmiz mətn kopyalandı');
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  inputText.value = '';
  cleanedText.value = '';
  suspiciousCount.textContent = '0';
  typeCount.textContent = '0';
  changeCount.textContent = '0';
  charCount.textContent = '0';
  resultsBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="6">Hələ analiz aparılmayıb.</td>
    </tr>`;
  visualizedText.classList.add('placeholder');
  visualizedText.textContent = 'Analiz nəticəsi burada görünəcək.';
  showToast('Sahələr sıfırlandı');
});

inputText.addEventListener('input', () => {
  charCount.textContent = [...inputText.value].length;
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', runAnalysis);
});
