'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Entity } from '@/types/deal';

interface DiagramNodeData {
  entity: Entity;
  badgeColor: string;
  borderColor: string;
}

function DiagramNodeComponent({ data }: { data: DiagramNodeData }) {
  const { entity, badgeColor, borderColor } = data;
  const primaryRole = entity.roles[0];

  return (
    <div
      className="rounded-lg bg-white shadow-sm px-3 py-2"
      style={{
        width: 200,
        height: 80,
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-slate-300 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-slate-300 !w-2 !h-2 !border-0" />

      {primaryRole && (
        <span
          className="inline-block self-start rounded px-1.5 py-0.5 text-[10px] font-semibold text-white mb-1"
          style={{ backgroundColor: badgeColor }}
        >
          {primaryRole.replace(/_/g, ' ').toUpperCase()}
        </span>
      )}
      <div className="text-sm font-bold text-slate-800 leading-tight truncate">
        {entity.name}
      </div>
      <div className="text-[11px] text-slate-400 truncate">
        {entity.type.replace(/_/g, ' ')}
        {entity.jurisdiction ? ` \u00B7 ${entity.jurisdiction}` : ''}
      </div>
    </div>
  );
}

export default memo(DiagramNodeComponent);
