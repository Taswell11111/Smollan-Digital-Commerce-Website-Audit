export interface RoiInput {
  monthlyVisitors?: number; // Client-provided
  conversionRate: number; // Assumption, default 1.5%
  averageOrderValue?: number; // Client-provided
  lifts: Array<{ checkId: string; liftLow: number; liftHigh: number }>;
}

export interface RoiOutput {
  currentMonthlyRevenue: number | null;
  incrementalMonthlyRevenueLow: number | null;
  incrementalMonthlyRevenueHigh: number | null;
  annualisedRevenueLow: number | null;
  annualisedRevenueHigh: number | null;
  missingInputs: string[];
  assumptions: string[];
  formula: string;
}

export function calculateRoi(input: RoiInput): RoiOutput {
  const missingInputs: string[] = [];
  if (input.monthlyVisitors === undefined || input.monthlyVisitors === null || isNaN(input.monthlyVisitors)) {
    missingInputs.push('monthlyVisitors');
  }
  if (input.averageOrderValue === undefined || input.averageOrderValue === null || isNaN(input.averageOrderValue)) {
    missingInputs.push('averageOrderValue');
  }

  const assumptions = [
    `Baseline conversion rate: ${(input.conversionRate ?? 1.5).toFixed(2)}% (Assumption, editable)`,
    'Conversion uplift ranges derived from selected fix list lift estimates'
  ];

  const formula = 'Current Monthly Revenue = Visitors × Conversion Rate × AOV. Incremental Monthly Revenue = Visitors × (Lift % / 100) × AOV. Annualised = Incremental × 12.';

  if (missingInputs.length > 0) {
    return {
      currentMonthlyRevenue: null,
      incrementalMonthlyRevenueLow: null,
      incrementalMonthlyRevenueHigh: null,
      annualisedRevenueLow: null,
      annualisedRevenueHigh: null,
      missingInputs,
      assumptions,
      formula
    };
  }

  const visitors = input.monthlyVisitors!;
  const cr = (input.conversionRate ?? 1.5) / 100;
  const aov = input.averageOrderValue!;

  const currentMonthlyRevenue = visitors * cr * aov;

  let totalLiftLow = 0;
  let totalLiftHigh = 0;
  (input.lifts || []).forEach(l => {
    totalLiftLow += l.liftLow || 0;
    totalLiftHigh += l.liftHigh || 0;
  });

  const liftLowRatio = totalLiftLow / 100;
  const liftHighRatio = totalLiftHigh / 100;

  const incrementalMonthlyRevenueLow = visitors * liftLowRatio * aov;
  const incrementalMonthlyRevenueHigh = visitors * liftHighRatio * aov;

  const annualisedRevenueLow = incrementalMonthlyRevenueLow * 12;
  const annualisedRevenueHigh = incrementalMonthlyRevenueHigh * 12;

  return {
    currentMonthlyRevenue: Math.round(currentMonthlyRevenue),
    incrementalMonthlyRevenueLow: Math.round(incrementalMonthlyRevenueLow),
    incrementalMonthlyRevenueHigh: Math.round(incrementalMonthlyRevenueHigh),
    annualisedRevenueLow: Math.round(annualisedRevenueLow),
    annualisedRevenueHigh: Math.round(annualisedRevenueHigh),
    missingInputs: [],
    assumptions,
    formula
  };
}
