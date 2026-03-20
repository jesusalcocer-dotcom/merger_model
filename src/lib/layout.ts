import { Node, Edge, MarkerType } from '@xyflow/react';
import { Entity, Relationship, ConsiderationFlow } from '@/types/deal';
import {
  getSellSideEntities,
  getBuySideEntities,
  getThirdPartyEntities,
  getOwnershipDepth,
} from './graph-utils';

export type DiagramView = 'pre-closing' | 'transaction' | 'post-closing';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const COL_LEFT = 0;
const COL_CENTER = 400;
const COL_RIGHT = 800;
const ROW_SPACING = 150;
const SIBLING_OFFSET = 220;

function getRoleBadgeColor(entity: Entity): string {
  if (entity.roles.includes('target')) return '#22c55e';
  if (entity.roles.includes('seller')) return '#f59e0b';
  if (entity.roles.includes('buyer')) return '#3b82f6';
  if (entity.roles.includes('acq_vehicle')) return '#93c5fd';
  if (entity.roles.includes('parent')) return '#fbbf24';
  if (entity.roles.includes('guarantor')) return '#a855f7';
  if (entity.roles.includes('escrow_agent') || entity.roles.includes('insurer') || entity.roles.includes('lender')) return '#9ca3af';
  return '#9ca3af';
}

function getBorderColor(entity: Entity, side: 'sell' | 'buy' | 'target' | 'third'): string {
  switch (side) {
    case 'sell': return '#f59e0b';
    case 'buy': return '#3b82f6';
    case 'target': return '#22c55e';
    case 'third': return '#9ca3af';
  }
}

function getSide(entity: Entity, sellIds: Set<string>, buyIds: Set<string>): 'sell' | 'buy' | 'target' | 'third' {
  if (entity.roles.includes('target')) return 'target';
  if (sellIds.has(entity.id)) return 'sell';
  if (buyIds.has(entity.id)) return 'buy';
  return 'third';
}

export function computeLayout(
  entities: Entity[],
  relationships: Relationship[],
  considerationFlows: ConsiderationFlow[],
  view: DiagramView
): { nodes: Node[]; edges: Edge[] } {
  const target = entities.find(e => e.roles.includes('target'));
  if (!target || entities.length === 0) return { nodes: [], edges: [] };

  const sellSide = getSellSideEntities(entities, relationships);
  const buySide = getBuySideEntities(entities, relationships);
  const thirdParties = getThirdPartyEntities(entities, relationships);

  const sellIds = new Set(sellSide.map(e => e.id));
  const buyIds = new Set(buySide.map(e => e.id));

  // Position nodes
  const nodes: Node[] = [];

  // Target node at center
  nodes.push({
    id: target.id,
    type: 'dealNode',
    position: { x: COL_CENTER, y: ROW_SPACING },
    data: {
      entity: target,
      badgeColor: getRoleBadgeColor(target),
      borderColor: getBorderColor(target, 'target'),
    },
  });

  // Position sell-side entities by ownership depth
  const sellByDepth = new Map<number, Entity[]>();
  for (const e of sellSide) {
    const depth = getOwnershipDepth(e.id, relationships, new Set([...sellIds, target.id]));
    if (!sellByDepth.has(depth)) sellByDepth.set(depth, []);
    sellByDepth.get(depth)!.push(e);
  }

  for (const [depth, ents] of sellByDepth) {
    const startX = COL_LEFT - ((ents.length - 1) * SIBLING_OFFSET) / 2;
    ents.forEach((e, i) => {
      nodes.push({
        id: e.id,
        type: 'dealNode',
        position: { x: startX + i * SIBLING_OFFSET, y: depth * ROW_SPACING },
        data: {
          entity: e,
          badgeColor: getRoleBadgeColor(e),
          borderColor: getBorderColor(e, 'sell'),
        },
      });
    });
  }

  // Position buy-side entities by ownership depth
  const buyByDepth = new Map<number, Entity[]>();
  for (const e of buySide) {
    const depth = getOwnershipDepth(e.id, relationships, buyIds);
    if (!buyByDepth.has(depth)) buyByDepth.set(depth, []);
    buyByDepth.get(depth)!.push(e);
  }

  for (const [depth, ents] of buyByDepth) {
    const startX = COL_RIGHT - ((ents.length - 1) * SIBLING_OFFSET) / 2;
    ents.forEach((e, i) => {
      nodes.push({
        id: e.id,
        type: 'dealNode',
        position: { x: startX + i * SIBLING_OFFSET, y: depth * ROW_SPACING },
        data: {
          entity: e,
          badgeColor: getRoleBadgeColor(e),
          borderColor: getBorderColor(e, 'buy'),
        },
      });
    });
  }

  // Position third-party entities below center
  thirdParties.forEach((e, i) => {
    const startX = COL_CENTER - ((thirdParties.length - 1) * SIBLING_OFFSET) / 2;
    nodes.push({
      id: e.id,
      type: 'dealNode',
      position: { x: startX + i * SIBLING_OFFSET, y: ROW_SPACING * 3 + 50 },
      data: {
        entity: e,
        badgeColor: getRoleBadgeColor(e),
        borderColor: getBorderColor(e, 'third'),
      },
    });
  });

  // Build edges
  const edges: Edge[] = [];
  const entityIds = new Set(entities.map(e => e.id));

  // For post-closing view, modify relationships
  let activeRelationships = [...relationships];
  if (view === 'post-closing') {
    // Remove seller->target owns edges
    activeRelationships = activeRelationships.filter(
      r => !(r.to === target.id && r.type === 'owns' && sellIds.has(r.from))
    );
    // Add buyer-side -> target owns edge
    const acqVehicles = entities.filter(e => e.roles.includes('acq_vehicle'));
    const directBuyer = acqVehicles.length > 0
      ? acqVehicles[acqVehicles.length - 1]
      : entities.find(e => e.roles.includes('buyer'));
    if (directBuyer) {
      activeRelationships.push({
        id: 'post-close-owns',
        from: directBuyer.id,
        to: target.id,
        type: 'owns',
        params: { pct: 100 },
      });
    }
  }

  // Structural/ownership edges
  for (const rel of activeRelationships) {
    if (!entityIds.has(rel.from) || !entityIds.has(rel.to)) continue;

    let style: React.CSSProperties = {};
    let label = '';
    let animated = false;

    switch (rel.type) {
      case 'owns':
        style = { stroke: '#64748b', strokeWidth: 2 };
        label = `${rel.params.pct ?? '?'}%`;
        break;
      case 'guarantees':
        style = { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5 5' };
        label = 'guarantees';
        break;
      case 'manages':
        style = { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '2 4' };
        label = 'manages';
        break;
      case 'lp_in':
        style = { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' };
        label = `${rel.params.pct ?? '?'}% LP`;
        break;
    }

    edges.push({
      id: rel.id,
      source: rel.from,
      target: rel.to,
      style,
      label,
      animated,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
      labelStyle: { fontSize: 11, fill: '#64748b' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
    });
  }

  // Consideration flow edges (only in transaction view)
  if (view === 'transaction') {
    for (const flow of considerationFlows) {
      if (!entityIds.has(flow.from) || !entityIds.has(flow.to)) continue;

      let style: React.CSSProperties = {};
      let label = '';
      let animated = false;

      switch (flow.type) {
        case 'cash':
          style = { stroke: '#22c55e', strokeWidth: 3 };
          label = `$${flow.amount}M cash`;
          animated = true;
          break;
        case 'escrow':
          style = { stroke: '#eab308', strokeWidth: 3 };
          label = `$${flow.amount}M escrow`;
          break;
        case 'earnout':
          style = { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '5 5' };
          label = `$${flow.amount}M earnout`;
          break;
        case 'buyer_equity':
          style = { stroke: '#a855f7', strokeWidth: 3 };
          label = `$${flow.amount}M equity`;
          break;
        case 'seller_note':
          style = { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' };
          label = `$${flow.amount}M note`;
          break;
        case 'rollover':
          style = { stroke: '#7c3aed', strokeWidth: 2 };
          label = `$${flow.amount}M rollover`;
          break;
        case 'debt_payoff':
          style = { stroke: '#6b7280', strokeWidth: 2 };
          label = `$${flow.amount}M payoff`;
          break;
        case 'fees':
          style = { stroke: '#9ca3af', strokeWidth: 1 };
          label = `$${flow.amount}M fees`;
          break;
        case 'premium':
          style = { stroke: '#9ca3af', strokeWidth: 1 };
          label = `$${flow.amount}M premium`;
          break;
        case 'assumed_liabilities':
          style = { stroke: '#6b7280', strokeWidth: 2 };
          label = `$${flow.amount}M assumed`;
          break;
      }

      edges.push({
        id: flow.id,
        source: flow.from,
        target: flow.to,
        style,
        label,
        animated,
        type: 'default',
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        labelStyle: { fontSize: 10, fontWeight: 600, fill: (style.stroke as string) || '#64748b' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
      });
    }
  }

  return { nodes, edges };
}
