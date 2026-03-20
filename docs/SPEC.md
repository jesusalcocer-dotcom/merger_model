# Deal Structurer — Product Spec v1

## Overview

Single-page Next.js app for structuring M&A transactions. User pastes a term sheet or deal description, Claude API parses it into four structured blocks (entities, relationships, structure, consideration), user edits in tables, clicks Generate, sees a deal diagram with auto-detected flags.

## Tech Stack

- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS
- React Flow (diagram rendering)
- Anthropic API (Claude Sonnet for parsing)

## API Key

Hardcoded for testing (will be rotated):

```
[stored in .env.local — ANTHROPIC_API_KEY]
```

Use model: `claude-sonnet-4-20250514`

---

## 1. Data Schemas

All schemas defined in `/src/types/deal.ts`.

### Entity

```typescript
export const ENTITY_TYPES = [
  'person',
  'c_corp',
  's_corp',
  'llc',
  'lp',
  'trust',
  'sovereign',
  'bank',
  'foreign_entity',
] as const;

export type EntityType = typeof ENTITY_TYPES[number];

export const ENTITY_ROLES = [
  'target',
  'seller',
  'buyer',
  'parent',
  'acq_vehicle',
  'guarantor',
  'seller_rep',
  'escrow_agent',
  'insurer',
  'lender',
] as const;

export type EntityRole = typeof ENTITY_ROLES[number];

export interface Entity {
  id: string;            // kebab-case, e.g. "cascadia-fund-iii"
  name: string;          // display name, e.g. "Cascadia Partners Fund III"
  type: EntityType;
  jurisdiction: string;  // e.g. "Delaware", "New York", "Cayman Islands"
  roles: EntityRole[];
}
```

### Relationship (Edge)

```typescript
export const EDGE_TYPES = ['owns', 'guarantees', 'manages', 'lp_in'] as const;

export type EdgeType = typeof EDGE_TYPES[number];

export interface Relationship {
  id: string;            // auto-generated
  from: string;          // entity id
  to: string;            // entity id
  type: EdgeType;
  params: {
    pct?: number;        // for owns, lp_in (0-100)
    scope?: string;      // for guarantees ("full", "capped at $X", "specific obligations")
    commitment?: number; // for lp_in ($M)
  };
}
```

### Structure

```typescript
export const TRANSFER_OBJECTS = ['equity', 'assets'] as const;
export type TransferObject = typeof TRANSFER_OBJECTS[number];

export const MECHANISMS = [
  'direct_purchase',
  'forward_merger',
  'reverse_triangular_merger',
  'forward_triangular_merger',
  'tender_offer',
] as const;
export type Mechanism = typeof MECHANISMS[number];

export interface Structure {
  transferObject: TransferObject;
  mechanism: Mechanism;
  preReorgRequired: boolean;
  preReorgDescription?: string; // if true, describe what needs to happen
  assetSelection?: {            // only if transferObject = 'assets'
    includedAssets: string[];
    assumedLiabilities: string[];
    excludedAssets: string[];
    excludedLiabilities: string[];
  };
}
```

### Consideration Flow

```typescript
export const FLOW_TYPES = [
  'cash',
  'escrow',
  'earnout',
  'buyer_equity',
  'seller_note',
  'rollover',
  'debt_payoff',
  'fees',
  'premium',
  'assumed_liabilities',
] as const;

export type FlowType = typeof FLOW_TYPES[number];

export const FLOW_TIMINGS = ['closing', 'contingent', 'deferred'] as const;
export type FlowTiming = typeof FLOW_TIMINGS[number];

export interface ConsiderationFlow {
  id: string;            // auto-generated
  from: string;          // entity id
  to: string;            // entity id
  type: FlowType;
  amount: number;        // $M
  timing: FlowTiming;
  conditions?: string;   // free text: "release T18, WC settled", "Anvil/Condor award, 18mo"
}
```

### Top-level Deal State

```typescript
export interface DealState {
  rawText: string;
  entities: Entity[];
  relationships: Relationship[];
  structure: Structure;
  considerationFlows: ConsiderationFlow[];
}
```

---

## 2. UI Layout and Flow

Single page. Three visual states. Vertical scroll.

### State 1: Input

```
┌──────────────────────────────────────────────────────────┐
│  DEAL STRUCTURER                                          │
│                                                            │
│  Paste a term sheet, LOI, or deal description below.      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  [textarea, 12 rows minimum, full width]             │ │
│  │                                                      │ │
│  │  placeholder: "Meridian Capital Partners Fund IV     │ │
│  │  is acquiring 100% of Summit Precision Components    │ │
│  │  from Cascadia Partners for $87M..."                 │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│                                         [Parse Deal]      │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

"Parse Deal" button triggers the sequential API chain. Show a loading indicator with step labels: "Extracting entities...", "Mapping relationships...", "Determining structure...", "Parsing consideration..."

### State 2: Edit

After parsing completes, four table blocks appear below the text area. The text area remains visible and editable (user can re-parse).

Each table block has:
- A section header with the block name
- An editable table
- An [+ Add Row] button
- A [Re-parse below] button (triggers API calls for this block and all downstream blocks using current state)
- Row-level delete buttons (small X on each row)

#### Block 1: Entities Table

| Column | Type | Width |
|---|---|---|
| Name | text input | 30% |
| Type | dropdown (ENTITY_TYPES) | 20% |
| Jurisdiction | text input | 20% |
| Role(s) | multi-select dropdown (ENTITY_ROLES) | 25% |
| Delete | button (X) | 5% |

#### Block 2: Relationships Table

| Column | Type | Width |
|---|---|---|
| From | dropdown (entity names from Block 1) | 25% |
| To | dropdown (entity names from Block 1) | 25% |
| Type | dropdown (EDGE_TYPES) | 15% |
| Param | text input (auto-label: "%" for owns/lp_in, "scope" for guarantees) | 25% |
| Delete | button (X) | 5% |

Note: From/To dropdowns must reactively update when entities are added/removed in Block 1.

#### Block 3: Structure Panel

Not a table. A small form panel:

```
Transfer object:    (●) Equity    ( ) Assets
                    [if Assets selected, show asset selection sub-form]

Mechanism:          [ Direct Purchase        ▼]
                    [dropdown, filtered by transfer object:
                     if equity: all 5 mechanisms
                     if assets: only direct_purchase, greyed out]

Pre-reorg required: ( ) Yes   (●) No
                    [if Yes, show text input for description]
```

#### Block 4: Consideration Flows Table

| Column | Type | Width |
|---|---|---|
| From | dropdown (entity names) | 18% |
| To | dropdown (entity names) | 18% |
| Type | dropdown (FLOW_TYPES) | 12% |
| Amount ($M) | number input | 12% |
| Timing | dropdown (FLOW_TIMINGS) | 12% |
| Conditions | text input | 23% |
| Delete | button (X) | 5% |

Below Block 4:

```
                                              [Generate Diagram]
```

### State 3: Results

After Generate is clicked, results appear below the tables.

#### Deal Diagram

Full-width rendered diagram using React Flow. Details in Section 4.

Below the diagram, a toggle: [Pre-Closing] [Transaction] [Post-Closing]

- Pre-Closing: shows ownership graph only, no consideration arrows
- Transaction: shows ownership graph + consideration arrows (default view)
- Post-Closing: shows new ownership graph (target moved to buy-side)

#### Flags Panel

Below the diagram. A card/panel listing auto-detected issues.

Each flag:
```
⚠ [Title]
  [Description — 1-2 sentences explaining the flag and its consequence]
```

Color-coded: red for critical (CFIUS, invalid structure), amber for warning (thin credit, minority), grey for informational (TSA likely needed).

#### Export

Below flags. Two buttons:

[Export JSON] — downloads the full DealState as a .json file
[Copy JSON] — copies to clipboard

---

## 3. API Integration

### Architecture

Four Next.js API routes, one per parsing step:

```
/src/app/api/parse/entities/route.ts
/src/app/api/parse/relationships/route.ts
/src/app/api/parse/structure/route.ts
/src/app/api/parse/consideration/route.ts
```

Each route:
1. Receives POST with { rawText, ...priorResults }
2. Builds the prompt from a template
3. Calls Anthropic API
4. Parses and validates the JSON response
5. Returns the parsed block

### Client-side orchestration

The Parse button fires all four calls in sequence:

```typescript
async function parseDeal(rawText: string) {
  setLoading('entities');
  const entities = await fetch('/api/parse/entities', {
    method: 'POST',
    body: JSON.stringify({ rawText })
  }).then(r => r.json());
  setEntities(entities);

  setLoading('relationships');
  const relationships = await fetch('/api/parse/relationships', {
    method: 'POST',
    body: JSON.stringify({ rawText, entities })
  }).then(r => r.json());
  setRelationships(relationships);

  setLoading('structure');
  const structure = await fetch('/api/parse/structure', {
    method: 'POST',
    body: JSON.stringify({ rawText, entities, relationships })
  }).then(r => r.json());
  setStructure(structure);

  setLoading('consideration');
  const flows = await fetch('/api/parse/consideration', {
    method: 'POST',
    body: JSON.stringify({ rawText, entities, relationships, structure })
  }).then(r => r.json());
  setConsiderationFlows(flows);

  setLoading(null);
}
```

Re-parse from a specific step: same chain but starts from that step, using the current (edited) state for prior blocks.

### Prompt Templates

Each prompt template lives in `/src/prompts/`. Each exports a function that returns the messages array.

#### Call 1: Parse Entities

```
/src/prompts/parse-entities.ts
```

System prompt:

```
You are an M&A deal structure parser. Given a deal description, extract every entity (party) mentioned or implied.

Return a JSON array of entities. Each entity has:
- id: kebab-case unique identifier (e.g., "cascadia-fund-iii")
- name: full display name
- type: one of [person, c_corp, s_corp, llc, lp, trust, sovereign, bank, foreign_entity]
- jurisdiction: state or country (e.g., "Delaware"). Use "" if unknown.
- roles: array of one or more of [target, seller, buyer, parent, acq_vehicle, guarantor, seller_rep, escrow_agent, insurer, lender]

Important rules:
- Include entities that are implied but not explicitly named. If the description says "PE fund acquiring through a holding company," create both the fund entity AND the holding company entity.
- If a buyer is a PE fund, it likely has a GP entity (type: llc, role: []) and may have an acquisition vehicle (HoldCo and/or AcqCo).
- If a seller is a PE fund, it is type: lp.
- If a minority holder is a family trust, it is type: trust.
- If a sovereign wealth fund is mentioned as an LP, create it as a separate entity with type: sovereign.
- An escrow agent is typically type: bank. Only include if escrow is mentioned.
- An R&W insurer is type: bank, role: insurer. Only include if R&W insurance is mentioned.

Return ONLY a valid JSON array. No markdown, no preamble, no explanation.
```

User message: the raw deal text.

#### Call 2: Parse Relationships

System prompt:

```
You are an M&A deal structure parser. Given a deal description and a list of entities, extract every relationship between entities.

Entities provided:
{JSON.stringify(entities, null, 2)}

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

Return ONLY a valid JSON array. No markdown, no preamble.
```

User message: the raw deal text.

#### Call 3: Parse Structure

System prompt:

```
You are an M&A deal structure parser. Given a deal description, entities, and relationships, determine the transaction structure.

Entities: {JSON.stringify(entities, null, 2)}
Relationships: {JSON.stringify(relationships, null, 2)}

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

Return ONLY a valid JSON object. No markdown, no preamble.
```

User message: the raw deal text.

#### Call 4: Parse Consideration

System prompt:

```
You are an M&A deal structure parser. Given a deal description and the full deal structure, extract every flow of value between entities.

Entities: {JSON.stringify(entities, null, 2)}
Relationships: {JSON.stringify(relationships, null, 2)}
Structure: {JSON.stringify(structure, null, 2)}

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

Return ONLY a valid JSON array. No markdown, no preamble.
```

User message: the raw deal text.

### Error Handling

- If Claude returns invalid JSON, retry once. If still invalid, show an error message and let the user try re-parsing.
- If the API call fails (network, rate limit), show error and allow retry.
- Validate that entity ids referenced in relationships and flows actually exist in the entities list. Highlight broken references in the UI.

---

## 4. Diagram Rendering

### Library

React Flow (`@xyflow/react`).

### Layout Algorithm

Custom layout function in `/src/lib/layout.ts`.

The function takes entities, relationships, and consideration flows and returns positioned nodes and edges for React Flow.

#### Node Positioning

Three columns:
- Left column (x = 0): sell-side entities
- Center column (x = 400): target entity
- Right column (x = 800): buy-side entities

Within each column, vertical positioning by ownership depth:
- Root entities (no incoming "owns" edge from same side) at y = 0
- Each level of ownership adds y += 150
- Siblings at the same depth spread horizontally within their column (x offset ± 100)

Side assignment:
- Entity with role "target" → center
- Entity with role containing "seller", "seller_rep", or "parent" where the entity is on the sell-side ownership chain → left
- Entity with role containing "buyer", "acq_vehicle", "guarantor" on buy-side chain → right
- Third parties (escrow_agent, insurer, lender) → below center, y offset + 200

Algorithm:
1. Find the target entity. Place at center.
2. Trace "owns" edges backward from target to find all sell-side entities. Place left, top-to-bottom by depth.
3. Trace "owns" edges forward from buyer through acq_vehicles. Place right, top-to-bottom by depth.
4. Trace "manages" and "lp_in" edges to position GP, sovereign, etc. relative to their connected fund entity.
5. Place third parties below.

#### Node Component

Custom React Flow node. A rounded rectangle card:

```
┌──────────────────────┐
│ ■ ROLE_BADGE         │
│ Entity Name          │
│ type · jurisdiction  │
└──────────────────────┘
```

- Width: 200px, height: 80px
- Role badge: small colored chip at top-left
  - target: green (#22c55e)
  - seller: amber (#f59e0b)
  - buyer: blue (#3b82f6)
  - acq_vehicle: light blue (#93c5fd)
  - parent: amber (#f59e0b, lighter)
  - guarantor: purple (#a855f7)
  - escrow_agent, insurer, lender: grey (#9ca3af)
- Entity name: bold, 14px
- Type + jurisdiction: small text, 11px, grey
- Card background: white with subtle shadow
- Card border: 1px, colored by side (amber for sell, blue for buy, green for target, grey for third party)

#### Edge Types

Two categories of edges rendered differently:

**Ownership/structural edges** (from relationships):

| Type | Style | Label |
|---|---|---|
| owns | solid line, 2px, grey (#64748b) | "{pct}%" |
| guarantees | dashed line, 2px, purple (#a855f7) | "guarantees" |
| manages | dotted line, 1px, grey (#94a3b8) | "manages" |
| lp_in | dashed line, 1px, grey (#94a3b8) | "{pct}% LP" |

**Consideration flow edges** (from consideration flows — only visible in "Transaction" view):

| Type | Style | Color | Label |
|---|---|---|---|
| cash | solid, 3px, animated | green (#22c55e) | "${amount}M cash" |
| escrow | solid, 3px | yellow (#eab308) | "${amount}M escrow" |
| earnout | dashed, 3px | red (#ef4444) | "${amount}M earnout" |
| buyer_equity | solid, 3px | purple (#a855f7) | "${amount}M equity" |
| seller_note | dashed, 2px | blue (#3b82f6) | "${amount}M note" |
| rollover | solid, 2px, curved | purple (#7c3aed) | "${amount}M rollover" |
| debt_payoff | solid, 2px | grey (#6b7280) | "${amount}M payoff" |
| fees | solid, 1px | grey (#9ca3af) | "${amount}M fees" |
| premium | solid, 1px | grey (#9ca3af) | "${amount}M premium" |

Consideration edges flow right-to-left (buyer side → seller side), except:
- rollover flows from sell-side person to buy-side entity
- debt_payoff flows from buyer to lender (third party)
- fees flows from buyer to advisors (third party)
- premium flows from buyer to insurer (third party)

#### View Toggle

Three buttons below the diagram: [Pre-Closing] [Transaction] [Post-Closing]

- **Pre-Closing**: show only ownership/structural edges. No consideration flows.
- **Transaction** (default): show ownership edges + consideration flow edges. This is the full picture.
- **Post-Closing**: recompute ownership edges. Remove seller→target "owns" edges. Add buyer-side→target "owns" edge (100%). Remove consideration flow edges. Keep structural edges (manages, lp_in, guarantees).

### React Flow Configuration

```typescript
const rfOptions = {
  fitView: true,
  nodesDraggable: false,     // auto-layout only
  nodesConnectable: false,   // no manual edge creation
  elementsSelectable: false, // no selection
  zoomOnScroll: true,
  panOnScroll: true,
  minZoom: 0.3,
  maxZoom: 2,
};
```

---

## 5. Auto-Detection Rules

Implemented in `/src/lib/flags.ts`.

Function signature:

```typescript
interface Flag {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
}

function detectFlags(deal: DealState): Flag[]
```

### Rules

**Rule 1: CFIUS**

Severity: critical

Trigger: any entity with type = "sovereign" or type = "foreign_entity" that has a path to the target through lp_in → owns chain on the buy-side.

Description: "[Entity name] ([type]) has an indirect path to ownership of [target name] through the buy-side structure. This likely triggers a CFIUS review, adding 45-75+ days to the timeline."

**Rule 2: Minority Shareholders**

Severity: warning

Trigger: more than one "owns" edge pointing to the target entity.

Description: "[N] entities own equity in [target name]. Check for: ROFR/preemptive rights, drag-along provisions, consent requirements, whether all sellers are parties to the SPA."

**Rule 3: Thin Seller Credit**

Severity: warning

Trigger: seller entity has type = "lp" or type = "llc" AND no "guarantees" edge exists from any other entity to the seller.

Description: "[Seller name] is a [type] with no parent guarantee. Post-closing indemnification claims may be uncollectable if the fund distributes sale proceeds to LPs. Consider: R&W insurance, escrow, parent guaranty."

**Rule 4: Carve-out / TSA**

Severity: info

Trigger: sell-side ownership depth > 1 (there exists a parent entity that owns the seller that owns the target).

Description: "This appears to be a carve-out ([parent] → [seller] → [target]). Likely requires a Transition Services Agreement for shared services (IT, HR, finance, facilities). WC calculation may be complex."

**Rule 5: Invalid Mechanism**

Severity: critical

Trigger: structure.transferObject = "assets" AND structure.mechanism != "direct_purchase"

Description: "Asset acquisitions can only use direct purchase (APA). [selected mechanism] is incompatible with an asset transfer. Change the mechanism to Direct Purchase."

**Rule 6: Tax Election Available**

Severity: info

Trigger: structure.transferObject = "equity" AND target entity type = "s_corp"

Description: "Target is an S-Corp. A 338(h)(10) election may be available, giving the buyer a tax step-up while maintaining stock purchase mechanics. Both parties must consent."

**Rule 7: No Escrow with Direct Indemnification**

Severity: warning

Trigger: no consideration flow with type = "escrow" exists AND no consideration flow with type = "premium" (R&W insurance) exists.

Description: "No escrow or R&W insurance in the consideration structure. Buyer's sole recourse for post-closing claims is direct seller indemnification. If seller credit is thin (see other flags), this creates significant collection risk."

**Rule 8: Earnout Governance Risk**

Severity: warning

Trigger: a consideration flow with type = "earnout" exists AND the buyer will control the target post-closing.

Description: "Earnout detected ($[amount]M). Post-closing, the buyer controls the target's operations, creating a potential conflict of interest. The buyer may have an incentive to avoid triggering the earnout. Consider: efforts covenants, information rights, deemed-trigger provisions, earnout governance language."

---

## 6. File Structure

```
merger_model/
├── docs/
│   └── SPEC.md                          # this file
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # root layout
│   │   ├── page.tsx                     # main (only) page
│   │   ├── globals.css                  # tailwind imports
│   │   └── api/
│   │       └── parse/
│   │           ├── entities/route.ts
│   │           ├── relationships/route.ts
│   │           ├── structure/route.ts
│   │           └── consideration/route.ts
│   ├── components/
│   │   ├── TextInput.tsx                # state 1: textarea + parse button
│   │   ├── EntityTable.tsx              # block 1 editable table
│   │   ├── RelationshipTable.tsx        # block 2 editable table
│   │   ├── StructurePanel.tsx           # block 3 form panel
│   │   ├── ConsiderationTable.tsx       # block 4 editable table
│   │   ├── DealDiagram.tsx              # react flow wrapper
│   │   ├── DiagramNode.tsx              # custom react flow node
│   │   ├── FlagsPanel.tsx               # auto-detected flags
│   │   └── ExportButtons.tsx            # JSON export
│   ├── lib/
│   │   ├── layout.ts                   # diagram layout algorithm
│   │   ├── flags.ts                    # auto-detection rules
│   │   └── graph-utils.ts             # helper functions for traversing entity graph
│   ├── prompts/
│   │   ├── parse-entities.ts
│   │   ├── parse-relationships.ts
│   │   ├── parse-structure.ts
│   │   └── parse-consideration.ts
│   └── types/
│       └── deal.ts                     # all TypeScript interfaces and enums
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.mjs
```

---

## 7. Mock Data

For development, use this hardcoded Summit deal in `/src/lib/mock-data.ts`:

```typescript
import { DealState } from '@/types/deal';

export const MOCK_DEAL: DealState = {
  rawText: `Meridian Capital Partners Fund IV is acquiring 100% of Summit Precision 
Components from Cascadia Partners Fund III and the Dellacroce Family Trust through 
a newly formed acquisition vehicle. Stock purchase for $87M enterprise value. 
$63M cash at closing, $8M escrow for working capital adjustment (18 month term), 
$8M earnout contingent on DoD contract awards (Anvil and Condor) within 18 months. 
CEO Vasquez rolling $2.5M and COO Ritter rolling $0.8M into HoldCo. Summit has 
$12M existing debt to be retired at closing. Transaction fees estimated at $4M. 
Meridian purchasing R&W insurance ($8.7M policy, $435K retention, $261K premium). 
Cascadia is a PE fund owning 93%, Dellacroce Family Trust owns 7% with ROFR. 
Meridian Fund IV has Gulf Coast Sovereign Fund as 18% LP. Meridian GP manages the fund.`,

  entities: [
    { id: 'summit', name: 'Summit Precision Components', type: 'c_corp', jurisdiction: 'Delaware', roles: ['target'] },
    { id: 'cascadia', name: 'Cascadia Partners Fund III', type: 'lp', jurisdiction: 'Delaware', roles: ['seller'] },
    { id: 'dellacroce', name: 'Dellacroce Family Trust', type: 'trust', jurisdiction: 'New York', roles: ['seller'] },
    { id: 'meridian-iv', name: 'Meridian Capital Partners Fund IV', type: 'lp', jurisdiction: 'Delaware', roles: ['buyer'] },
    { id: 'meridian-gp', name: 'Meridian GP LLC', type: 'llc', jurisdiction: 'Delaware', roles: [] },
    { id: 'holdco', name: 'HoldCo', type: 'llc', jurisdiction: 'Delaware', roles: ['acq_vehicle'] },
    { id: 'acq-co', name: 'AcqCo', type: 'llc', jurisdiction: 'Delaware', roles: ['acq_vehicle'] },
    { id: 'gulf-sovereign', name: 'Gulf Coast Sovereign Fund', type: 'sovereign', jurisdiction: '', roles: [] },
    { id: 'vasquez', name: 'Vasquez (CEO)', type: 'person', jurisdiction: '', roles: [] },
    { id: 'ritter', name: 'Ritter (COO)', type: 'person', jurisdiction: '', roles: [] },
    { id: 'escrow-agent', name: 'Escrow Agent', type: 'bank', jurisdiction: 'New York', roles: ['escrow_agent'] },
    { id: 'rw-insurer', name: 'R&W Insurer', type: 'bank', jurisdiction: '', roles: ['insurer'] },
    { id: 'summit-lenders', name: 'Summit Lenders', type: 'bank', jurisdiction: '', roles: ['lender'] },
    { id: 'advisors', name: 'Transaction Advisors', type: 'bank', jurisdiction: '', roles: [] },
  ],

  relationships: [
    { id: 'rel-1', from: 'cascadia', to: 'summit', type: 'owns', params: { pct: 93 } },
    { id: 'rel-2', from: 'dellacroce', to: 'summit', type: 'owns', params: { pct: 7 } },
    { id: 'rel-3', from: 'meridian-gp', to: 'meridian-iv', type: 'manages', params: {} },
    { id: 'rel-4', from: 'gulf-sovereign', to: 'meridian-iv', type: 'lp_in', params: { pct: 18 } },
    { id: 'rel-5', from: 'meridian-iv', to: 'holdco', type: 'owns', params: { pct: 100 } },
    { id: 'rel-6', from: 'holdco', to: 'acq-co', type: 'owns', params: { pct: 100 } },
  ],

  structure: {
    transferObject: 'equity',
    mechanism: 'direct_purchase',
    preReorgRequired: false,
  },

  considerationFlows: [
    { id: 'flow-1', from: 'acq-co', to: 'cascadia', type: 'cash', amount: 58.6, timing: 'closing', conditions: null },
    { id: 'flow-2', from: 'acq-co', to: 'dellacroce', type: 'cash', amount: 4.4, timing: 'closing', conditions: null },
    { id: 'flow-3', from: 'acq-co', to: 'escrow-agent', type: 'escrow', amount: 8.0, timing: 'closing', conditions: 'Release at month 18, WC adjustment settled. Remainder to Cascadia.' },
    { id: 'flow-4', from: 'acq-co', to: 'cascadia', type: 'earnout', amount: 8.0, timing: 'contingent', conditions: 'DoD awards Anvil and/or Condor within 18 months of closing' },
    { id: 'flow-5', from: 'vasquez', to: 'holdco', type: 'rollover', amount: 2.5, timing: 'closing', conditions: null },
    { id: 'flow-6', from: 'ritter', to: 'holdco', type: 'rollover', amount: 0.8, timing: 'closing', conditions: null },
    { id: 'flow-7', from: 'acq-co', to: 'summit-lenders', type: 'debt_payoff', amount: 12.0, timing: 'closing', conditions: null },
    { id: 'flow-8', from: 'acq-co', to: 'advisors', type: 'fees', amount: 4.0, timing: 'closing', conditions: null },
    { id: 'flow-9', from: 'meridian-iv', to: 'rw-insurer', type: 'premium', amount: 0.261, timing: 'closing', conditions: '$8.7M policy limit, $435K retention, 36mo term' },
  ],
};
```

---

## 8. Build Order

**Phase 1: Scaffold + Types + Mock Data**
- Initialize Next.js with TypeScript and Tailwind
- Create all TypeScript interfaces in `/src/types/deal.ts`
- Create mock data in `/src/lib/mock-data.ts`
- Create basic page layout with placeholder components
- Verify everything compiles and renders

**Phase 2: Editable Tables**
- Build EntityTable, RelationshipTable, StructurePanel, ConsiderationTable
- Wire state management (useState with DealState)
- Load mock data on page load for testing
- Verify all tables render correctly and edits update state

**Phase 3: Diagram**
- Install React Flow
- Build layout algorithm in `/src/lib/layout.ts`
- Build custom DiagramNode component
- Build DealDiagram wrapper with view toggle (pre/transaction/post)
- Wire Generate button to compute layout and render diagram
- Test with mock data

**Phase 4: API Integration**
- Create four prompt template files
- Create four API route handlers
- Build TextInput component with Parse button
- Wire parse chain (sequential calls, loading states)
- Wire Re-parse buttons on each table block
- Test with the Summit deal description

**Phase 5: Flags + Polish**
- Implement flag detection rules in `/src/lib/flags.ts`
- Build FlagsPanel component
- Build ExportButtons (JSON download, clipboard copy)
- Visual polish: consistent spacing, responsive layout, loading animations
- Error handling: API failures, invalid JSON, broken entity references

---

## 9. Design Notes

### Color Palette

- Background: white (#ffffff)
- Cards/panels: white with grey border (#e2e8f0)
- Section headers: slate-800 (#1e293b) text
- Sell-side accent: amber-500 (#f59e0b)
- Buy-side accent: blue-500 (#3b82f6)
- Target accent: green-500 (#22c55e)
- Third-party accent: grey-400 (#9ca3af)
- Critical flag: red-500 (#ef4444)
- Warning flag: amber-500 (#f59e0b)
- Info flag: blue-400 (#60a5fa)

### Typography

- Headings: Inter or system font, bold
- Body: 14px
- Table cells: 13px
- Small labels: 11px

### Spacing

- Page padding: 24px horizontal, 16px vertical
- Section gap: 32px
- Table row height: 40px
- Card padding: 16px

### Responsive

Desktop-first. Minimum viewport: 1024px. Tables scroll horizontally on smaller screens. Diagram zooms to fit.
