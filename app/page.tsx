import Link from "next/link";
import { analyzePortfolio } from "@/lib/margin";
import { demoAgreements } from "@/lib/demo-data";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Home() {
  const report = analyzePortfolio(demoAgreements, 0.4);
  return <main className="shell">
    <header>
      <div>
        <span className="eyebrow">RENEWMARGIN · HVAC MARGIN LEAK SCAN</span>
        <h1>Find the maintenance agreements quietly losing you money.</h1>
        <p>Upload your agreement book and completed service history. RenewMargin calculates the real cost of each plan and shows what it should renew for before another year of underpriced visits.</p>
      </div>
      <Link className="button primaryCta" href="/history">Run a free Margin Leak Scan</Link>
    </header>

    <div className="demoNote">Example results from a 5-agreement sample portfolio</div>
    <section className="metrics">
      <article><span>Potential annual margin recovery</span><strong>{money.format(report.potentialUpside)}</strong></article>
      <article><span>Agreements needing repricing</span><strong>{report.needsRepricing}</strong></article>
      <article><span>Current annual revenue</span><strong>{money.format(report.currentRevenue)}</strong></article>
      <article><span>Actual service cost</span><strong>{money.format(report.actualCost)}</strong></article>
    </section>

    <section className="panel">
      <div className="panelHead">
        <div><h2>See the leak in dollars</h2><p>Example portfolio · target gross margin: 40%</p></div>
        <span>{report.agreements.length} agreements analyzed</span>
      </div>
      <div className="table">
        <div className="row heading"><span>Customer</span><span>Current</span><span>Actual cost</span><span>Margin</span><span>Suggested</span><span>Action</span></div>
        {report.agreements.map(a => <div className="row" key={a.id}><span><b>{a.customer}</b><small>{a.id}</small></span><span>{money.format(a.annualPrice)}</span><span>{money.format(a.actualCost)}</span><span className={a.status}>{(a.grossMargin*100).toFixed(1)}%</span><span><b>{money.format(a.recommendedPrice)}</b></span><span className={`pill ${a.status}`}>{a.status === "reprice" ? "Reprice" : a.status === "watch" ? "Review" : "Healthy"}</span></div>)}
      </div>
    </section>

    <section className="callout">
      <div>
        <span className="eyebrow">FROM EXPORT TO ANSWER</span>
        <h2>No system replacement. No spreadsheet archaeology.</h2>
        <p>Start with CSV exports from the software you already use. RenewMargin matches completed work to agreements, calculates deterministic margin, flags low-confidence matches, and recommends a renewal price you control.</p>
      </div>
      <Link className="button" href="/history">Analyze service history</Link>
    </section>

    <section className="callout">
      <div>
        <span className="eyebrow">FOUNDING CUSTOMER OFFER</span>
        <h2>$99/month for up to 250 active agreements.</h2>
        <p>Run the scan first. If RenewMargin cannot show you meaningful margin leakage, do not buy it. Founding customers keep the $99/month plan while the product expands.</p>
      </div>
      <Link className="button" href="/history">Start with the free scan</Link>
    </section>

    <section className="callout">
      <div>
        <span className="eyebrow">ALREADY HAVE COST TOTALS?</span>
        <h2>Use the one-file quick scan.</h2>
        <p>If your export already contains labor and material totals by agreement, skip service-history matching and go straight to repricing.</p>
      </div>
      <Link className="button" href="/import">Open quick scan</Link>
    </section>
  </main>;
}
