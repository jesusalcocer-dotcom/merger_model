import { Entity } from '@/types/deal';

export function buildRelationshipPrompt(rawText: string, entities: Entity[]) {
  return {
    system: `You are an M&A deal structure parser. Given a deal description and a list of entities, extract every relationship between entities.

Entities provided:
${JSON.stringify(entities, null, 2)}

Return a JSON array of relationships. Each relationship has:
- id: auto-generated unique string (e.g., "rel-1", "rel-2")
- from: entity id (must match an id from the entities list)
- to: entity id (must match an id from the entities list)
- type: one of [owns, guarantees, manages, lp_in]
- params: object with optional fields:
  - pct: number 0-100 (required for owns and lp_in)
  - scope: string (for guarantees, e.g., "full", "capped at $25M")
  - commitment: number in $M (optional for lp_in)

Rules:
- "owns" means A holds equity in B. Direction: owner → owned. Always include pct.
- "guarantees" means A backstops B's deal obligations. Include scope.
- "manages" means A is GP or manager of B (control without ownership).
- "lp_in" means A is a limited partner in fund B. Include pct and optionally commitment.
- Every entity except the target should appear in at least one relationship.
- If you identify an entity that should exist but isn't in the list, note it but do NOT add entities. Only use entity ids from the provided list.
- Ownership chains should be complete: if Fund owns HoldCo owns AcqCo, that's two separate "owns" edges.
- Do NOT create ownership edges that result from the transaction itself, such as management rollover equity into the buyer's holding company. Those post-closing ownership stakes are captured as consideration flows in Block 4, not as pre-existing relationships in Block 2. Only include relationships that exist BEFORE the transaction closes.

Return ONLY a valid JSON array. No markdown, no preamble.`,
    user: rawText,
  };
}
