import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Colors from "What diagram is right for you?" flowchart: teal, orange, reddish-orange
const FLOW_COLORS = [
  'rgb(13, 148, 136)',   // teal
  'rgb(234, 88, 12)',    // orange
  'rgb(220, 38, 38)',    // reddish-orange
];

/**
 * Interactive diagram as flowchart-style cards with connecting lines (like "What diagram is right for you?").
 * @param {Object} data - { title, nodes: [{ id, label, children: [{id, label}], connectionIds }], diagramType }
 * @param {boolean} editable - Allow editing labels
 * @param {(data: Object) => void} onDataChange - Callback with current data (for PDF export)
 * @param {string} className
 */
export default function InteractiveDiagramCards({ data, editable = true, onDataChange, className = '' }) {
  const [nodes, setNodes] = useState([]);
  const [openIds, setOpenIds] = useState(new Set());
  const [title, setTitle] = useState('');
  const [positions, setPositions] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (data?.nodes && Array.isArray(data.nodes)) {
      setNodes(data.nodes.map((n) => ({ ...n, label: n.label || '', children: (n.children || []).map((c) => ({ ...c, label: c.label || '' })) })));
      setTitle(data.title || '');
    } else {
      setNodes([]);
      setTitle('');
    }
  }, [data]);

  const measurePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const els = container.querySelectorAll('[data-node-id]');
    const next = {};
    els.forEach((el) => {
      const id = el.getAttribute('data-node-id');
      if (!id) return;
      const r = el.getBoundingClientRect();
          next[id] = {
            x: r.left - rect.left + r.width / 2,
            y: r.top - rect.top + r.height / 2,
          };
    });
    setPositions((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);

  useEffect(() => {
    measurePositions();
    const t = setTimeout(measurePositions, 100);
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measurePositions)
      : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
    };
  }, [measurePositions, nodes.length, openIds]);

  const toggleOpen = useCallback((id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateNodeLabel = useCallback((nodeId, value) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, label: value } : n))
    );
  }, []);

  const updateChildLabel = useCallback((nodeId, childId, value) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, children: (n.children || []).map((c) => (c.id === childId ? { ...c, label: value } : c)) }
          : n
      )
    );
  }, []);

  useEffect(() => {
    if (onDataChange && nodes.length > 0) {
      onDataChange({ title, nodes, diagramType: data?.diagramType || 'mind_map' });
    }
  }, [title, nodes, data?.diagramType, onDataChange]);

  if (!data || nodes.length === 0) {
    return (
      <div className={cn('rounded-xl border border-dashed p-8 text-center text-muted-foreground', className)}>
        No diagram data
      </div>
    );
  }

  const connections = [];
  nodes.forEach((node) => {
    (node.connectionIds || []).forEach((targetId) => {
      if (positions[node.id] && positions[targetId]) {
        connections.push({ from: node.id, to: targetId, fromPos: positions[node.id], toPos: positions[targetId] });
      }
    });
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-2xl p-6 min-h-[320px]',
        'bg-[#1e3a5f]',
        className
      )}
    >
      {/* Connecting lines (flowchart style) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.6)" />
          </marker>
        </defs>
        {connections.map((c, i) => {
          const { fromPos, toPos } = c;
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const dist = Math.hypot(dx, dy) || 1;
          const radius = Math.min(40, dist / 4);
          const x1 = fromPos.x + (dx / dist) * 28;
          const y1 = fromPos.y + (dy / dist) * 28;
          const x2 = toPos.x - (dx / dist) * 28;
          const y2 = toPos.y - (dy / dist) * 28;
          return (
            <line
              key={`${c.from}-${c.to}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
              strokeDasharray="none"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </svg>

      {/* Central question box (like "What are you communicating?") */}
      <div className="flex justify-center mb-6">
        <div
          className={cn(
            'rounded-2xl px-6 py-3 shadow-lg',
            'bg-white text-gray-800 font-semibold text-center',
            'border border-gray-200'
          )}
        >
          {editable ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-semibold max-w-xs text-center border-0 bg-transparent shadow-none"
              placeholder="What are you communicating?"
            />
          ) : (
            <span>{title}</span>
          )}
        </div>
      </div>

      {/* Flow nodes: rounded cards with category colors */}
      <div className="relative flex flex-wrap justify-center gap-4">
        {nodes.map((node, index) => {
          const fill = FLOW_COLORS[index % FLOW_COLORS.length];
          return (
            <div
              key={node.id}
              data-node-id={node.id}
              className={cn(
                'rounded-2xl px-4 py-3 min-w-[140px] max-w-[220px]',
                'shadow-lg transition-all duration-300 hover:shadow-xl',
                'animate-in fade-in slide-in-from-bottom-3',
                'border border-white/20'
              )}
              style={{
                backgroundColor: fill,
                color: 'white',
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <Collapsible open={openIds.has(node.id)} onOpenChange={() => toggleOpen(node.id)}>
                <div className="flex items-center gap-2">
                  {(node.children || []).length > 0 && (
                    <CollapsibleTrigger asChild>
                      <button type="button" className="p-0.5 rounded hover:bg-white/20 text-white">
                        {openIds.has(node.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  )}
                  {editable ? (
                    <Input
                      value={node.label}
                      onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                      className="flex-1 border-0 bg-white/15 text-white font-medium placeholder:text-white/70 h-8 px-2 text-sm focus-visible:ring-1 ring-white/30"
                      placeholder="…"
                    />
                  ) : (
                    <span className="flex-1 font-medium text-sm leading-tight">{node.label}</span>
                  )}
                </div>
                {(node.children || []).length > 0 && (
                  <CollapsibleContent>
                    <ul className="mt-2 pl-5 space-y-1 text-xs text-white/90">
                      {(node.children || []).map((child) => (
                        <li key={child.id} className="flex items-center gap-2">
                          {editable ? (
                            <Input
                              value={child.label}
                              onChange={(e) => updateChildLabel(node.id, child.id, e.target.value)}
                              className="flex-1 h-6 text-xs border-0 bg-white/10 text-white placeholder:text-white/60 py-0"
                              placeholder="…"
                            />
                          ) : (
                            <span>{child.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          );
        })}
      </div>
    </div>
  );
}
