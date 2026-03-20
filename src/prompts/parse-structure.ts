import { Entity, Relationship } from '@/types/deal';

export function buildStructurePrompt(rawText: string, entities: Entity[], relationships: Relationship[]) {
  return {
    system: `You are an M&A deal structure parser. Given a deal description, entities, and relationships, determine the transaction structure.

Entities: ${JSON.stringify(entities, null, 2)}
Relationships: ${JSON.stringify(relationships, null, 2)}

Return a JSON object with:
- transferObject: "equity" or "assets"
- mechanism: one of [direct_purchase, forward_merger, reverse_triangular_merger, forward_triangular_merger, tender_offer]
  - If transferObject is "assets", mechanism MUST be "direct_purchase"
- preReorgRequired: boolean
  - true if the target business doesn't currently exist as a separate entity and needs to be carved out before the transaction
- preReorgDescription: string (only if preReorgRequired is true, describe what reorganization is needed)
- assetSelection: object (only if transferObject is "assets") with:
  - includedAssets: string array
  - assumedLiabilities: string array
  - excludedAssets: string array
  - excludedLiabilities: string array

Rules:
- If the description says "stock purchase" or "equity purchase" or "acquire all shares," transferObject is "equity"
- If it says "asset purchase" or "acquire assets," transferObject is "assets"
- If it says "merger," determine which type from context (forward, reverse triangular, forward triangular)
- Default to "direct_purchase" for mechanism if not specified
- preReorgRequired is true only if the target is described as a "division" or "business unit" that is not a separate legal entity

Return ONLY a valid JSON object. No markdown, no preamble.`,
    user: rawText,
  };
}
