export type AgreementInput = {
  id: string;
  customer: string;
  annualPrice: number;
  laborHours: number;
  laborRate: number;
  materialCost: number;
  otherCost?: number;
};

export type MarginResult = AgreementInput & {
  actualCost: number;
  grossProfit: number;
  grossMargin: number;
  recommendedPrice: number;
  annualUpside: number;
  status: "healthy" | "watch" | "reprice";
};

export function analyzeAgreement(input: AgreementInput, targetMargin = 0.4): MarginResult {
  if (targetMargin <= 0 || targetMargin >= 1) throw new Error("targetMargin must be between 0 and 1");
  const actualCost = input.laborHours * input.laborRate + input.materialCost + (input.otherCost ?? 0);
  const grossProfit = input.annualPrice - actualCost;
  const grossMargin = input.annualPrice > 0 ? grossProfit / input.annualPrice : -1;
  const recommendedPrice = Math.ceil(actualCost / (1 - targetMargin));
  const annualUpside = Math.max(0, recommendedPrice - input.annualPrice);
  const status = grossMargin < targetMargin - 0.1 ? "reprice" : grossMargin < targetMargin ? "watch" : "healthy";
  return { ...input, actualCost, grossProfit, grossMargin, recommendedPrice, annualUpside, status };
}

export function analyzePortfolio(inputs: AgreementInput[], targetMargin = 0.4) {
  const agreements = inputs.map((x) => analyzeAgreement(x, targetMargin));
  return {
    agreements,
    currentRevenue: agreements.reduce((s, x) => s + x.annualPrice, 0),
    actualCost: agreements.reduce((s, x) => s + x.actualCost, 0),
    potentialUpside: agreements.reduce((s, x) => s + x.annualUpside, 0),
    needsRepricing: agreements.filter((x) => x.status === "reprice").length,
  };
}
