import React from 'react';

const TAGS = [
  { label: 'Precisa do CNPJ', value: 'precisa_cnpj', color: '#f59e42' },
  { label: 'Com dívida', value: 'com_divida', color: '#ef4444' },
  { label: 'Com limite', value: 'com_limite', color: '#22c55e' },
  { label: 'CNPJ', value: 'cnpj', color: '#2563eb' },
  { label: 'PF', value: 'pf', color: '#a21caf' },
  { label: 'Fibra', value: 'fibra', color: '#06b6d4' },
  { label: 'Sem viabilidade', value: 'sem_viabilidade', color: '#64748b' },
  { label: 'Com via', value: 'com_via', color: '#eab308' },
];

export default function TagSelector({ value = [], onChange }) {
  function toggleTag(tag) {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map(tag => {
          const t = TAGS.find(t => t.value === tag);
          return t ? (
            <span key={tag} style={{ background: t.color, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{t.label}</span>
          ) : null;
        })}
      </div>
      <div className="border rounded px-2 py-1 bg-white shadow">
        {TAGS.map(tag => (
          <label key={tag.value} className="flex items-center gap-2 cursor-pointer mb-1">
            <input
              type="checkbox"
              checked={value.includes(tag.value)}
              onChange={() => toggleTag(tag.value)}
            />
            <span style={{ color: tag.color, fontWeight: 600 }}>{tag.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
} 