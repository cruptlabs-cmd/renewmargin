'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { parseCsv, type CsvRow } from '../../lib/csv';
import { analyzeCsvRows } from '../../lib/scan';

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function ImportPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [targetMargin, setTargetMargin] = useState(40);
  const [error, setError] = useState('');

  const analysis = useMemo(() => analyzeCsvRows(rows, targetMargin), [rows, targetMargin]);
  const sorted = useMemo(() => [...analysis].sort((a,b) => {
    if (a.valid !== b.valid) return a.valid ? -1 : 1;
    return a.margin - b.margin;
  }), [analysis]);
  const validRows = useMemo(() => analysis.filter(a => a.valid), [analysis]);
  const summary = useMemo(() => ({
    atRisk: validRows.filter(a => a.margin < targetMargin).length,
    incomplete: analysis.length - validRows.length,
    currentRevenue: validRows.reduce((sum,a) => sum + a.current, 0),
    serviceCost: validRows.reduce((sum,a) => sum + a.cost, 0),
    potentialUpside: validRows.filter(a => a.margin < targetMargin).reduce((sum,a) => sum + a.upside, 0)
  }), [analysis, validRows, targetMargin]);

  async function load(file?: File) {
    if (!file) return;
    setError('');
    const parsed = parseCsv(await file.text());
    if (!parsed.length) {
      setRows([]);
      setError('No usable rows found. Check that the file is a CSV with a header row.');
      return;
    }
    setFileName(file.name);
    setRows(parsed);
  }

  function downloadResults() {
    const header = ['customer','current_price','actual_service_cost','current_margin_percent','recommended_renewal_price','potential_annual_recovery','renewal_date','status'];
    const lines = sorted.map(a => [
      a.customer,
      a.current.toFixed(2),
      a.valid ? a.cost.toFixed(2) : '',
      a.valid ? a.margin.toFixed(2) : '',
      a.valid ? a.recommended.toFixed(2) : '',
      a.valid ? a.upside.toFixed(2) : '',
      a.renewal,
      a.valid ? 'ready' : `missing: ${a.missing.join('; ')}`
    ].map(csvEscape).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'renewmargin-results.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    const sample = 'customer,current_price,labor_hours,loaded_hourly_cost,material_cost,visit_overhead,renewal_date\nJohnson Residence,219,2.8,52,31,20,2026-10-15\nGarcia Residence,349,2.1,52,18,20,2026-11-01';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'renewmargin-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return <main className="shell">
    <nav className="topNav"><Link href="/">← Dashboard</Link><span>RenewMargin</span></nav>
    <div className="eyebrow">MARGIN LEAK SCAN</div>
    <h1>Import agreements</h1>
    <p className="sub">Upload a CSV and RenewMargin will calculate agreement-level service cost, current margin and a suggested renewal price.</p>

    <section className="panel importPanel">
      <label className="drop">
        <strong>{fileName || 'Choose agreement CSV'}</strong>
        <span>{rows.length ? `${rows.length} agreements loaded` : 'Required: customer, current price, labor hours and loaded hourly cost'}</span>
        <input type="file" accept=".csv,text/csv" onChange={e => load(e.target.files?.[0])} />
      </label>
      <div className="importControls">
        <label className="marginInput">Target gross margin <span><input type="number" min="1" max="90" value={targetMargin} onChange={e => setTargetMargin(Math.min(90, Math.max(1, Number(e.target.value))))} />%</span></label>
        <button className="secondary" type="button" onClick={downloadTemplate}>Download template</button>
      </div>
      {error && <p className="errorText">{error}</p>}
    </section>

    {analysis.length > 0 && <>
      <section className="metrics scanMetrics">
        <article><span>Potential annual margin recovery</span><strong>${summary.potentialUpside.toFixed(0)}</strong></article>
        <article><span>Agreements below target</span><strong>{summary.atRisk}</strong></article>
        <article><span>Current annual revenue</span><strong>${summary.currentRevenue.toFixed(0)}</strong></article>
        <article><span>Rows needing data</span><strong>{summary.incomplete}</strong></article>
      </section>
      <section className="panel">
        <div className="panelHead"><div><h2>Results</h2><p>Only complete rows are included in totals and repricing recommendations.</p></div><button type="button" onClick={downloadResults}>Export repricing CSV</button></div>
        <div className="table importTable">
          <div className="tableHead"><strong>Agreement</strong><strong>Current</strong><strong>Cost</strong><strong>Margin</strong><strong>Suggested renewal</strong></div>
          {sorted.map(item => <div className="tableRow" key={item.id}>
            <div><strong>{item.customer}</strong><small>{item.valid ? (item.renewal || 'Renewal date unavailable') : `Missing: ${item.missing.join(', ')}`}</small></div>
            <span>{item.current > 0 ? `$${item.current.toFixed(0)}` : '—'}</span><span>{item.valid ? `$${item.cost.toFixed(0)}` : '—'}</span>
            <span className={item.valid && item.margin < targetMargin ? 'bad' : item.valid ? 'good' : ''}>{item.valid ? `${item.margin.toFixed(1)}%` : 'Needs data'}</span>
            <strong>{item.valid ? `$${item.recommended.toFixed(0)}` : '—'}</strong>
          </div>)}
        </div>
      </section>
    </>}
  </main>;
}
