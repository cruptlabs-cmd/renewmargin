'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { deleteSavedScan, listSavedScans, type SavedHistoryScan } from '../../lib/saved-scans';

export default function SavedScansPage() {
  const [scans, setScans] = useState<SavedHistoryScan[]>([]);
  useEffect(() => setScans(listSavedScans()), []);

  const totals = useMemo(() => scans.map(scan => ({
    id: scan.id,
    atRisk: scan.results.filter(r => r.visitCount > 0 && r.grossMargin < scan.targetMargin).length,
    upside: scan.results.reduce((sum, r) => sum + (r.visitCount > 0 ? r.annualUpside : 0), 0),
  })), [scans]);

  function remove(id: string) {
    deleteSavedScan(id);
    setScans(listSavedScans());
  }

  return <main className="shell">
    <nav className="topNav"><Link href="/history">← Service history</Link><span>RenewMargin</span></nav>
    <div className="eyebrow">SAVED SCANS</div>
    <h1>Keep a record of each pricing review.</h1>
    <p className="sub">Saved scans stay in this browser for now. Cloud accounts and team access are the next persistence step.</p>

    {!scans.length && <section className="panel" style={{padding:24}}><h2>No saved scans yet.</h2><p>Run a service-history analysis and choose Save scan.</p></section>}

    {scans.map(scan => {
      const total = totals.find(t => t.id === scan.id)!;
      return <section className="panel" key={scan.id} style={{marginBottom:18}}>
        <div className="panelHead"><div><h2>{scan.name}</h2><p>{new Date(scan.createdAt).toLocaleString()} · {scan.agreementFile || 'Agreement CSV'} + {scan.visitFile || 'Service history CSV'}</p></div><button onClick={() => remove(scan.id)}>Delete</button></div>
        <section className="metrics scanMetrics" style={{padding:18, marginBottom:0}}>
          <article><span>Agreements</span><strong>{scan.results.length}</strong></article>
          <article><span>Below target</span><strong>{total.atRisk}</strong></article>
          <article><span>Potential annual recovery</span><strong>${total.upside.toFixed(0)}</strong></article>
          <article><span>Target margin</span><strong>{scan.targetMargin}%</strong></article>
        </section>
        <div className="table importTable">
          <div className="tableHead"><strong>Agreement</strong><strong>Visits</strong><strong>Actual cost</strong><strong>Margin</strong><strong>Suggested renewal</strong></div>
          {scan.results.map(r => <div className="tableRow" key={`${scan.id}-${r.id}`}>
            <div><strong>{r.customer}</strong><small>{r.confidence} confidence · {r.matchedBy.replace('_', ' ')}</small></div>
            <span>{r.visitCount}</span><span>{r.visitCount ? `$${r.actualCost.toFixed(0)}` : '—'}</span>
            <span className={r.visitCount && r.grossMargin < scan.targetMargin ? 'bad' : r.visitCount ? 'good' : ''}>{r.visitCount ? `${r.grossMargin.toFixed(1)}%` : 'Needs review'}</span>
            <strong>{r.visitCount ? `$${r.recommendedPrice.toFixed(0)}` : '—'}</strong>
          </div>)}
        </div>
      </section>;
    })}
  </main>;
}
