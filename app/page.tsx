import Link from "next/link";
import { analyzePortfolio } from "@/lib/margin";
import { demoAgreements } from "@/lib/demo-data";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Home() {
  const report = analyzePortfolio(demoAgreements, 0.4);
  return <main className="shell">
    <header><div><span className="eyebrow">RENEWMARGIN</span><h1>Know which service agreements are quietly losing money.</h1><p>Turn actual labor and material costs into profitable renewal prices—before the next renewal.</p></div><Link className="button" href="/import">Import agreements</Link></header>
    <section className="metrics">
      <article><span>Potential annual margin recovery</span><strong>{money.format(report.potentialUpside)}</strong></article>
      <article><span>Agreements needing repricing</span><strong>{report.needsRepricing}</strong></article>
      <article><span>Current annual revenue</span><strong>{money.format(report.currentRevenue)}</strong></article>
      <article><span>Actual service cost</span><strong>{money.format(report.actualCost)}</strong></article>
    </section>
    <section className="panel"><div className="panelHead"><div><h2>Agreement margin scan</h2><p>Target gross margin: 40%</p></div><span>{report.agreements.length} agreements analyzed</span></div>
      <div className="table"><div className="row heading"><span>Customer</span><span>Current</span><span>Actual cost</span><span>Margin</span><span>Suggested</span><span>Action</span></div>
      {report.agreements.map(a => <div className="row" key={a.id}><span><b>{a.customer}</b><small>{a.id}</small></span><span>{money.format(a.annualPrice)}</span><span>{money.format(a.actualCost)}</span><span className={a.status}>{(a.grossMargin*100).toFixed(1)}%</span><span><b>{money.format(a.recommendedPrice)}</b></span><span className={`pill ${a.status}`}>{a.status === "reprice" ? "Reprice" : a.status === "watch" ? "Review" : "Healthy"}</span></div>)}</div>
    </section>
    <section className="callout"><div><span className="eyebrow">FREE MARGIN LEAK SCAN</span><h2>Upload your agreement export. See the dollars before you buy anything.</h2></div><Link className="button" href="/import">Run a free scan</Link></section>
  </main>;
}
