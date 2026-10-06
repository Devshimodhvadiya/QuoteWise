// =========================================
// User Types
// =========================================
export type UserRole = 'admin' | 'employee';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  companyName: string;
  role: UserRole;
  department?: string;
  status?: 'active' | 'suspended';
  assignedCount?: number;
  createdAt: Date;
}

// =========================================
// Hard Constraints & Requirement Types
// =========================================
export type RequirementStatus = 'Draft' | 'Open' | 'Under Review' | 'Completed' | 'Cancelled';

export const REQUIREMENT_STATUSES: RequirementStatus[] = [
  'Draft', 'Open', 'Under Review', 'Completed', 'Cancelled'
];

export const REQUIREMENT_CATEGORIES = [
  'IT Equipment', 'Office Supplies', 'Furniture', 'Networking', 'Software',
  'Electronics', 'Stationery', 'Maintenance', 'Services', 'Other'
];

export interface RequirementConstraints {
  maxBudget?: number;
  maxDeliveryDays?: number;
  minWarrantyMonths?: number;
  minVendorRating?: number;
}

export interface Requirement extends RequirementConstraints {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  budget: number;
  deadline: Date;
  status: RequirementStatus;
  createdBy: string;
  createdByName: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// =========================================
// Vendor Types
// =========================================
export const VENDOR_CATEGORIES = [
  'IT & Electronics', 'Office Supplies', 'Furniture', 'Networking Equipment',
  'Software & SaaS', 'Maintenance & Repair', 'Logistics', 'Consulting', 'Other'
];

export interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  address: string;
  notes: string;
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// =========================================
// Quotation Types
// =========================================
export interface Quotation {
  id: string;
  requirementId: string;
  requirementTitle?: string;
  vendorId: string;
  vendorName?: string;
  vendorCompany?: string;
  price: number;
  warrantyMonths: number;
  deliveryDays: number;
  vendorRating: number;
  notes: string;
  companyId: string;
  submittedAt: Date;
  createdBy: string;
  createdAt: Date;
}

// =========================================
// Eligibility & Red Flags Types
// =========================================
export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
}

export type RedFlagSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface RedFlag {
  id: string;
  vendorId: string;
  vendorName: string;
  severity: RedFlagSeverity;
  message: string;
}

// =========================================
// Score Breakdown & Explanation Types
// =========================================
export interface ScoreFactorBreakdown {
  factor: 'price' | 'warranty' | 'delivery' | 'rating';
  label: string;
  rawValue: number;
  formattedRaw: string;
  normalizedScore: number;
  weight: number;
  weightedContribution: number;
}

export interface RecommendationExplanation {
  summary: string;
  strengths: string[];
  tradeoffs: string[];
  decisionRationale: string;
}

export interface BudgetAnalysis {
  budget: number;
  recommendedPrice: number;
  isWithinBudget: boolean;
  budgetVariance: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  savingsAmount: number;
  savingsPercentage: number;
  isAboveAverage: boolean;
  aboveAverageAmount?: number;
}

// =========================================
// Comparison Types
// =========================================
export interface ComparisonWeights {
  price: number;
  warranty: number;
  delivery: number;
  rating: number;
}

export const DEFAULT_WEIGHTS: ComparisonWeights = {
  price: 40,
  warranty: 25,
  delivery: 20,
  rating: 15,
};

export interface QuotationScore {
  quotationId: string;
  vendorId: string;
  vendorName: string;
  vendorCompany: string;
  price: number;
  warrantyMonths: number;
  deliveryDays: number;
  vendorRating: number;
  // Normalized 0-100 scores
  priceScore: number;
  warrantyScore: number;
  deliveryScore: number;
  ratingScore: number;
  finalScore: number;
  // Weighted contributions
  priceContribution?: number;
  warrantyContribution?: number;
  deliveryContribution?: number;
  ratingContribution?: number;
  breakdown?: ScoreFactorBreakdown[];
  // Eligibility & Flags
  isEligible: boolean;
  ineligibilityReasons: string[];
  redFlags: RedFlag[];
  isRecommended: boolean;
  highlights: string[];
}

export interface WhatIfScenario {
  weights: ComparisonWeights;
  originalWinnerId?: string;
  originalWinnerName?: string;
  originalWinnerScore?: number;
  scenarioWinnerId?: string;
  scenarioWinnerName?: string;
  scenarioWinnerScore?: number;
  recommendationChanged: boolean;
  explanation: string;
  scores: QuotationScore[];
}

export interface ComparisonResult {
  requirementId: string;
  requirementTitle: string;
  weights: ComparisonWeights;
  scores: QuotationScore[];
  eligibleScores: QuotationScore[];
  ineligibleScores: QuotationScore[];
  recommendedVendorId?: string;
  recommendedVendorName?: string;
  recommendationReason: string;
  recommendationExplanation?: RecommendationExplanation;
  estimatedSavings: number;
  budgetAnalysis?: BudgetAnalysis;
  allRedFlags: RedFlag[];
  hasEligibleWinner: boolean;
  constraints?: RequirementConstraints;
}

export interface Comparison {
  id: string;
  requirementId: string;
  requirementTitle: string;
  weights: ComparisonWeights;
  scores: QuotationScore[];
  recommendedVendorId?: string;
  recommendedVendorName?: string;
  recommendationReason: string;
  recommendationExplanation?: RecommendationExplanation;
  estimatedSavings: number;
  budgetAnalysis?: BudgetAnalysis;
  allRedFlags?: RedFlag[];
  constraints?: RequirementConstraints;
  companyId: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

// =========================================
// Dashboard Types
// =========================================
export interface DashboardStats {
  totalRequirements: number;
  activeRequirements: number;
  totalVendors: number;
  totalQuotations: number;
  completedComparisons: number;
  averageSavings: number;
  totalSavings: number;
}
