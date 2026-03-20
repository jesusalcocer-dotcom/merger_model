import { DealState } from '@/types/deal';

export const MOCK_DEAL: DealState = {
  rawText: `Meridian Capital Partners Fund IV is acquiring 100% of Summit Precision Components from Cascadia Partners Fund III and the Dellacroce Family Trust through a newly formed acquisition vehicle. Stock purchase for $87M enterprise value. $63M cash at closing, $8M escrow for working capital adjustment (18 month term), $8M earnout contingent on DoD contract awards (Anvil and Condor) within 18 months. CEO Vasquez rolling $2.5M and COO Ritter rolling $0.8M into HoldCo. Summit has $12M existing debt to be retired at closing. Transaction fees estimated at $4M. Meridian purchasing R&W insurance ($8.7M policy, $435K retention, $261K premium). Cascadia is a PE fund owning 93%, Dellacroce Family Trust owns 7% with ROFR. Meridian Fund IV has Gulf Coast Sovereign Fund as 18% LP. Meridian GP manages the fund.`,

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
