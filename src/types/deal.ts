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
  id: string;
  name: string;
  type: EntityType;
  jurisdiction: string;
  roles: EntityRole[];
}

export const EDGE_TYPES = ['owns', 'guarantees', 'manages', 'lp_in'] as const;

export type EdgeType = typeof EDGE_TYPES[number];

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  params: {
    pct?: number;
    scope?: string;
    commitment?: number;
  };
}

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
  preReorgDescription?: string;
  assetSelection?: {
    includedAssets: string[];
    assumedLiabilities: string[];
    excludedAssets: string[];
    excludedLiabilities: string[];
  };
}

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
  id: string;
  from: string;
  to: string;
  type: FlowType;
  amount: number;
  timing: FlowTiming;
  conditions?: string | null;
}

export interface DealState {
  rawText: string;
  entities: Entity[];
  relationships: Relationship[];
  structure: Structure;
  considerationFlows: ConsiderationFlow[];
}
