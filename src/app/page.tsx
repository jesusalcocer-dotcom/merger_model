'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DealState, Entity, Relationship, Structure, ConsiderationFlow } from '@/types/deal';
import { MOCK_DEAL } from '@/lib/mock-data';
import { detectFlags, Flag } from '@/lib/flags';

import TextInput from '@/components/TextInput';
import EntityTable from '@/components/EntityTable';
import RelationshipTable from '@/components/RelationshipTable';
import StructurePanel from '@/components/StructurePanel';
import ConsiderationTable from '@/components/ConsiderationTable';
import FlagsPanel from '@/components/FlagsPanel';
import ExportButtons from '@/components/ExportButtons';

const DealDiagram = dynamic(() => import('@/components/DealDiagram'), { ssr: false });

const DEFAULT_STRUCTURE: Structure = {
  transferObject: 'equity',
  mechanism: 'direct_purchase',
  preReorgRequired: false,
};

type AIModel = 'gpt-5.4' | 'claude-sonnet-4-6' | 'claude-opus-4-6';

const MODEL_OPTIONS: { value: AIModel; label: string }[] = [
  { value: 'gpt-5.4', label: 'GPT-5.4' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { value: 'claude-opus-4-6', label: 'Opus 4.6' },
];

export default function Home() {
  const [rawText, setRawText] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [structure, setStructure] = useState<Structure>(DEFAULT_STRUCTURE);
  const [considerationFlows, setConsiderationFlows] = useState<ConsiderationFlow[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [model, setModel] = useState<AIModel>('gpt-5.4');

  const dealState: DealState = {
    rawText,
    entities,
    relationships,
    structure,
    considerationFlows,
  };

  const flags: Flag[] = showDiagram ? detectFlags(dealState) : [];

  const getResError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return data.error || fallback;
    } catch {
      return `${fallback} (${res.status})`;
    }
  };

  // Parse from a specific step onward
  const parseFrom = useCallback(async (step: 'entities' | 'relationships' | 'structure' | 'consideration') => {
    setError(null);
    try {
      let currentEntities = entities;
      let currentRelationships = relationships;
      let currentStructure = structure;

      if (step === 'entities' || !parsed) {
        setLoading('entities');
        const res = await fetch('/api/parse/entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText, model }),
        });
        if (!res.ok) throw new Error(await getResError(res, 'Failed to parse entities'));
        currentEntities = await res.json();
        setEntities(currentEntities);
      }

      if (step === 'entities' || step === 'relationships' || !parsed) {
        setLoading('relationships');
        const res = await fetch('/api/parse/relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText, entities: currentEntities, model }),
        });
        if (!res.ok) throw new Error(await getResError(res, 'Failed to parse relationships'));
        currentRelationships = await res.json();
        setRelationships(currentRelationships);
      }

      if (step === 'entities' || step === 'relationships' || step === 'structure' || !parsed) {
        setLoading('structure');
        const res = await fetch('/api/parse/structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText, entities: currentEntities, relationships: currentRelationships, model }),
        });
        if (!res.ok) throw new Error(await getResError(res, 'Failed to parse structure'));
        currentStructure = await res.json();
        setStructure(currentStructure);
      }

      {
        setLoading('consideration');
        const res = await fetch('/api/parse/consideration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText,
            entities: currentEntities,
            relationships: currentRelationships,
            structure: currentStructure,
            model,
          }),
        });
        if (!res.ok) throw new Error(await getResError(res, 'Failed to parse consideration'));
        const flows = await res.json();
        setConsiderationFlows(flows);
      }

      setParsed(true);
      setLoading(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      setLoading(null);
    }
  }, [rawText, entities, relationships, structure, parsed, model]);

  const handleParse = () => parseFrom('entities');

  const handleGenerate = () => {
    setShowDiagram(true);
  };

  // Load mock data for testing
  const loadMock = () => {
    setRawText(MOCK_DEAL.rawText);
    setEntities(MOCK_DEAL.entities);
    setRelationships(MOCK_DEAL.relationships);
    setStructure(MOCK_DEAL.structure);
    setConsiderationFlows(MOCK_DEAL.considerationFlows);
    setParsed(true);
    setShowDiagram(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-4 space-y-8">
      <div className="flex justify-end">
        <select
          value={model}
          onChange={e => setModel(e.target.value as AIModel)}
          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-blue-400 focus:outline-none"
        >
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <TextInput
        rawText={rawText}
        onRawTextChange={setRawText}
        onParse={handleParse}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {!parsed && !loading && (
        <button
          onClick={loadMock}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Load mock data (Summit deal)
        </button>
      )}

      {parsed && (
        <>
          <EntityTable
            entities={entities}
            onChange={setEntities}
            onReparse={() => parseFrom('entities')}
            loading={loading}
          />

          <RelationshipTable
            relationships={relationships}
            entities={entities}
            onChange={setRelationships}
            onReparse={() => parseFrom('relationships')}
            loading={loading}
          />

          <StructurePanel
            structure={structure}
            onChange={setStructure}
            onReparse={() => parseFrom('structure')}
            loading={loading}
          />

          <ConsiderationTable
            flows={considerationFlows}
            entities={entities}
            onChange={setConsiderationFlows}
          />

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Generate Diagram
            </button>
          </div>
        </>
      )}

      {showDiagram && (
        <>
          <DealDiagram
            entities={entities}
            relationships={relationships}
            considerationFlows={considerationFlows}
          />

          <FlagsPanel flags={flags} />

          <ExportButtons deal={dealState} />
        </>
      )}
    </main>
  );
}
