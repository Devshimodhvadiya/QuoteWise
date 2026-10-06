import type {
  ComparisonWeights,
  Quotation,
  QuotationScore,
  ComparisonResult,
  RequirementConstraints,
  EligibilityResult,
  RedFlag,
  ScoreFactorBreakdown,
  RecommendationExplanation,
  BudgetAnalysis,
  WhatIfScenario,
} from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (n: number, decimals = 1): string => {
  return n.toFixed(decimals);
};

// ====================================================
// FEATURE 1: Hard Constraints & Eligibility Engine
// ====================================================
export const validateEligibility = (
  quotation: Quotation,
  constraints?: RequirementConstraints,
  requirementBudget?: number
): EligibilityResult => {
  const reasons: string[] = [];

  // 1. Maximum Budget check
  const maxBudget = constraints?.maxBudget ?? requirementBudget;
  if (maxBudget && maxBudget > 0 && quotation.price > maxBudget) {
    const diff = quotation.price - maxBudget;
    reasons.push(`Price exceeds maximum budget by ${formatCurrency(diff)} (Quote: ${formatCurrency(quotation.price)} vs Budget: ${formatCurrency(maxBudget)})`);
  }

  // 2. Maximum Delivery Days check
  if (constraints?.maxDeliveryDays && constraints.maxDeliveryDays > 0) {
    if (quotation.deliveryDays > constraints.maxDeliveryDays) {
      reasons.push(`Delivery time of ${quotation.deliveryDays} days exceeds maximum allowed ${constraints.maxDeliveryDays} days`);
    }
  }

  // 3. Minimum Warranty Months check
  if (constraints?.minWarrantyMonths && constraints.minWarrantyMonths > 0) {
    if (quotation.warrantyMonths < constraints.minWarrantyMonths) {
      reasons.push(`Warranty is ${quotation.warrantyMonths} months; minimum required is ${constraints.minWarrantyMonths} months`);
    }
  }

  // 4. Minimum Vendor Rating check
  if (constraints?.minVendorRating && constraints.minVendorRating > 0) {
    if (quotation.vendorRating < constraints.minVendorRating) {
      reasons.push(`Vendor rating of ${quotation.vendorRating} is below required minimum of ${constraints.minVendorRating}`);
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
};

// ====================================================
// FEATURE 4: Automatic Red Flags Engine (Rule-based)
// ====================================================
export const detectRedFlags = (
  quotation: Quotation,
  allQuotations: Quotation[],
  constraints?: RequirementConstraints,
  requirementBudget?: number,
  deadline?: Date
): RedFlag[] => {
  const flags: RedFlag[] = [];
  const vName = quotation.vendorName ?? 'Vendor';
  const vId = quotation.vendorId;

  // Average price across all quotes
  const validPrices = allQuotations.map((q) => q.price).filter((p) => p > 0);
  const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : quotation.price;

  const maxBudget = constraints?.maxBudget ?? requirementBudget;

  // 1. Over Budget (CRITICAL)
  if (maxBudget && maxBudget > 0 && quotation.price > maxBudget) {
    const diff = quotation.price - maxBudget;
    flags.push({
      id: `${vId}-budget-exceeded`,
      vendorId: vId,
      vendorName: vName,
      severity: 'CRITICAL',
      message: `Price exceeds maximum budget by ${formatCurrency(diff)}.`,
    });
  }

  // 2. Significantly higher than average (>20%) (WARNING)
  if (avgPrice > 0 && quotation.price > avgPrice * 1.2) {
    const pct = Math.round(((quotation.price - avgPrice) / avgPrice) * 100);
    flags.push({
      id: `${vId}-price-high`,
      vendorId: vId,
      vendorName: vName,
      severity: 'WARNING',
      message: `Price is ${pct}% above the average quotation.`,
    });
  }

  // 3. Significantly lower than average (>15% below) (INFO)
  if (avgPrice > 0 && quotation.price < avgPrice * 0.85) {
    const pct = Math.round(((avgPrice - quotation.price) / avgPrice) * 100);
    flags.push({
      id: `${vId}-price-low`,
      vendorId: vId,
      vendorName: vName,
      severity: 'INFO',
      message: `Price is ${pct}% below the average quotation. Verify scope completeness.`,
    });
  }

  // 4. Warranty below required minimum (CRITICAL)
  if (constraints?.minWarrantyMonths && quotation.warrantyMonths < constraints.minWarrantyMonths) {
    flags.push({
      id: `${vId}-warranty-below-min`,
      vendorId: vId,
      vendorName: vName,
      severity: 'CRITICAL',
      message: `Warranty is below required minimum (${quotation.warrantyMonths} mo vs min ${constraints.minWarrantyMonths} mo).`,
    });
  }

  // 5. Delivery exceeds maximum allowed time (CRITICAL)
  if (constraints?.maxDeliveryDays && quotation.deliveryDays > constraints.maxDeliveryDays) {
    flags.push({
      id: `${vId}-delivery-exceeded`,
      vendorId: vId,
      vendorName: vName,
      severity: 'CRITICAL',
      message: `Delivery exceeds maximum allowed time (${quotation.deliveryDays} days vs max ${constraints.maxDeliveryDays} days).`,
    });
  }

  // 6. Delivery close to maximum allowed time (85% to 100%) (WARNING)
  if (
    constraints?.maxDeliveryDays &&
    quotation.deliveryDays <= constraints.maxDeliveryDays &&
    quotation.deliveryDays >= Math.ceil(constraints.maxDeliveryDays * 0.85)
  ) {
    flags.push({
      id: `${vId}-delivery-close-deadline`,
      vendorId: vId,
      vendorName: vName,
      severity: 'WARNING',
      message: `Delivery turnaround is close to the allowed deadline (${quotation.deliveryDays} / ${constraints.maxDeliveryDays} days).`,
    });
  }

  // 7. Rating below required minimum (CRITICAL)
  if (constraints?.minVendorRating && quotation.vendorRating < constraints.minVendorRating) {
    flags.push({
      id: `${vId}-rating-below-min`,
      vendorId: vId,
      vendorName: vName,
      severity: 'CRITICAL',
      message: `Vendor rating is below the minimum requirement (${quotation.vendorRating} vs min ${constraints.minVendorRating}).`,
    });
  }

  // 8. General ineligibility summary (CRITICAL)
  const eligibility = validateEligibility(quotation, constraints, requirementBudget);
  if (!eligibility.isEligible && flags.filter((f) => f.severity === 'CRITICAL').length === 0) {
    flags.push({
      id: `${vId}-ineligible-summary`,
      vendorId: vId,
      vendorName: vName,
      severity: 'CRITICAL',
      message: `Vendor does not satisfy mandatory requirements.`,
    });
  }

  return flags;
};

// ====================================================
// FEATURE 2: Score Breakdown & Weighted Calculation
// ====================================================
export const calculateComprehensiveScores = (
  quotations: Quotation[],
  weights: ComparisonWeights,
  constraints?: RequirementConstraints,
  requirementBudget?: number,
  deadline?: Date
): {
  allScores: QuotationScore[];
  eligibleScores: QuotationScore[];
  ineligibleScores: QuotationScore[];
} => {
  if (quotations.length === 0) {
    return { allScores: [], eligibleScores: [], ineligibleScores: [] };
  }

  // 1. Evaluate eligibility & red flags for all vendors
  const assessed = quotations.map((q) => {
    const eligibility = validateEligibility(q, constraints, requirementBudget);
    const redFlags = detectRedFlags(q, quotations, constraints, requirementBudget, deadline);
    return {
      quotation: q,
      isEligible: eligibility.isEligible,
      ineligibilityReasons: eligibility.reasons,
      redFlags,
    };
  });

  const eligibleItems = assessed.filter((a) => a.isEligible);
  const eligibleQuotes = eligibleItems.map((a) => a.quotation);

  // If there are eligible vendors, baseline min/max is computed among ELIGIBLE vendors
  const targetGroup = eligibleQuotes.length > 0 ? eligibleQuotes : quotations;

  const minPrice = Math.min(...targetGroup.map((q) => q.price));
  const maxWarranty = Math.max(...targetGroup.map((q) => q.warrantyMonths));
  const minDelivery = Math.min(...targetGroup.map((q) => q.deliveryDays));
  const maxRating = Math.max(...targetGroup.map((q) => q.vendorRating));

  const wPrice = weights.price / 100;
  const wWarranty = weights.warranty / 100;
  const wDelivery = weights.delivery / 100;
  const wRating = weights.rating / 100;

  // 2. Score eligible vendors
  const scoredEligible: QuotationScore[] = eligibleItems.map(({ quotation: q, ineligibilityReasons, redFlags }) => {
    // Formulas:
    // PRICE: minPrice / vendorPrice * 100 (Lower price = better)
    const priceScore = minPrice > 0 && q.price > 0 ? (minPrice / q.price) * 100 : 100;
    // DELIVERY: minDelivery / vendorDelivery * 100 (Lower delivery time = better)
    const deliveryScore = minDelivery > 0 && q.deliveryDays > 0 ? (minDelivery / q.deliveryDays) * 100 : 100;
    // WARRANTY: vendorWarranty / maxWarranty * 100 (Higher warranty = better)
    const warrantyScore = maxWarranty > 0 ? (q.warrantyMonths / maxWarranty) * 100 : 100;
    // RATING: vendorRating / maxRating * 100 (Higher rating = better)
    const ratingScore = maxRating > 0 ? (q.vendorRating / maxRating) * 100 : 100;

    const priceContribution = Math.round(priceScore * wPrice * 100) / 100;
    const warrantyContribution = Math.round(warrantyScore * wWarranty * 100) / 100;
    const deliveryContribution = Math.round(deliveryScore * wDelivery * 100) / 100;
    const ratingContribution = Math.round(ratingScore * wRating * 100) / 100;

    const finalScore = Math.round((priceContribution + warrantyContribution + deliveryContribution + ratingContribution) * 10) / 10;

    const breakdown: ScoreFactorBreakdown[] = [
      {
        factor: 'price',
        label: 'Price',
        rawValue: q.price,
        formattedRaw: formatCurrency(q.price),
        normalizedScore: Math.round(priceScore * 10) / 10,
        weight: weights.price,
        weightedContribution: priceContribution,
      },
      {
        factor: 'warranty',
        label: 'Warranty',
        rawValue: q.warrantyMonths,
        formattedRaw: `${q.warrantyMonths} mo`,
        normalizedScore: Math.round(warrantyScore * 10) / 10,
        weight: weights.warranty,
        weightedContribution: warrantyContribution,
      },
      {
        factor: 'delivery',
        label: 'Delivery',
        rawValue: q.deliveryDays,
        formattedRaw: `${q.deliveryDays} days`,
        normalizedScore: Math.round(deliveryScore * 10) / 10,
        weight: weights.delivery,
        weightedContribution: deliveryContribution,
      },
      {
        factor: 'rating',
        label: 'Rating',
        rawValue: q.vendorRating,
        formattedRaw: `★ ${q.vendorRating}`,
        normalizedScore: Math.round(ratingScore * 10) / 10,
        weight: weights.rating,
        weightedContribution: ratingContribution,
      },
    ];

    const highlights: string[] = [];
    if (q.price === minPrice) highlights.push('Lowest Price');
    if (q.warrantyMonths === maxWarranty) highlights.push('Best Warranty');
    if (q.deliveryDays === minDelivery) highlights.push('Fastest Delivery');
    if (q.vendorRating === maxRating) highlights.push('Highest Rated');

    return {
      quotationId: q.id,
      vendorId: q.vendorId,
      vendorName: q.vendorName ?? 'Unknown',
      vendorCompany: q.vendorCompany ?? '',
      price: q.price,
      warrantyMonths: q.warrantyMonths,
      deliveryDays: q.deliveryDays,
      vendorRating: q.vendorRating,
      priceScore: Math.round(priceScore * 10) / 10,
      warrantyScore: Math.round(warrantyScore * 10) / 10,
      deliveryScore: Math.round(deliveryScore * 10) / 10,
      ratingScore: Math.round(ratingScore * 10) / 10,
      priceContribution,
      warrantyContribution,
      deliveryContribution,
      ratingContribution,
      breakdown,
      finalScore,
      isRecommended: false,
      isEligible: true,
      ineligibilityReasons: [],
      redFlags,
      highlights,
    };
  });

  // Sort eligible by finalScore descending
  scoredEligible.sort((a, b) => b.finalScore - a.finalScore);

  // Highest scoring eligible vendor becomes recommended
  if (scoredEligible.length > 0) {
    scoredEligible[0].isRecommended = true;
  }

  // 3. Score ineligible vendors (they CANNOT be recommended)
  const scoredIneligible: QuotationScore[] = assessed
    .filter((a) => !a.isEligible)
    .map(({ quotation: q, ineligibilityReasons, redFlags }) => ({
      quotationId: q.id,
      vendorId: q.vendorId,
      vendorName: q.vendorName ?? 'Unknown',
      vendorCompany: q.vendorCompany ?? '',
      price: q.price,
      warrantyMonths: q.warrantyMonths,
      deliveryDays: q.deliveryDays,
      vendorRating: q.vendorRating,
      priceScore: 0,
      warrantyScore: 0,
      deliveryScore: 0,
      ratingScore: 0,
      finalScore: 0,
      priceContribution: 0,
      warrantyContribution: 0,
      deliveryContribution: 0,
      ratingContribution: 0,
      breakdown: [],
      isRecommended: false,
      isEligible: false,
      ineligibilityReasons,
      redFlags,
      highlights: ['Ineligible'],
    }));

  const allScores = [...scoredEligible, ...scoredIneligible];

  return {
    allScores,
    eligibleScores: scoredEligible,
    ineligibleScores: scoredIneligible,
  };
};

// ====================================================
// FEATURE 6: Savings & Budget Analysis Engine
// ====================================================
export const calculateBudgetAnalysis = (
  quotations: Quotation[],
  recommended: QuotationScore | undefined,
  requirementBudget: number
): BudgetAnalysis => {
  const prices = quotations.map((q) => q.price).filter((p) => p > 0);
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

  if (!recommended) {
    return {
      budget: requirementBudget,
      recommendedPrice: 0,
      isWithinBudget: true,
      budgetVariance: 0,
      averagePrice: avgPrice,
      lowestPrice,
      highestPrice,
      savingsAmount: 0,
      savingsPercentage: 0,
      isAboveAverage: false,
    };
  }

  const recPrice = recommended.price;
  const isWithinBudget = requirementBudget > 0 ? recPrice <= requirementBudget : true;
  const budgetVariance = requirementBudget > 0 ? requirementBudget - recPrice : 0;

  const isAboveAverage = recPrice > avgPrice;
  const savingsAmount = isAboveAverage ? 0 : Math.max(0, avgPrice - recPrice);
  const aboveAverageAmount = isAboveAverage ? recPrice - avgPrice : 0;
  const savingsPercentage = avgPrice > 0 && !isAboveAverage ? Math.round((savingsAmount / avgPrice) * 1000) / 10 : 0;

  return {
    budget: requirementBudget,
    recommendedPrice: recPrice,
    isWithinBudget,
    budgetVariance,
    averagePrice: avgPrice,
    lowestPrice,
    highestPrice,
    savingsAmount,
    savingsPercentage,
    isAboveAverage,
    aboveAverageAmount,
  };
};

// ====================================================
// FEATURE 5: "Why This Vendor?" Explanation Engine
// ====================================================
export const generateRecommendationExplanation = (
  eligibleScores: QuotationScore[],
  recommended: QuotationScore | undefined,
  budgetAnalysis: BudgetAnalysis
): RecommendationExplanation => {
  if (!recommended) {
    return {
      summary: 'No eligible vendor found.',
      strengths: [],
      tradeoffs: [],
      decisionRationale: 'All submitted vendor quotations failed one or more mandatory hard constraints (e.g. budget, delivery deadline, warranty, or vendor rating). No vendor could be recommended.',
    };
  }

  const strengths: string[] = [];
  const tradeoffs: string[] = [];

  const minEligiblePrice = Math.min(...eligibleScores.map((s) => s.price));
  const maxEligibleWarranty = Math.max(...eligibleScores.map((s) => s.warrantyMonths));
  const minEligibleDelivery = Math.min(...eligibleScores.map((s) => s.deliveryDays));
  const maxEligibleRating = Math.max(...eligibleScores.map((s) => s.vendorRating));

  // Strengths identification
  if (recommended.price === minEligiblePrice) {
    strengths.push(`Lowest quoted price among eligible vendors (${formatCurrency(recommended.price)})`);
  }
  if (recommended.warrantyMonths === maxEligibleWarranty) {
    strengths.push(`Highest warranty period among eligible vendors (${recommended.warrantyMonths} months)`);
  }
  if (recommended.deliveryDays === minEligibleDelivery) {
    strengths.push(`Fastest delivery turnaround among eligible vendors (${recommended.deliveryDays} days)`);
  }
  if (recommended.vendorRating === maxEligibleRating) {
    strengths.push(`Highest vendor performance rating among eligible vendors (${recommended.vendorRating}/5)`);
  }
  strengths.push(`Achieved the highest overall weighted score of ${recommended.finalScore} / 100`);

  // Trade-offs identification
  const cheapestCompetitor = eligibleScores.find((s) => s.price === minEligiblePrice && s.vendorId !== recommended.vendorId);
  if (cheapestCompetitor && recommended.price > minEligiblePrice) {
    const diff = recommended.price - cheapestCompetitor.price;
    tradeoffs.push(
      `Quotation is higher than ${cheapestCompetitor.vendorName} by ${formatCurrency(diff)}, but offset by stronger warranty, delivery speed, or rating performance.`
    );
  }

  const fastestCompetitor = eligibleScores.find((s) => s.deliveryDays === minEligibleDelivery && s.vendorId !== recommended.vendorId);
  if (fastestCompetitor && recommended.deliveryDays > minEligibleDelivery) {
    tradeoffs.push(
      `Delivery turnaround (${recommended.deliveryDays} days) is slower than ${fastestCompetitor.vendorName} (${fastestCompetitor.deliveryDays} days).`
    );
  }

  const longestWarrantyCompetitor = eligibleScores.find((s) => s.warrantyMonths === maxEligibleWarranty && s.vendorId !== recommended.vendorId);
  if (longestWarrantyCompetitor && recommended.warrantyMonths < maxEligibleWarranty) {
    tradeoffs.push(
      `Warranty period (${recommended.warrantyMonths} mo) is shorter than ${longestWarrantyCompetitor.vendorName} (${longestWarrantyCompetitor.warrantyMonths} mo).`
    );
  }

  const summary = `${recommended.vendorName} (${recommended.vendorCompany}) is recommended because it achieved the highest overall score of ${recommended.finalScore}/100 among all eligible vendors.`;

  let decisionRationale = `${summary} `;
  if (strengths.length > 0) {
    decisionRationale += `Key advantages include ${strengths.slice(0, 2).join(' and ')}. `;
  }
  if (tradeoffs.length > 0) {
    decisionRationale += `Although ${tradeoffs[0].toLowerCase()}, its composite score demonstrates the optimal overall procurement value.`;
  }

  return {
    summary,
    strengths,
    tradeoffs,
    decisionRationale,
  };
};

// ====================================================
// Comprehensive Comparison Result Builder
// ====================================================
export const buildComparisonResult = (
  requirementId: string,
  requirementTitle: string,
  quotations: Quotation[],
  weights: ComparisonWeights,
  constraints?: RequirementConstraints,
  requirementBudget: number = 0,
  deadline?: Date
): ComparisonResult => {
  const { allScores, eligibleScores, ineligibleScores } = calculateComprehensiveScores(
    quotations,
    weights,
    constraints,
    requirementBudget,
    deadline
  );

  const recommended = eligibleScores.find((s) => s.isRecommended);
  const budgetAnalysis = calculateBudgetAnalysis(quotations, recommended, requirementBudget);
  const explanation = generateRecommendationExplanation(eligibleScores, recommended, budgetAnalysis);

  const allRedFlags: RedFlag[] = [];
  allScores.forEach((s) => {
    s.redFlags.forEach((rf) => allRedFlags.push(rf));
  });

  return {
    requirementId,
    requirementTitle,
    weights,
    scores: allScores,
    eligibleScores,
    ineligibleScores,
    recommendedVendorId: recommended?.vendorId,
    recommendedVendorName: recommended?.vendorName,
    recommendationReason: explanation.decisionRationale,
    recommendationExplanation: explanation,
    estimatedSavings: budgetAnalysis.savingsAmount,
    budgetAnalysis,
    allRedFlags,
    hasEligibleWinner: Boolean(recommended),
    constraints,
  };
};

// ====================================================
// FEATURE 3: What-If Analysis Engine
// ====================================================
export const simulateWhatIfScenario = (
  quotations: Quotation[],
  originalWeights: ComparisonWeights,
  scenarioWeights: ComparisonWeights,
  constraints?: RequirementConstraints,
  requirementBudget: number = 0,
  deadline?: Date
): WhatIfScenario => {
  // 1. Calculate original result
  const origResult = buildComparisonResult(
    'temp',
    'temp',
    quotations,
    originalWeights,
    constraints,
    requirementBudget,
    deadline
  );

  // 2. Calculate scenario result
  const scenarioResult = buildComparisonResult(
    'temp',
    'temp',
    quotations,
    scenarioWeights,
    constraints,
    requirementBudget,
    deadline
  );

  const origWinner = origResult.eligibleScores.find((s) => s.isRecommended);
  const scenWinner = scenarioResult.eligibleScores.find((s) => s.isRecommended);

  const recommendationChanged = Boolean(
    origWinner && scenWinner && origWinner.vendorId !== scenWinner.vendorId
  );

  let explanation = '';
  if (!origWinner && !scenWinner) {
    explanation = 'No eligible vendors available under mandatory hard constraints.';
  } else if (!recommendationChanged) {
    explanation = `${origWinner?.vendorName ?? 'Current vendor'} maintains the highest score under this weighting scenario.`;
  } else {
    // Determine which weight increased the most
    const deltas: { key: keyof ComparisonWeights; label: string; diff: number }[] = [
      { key: 'price', label: 'Price', diff: scenarioWeights.price - originalWeights.price },
      { key: 'warranty', label: 'Warranty', diff: scenarioWeights.warranty - originalWeights.warranty },
      { key: 'delivery', label: 'Delivery', diff: scenarioWeights.delivery - originalWeights.delivery },
      { key: 'rating', label: 'Vendor Rating', diff: scenarioWeights.rating - originalWeights.rating },
    ];
    deltas.sort((a, b) => b.diff - a.diff);
    const topFactor = deltas[0];

    explanation = `${scenWinner?.vendorName} became the recommended vendor because ${topFactor.label} now has a higher weight (${scenarioWeights[topFactor.key]}% vs original ${originalWeights[topFactor.key]}%).`;
  }

  return {
    weights: scenarioWeights,
    originalWinnerId: origWinner?.vendorId,
    originalWinnerName: origWinner?.vendorName,
    originalWinnerScore: origWinner?.finalScore,
    scenarioWinnerId: scenWinner?.vendorId,
    scenarioWinnerName: scenWinner?.vendorName,
    scenarioWinnerScore: scenWinner?.finalScore,
    recommendationChanged,
    explanation,
    scores: scenarioResult.scores,
  };
};

// Re-export backward compatible calculateScores
export const calculateScores = (
  quotations: Quotation[],
  weights: ComparisonWeights
): QuotationScore[] => {
  const res = calculateComprehensiveScores(quotations, weights);
  return res.allScores;
};

export const generateRecommendationReason = (
  scores: QuotationScore[],
  recommended: QuotationScore
): string => {
  const eligible = scores.filter((s) => s.isEligible);
  const budgetAnalysis = calculateBudgetAnalysis(
    scores.map((s) => ({
      id: s.quotationId,
      requirementId: '',
      vendorId: s.vendorId,
      vendorName: s.vendorName,
      vendorCompany: s.vendorCompany,
      price: s.price,
      warrantyMonths: s.warrantyMonths,
      deliveryDays: s.deliveryDays,
      vendorRating: s.vendorRating,
      notes: '',
      companyId: '',
      submittedAt: new Date(),
      createdBy: '',
      createdAt: new Date(),
    })),
    recommended,
    recommended.price * 1.1
  );
  const expl = generateRecommendationExplanation(eligible, recommended, budgetAnalysis);
  return expl.decisionRationale;
};
