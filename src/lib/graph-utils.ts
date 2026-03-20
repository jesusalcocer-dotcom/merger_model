import { Entity, Relationship } from '@/types/deal';

/** Get all entities on the sell-side of the target (trace "owns" edges backward to target) */
export function getSellSideEntities(
  entities: Entity[],
  relationships: Relationship[]
): Entity[] {
  const target = entities.find(e => e.roles.includes('target'));
  if (!target) return [];

  const sellSideIds = new Set<string>();

  // Find all entities that own the target (directly or indirectly)
  function traceOwners(entityId: string) {
    const owners = relationships.filter(r => r.to === entityId && r.type === 'owns');
    for (const rel of owners) {
      if (!sellSideIds.has(rel.from)) {
        sellSideIds.add(rel.from);
        traceOwners(rel.from);
      }
    }
  }

  traceOwners(target.id);
  return entities.filter(e => sellSideIds.has(e.id));
}

/** Get all entities on the buy-side (buyer -> acq_vehicle chain) */
export function getBuySideEntities(
  entities: Entity[],
  relationships: Relationship[]
): Entity[] {
  const buyers = entities.filter(e => e.roles.includes('buyer'));
  if (buyers.length === 0) return [];

  const buySideIds = new Set<string>(buyers.map(b => b.id));

  // Trace ownership downward from buyers
  function traceOwned(entityId: string) {
    const owned = relationships.filter(r => r.from === entityId && r.type === 'owns');
    for (const rel of owned) {
      if (!buySideIds.has(rel.to)) {
        buySideIds.add(rel.to);
        traceOwned(rel.to);
      }
    }
  }

  for (const buyer of buyers) {
    traceOwned(buyer.id);
  }

  // Also include manages, lp_in connected entities
  for (const rel of relationships) {
    if (rel.type === 'manages' || rel.type === 'lp_in') {
      if (buySideIds.has(rel.to)) {
        buySideIds.add(rel.from);
      }
    }
  }

  return entities.filter(e => buySideIds.has(e.id));
}

/** Get third-party entities (not sell-side, not buy-side, not target) */
export function getThirdPartyEntities(
  entities: Entity[],
  relationships: Relationship[]
): Entity[] {
  const target = entities.find(e => e.roles.includes('target'));
  const sellSide = getSellSideEntities(entities, relationships);
  const buySide = getBuySideEntities(entities, relationships);

  const assignedIds = new Set<string>([
    ...(target ? [target.id] : []),
    ...sellSide.map(e => e.id),
    ...buySide.map(e => e.id),
  ]);

  return entities.filter(e => !assignedIds.has(e.id));
}

/** Get ownership depth of entity within a group (0 = root) */
export function getOwnershipDepth(
  entityId: string,
  relationships: Relationship[],
  groupIds: Set<string>
): number {
  const owner = relationships.find(
    r => r.to === entityId && r.type === 'owns' && groupIds.has(r.from)
  );
  if (!owner) return 0;
  return 1 + getOwnershipDepth(owner.from, relationships, groupIds);
}

/** Check if entity has a path to target through buy-side ownership */
export function hasPathToTargetThroughBuySide(
  entityId: string,
  targetId: string,
  entities: Entity[],
  relationships: Relationship[]
): boolean {
  const visited = new Set<string>();

  function dfs(currentId: string): boolean {
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    // Check lp_in and owns edges from current entity
    for (const rel of relationships) {
      if (rel.from === currentId && (rel.type === 'lp_in' || rel.type === 'owns')) {
        if (rel.to === targetId) return true;
        if (dfs(rel.to)) return true;
      }
    }
    return false;
  }

  return dfs(entityId);
}

/** Get sell-side ownership depth (how many owns edges between seller chain to target) */
export function getSellSideOwnershipDepth(
  entities: Entity[],
  relationships: Relationship[]
): number {
  const target = entities.find(e => e.roles.includes('target'));
  if (!target) return 0;

  let maxDepth = 0;

  function traceDepth(entityId: string, depth: number) {
    const owners = relationships.filter(r => r.to === entityId && r.type === 'owns');
    if (owners.length === 0) {
      maxDepth = Math.max(maxDepth, depth);
      return;
    }
    for (const rel of owners) {
      traceDepth(rel.from, depth + 1);
    }
  }

  traceDepth(target.id, 0);
  return maxDepth;
}
