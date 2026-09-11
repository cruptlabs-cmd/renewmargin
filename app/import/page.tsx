'use client';

import { useMemo, useState } from 'react';
import { numberValue, parseCsv, type CsvRow } from '../../lib/csv';

const aliases: Record<string, string[]> = {
  customer: ['customer','customer_name','name'],
  current_price: ['current_price','annual_price','price','agreement_price'],
  labor_hours: ['labor_hours','hours','service_hours'],
  loaded_hourly_cost: ['loaded_hourly_cost','hourly_cost','labor_rate'],
  material_cost: ['material_cost','materials','parts_cost'],
  visit_overhead: ['visit_overhead','overhead','travel_cost'],
  renewal_date: ['renewal_date','expires','expiration_date']
};

function find(row: CsvRow, field: string) {
  const key = aliases[field].find(a => Object.keys(row).some(k => k.toLowerCase() === a));
  if (!key) return '';
  const actual = Object.keys(row).find(k => k.toLowerCase() === key);
  return actual ? row[actual] : '';
}

export default function ImportPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [targetMargin, setTargetMargin] = useState(40);

  const analysis = useMemo(() => rows.map((row, index) => {
    const current = numberValue(find(row, 'current_price'));
    const labor = numberValue(find(row, 'labor_hours')) * numberValue(find(row, 'loaded_hourly_cost'));
    const cost = labor + numberValue(find(row, 'material_cost')) + numberValue(find(row, 'visit_overhead'));
    const margin = current > 0 ? ((current - cost) / current) * 100 : 0;
    const recommended = targetMargin < 100 ? cost / (1 - targetMargin / 100) : cost;
    return { id: index, customer: find(row, 'customer') || `Agreement ${index + 1}`, current, cost, margin, recommended, renewal: find(row, 'renewal_date') };
  }), [rows, targetMargin]);

  async function load(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setRows(parseCsv(await file.text()));
  }

  return <main className="shell">
    <div className="eyebrow">MARGIN LEAK SCAN</div>
    <h1>Import agreements</h1>
    <p className="sub">Upload a CSV and RenewMargin will calculate agreement-level service cost, current margin and a suggested renewal price.</p>
    <section className="panel importPanel">
      <label className="drop">
        <strong>{fileName || 'Choose agreement CSV'}</strong>
        <span>{rows.length ? `${rows.length} agreements loaded` : 'CSV only · nothing is uploaded to a third party in this MVP'}</span>
        <input type="file" accept=".csv,text/csv" onChange={e => load(e.target.files?.[0])} />
      </label>
      <label className="marginInput">Target gross margin <input type="number" min="1" max="90" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} />%</label>
    </section>
    {analysis.length > 0 && <section className="panel">
      <div className="tableHead"><strong>Agreement</strong><strong>Current</strong><strong>Cost</strong><strong>Margin</strong><strong>Suggested renewal</strong></div>
      {analysis.sort((a,b) => a.margin-b.margin).map(item => <div className="tableRow" key={item.id}>
        <div><strong>{item.customer}</strong><small>{item.renewal || 'Renewal date unavailable'}</small></div>
        <span>${item.current.toFixed(0)}</span><span>${item.cost.toFixed(0)}</span>
        <span className={item.margin < targetMargin ? 'bad' : 'good'}>{item.margin.toFixed(1)}%</span>
        <strong>${item.recommended.toFixed(0)}</strong>
      </div>)}
    </section>}
  </main>;
}
