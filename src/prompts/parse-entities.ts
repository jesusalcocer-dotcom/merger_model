export function buildEntityPrompt(rawText: string) {
  return {
    system: `You are an M&A deal structure parser. Given a deal description, extract every entity (party) mentioned or implied.

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
- If a PE fund forms an acquisition vehicle (HoldCo, AcqCo, MergerSub), the fund's role is 'parent', NOT 'buyer'. The acquisition vehicle that directly purchases the target or its shares gets roles ['buyer', 'acq_vehicle']. The fund is the economic buyer but legally it is the parent entity.
- Always create an entity for existing lenders if the description mentions debt to be retired or paid off at closing. Name it '[Company] Lenders' with type: 'bank' and roles: ['lender']. Always create a 'Transaction Advisors' entity with type: 'bank' and roles: [] if transaction fees, expenses, or advisor fees are mentioned.
- For US PE funds and acquisition vehicles described as LP or LLC without an explicit jurisdiction stated, default to 'Delaware'. Leave jurisdiction blank only if the entity's jurisdiction is truly unknown or non-US.

Return ONLY a valid JSON array. No markdown, no preamble, no explanation.`,
    user: rawText,
  };
}
