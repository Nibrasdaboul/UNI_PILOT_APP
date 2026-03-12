/**
 * Arabic PDF export: render content as HTML (RTL, Amiri), capture with html2canvas,
 * then add to jsPDF as images. Ensures correct Arabic display and professional layout.
 */

const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;
const MARGIN_PX = 55;
const CONTENT_WIDTH_PX = A4_WIDTH_PX - MARGIN_PX * 2;
const HEADER_BAR_HEIGHT = 40;
const SCALE = 2;

const baseStyles = `
  margin: 0; padding: 0; box-sizing: border-box;
  font-family: 'Amiri', 'Segoe UI', 'Tahoma', serif;
  direction: rtl; text-align: right;
  color: #111; background: #fff;
  width: ${A4_WIDTH_PX}px; min-height: 100px;
`.replace(/\n/g, ' ');

function ensureAmiriLoaded() {
  if (document.getElementById('pdf-amiri-font')) return Promise.resolve();
  const link = document.createElement('link');
  link.id = 'pdf-amiri-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap';
  document.head.appendChild(link);
  return new Promise((r) => {
    link.onload = r;
    setTimeout(r, 800);
  });
}

function buildHeader(docTitle, subtitle) {
  const dateStr = new Date().toLocaleDateString('ar-SA', { dateStyle: 'medium' });
  return `
    <div style="background:#2563eb; color:#fff; padding:10px 24px; display:flex; justify-content:space-between; align-items:center; font-size:14px;">
      <span>UniPilot</span>
      <span>${subtitle}</span>
    </div>
    <div style="padding:16px ${MARGIN_PX}px 0;">
      <h1 style="font-size:22px; font-weight:700; margin:0 0 6px;">${docTitle}</h1>
      <p style="font-size:12px; color:#666; margin:0 0 12px;">${dateStr}</p>
      <hr style="border:0; border-top:1px solid #e5e7eb; margin:0 0 20px;">
    </div>
  `;
}

function escapeHtml(s) {
  if (s == null) return '';
  const str = String(s);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPdfHtml(activeTab, result, language) {
  const ar = language === 'ar';
  const titles = {
    summarizer: ar ? { title: 'ملخص', sub: 'أدوات الدراسة - UniPilot' } : { title: 'Summary', sub: 'Study Tools - UniPilot' },
    flashcards: ar ? { title: 'بطاقات تعليمية', sub: 'أدوات الدراسة - UniPilot' } : { title: 'Flashcards', sub: 'Study Tools - UniPilot' },
    quiz: ar ? { title: 'اختبار', sub: 'أدوات الدراسة - UniPilot' } : { title: 'Quiz', sub: 'Study Tools - UniPilot' },
    mindmap: ar ? { title: 'خريطة ذهنية', sub: 'أدوات الدراسة - UniPilot' } : { title: 'Mind Map', sub: 'Study Tools - UniPilot' },
    voice: ar ? { title: 'الصوت إلى نص', sub: 'UniPilot' } : { title: 'Voice to Text', sub: 'UniPilot' },
    diagram: ar ? { title: 'مخطط تفاعلي', sub: 'المخططات والانفوغرافيك - UniPilot' } : { title: 'Diagram', sub: 'Mind Maps & Infographics - UniPilot' },
    infographic: ar ? { title: 'انفوغرافيك', sub: 'المخططات والانفوغرافيك - UniPilot' } : { title: 'Infographic', sub: 'Mind Maps & Infographics - UniPilot' },
    research_full: ar ? { title: 'بحث كامل', sub: 'المخططات والانفوغرافيك - UniPilot' } : { title: 'Full Research', sub: 'Mind Maps & Infographics - UniPilot' },
  };
  const { title: docTitle, sub: subtitle } = titles[activeTab] || titles.summarizer;
  const header = buildHeader(docTitle, subtitle);

  let body = '';
  const wrap = (html) =>
    `<div style="padding:0 ${MARGIN_PX}px 24px; font-size:15px; line-height:1.7;">${html}</div>`;

  if (activeTab === 'voice' && result && typeof result === 'object') {
    const transcript = (result.transcript || '').trim();
    const notes = (result.notes || '').trim();
    const summary = (result.summary || '').trim();
    const sections = [];
    if (transcript) {
      const heading = ar ? 'النص المُحوّل' : 'Transcribed Text';
      sections.push(`<div style="margin-bottom:20px;"><h2 style="font-size:16px; font-weight:700; margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0; white-space:pre-wrap;">${escapeHtml(transcript)}</p></div>`);
    }
    if (notes) {
      const heading = ar ? 'ملاحظات أثناء التسجيل' : 'Notes during recording';
      sections.push(`<div style="margin-bottom:20px;"><h2 style="font-size:16px; font-weight:700; margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0; white-space:pre-wrap;">${escapeHtml(notes)}</p></div>`);
    }
    if (summary) {
      const heading = ar ? 'ملخص' : 'Summary';
      sections.push(`<div style="margin-bottom:20px;"><h2 style="font-size:16px; font-weight:700; margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0; white-space:pre-wrap;">${escapeHtml(summary)}</p></div>`);
    }
    body = wrap(sections.length ? sections.join('') : (ar ? 'لا يوجد محتوى' : 'No content'));
  } else if (activeTab === 'summarizer' && typeof result === 'string') {
    const lines = result.split(/\n/).map((l) => `<p style="margin:0 0 8px;">${escapeHtml(l)}</p>`).join('');
    body = wrap(lines || escapeHtml(result));
  } else if (activeTab === 'flashcards' && Array.isArray(result)) {
    const cards = result.map(
      (card, i) => `
        <div style="border:1px solid #d1d5db; border-radius:8px; padding:14px; margin-bottom:16px; background:#fafafa;">
          <div style="font-weight:700; font-size:14px; margin-bottom:8px;">بطاقة ${i + 1}</div>
          <div style="font-size:13px; color:#374151; margin-bottom:6px;"><strong>السؤال:</strong></div>
          <div style="margin-bottom:10px; font-size:14px;">${escapeHtml((card.front || card.question || '').slice(0, 400))}</div>
          <div style="font-size:13px; color:#374151; margin-bottom:4px;"><strong>الإجابة:</strong></div>
          <div style="font-size:14px; color:#4b5563;">${escapeHtml((card.back || card.answer || '').slice(0, 400))}</div>
        </div>
      `
    );
    body = wrap(cards.join(''));
  } else if (activeTab === 'quiz' && Array.isArray(result)) {
    const questions = result.map(
      (q, i) => {
        const opts = (q.options || []).map((opt, j) => `<div style="margin:4px 0 4px 20px;">${String.fromCharCode(65 + j)}. ${escapeHtml(opt)}</div>`).join('');
        return `
          <div style="margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:700; font-size:15px; margin-bottom:8px;">${i + 1}. ${escapeHtml((q.question || '').slice(0, 500))}</div>
            <div style="font-size:14px; color:#374151;">${opts}</div>
          </div>
        `;
      }
    );
    body = wrap(questions.join(''));
  } else if (activeTab === 'mindmap' && result && typeof result === 'object') {
    const renderNode = (node, depth) => {
      const margin = depth * 20;
      const fontSize = depth === 0 ? 16 : 14;
      const label = escapeHtml((node.label || '').slice(0, 200));
      const children = (node.children || []).map((c) => renderNode(c, depth + 1)).join('');
      return `<div style="margin-right:${margin}px; margin-bottom:6px; font-size:${fontSize}px;">${depth === 0 ? '<strong>' : ''}${label}${depth === 0 ? '</strong>' : ''}${children ? `<div>${children}</div>` : ''}</div>`;
    };
    body = wrap(renderNode(result, 0));
  } else if (activeTab === 'diagram' && result && typeof result === 'object') {
    const diagramTitle = escapeHtml((result.title || '').slice(0, 200));
    const idToLabel = (id) => (result.nodes || []).find((n) => n.id === id)?.label || id;
    const nodesHtml = (result.nodes || []).map(
      (n, i) => {
        const label = escapeHtml((n.label || '').slice(0, 300));
        const childrenList = (n.children || []).map((c) => `<li style="margin:4px 0 4px 20px;">${escapeHtml((c.label || '').slice(0, 200))}</li>`).join('');
        const conn = (n.connectionIds || []).map((cid) => idToLabel(cid)).filter(Boolean);
        const connText = conn.length ? `<p style="font-size:12px; color:#6b7280; margin:4px 0 0 0;">→ ${ar ? 'مرتبط بـ: ' : 'Connected to: '}${conn.join(', ')}</p>` : '';
        return `
          <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-bottom:12px; background:#fafafa;">
            <div style="font-weight:700; font-size:14px; margin-bottom:6px;">${label}</div>
            ${childrenList ? `<ul style="margin:0 0 6px 0; padding-right:16px;">${childrenList}</ul>` : ''}
            ${connText}
          </div>`;
      }
    ).join('');
    body = wrap(`<h2 style="font-size:16px; font-weight:700; margin:0 0 12px;">${diagramTitle}</h2>${nodesHtml || (ar ? 'لا توجد عقد' : 'No nodes')}`);
  } else if (activeTab === 'infographic' && result && typeof result === 'object') {
    const infoTitle = escapeHtml((result.title || '').slice(0, 200));
    const items = result.data || [];
    const itemsHtml = items.map(
      (d, i) => {
        const label = escapeHtml((d.label || '').slice(0, 200));
        const val = d.value != null ? `<span style="color:#4b5563;"> (${d.value})</span>` : '';
        const desc = d.description ? `<p style="font-size:13px; color:#6b7280; margin:4px 0 0 16px;">${escapeHtml((d.description || '').slice(0, 300))}</p>` : '';
        const subList = Array.isArray(d.items) && d.items.length
          ? `<ul style="margin:4px 0 0 16px; padding-right:16px;">${d.items.map((it) => `<li>${escapeHtml(String(it).slice(0, 150))}</li>`).join('')}</ul>`
          : '';
        const dateOrOrder = d.date || (d.order != null ? `#${d.order}` : '');
        const meta = dateOrOrder ? `<span style="font-size:12px; color:#6b7280;">${escapeHtml(String(dateOrOrder))}</span> ` : '';
        return `<div style="margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #e5e7eb;"><div style="font-weight:600; font-size:14px;">${meta}${label}${val}</div>${desc}${subList}</div>`;
      }
    ).join('');
    body = wrap(`<h2 style="font-size:16px; font-weight:700; margin:0 0 12px;">${infoTitle}</h2>${itemsHtml || (ar ? 'لا توجد بيانات' : 'No data')}`);
  } else if (activeTab === 'research_full' && result && typeof result === 'object') {
    const researchTitle = escapeHtml((result.title || '').slice(0, 200));
    const summary = (result.summary || '').trim();
    const summaryHtml = summary ? `<div style="margin-bottom:20px; padding:12px; background:#f3f4f6; border-radius:8px; font-size:14px; line-height:1.7;">${escapeHtml(summary.slice(0, 1200))}</div>` : '';
    const sections = result.sections || [];
    const sectionHtml = sections.map((sec) => {
      const st = escapeHtml((sec.title || '').slice(0, 150));
      let block = '';
      if (sec.type === 'key_facts' && Array.isArray(sec.items)) {
        block = `<ul style="margin:0; padding-right:20px;">${sec.items.map((it) => `<li style="margin:6px 0;">${escapeHtml(String(it).slice(0, 400))}</li>`).join('')}</ul>`;
      } else if (Array.isArray(sec.data)) {
        block = sec.data.map((d) => {
          const label = escapeHtml((d.label || '').slice(0, 200));
          const val = d.value != null ? ` <strong>${d.value}</strong>` : '';
          const desc = d.description ? `<div style="font-size:13px; color:#6b7280; margin:4px 0 0 12px;">${escapeHtml((d.description || '').slice(0, 250))}</div>` : '';
          const dateMeta = d.date || (d.order != null ? `#${d.order}` : '');
          const meta = dateMeta ? `<span style="font-size:12px; color:#6b7280;">${escapeHtml(String(dateMeta))}</span> ` : '';
          const sub = Array.isArray(d.items) ? `<ul style="margin:4px 0 0 12px; padding-right:16px;">${d.items.map((it) => `<li>${escapeHtml(String(it).slice(0, 150))}</li>`).join('')}</ul>` : '';
          return `<div style="margin-bottom:10px; padding:10px; border:1px solid #e5e7eb; border-radius:6px; background:#fafafa;">${meta}<strong>${label}</strong>${val}${desc}${sub}</div>`;
        }).join('');
      }
      return `<div style="margin-bottom:24px;"><h3 style="font-size:15px; font-weight:700; margin:0 0 10px; color:#1f2937;">${st}</h3>${block}</div>`;
    }).join('');
    body = wrap(`<h2 style="font-size:18px; font-weight:700; margin:0 0 12px;">${researchTitle}</h2>${summaryHtml}${sectionHtml || (ar ? 'لا أقسام' : 'No sections')}`);
  } else {
    body = wrap('<p>لا يوجد محتوى</p>');
  }

  return `<div id="pdf-export-root" style="${baseStyles}">
    ${header}
    ${body}
  </div>`;
}

/**
 * Render HTML to canvas, then add to jsPDF as pages (sliced). Returns doc.
 */
export async function exportArabicPdf(activeTab, result, language) {
  await ensureAmiriLoaded();
  const html = buildPdfHtml(activeTab, result, language);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed; left:-9999px; top:0; z-index:-1;';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  const root = document.getElementById('pdf-export-root');
  if (!root) {
    wrap.remove();
    throw new Error('PDF root not found');
  }

  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(root, {
    scale: SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: A4_WIDTH_PX,
    windowWidth: A4_WIDTH_PX,
  });
  wrap.remove();

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [A4_WIDTH_PX, A4_HEIGHT_PX] });
  const contentTop = 50;
  const contentBottom = A4_HEIGHT_PX - 45;
  const contentAreaHeight = contentBottom - contentTop;
  const margin = 40;
  const drawW = A4_WIDTH_PX - margin * 2;
  const drawH = contentAreaHeight;
  const totalH = canvas.height;
  const totalW = canvas.width;
  const sliceHeightPx = Math.ceil((drawH / drawW) * totalW);

  let offset = 0;
  let pageNum = 1;

  while (offset < totalH) {
    if (pageNum > 1) doc.addPage();
    const h = Math.min(sliceHeightPx, totalH - offset);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = totalW;
    sliceCanvas.height = h;
    const ctx = sliceCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, offset, totalW, h, 0, 0, totalW, h);

    const imgData = sliceCanvas.toDataURL('image/png');
    const isLastShortSlice = h < sliceHeightPx;
    const actualDrawH = isLastShortSlice ? h * (drawW / totalW) : drawH;
    doc.addImage(imgData, 'PNG', margin, contentTop, drawW, actualDrawH);

    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`صفحة ${pageNum}`, A4_WIDTH_PX - margin - 40, A4_HEIGHT_PX - 20);
    doc.text('UniPilot', margin, A4_HEIGHT_PX - 20);
    doc.setTextColor(0, 0, 0);

    offset += sliceHeightPx;
    pageNum += 1;
  }

  return doc;
}

/**
 * Export a DOM element (with charts, diagrams, progress rings) as PDF with same header/footer as Study Tools.
 * Use this when the content includes Recharts or other visual elements that must be captured as image.
 * @param {HTMLElement} contentElement - The div containing the content (charts, diagrams, etc.)
 * @param {string} docTitle - Document title for the header
 * @param {string} subtitle - Subtitle (e.g. "المخططات والانفوغرافيك - UniPilot")
 * @param {string} language - 'ar' | 'en'
 * @returns {Promise<import('jspdf').jsPDF>}
 */
export async function exportContentWithChartsPdf(contentElement, docTitle, subtitle, language) {
  await ensureAmiriLoaded();
  const ar = language === 'ar';
  const margin = 40;
  const contentTop = 50;
  const contentBottom = A4_HEIGHT_PX - 45;
  const contentAreaHeight = contentBottom - contentTop;
  const drawW = A4_WIDTH_PX - margin * 2;

  const headerHtml = buildHeader(docTitle || (ar ? 'بحث' : 'Research'), subtitle || (ar ? 'المخططات والانفوغرافيك - UniPilot' : 'Mind Maps & Infographics - UniPilot'));
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed; left:-9999px; top:0; z-index:9999; width:' + A4_WIDTH_PX + 'px; background:#fff;';
  wrap.innerHTML = '<div id="pdf-header-root" style="' + baseStyles + '">' + headerHtml + '</div>';
  document.body.appendChild(wrap);
  const headerRoot = document.getElementById('pdf-header-root');
  if (!headerRoot) {
    wrap.remove();
    throw new Error('PDF header not found');
  }

  const { default: html2canvas } = await import('html2canvas');
  const headerCanvas = await html2canvas(headerRoot, {
    scale: SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: A4_WIDTH_PX,
    windowWidth: A4_WIDTH_PX,
  });
  wrap.remove();

  if (!contentElement || !contentElement.ownerDocument) {
    throw new Error('Content element not found');
  }

  const contentCanvas = await html2canvas(contentElement, {
    scale: SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
  });

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [A4_WIDTH_PX, A4_HEIGHT_PX] });

  const headerHeightPx = 100;
  doc.addImage(headerCanvas.toDataURL('image/png'), 'PNG', 0, 0, A4_WIDTH_PX, headerHeightPx);

  const totalH = contentCanvas.height;
  const totalW = contentCanvas.width;
  const firstPageContentTop = headerHeightPx + 10;
  const firstPageContentHeight = A4_HEIGHT_PX - firstPageContentTop - 45;

  // Full width: scale by width only
  const scale = drawW / totalW;
  const contentHeightInPdf = totalH * scale;

  /** Find a good cut position near targetY (canvas coords) where the row is mostly empty (gap between sections) */
  function findBestCut(canvas, targetY, minY, maxY) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return targetY;
    const w = canvas.width;
    const step = 12;
    const windowHalf = 150;
    const yStart = Math.max(minY, Math.floor(targetY - windowHalf));
    const yEnd = Math.min(maxY, Math.ceil(targetY + windowHalf));
    let bestY = targetY;
    let bestDensity = 1;
    const sampleStep = Math.max(2, Math.floor(w / 60));
    for (let y = yStart; y < yEnd; y += step) {
      if (y + step > canvas.height) break;
      const img = ctx.getImageData(0, y, w, step);
      let nonWhite = 0;
      let samples = 0;
      for (let i = 0; i < img.data.length; i += 4 * sampleStep) {
        samples++;
        const r = img.data[i];
        const g = img.data[i + 1];
        const b = img.data[i + 2];
        const a = img.data[i + 3];
        if (a > 10 && (r < 248 || g < 248 || b < 248)) nonWhite++;
      }
      const density = samples ? nonWhite / samples : 0;
      if (density < bestDensity) {
        bestDensity = density;
        bestY = y + Math.floor(step / 2);
      }
    }
    return bestY;
  }

  const sliceStarts = [0];
  let currentTarget = (firstPageContentHeight / scale);
  const pageContentHeights = [firstPageContentHeight, contentAreaHeight];
  while (currentTarget < totalH - 20) {
    const cut = findBestCut(contentCanvas, currentTarget, sliceStarts[sliceStarts.length - 1] + 50, totalH - 20);
    sliceStarts.push(Math.min(cut, totalH));
    currentTarget = cut + (contentAreaHeight / scale);
    if (sliceStarts[sliceStarts.length - 1] >= totalH - 20) break;
  }
  if (sliceStarts[sliceStarts.length - 1] < totalH - 5) sliceStarts.push(totalH);

  let pageNum = 1;
  for (let i = 0; i < sliceStarts.length - 1; i++) {
    if (pageNum > 1) doc.addPage();
    const y0 = sliceStarts[i];
    const y1 = sliceStarts[i + 1];
    const sliceH = y1 - y0;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = totalW;
    sliceCanvas.height = sliceH;
    const sctx = sliceCanvas.getContext('2d');
    sctx.fillStyle = '#ffffff';
    sctx.fillRect(0, 0, totalW, sliceH);
    sctx.drawImage(contentCanvas, 0, y0, totalW, sliceH, 0, 0, totalW, sliceH);
    const drawH = sliceH * scale;
    const topPx = i === 0 ? firstPageContentTop : contentTop;
    doc.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, topPx, drawW, drawH);

    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(ar ? `صفحة ${pageNum}` : `Page ${pageNum}`, A4_WIDTH_PX - margin - 40, A4_HEIGHT_PX - 20);
    doc.text('UniPilot', margin, A4_HEIGHT_PX - 20);
    doc.setTextColor(0, 0, 0);
    pageNum++;
  }

  return doc;
}
