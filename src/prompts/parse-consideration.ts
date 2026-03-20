import { Entity, Relationship, Structure } from '@/types/deal';

export function buildConsiderationPrompt(
  rawText: string,
  entities: Entity[],
  relationships: Relationship[],
  structure: Structure
) {
  return {
    system: `You are an M&A deal structure parser. Given a deal description and the full deal structure, extract every flow of value between entities.

Entities: ${JSON.stringify(entities, null, 2)}
Relationships: ${JSON.stringify(relationships, null, 2)}
Structure: ${JSON.stringify(structure, null, 2)}

Return a JSON array of consideration flows. Each flow has:
- id: unique string (e.g., "flow-1", "flow-2")
- from: entity id (must match entities list)
- to: entity id (must match entities list)
- type: one of [cash, escrow, earnout, buyer_equity, seller_note, rollover, debt_payoff, fees, premium, assumed_liabilities]
- amount: number in $M
- timing: one of [closing, contingent, deferred]
- conditions: string or null (e.g., "release at month 18, WC adjustment settled", "revenue target $50M in year 1")

Rules:
- Include ALL flows, not just consideration to sellers. Include: debt payoff (buyer pays target's lenders), transaction fees (buyer pays advisors), R&W insurance premium (buyer pays insurer), rollover equity (management contributes to buyer entity).
- Cash payments to sellers should be split by seller based on ownership percentage if multiple sellers exist.
- Escrow flows TO the escrow agent entity, not to the seller. Include conditions for release.
- Earnout timing is "contingent". Include trigger description in conditions.
- Rollover: from is the person rolling, to is the buyer-side entity they're rolling into.
- Debt payoff: from is the acquisition vehicle, to is the lender. Timing is "closing".
- Fees: from is the acquisition vehicle, to a "transaction advisors" entity (create one if needed with type: bank, role: []).
- If amounts aren't specified exactly, estimate based on context or use 0 and note "TBD" in conditions.

Return ONLY a valid JSON array. No markdown, no preamble.`,
    user: rawText,
  };
}
