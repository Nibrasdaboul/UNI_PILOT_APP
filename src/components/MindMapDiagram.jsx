import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/lib/ThemeContext';

let mermaidInitTheme = null;
function initMermaid(isDark) {
  if (mermaidInitTheme === isDark) return;
  const card = isDark ? '#1e293b' : '#f8fafc';
  const foreground = isDark ? '#f1f5f9' : '#1e293b';
  const border = isDark ? '#334155' : '#e2e8f0';
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: card,
      primaryTextColor: foreground,
      primaryBorderColor: border,
      lineColor: border,
      secondaryColor: card,
      tertiaryColor: isDark ? '#334155' : '#f1f5f9',
    },
  });
  mermaidInitTheme = isDark;
}

function sanitizeLabel(label) {
  if (label == null) return '""';
  let s = String(label)
    .replace(/\s+/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim()
    // Strip trailing dashes/underscores so parser does not treat "text ---" as two nodes
    .replace(/[\-_=]+\s*$/, '')
    .trim()
    .slice(0, 120);
  if (!s) return '""';
  // Remove/neutralize ALL quote-like chars so Mermaid never sees a closing " (ASCII + Unicode quotes)
  s = s.replace(/["""‟‶〝〞ˮ]/g, "'");
  s = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${s}"`;
}

let nodeIdCounter = 0;
function nextNodeId() {
  nodeIdCounter += 1;
  return `n${nodeIdCounter}`;
}

function treeToMermaidLines(node, indent = 4) {
  if (!node) return [];
  const raw = node.label != null ? String(node.label).trim() : '';
  const label = raw.replace(/\s+/g, ' ').slice(0, 120);
  // Skip empty or dash-only nodes that break Mermaid parser
  if (!label || /^[\s\-_=]+$/.test(label)) return [];
  const id = nextNodeId();
  const line = ' '.repeat(indent) + id + '[' + sanitizeLabel(label) + ']';
  const lines = [line];
  const children = Array.isArray(node.children) ? node.children : [];
  children.forEach((child) => {
    lines.push(...treeToMermaidLines(child, indent + 4));
  });
  return lines;
}

function buildMermaidCode(data) {
  nodeIdCounter = 0;
  const lines = treeToMermaidLines(data);
  if (lines.length === 0) return 'mindmap\n    empty';
  return 'mindmap\n' + lines.join('\n');
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const INITIAL_SCALE = 0.85;

export default function MindMapDiagram({ data, className = '' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const wrapRef = useRef(null);
  const translateScaleRef = useRef({ x: 0, y: 0, scale: INITIAL_SCALE });
  useEffect(() => {
    translateScaleRef.current = { x: translate.x, y: translate.y, scale };
  }, [translate.x, translate.y, scale]);

  useEffect(() => {
    if (!data || !data.label) {
      setSvg('');
      setError('No data');
      return;
    }
    setError(null);
    initMermaid(isDark);
    const code = buildMermaidCode(data);
    const id = `mindmap-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`;
    mermaid
      .render(id, code)
      .then(({ svg: result }) => {
        setSvg(result);
      })
      .catch((err) => {
        setError(err?.message || 'Diagram failed');
        setSvg('');
      });
  }, [data, isDark]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  }, [translate]);

  const onMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setTranslate({
        x: dragStart.current.tx + e.clientX - dragStart.current.x,
        y: dragStart.current.ty + e.clientY - dragStart.current.y,
      });
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);
  const onMouseLeave = useCallback(() => setIsDragging(false), []);

  const onDoubleClick = useCallback(() => {
    setScale(INITIAL_SCALE);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const touchState = useRef({
    lastCount: 0,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    pinchStartDist: 0,
    pinchStartScale: INITIAL_SCALE,
  });
  const lastTapRef = useRef(0);

  const getTouchDistance = useCallback((touches) => {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }, []);

  const getTouchCenter = useCallback((touches) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      const touches = Array.from(e.touches);
      const n = touches.length;
      const { x: tx, y: ty, scale: sc } = translateScaleRef.current;
      if (n === 1) {
        touchState.current = {
          lastCount: 1,
          startX: touches[0].clientX,
          startY: touches[0].clientY,
          startTx: tx,
          startTy: ty,
          pinchStartDist: 0,
          pinchStartScale: sc,
        };
      } else if (n === 2) {
        const dist = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        touchState.current = {
          lastCount: 2,
          startX: center.x,
          startY: center.y,
          startTx: tx,
          startTy: ty,
          pinchStartDist: dist || 1,
          pinchStartScale: sc,
        };
      }
    },
    [getTouchDistance, getTouchCenter]
  );

  const onTouchMove = useCallback(
    (e) => {
      const touches = Array.from(e.touches);
      const n = touches.length;
      const ts = touchState.current;
      if (n === 1 && ts.lastCount >= 1) {
        e.preventDefault();
        setTranslate({
          x: ts.startTx + touches[0].clientX - ts.startX,
          y: ts.startTy + touches[0].clientY - ts.startY,
        });
      } else if (n === 2 && ts.pinchStartDist > 0) {
        e.preventDefault();
        const dist = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        if (dist > 0) {
          const scaleFactor = dist / ts.pinchStartDist;
          const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, ts.pinchStartScale * scaleFactor));
          setScale(newScale);
        }
        setTranslate({
          x: ts.startTx + center.x - ts.startX,
          y: ts.startTy + center.y - ts.startY,
        });
      }
    },
    [getTouchDistance, getTouchCenter]
  );

  const onTouchEnd = useCallback(
    (e) => {
      const touches = Array.from(e.touches);
      const n = touches.length;
      const { x: tx, y: ty, scale: sc } = translateScaleRef.current;
      if (n === 0 && e.changedTouches?.length === 1 && touchState.current.lastCount === 1) {
        const released = e.changedTouches[0];
        const dx = released.clientX - touchState.current.startX;
        const dy = released.clientY - touchState.current.startY;
        if (Math.hypot(dx, dy) < 25) {
          const now = Date.now();
          if (now - lastTapRef.current < 350) {
            setScale(INITIAL_SCALE);
            setTranslate({ x: 0, y: 0 });
            lastTapRef.current = 0;
          } else {
            lastTapRef.current = now;
          }
        }
      }
      if (n === 0) {
        touchState.current = { lastCount: 0, startX: 0, startY: 0, startTx: 0, startTy: 0, pinchStartDist: 0, pinchStartScale: INITIAL_SCALE };
      } else if (n === 1) {
        touchState.current.lastCount = 1;
        touchState.current.startX = touches[0].clientX;
        touchState.current.startY = touches[0].clientY;
        touchState.current.startTx = tx;
        touchState.current.startTy = ty;
      } else if (n === 2) {
        const dist = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        touchState.current.lastCount = 2;
        touchState.current.pinchStartDist = dist || 1;
        touchState.current.pinchStartScale = sc;
        touchState.current.startX = center.x;
        touchState.current.startY = center.y;
        touchState.current.startTx = tx;
        touchState.current.startTy = ty;
      }
    },
    [getTouchDistance, getTouchCenter]
  );

  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    const prevent = (e) => e.preventDefault();
    w.addEventListener('wheel', prevent, { passive: false });
    return () => w.removeEventListener('wheel', prevent);
  }, [svg]);

  if (error) {
    return (
      <div className={`rounded-xl border border-dashed p-6 text-center text-muted-foreground ${className}`}>
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed p-8 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`min-h-[420px] w-full ${className}`}>
      <p className="text-center text-xs text-muted-foreground" dir="auto">
        اسحب للنقل • عجلة الماوس أو قرص بأصبعين للتكبير/التصغير • دبل كليك لإعادة التعيين · Drag to pan · Scroll or pinch to zoom · Double-tap to reset
      </p>
      <div
        ref={wrapRef}
        className="overflow-hidden rounded-xl border border-border bg-card min-h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ touchAction: 'none' }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          className="origin-center p-6 inline-flex items-center justify-center"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          <div
            className="mindmap-svg-wrap rounded-lg bg-card"
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{ minWidth: 'min(100%, 560px)' }}
          />
        </div>
      </div>
    </div>
  );
}
