'use client';

import { Entity, ConsiderationFlow, FLOW_TYPES, FLOW_TIMINGS, FlowType, FlowTiming } from '@/types/deal';

interface ConsiderationTableProps {
  flows: ConsiderationFlow[];
  entities: Entity[];
  onChange: (flows: ConsiderationFlow[]) => void;
}

export default function ConsiderationTable({ flows, entities, onChange }: ConsiderationTableProps) {
  const updateFlow = (index: number, field: string, value: unknown) => {
    const updated = [...flows];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addFlow = () => {
    const id = `flow-${Date.now()}`;
    onChange([
      ...flows,
      {
        id,
        from: entities[0]?.id || '',
        to: entities[0]?.id || '',
        type: 'cash',
        amount: 0,
        timing: 'closing',
        conditions: null,
      },
    ]);
  };

  const removeFlow = (index: number) => {
    onChange(flows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Consideration Flows</h2>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2" style={{ width: '18%' }}>From</th>
              <th className="px-3 py-2" style={{ width: '18%' }}>To</th>
              <th className="px-3 py-2" style={{ width: '12%' }}>Type</th>
              <th className="px-3 py-2" style={{ width: '12%' }}>Amount ($M)</th>
              <th className="px-3 py-2" style={{ width: '12%' }}>Timing</th>
              <th className="px-3 py-2" style={{ width: '23%' }}>Conditions</th>
              <th className="px-3 py-2" style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {flows.map((flow, i) => (
              <tr key={flow.id} className="h-10">
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={flow.from}
                    onChange={e => updateFlow(i, 'from', e.target.value)}
                  >
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name || e.id}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={flow.to}
                    onChange={e => updateFlow(i, 'to', e.target.value)}
                  >
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name || e.id}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={flow.type}
                    onChange={e => updateFlow(i, 'type', e.target.value as FlowType)}
                  >
                    {FLOW_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={flow.amount}
                    onChange={e => updateFlow(i, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={flow.timing}
                    onChange={e => updateFlow(i, 'timing', e.target.value as FlowTiming)}
                  >
                    {FLOW_TIMINGS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={flow.conditions || ''}
                    placeholder="conditions..."
                    onChange={e => updateFlow(i, 'conditions', e.target.value || null)}
                  />
                </td>
                <td className="px-3 py-1 text-center">
                  <button
                    onClick={() => removeFlow(i)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addFlow}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add Row
      </button>
    </div>
  );
}
