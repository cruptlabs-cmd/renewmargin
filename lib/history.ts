import { numberValue, type CsvRow } from './csv';
import { analyzeAgreement } from './margin';

export type HistoryAnalysis = {
  id: string;
  customer: string;
  renewalDate: string;
  annualPrice: number;
  visitCount: number;
  laborHours: number;
  materialCost: number;
  overheadCost: number;
  actualCost: number;
  grossMargin: number;
  recommendedPrice: number;
  annualUpside: number;
  confidence: 'high' | 'medium' | 'low';
  matchedBy: 'agreement_id' | 'customer' | 'none';
};

function value(row: CsvRow, aliases: string[]) {
  const key = Object.keys(row).find(k => aliases.includes(k.trim().toLowerCase()));
  return key ? row[key].trim() : '';
}

function normalizedCustomer(row: CsvRow) {
  return value(row, ['customer', 'customer_name', 'name']).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function dateValue(row: CsvRow) {
  return value(row, ['date', 'service_date', 'completed_date', 'completed_at']);
}

function inTrailingYear(raw: string, now: Date) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  return d >= cutoff && d <= now;
}

export function analyzeAgreementHistory(
  agreements: CsvRow[],
  visits: CsvRow[],
  loadedHourlyCost: number,
  targetMarginPercent: number,
  now = new Date(),
): HistoryAnalysis[] {
  if (!(loadedHourlyCost >= 0)) throw new Error('loadedHourlyCost must be non-negative');
  if (!(targetMarginPercent > 0 && targetMarginPercent < 100)) throw new Error('target margin must be between 0 and 100');

  return agreements.map((agreement, index) => {
    const agreementId = value(agreement, ['agreement_id', 'agreementid', 'plan_id', 'membership_id']);
    const customer = value(agreement, ['customer', 'customer_name', 'name']) || `Agreement ${index + 1}`;
    const annualPrice = numberValue(value(agreement, ['current_price', 'annual_price', 'price', 'agreement_price']));
    const customerKey = normalizedCustomer(agreement);

    const idMatches = agreementId ? visits.filter(v => value(v, ['agreement_id', 'agreementid', 'plan_id', 'membership_id']) === agreementId) : [];
    const customerMatches = !idMatches.length && customerKey ? visits.filter(v => normalizedCustomer(v) === customerKey) : [];
    const matchedBy: HistoryAnalysis['matchedBy'] = idMatches.length ? 'agreement_id' : customerMatches.length ? 'customer' : 'none';
    const matched = (idMatches.length ? idMatches : customerMatches).filter(v => inTrailingYear(dateValue(v), now));

    const laborHours = matched.reduce((sum, v) => sum + numberValue(value(v, ['labor_hours', 'hours', 'service_hours'])), 0);
    const materialCost = matched.reduce((sum, v) => sum + numberValue(value(v, ['material_cost', 'materials', 'parts_cost'])), 0);
    const overheadCost = matched.reduce((sum, v) => sum + numberValue(value(v, ['visit_overhead', 'overhead', 'travel_cost'])), 0);
    const margin = analyzeAgreement({ id: agreementId || String(index), customer, annualPrice, laborHours, laborRate: loadedHourlyCost, materialCost, otherCost: overheadCost }, targetMarginPercent / 100);

    const confidence: HistoryAnalysis['confidence'] = matchedBy === 'agreement_id' && matched.length >= 2 ? 'high' : matched.length >= 2 ? 'medium' : 'low';
    return {
      id: agreementId || String(index), customer,
      renewalDate: value(agreement, ['renewal_date', 'expires', 'expiration_date']),
      annualPrice, visitCount: matched.length, laborHours, materialCost, overheadCost,
      actualCost: margin.actualCost, grossMargin: margin.grossMargin * 100,
      recommendedPrice: margin.recommendedPrice, annualUpside: margin.annualUpside,
      confidence, matchedBy,
    };
  });
}
