'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { parseCsv, type CsvRow } from '../../lib/csv';
import { analyzeAgreementHistory } from '../../lib/history';

export default function HistoryPage() {
  const [agreements, setAgreements] = useState<CsvRow[]>([]);
  const [visits, setVisits] = useState<CsvRow[]>([]);
  const [agreementFile, setAgreementFile] = useState('');
  const [visitFile, setVisitFile] = useState('');
  const [hourlyCost, setHourlyCost] = useState(52);
  const [targetMargin, setTargetMargin] = useState(40);

  const results = useMemo(() => {
    if (!agreements.length || !visits.length) return [];
    return analyzeAgreementHistory(agreements, visits, hourlyCost, targetMargin)
      .sort((a, b) => a.grossMargin - b.grossMargin);
  }, [agreements, visits, hourlyCost, targetMargin]);

  async function load(file: File | undefined, setter: (rows: CsvRow[]) => void, nameSetter: (name: string) => void) {
    if (!file) return;
    setter(parseCsv(await file.text()));
    nameSetter(file.name);
  }

  const valid = results.filter(r => r.annualPrice > 0 && r.visitCount > 0);
  const summary = {
    matched: valid.length,
    unmatched: results.filter(r => r.visitCount === 0).length,
    upside: valid.reduce((sum, r) => sum + r.annualUpside, 0),
    atRisk: valid.filter(r => r.grossMargin < targetMargin).length,
  };

  return <main className="shell">
    <nav className="topNav"><Link href="/">← Dashboard</Link><span>RenewMargin</span></nav>
    <div className="eyebrow">ACTUAL SERVICE HISTORY</div>
    <h1>Price renewals from completed work.</h1>
    <p className="sub">Import your agreement book and completed service visits separately. RenewMargin matches the last 12 months of work and calculates what each agreement should renew for.</p>

    <section className="panel importPanel">
      <label className="drop"><strong>{agreementFile || '1. Agreement book CSV'}</strong><span>Recommended: agreement_id, customer, current_price, renewal_date</span><input type="file" accept=".csv,text/csv" onChange={e => load(e.target.files?.[0], setAgreements, setAgreementFile)} /></label>
      <label className="drop"><strong>{visitFile || '2. Completed service visits CSV'}</strong><span>Recommended: agreement_id, customer, service_date, labor_hours, material_cost, visit_overhead</span><input type="file" accept=".csv,text/csv" onChange={e => load(e.target.files?.[0], setVisits, setVisitFile)} /></label>
      <div className="importControls">
        <label className="marginInput">Loaded technician cost <span>$<input type="number" min="0" value={hourlyCost} onChange={e => setHourlyCost(Math.max(0, Number(e.target.value)))} />/hr</span></label>
        <label className="marginInput">Target gross margin <span><input type="number" min="1" max="90" value={targetMargin} onChange={e => setTargetMargin(Math.min(90, Math.max(1, Number(e.target.value))))} />%</span></label>
      </div>
    </section>

    {results.length > 0 && <>
      <section className="metrics scanMetrics">
        <article><span>Matched agreements</span><strong>{summary.matched}</strong></article>
        <article><span>Below target</span><strong>{summary.atRisk}</strong></article>
        <article><span>Potential annual recovery</span><strong>${summary.upside.toFixed(0)}</strong></article>
        <article><span>Needs match review</span><strong>{summary.unmatched}</strong></article>
      </section>
      <section className="panel">
        <div className="panelHead"><div><h2>Trailing 12-month agreement profitability</h2><p>Agreement ID matches are preferred. Customer-name matches are used only when no ID match exists.</p></div></div>
        <div className="table importTable">
          <div className="tableHead"><strong>Agreement</strong><strong>Visits</strong><strong>Actual cost</strong><strong>Margin</strong><strong>Suggested renewal</strong></div>
          {results.map(r => <div className="tableRow" key={r.id}>
            <div><strong>{r.customer}</strong><small>{r.matchedBy === 'none' ? 'No service history matched' : `${r.matchedBy.replace('_', ' ')} match · ${r.confidence} confidence`}</small></div>
            <span>{r.visitCount}</span>
            <span>{r.visitCount ? `$${r.actualCost.toFixed(0)}` : '—'}</span>
            <span className={r.visitCount && r.grossMargin < targetMargin ? 'bad' : r.visitCount ? 'good' : ''}>{r.visitCount ? `${r.grossMargin.toFixed(1)}%` : 'Needs review'}</span>
            <strong>{r.visitCount ? `$${r.recommendedPrice.toFixed(0)}` : '—'}</strong>
          </div>)}
        </div>
      </section>
    </>}
  </main>;
}
