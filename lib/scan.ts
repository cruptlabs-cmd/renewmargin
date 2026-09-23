import { analyzeAgreement } from './margin';
import { numberValue, type CsvRow } from './csv';

const aliases: Record<string, string[]> = {
  customer: ['customer', 'customer_name', 'name'],
  current_price: ['current_price', 'annual_price', 'price', 'agreement_price'],
  labor_hours: ['labor_hours', 'hours', 'service_hours'],
  loaded_hourly_cost: ['loaded_hourly_cost', 'hourly_cost', 'labor_rate'],
  material_cost: ['material_cost', 'materials', 'parts_cost'],
  visit_overhead: ['visit_overhead', 'overhead', 'travel_cost'],
  renewal_date: ['renewal_date', 'expires', 'expiration_date'],
};

function find(row: CsvRow, field: string) {
  const actual = Object.keys(row).find((key) => aliases[field].includes(key.trim().toLowerCase()));
  return actual ? row[actual].trim() : '';
}

function hasNumber(value: string) {
  if (!value) return false;
  const raw = value.trim();
  const normalized = raw.replace(/[()$,% ,]/g, '');
  if (!normalized) return false;
  return Number.isFinite(Number(normalized));
}

export type ScanResult = {
  id: number;
  customer: string;
  current: number;
  cost: number;
  margin: number;
  recommended: number;
  upside: number;
  renewal: string;
  valid: boolean;
  missing: string[];
};

export function analyzeCsvRow(row: CsvRow, index: number, targetMarginPercent: number): ScanResult {
  const currentRaw = find(row, 'current_price');
  const hoursRaw = find(row, 'labor_hours');
  const rateRaw = find(row, 'loaded_hourly_cost');
  const missing = [
    !find(row, 'customer') ? 'customer' : '',
    !hasNumber(currentRaw) ? 'current price' : '',
    !hasNumber(hoursRaw) ? 'labor hours' : '',
    !hasNumber(rateRaw) ? 'loaded hourly cost' : '',
  ].filter(Boolean);

  const current = numberValue(currentRaw);
  const laborHours = numberValue(hoursRaw);
  const hourlyCost = numberValue(rateRaw);
  const materialCost = numberValue(find(row, 'material_cost'));
  const overhead = numberValue(find(row, 'visit_overhead'));
  const valid = missing.length === 0 && current > 0 && laborHours >= 0 && hourlyCost >= 0 && materialCost >= 0 && overhead >= 0;

  if (!valid) {
    return {
      id: index,
      customer: find(row, 'customer') || `Agreement ${index + 1}`,
      current,
      cost: 0,
      margin: 0,
      recommended: 0,
      upside: 0,
      renewal: find(row, 'renewal_date'),
      valid: false,
      missing,
    };
  }

  const result = analyzeAgreement({
    id: String(index),
    customer: find(row, 'customer'),
    annualPrice: current,
    laborHours,
    laborRate: hourlyCost,
    materialCost,
    otherCost: overhead,
  }, targetMarginPercent / 100);

  return {
    id: index,
    customer: result.customer,
    current: result.annualPrice,
    cost: result.actualCost,
    margin: result.grossMargin * 100,
    recommended: result.recommendedPrice,
    upside: result.annualUpside,
    renewal: find(row, 'renewal_date'),
    valid: true,
    missing: [],
  };
}

export function analyzeCsvRows(rows: CsvRow[], targetMarginPercent: number) {
  return rows.map((row, index) => analyzeCsvRow(row, index, targetMarginPercent));
}
