'use client';

import { Entity, Relationship, EDGE_TYPES, EdgeType } from '@/types/deal';

interface RelationshipTableProps {
  relationships: Relationship[];
  entities: Entity[];
  onChange: (relationships: Relationship[]) => void;
  onReparse: () => void;
  loading: string | null;
}

export default function RelationshipTable({
  relationships,
  entities,
  onChange,
  onReparse,
  loading,
}: RelationshipTableProps) {
  const updateRel = (index: number, field: string, value: unknown) => {
    const updated = [...relationships];
    if (field === 'paramValue') {
      const rel = updated[index];
      const paramVal = value as string;
      if (rel.type === 'owns' || rel.type === 'lp_in') {
        updated[index] = { ...rel, params: { ...rel.params, pct: parseFloat(paramVal) || 0 } };
      } else if (rel.type === 'guarantees') {
        updated[index] = { ...rel, params: { ...rel.params, scope: paramVal } };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const addRelationship = () => {
    const id = `rel-${Date.now()}`;
    onChange([
      ...relationships,
      { id, from: entities[0]?.id || '', to: entities[0]?.id || '', type: 'owns', params: { pct: 100 } },
    ]);
  };

  const removeRelationship = (index: number) => {
    onChange(relationships.filter((_, i) => i !== index));
  };

  const getParamLabel = (type: EdgeType) => {
    if (type === 'owns' || type === 'lp_in') return '%';
    if (type === 'guarantees') return 'scope';
    return '';
  };

  const getParamValue = (rel: Relationship) => {
    if (rel.type === 'owns' || rel.type === 'lp_in') return rel.params.pct?.toString() || '';
    if (rel.type === 'guarantees') return rel.params.scope || '';
    return '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Relationships</h2>
        <button
          onClick={onReparse}
          disabled={!!loading}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Re-parse below
        </button>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2" style={{ width: '25%' }}>From</th>
              <th className="px-3 py-2" style={{ width: '25%' }}>To</th>
              <th className="px-3 py-2" style={{ width: '15%' }}>Type</th>
              <th className="px-3 py-2" style={{ width: '25%' }}>Param</th>
              <th className="px-3 py-2" style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relationships.map((rel, i) => (
              <tr key={rel.id} className="h-10">
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={rel.from}
                    onChange={e => updateRel(i, 'from', e.target.value)}
                  >
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name || e.id}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={rel.to}
                    onChange={e => updateRel(i, 'to', e.target.value)}
                  >
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name || e.id}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={rel.type}
                    onChange={e => updateRel(i, 'type', e.target.value as EdgeType)}
                  >
                    {EDGE_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  {getParamLabel(rel.type) && (
                    <div className="flex items-center gap-1">
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                        type={rel.type === 'owns' || rel.type === 'lp_in' ? 'number' : 'text'}
                        placeholder={getParamLabel(rel.type)}
                        value={getParamValue(rel)}
                        onChange={e => updateRel(i, 'paramValue', e.target.value)}
                      />
                      <span className="text-[11px] text-slate-400">{getParamLabel(rel.type)}</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-1 text-center">
                  <button
                    onClick={() => removeRelationship(i)}
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
        onClick={addRelationship}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add Row
      </button>
    </div>
  );
}
