'use client';

import { Structure, MECHANISMS, Mechanism, TransferObject } from '@/types/deal';

interface StructurePanelProps {
  structure: Structure;
  onChange: (structure: Structure) => void;
  onReparse: () => void;
  loading: string | null;
}

export default function StructurePanel({ structure, onChange, onReparse, loading }: StructurePanelProps) {
  const setTransferObject = (to: TransferObject) => {
    const updated: Structure = { ...structure, transferObject: to };
    if (to === 'assets') {
      updated.mechanism = 'direct_purchase';
      if (!updated.assetSelection) {
        updated.assetSelection = {
          includedAssets: [],
          assumedLiabilities: [],
          excludedAssets: [],
          excludedLiabilities: [],
        };
      }
    } else {
      delete updated.assetSelection;
    }
    onChange(updated);
  };

  const setMechanism = (m: Mechanism) => {
    onChange({ ...structure, mechanism: m });
  };

  const setPreReorg = (val: boolean) => {
    onChange({
      ...structure,
      preReorgRequired: val,
      preReorgDescription: val ? structure.preReorgDescription || '' : undefined,
    });
  };

  const updateAssetList = (field: keyof NonNullable<Structure['assetSelection']>, value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    onChange({
      ...structure,
      assetSelection: {
        ...structure.assetSelection!,
        [field]: items,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Structure</h2>
        <button
          onClick={onReparse}
          disabled={!!loading}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Re-parse below
        </button>
      </div>
      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        {/* Transfer Object */}
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-slate-600 w-40">Transfer object:</span>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="transferObject"
              checked={structure.transferObject === 'equity'}
              onChange={() => setTransferObject('equity')}
              className="accent-blue-600"
            />
            Equity
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="transferObject"
              checked={structure.transferObject === 'assets'}
              onChange={() => setTransferObject('assets')}
              className="accent-blue-600"
            />
            Assets
          </label>
        </div>

        {/* Asset Selection sub-form */}
        {structure.transferObject === 'assets' && (
          <div className="ml-40 space-y-2 rounded bg-slate-50 p-3 text-sm">
            {(['includedAssets', 'assumedLiabilities', 'excludedAssets', 'excludedLiabilities'] as const).map(field => (
              <div key={field} className="flex items-center gap-2">
                <label className="w-40 text-xs text-slate-500">{field.replace(/([A-Z])/g, ' $1').trim()}:</label>
                <input
                  className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                  placeholder="comma-separated items"
                  value={structure.assetSelection?.[field]?.join(', ') || ''}
                  onChange={e => updateAssetList(field, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Mechanism */}
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-slate-600 w-40">Mechanism:</span>
          <select
            className="rounded border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            value={structure.mechanism}
            onChange={e => setMechanism(e.target.value as Mechanism)}
            disabled={structure.transferObject === 'assets'}
          >
            {MECHANISMS.map(m => (
              <option
                key={m}
                value={m}
                disabled={structure.transferObject === 'assets' && m !== 'direct_purchase'}
              >
                {m.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Pre-reorg */}
        <div className="flex items-start gap-6">
          <span className="text-sm font-medium text-slate-600 w-40 pt-0.5">Pre-reorg required:</span>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="preReorg"
                  checked={structure.preReorgRequired}
                  onChange={() => setPreReorg(true)}
                  className="accent-blue-600"
                />
                Yes
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="preReorg"
                  checked={!structure.preReorgRequired}
                  onChange={() => setPreReorg(false)}
                  className="accent-blue-600"
                />
                No
              </label>
            </div>
            {structure.preReorgRequired && (
              <input
                className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="Describe the required pre-reorganization..."
                value={structure.preReorgDescription || ''}
                onChange={e => onChange({ ...structure, preReorgDescription: e.target.value })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
