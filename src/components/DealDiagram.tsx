'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Entity, Relationship, ConsiderationFlow } from '@/types/deal';
import { computeLayout, DiagramView } from '@/lib/layout';
import DiagramNodeComponent from './DiagramNode';

interface DealDiagramProps {
  entities: Entity[];
  relationships: Relationship[];
  considerationFlows: ConsiderationFlow[];
}

const nodeTypes: NodeTypes = {
  dealNode: DiagramNodeComponent as unknown as NodeTypes['dealNode'],
};

function DiagramInner({ entities, relationships, considerationFlows }: DealDiagramProps) {
  const [view, setView] = useState<DiagramView>('transaction');

  const { nodes, edges } = useMemo(
    () => computeLayout(entities, relationships, considerationFlows, view),
    [entities, relationships, considerationFlows, view]
  );

  const views: { key: DiagramView; label: string }[] = [
    { key: 'pre-closing', label: 'Pre-Closing' },
    { key: 'transaction', label: 'Transaction' },
    { key: 'post-closing', label: 'Post-Closing' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Deal Diagram</h2>
      <div className="rounded-lg border border-slate-200 bg-slate-50" style={{ height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll
          panOnScroll
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="flex gap-1 justify-center">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              view === v.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DealDiagram(props: DealDiagramProps) {
  return (
    <ReactFlowProvider>
      <DiagramInner {...props} />
    </ReactFlowProvider>
  );
}
