'use client';

import { Entity, ENTITY_TYPES, ENTITY_ROLES, EntityType, EntityRole } from '@/types/deal';

interface EntityTableProps {
  entities: Entity[];
  onChange: (entities: Entity[]) => void;
  onReparse: () => void;
  loading: string | null;
}

export default function EntityTable({ entities, onChange, onReparse, loading }: EntityTableProps) {
  const updateEntity = (index: number, field: keyof Entity, value: unknown) => {
    const updated = [...entities];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addEntity = () => {
    const id = `entity-${Date.now()}`;
    onChange([
      ...entities,
      { id, name: '', type: 'c_corp', jurisdiction: '', roles: [] },
    ]);
  };

  const removeEntity = (index: number) => {
    onChange(entities.filter((_, i) => i !== index));
  };

  const toggleRole = (index: number, role: EntityRole) => {
    const current = entities[index].roles ?? [];
    const updated = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    updateEntity(index, 'roles', updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Entities</h2>
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
              <th className="px-3 py-2" style={{ width: '30%' }}>Name</th>
              <th className="px-3 py-2" style={{ width: '20%' }}>Type</th>
              <th className="px-3 py-2" style={{ width: '20%' }}>Jurisdiction</th>
              <th className="px-3 py-2" style={{ width: '25%' }}>Role(s)</th>
              <th className="px-3 py-2" style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entities.map((entity, i) => (
              <tr key={entity.id} className="h-10">
                <td className="px-3 py-1">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={entity.name}
                    onChange={e => updateEntity(i, 'name', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1">
                  <select
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={entity.type}
                    onChange={e => updateEntity(i, 'type', e.target.value as EntityType)}
                  >
                    {ENTITY_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[13px] focus:border-blue-400 focus:outline-none"
                    value={entity.jurisdiction}
                    onChange={e => updateEntity(i, 'jurisdiction', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1">
                  <div className="flex flex-wrap gap-1">
                    {ENTITY_ROLES.map(role => (
                      <button
                        key={role}
                        onClick={() => toggleRole(i, role)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                          (entity.roles ?? []).includes(role)
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-1 text-center">
                  <button
                    onClick={() => removeEntity(i)}
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
        onClick={addEntity}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add Row
      </button>
    </div>
  );
}
