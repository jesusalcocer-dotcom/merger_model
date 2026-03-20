import { DealState } from '@/types/deal';
import {
  hasPathToTargetThroughBuySide,
  getSellSideOwnershipDepth,
} from './graph-utils';

export interface Flag {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
}

export function detectFlags(deal: DealState): Flag[] {
  const flags: Flag[] = [];
  const target = deal.entities.find(e => e.roles.includes('target'));
  if (!target) return flags;

  // Rule 1: CFIUS
  for (const entity of deal.entities) {
    if (entity.type === 'sovereign' || entity.type === 'foreign_entity') {
      if (hasPathToTargetThroughBuySide(entity.id, target.id, deal.entities, deal.relationships)) {
        flags.push({
          severity: 'critical',
          title: 'CFIUS Review Likely',
          description: `${entity.name} (${entity.type.replace('_', ' ')}) has an indirect path to ownership of ${target.name} through the buy-side structure. This likely triggers a CFIUS review, adding 45-75+ days to the timeline.`,
        });
      }
    }
  }

  // Rule 2: Minority Shareholders
  const ownsToTarget = deal.relationships.filter(
    r => r.to === target.id && r.type === 'owns'
  );
  if (ownsToTarget.length > 1) {
    flags.push({
      severity: 'warning',
      title: 'Multiple Shareholders',
      description: `${ownsToTarget.length} entities own equity in ${target.name}. Check for: ROFR/preemptive rights, drag-along provisions, consent requirements, whether all sellers are parties to the SPA.`,
    });
  }

  // Rule 3: Thin Seller Credit
  for (const entity of deal.entities) {
    if (entity.roles.includes('seller') && (entity.type === 'lp' || entity.type === 'llc')) {
      const hasGuarantor = deal.relationships.some(
        r => r.to === entity.id && r.type === 'guarantees'
      );
      if (!hasGuarantor) {
        flags.push({
          severity: 'warning',
          title: 'Thin Seller Credit',
          description: `${entity.name} is a ${entity.type.toUpperCase()} with no parent guarantee. Post-closing indemnification claims may be uncollectable if the fund distributes sale proceeds to LPs. Consider: R&W insurance, escrow, parent guaranty.`,
        });
      }
    }
  }

  // Rule 4: Carve-out / TSA
  const sellSideDepth = getSellSideOwnershipDepth(deal.entities, deal.relationships);
  if (sellSideDepth > 1) {
    const sellers = deal.entities.filter(e => e.roles.includes('seller'));
    const parents = deal.entities.filter(e => e.roles.includes('parent'));
    const parentName = parents.length > 0 ? parents[0].name : 'Parent';
    const sellerName = sellers.length > 0 ? sellers[0].name : 'Seller';
    flags.push({
      severity: 'info',
      title: 'Carve-out / TSA Likely',
      description: `This appears to be a carve-out (${parentName} → ${sellerName} → ${target.name}). Likely requires a Transition Services Agreement for shared services (IT, HR, finance, facilities). WC calculation may be complex.`,
    });
  }

  // Rule 5: Invalid Mechanism
  if (deal.structure.transferObject === 'assets' && deal.structure.mechanism !== 'direct_purchase') {
    const mechLabel = deal.structure.mechanism.replace(/_/g, ' ');
    flags.push({
      severity: 'critical',
      title: 'Invalid Mechanism',
      description: `Asset acquisitions can only use direct purchase (APA). "${mechLabel}" is incompatible with an asset transfer. Change the mechanism to Direct Purchase.`,
    });
  }

  // Rule 6: Tax Election Available
  if (deal.structure.transferObject === 'equity' && target.type === 's_corp') {
    flags.push({
      severity: 'info',
      title: '338(h)(10) Election Available',
      description: `Target is an S-Corp. A 338(h)(10) election may be available, giving the buyer a tax step-up while maintaining stock purchase mechanics. Both parties must consent.`,
    });
  }

  // Rule 7: No Escrow with Direct Indemnification
  const hasEscrow = deal.considerationFlows.some(f => f.type === 'escrow');
  const hasRWInsurance = deal.considerationFlows.some(f => f.type === 'premium');
  if (!hasEscrow && !hasRWInsurance) {
    flags.push({
      severity: 'warning',
      title: 'No Escrow or R&W Insurance',
      description: `No escrow or R&W insurance in the consideration structure. Buyer's sole recourse for post-closing claims is direct seller indemnification. If seller credit is thin (see other flags), this creates significant collection risk.`,
    });
  }

  // Rule 8: Earnout Governance Risk
  const earnoutFlows = deal.considerationFlows.filter(f => f.type === 'earnout');
  if (earnoutFlows.length > 0) {
    const totalEarnout = earnoutFlows.reduce((sum, f) => sum + f.amount, 0);
    flags.push({
      severity: 'warning',
      title: 'Earnout Governance Risk',
      description: `Earnout detected ($${totalEarnout}M). Post-closing, the buyer controls the target's operations, creating a potential conflict of interest. The buyer may have an incentive to avoid triggering the earnout. Consider: efforts covenants, information rights, deemed-trigger provisions, earnout governance language.`,
    });
  }

  // Rule 9: Cap Table Reconciliation
  const rolloverEntities = deal.entities.filter(e =>
    e.roles.includes('seller') &&
    deal.considerationFlows.some(f => f.type === 'rollover' && f.from === e.id)
  );
  if (rolloverEntities.length > 0) {
    const rolloverWithoutOwnership = rolloverEntities.filter(
      e => !deal.relationships.some(r => r.from === e.id && r.to === target.id && r.type === 'owns')
    );
    const totalOwnershipPct = deal.relationships
      .filter(r => r.to === target.id && r.type === 'owns')
      .reduce((sum, r) => sum + (r.params?.pct ?? 0), 0);
    if (rolloverWithoutOwnership.length > 0 && totalOwnershipPct >= 100) {
      const names = rolloverWithoutOwnership.map(e => e.name).join(', ');
      flags.push({
        severity: 'warning',
        title: 'Cap Table Reconciliation',
        description: `${names} appear to hold equity in ${target.name} (they are rolling equity into the buyer structure) but the ownership table accounts for 100% of ${target.name} equity without them. The cap table may not reconcile. Verify the source of their equity: direct shares, stock options, restricted stock, carried interest, or co-investment through a fund.`,
      });
    }
  }

  return flags;
}
