import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Trophy, TrendingDown, Shield, Clock, Star,
  RotateCcw, AlertTriangle, AlertCircle, Info, CheckCircle2, XCircle,
  HelpCircle, ChevronDown, ChevronUp, Sliders, Check, Sparkles, DollarSign,
  ShieldAlert, RefreshCw,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getRequirement, getQuotationsByRequirement, saveComparison } from '../../firebase/firestore';
import {
  buildComparisonResult,
  simulateWhatIfScenario,
  formatCurrency,
  formatNumber,
} from '../../utils/comparison';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader, PageLoader, EmptyState } from '../../components/ui/index';
import { ConfirmDialog } from '../../components/ui/Modal';
import { cn, getScoreColor } from '../../utils';
import toast from 'react-hot-toast';
import type {
  ComparisonWeights,
  ComparisonResult,
  Requirement,
  Quotation,
  WhatIfScenario,
  QuotationScore,
  RedFlag,
} from '../../types';
import { DEFAULT_WEIGHTS } from '../../types';

const RADAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const WeightSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  disabled?: boolean;
}> = ({ label, value, onChange, color, disabled = false }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{label}</label>
      <span className={cn('text-sm font-bold', color)}>{value}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      step="1"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-indigo-600 cursor-pointer disabled:opacity-50"
    />
  </div>
);

const NewComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requirementId = searchParams.get('requirementId') ?? '';
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active comparison weights
  const [weights, setWeights] = useState<ComparisonWeights>(DEFAULT_WEIGHTS);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  // What-If Scenario state
  const [scenarioWeights, setScenarioWeights] = useState<ComparisonWeights>(DEFAULT_WEIGHTS);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

  const totalActiveWeight = weights.price + weights.warranty + weights.delivery + weights.rating;
  const totalScenarioWeight = scenarioWeights.price + scenarioWeights.warranty + scenarioWeights.delivery + scenarioWeights.rating;

  // Load requirement and quotations
  useEffect(() => {
    if (!requirementId || !userProfile) return;
    const load = async () => {
      try {
        const [req, quots] = await Promise.all([
          getRequirement(requirementId, userProfile.companyName),
          getQuotationsByRequirement(requirementId, userProfile.companyName),
        ]);
        if (!req || req.companyId.trim().toLowerCase() !== userProfile.companyName.trim().toLowerCase()) {
          toast.error('Requirement not found or belongs to another company');
          navigate('/requirements');
          return;
        }
        setRequirement(req);
        setQuotations(quots);
        if (req && quots.length >= 2) {
          const res = buildComparisonResult(
            req.id,
            req.title,
            quots,
            DEFAULT_WEIGHTS,
            {
              maxBudget: req.maxBudget ?? req.budget,
              maxDeliveryDays: req.maxDeliveryDays,
              minWarrantyMonths: req.minWarrantyMonths,
              minVendorRating: req.minVendorRating,
            },
            req.budget,
            req.deadline
          );
          setResult(res);
          setScenarioWeights(DEFAULT_WEIGHTS);
        }
      } catch {
        toast.error('Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [requirementId, userProfile]);

  // Recalculate active comparison on weights change
  useEffect(() => {
    if (!requirement || quotations.length < 2) return;
    const res = buildComparisonResult(
      requirement.id,
      requirement.title,
      quotations,
      weights,
      {
        maxBudget: requirement.maxBudget ?? requirement.budget,
        maxDeliveryDays: requirement.maxDeliveryDays,
        minWarrantyMonths: requirement.minWarrantyMonths,
        minVendorRating: requirement.minVendorRating,
      },
      requirement.budget,
      requirement.deadline
    );
    setResult(res);
  }, [weights, requirement, quotations]);

  // FEATURE 3: What-If simulation calculation
  const scenarioResult: WhatIfScenario | null = useMemo(() => {
    if (!requirement || quotations.length < 2 || totalScenarioWeight !== 100) return null;
    return simulateWhatIfScenario(
      quotations,
      weights,
      scenarioWeights,
      {
        maxBudget: requirement.maxBudget ?? requirement.budget,
        maxDeliveryDays: requirement.maxDeliveryDays,
        minWarrantyMonths: requirement.minWarrantyMonths,
        minVendorRating: requirement.minVendorRating,
      },
      requirement.budget,
      requirement.deadline
    );
  }, [quotations, weights, scenarioWeights, totalScenarioWeight, requirement]);

  const updateWeight = (key: keyof ComparisonWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const updateScenarioWeight = (key: keyof ComparisonWeights, value: number) => {
    setScenarioWeights((prev) => ({ ...prev, [key]: value }));
  };

  const resetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setScenarioWeights(DEFAULT_WEIGHTS);
    toast.success('Weights reset to defaults (40-25-20-15)');
  };

  const handleApplyScenario = () => {
    setWeights(scenarioWeights);
    setShowApplyConfirm(false);
    toast.success('What-If scenario applied as current weights!');
  };

  const handleResetScenario = () => {
    setScenarioWeights(weights);
    toast.success('Scenario weights reset to current comparison weights');
  };

  const handleSave = async () => {
    if (!result || !userProfile || !requirement) return;
    setSaving(true);
    try {
      const id = await saveComparison({
        requirementId: result.requirementId,
        requirementTitle: result.requirementTitle,
        weights: result.weights,
        scores: result.scores,
        recommendedVendorId: result.recommendedVendorId,
        recommendedVendorName: result.recommendedVendorName,
        recommendationReason: result.recommendationReason,
        recommendationExplanation: result.recommendationExplanation,
        estimatedSavings: result.estimatedSavings,
        budgetAnalysis: result.budgetAnalysis,
        allRedFlags: result.allRedFlags,
        constraints: result.constraints,
        companyId: userProfile.companyName,
        createdBy: userProfile.uid,
        createdByName: userProfile.name,
      });
      toast.success('Comparison saved successfully!');
      navigate(`/comparisons/${id}`);
    } catch {
      toast.error('Failed to save comparison');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!requirementId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Trophy size={40} />}
          title="No requirement selected"
          description="Please navigate from a requirement page to run a comparison."
          action={<Link to="/requirements"><Button variant="outline">Go to Requirements</Button></Link>}
        />
      </div>
    );
  }

  if (!result || quotations.length < 2) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Trophy size={40} />}
          title="Not enough quotations"
          description="You need at least 2 vendor quotations to run a comparison."
          action={
            <Link to={`/requirements/${requirementId}`}>
              <Button variant="outline">Add Quotations</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const recommended = result.eligibleScores.find((s) => s.isRecommended);
  const budgetAnalysis = result.budgetAnalysis;
  const explanation = result.recommendationExplanation;

  return (
    <div className="pb-16">
      <PageHeader
        title="Quote Comparison & Decision Engine"
        description={requirement ? `Requirement: ${requirement.title} · Date: ${new Date().toLocaleDateString('en-IN')}` : ''}
        breadcrumb={
          <Link to={`/requirements/${requirementId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} />
            Back to Requirement
          </Link>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetWeights} leftIcon={<RotateCcw size={14} />} size="sm">
              Reset Weights
            </Button>
            <Button leftIcon={<Save size={16} />} loading={saving} onClick={handleSave}>
              Save Comparison
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Requirement Metadata & Active Hard Constraints Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs block">Requirement Budget</span>
              <span className="font-bold text-slate-900">{formatCurrency(requirement?.budget ?? 0)}</span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 text-xs block">Quotes Evaluated</span>
              <span className="font-bold text-slate-900">{quotations.length} Vendors</span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 text-xs block">Eligible Quotes</span>
              <span className="font-bold text-emerald-600">{result.eligibleScores.length} of {quotations.length}</span>
            </div>
          </div>

          {/* Hard Constraints Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-500">Constraints:</span>
            {requirement?.maxBudget ? (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                Max Budget: {formatCurrency(requirement.maxBudget)}
              </span>
            ) : null}
            {requirement?.maxDeliveryDays ? (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                Max Delivery: {requirement.maxDeliveryDays}d
              </span>
            ) : null}
            {requirement?.minWarrantyMonths ? (
              <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                Min Warranty: {requirement.minWarrantyMonths}m
              </span>
            ) : null}
            {requirement?.minVendorRating ? (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                Min Rating: ★{requirement.minVendorRating}
              </span>
            ) : null}
          </div>
        </div>

        {/* ====================================================
            FEATURE 6: SAVINGS & DECISION SUMMARY
            ==================================================== */}
        <section aria-label="Decision Summary">
          {recommended ? (
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Trophy size={14} className="text-amber-300" />
                    <span>Recommended Vendor Decision</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white">{recommended.vendorName}</h2>
                    <p className="text-indigo-200 text-base font-medium">{recommended.vendorCompany}</p>
                  </div>
                  <p className="text-indigo-100 text-sm leading-relaxed pt-1">
                    {explanation?.decisionRationale ?? result.recommendationReason}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[180px] self-start lg:self-auto">
                  <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold">Composite Score</p>
                  <p className="text-5xl font-extrabold text-white my-1">{recommended.finalScore}</p>
                  <p className="text-xs text-indigo-200">out of 100 points</p>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 size={12} />
                      Verified Eligible
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision Metrics Grid */}
              <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-indigo-200 uppercase font-medium">Selected Quotation</p>
                  <p className="text-base font-bold text-white mt-0.5">{formatCurrency(recommended.price)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-indigo-200 uppercase font-medium">Average Quotation</p>
                  <p className="text-base font-bold text-white mt-0.5">{formatCurrency(budgetAnalysis?.averagePrice ?? 0)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-indigo-200 uppercase font-medium">Savings Amount</p>
                  <p className={cn('text-base font-bold mt-0.5', (budgetAnalysis?.savingsAmount ?? 0) > 0 ? 'text-emerald-300' : 'text-amber-300')}>
                    {(budgetAnalysis?.savingsAmount ?? 0) > 0 ? formatCurrency(budgetAnalysis!.savingsAmount) : '₹0'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-indigo-200 uppercase font-medium">Savings %</p>
                  <p className={cn('text-base font-bold mt-0.5', (budgetAnalysis?.savingsPercentage ?? 0) > 0 ? 'text-emerald-300' : 'text-amber-300')}>
                    {(budgetAnalysis?.savingsPercentage ?? 0) > 0 ? `${budgetAnalysis!.savingsPercentage}%` : '0%'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-indigo-200 uppercase font-medium">Budget Status</p>
                  <p className={cn('text-base font-bold mt-0.5', budgetAnalysis?.isWithinBudget ? 'text-emerald-300' : 'text-rose-300')}>
                    {budgetAnalysis?.isWithinBudget ? '✓ Within Budget' : '⚠ Exceeds Budget'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-indigo-200 uppercase font-medium">Market Position</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    {budgetAnalysis?.isAboveAverage ? (
                      <span className="text-amber-300 text-xs">Above Avg: +{formatCurrency(budgetAnalysis.aboveAverageAmount ?? 0)}</span>
                    ) : (
                      <span className="text-emerald-300 text-xs">Below Market Avg</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-rose-900 shadow-sm">
              <div className="flex items-start gap-3">
                <XCircle size={28} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xl font-bold">No eligible vendor found.</h3>
                  <p className="text-sm text-rose-700 mt-1">
                    All submitted quotations failed one or more mandatory hard constraints. No winning vendor can be recommended.
                    Review the eligibility breakdown below to see exact violation reasons for each vendor.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ====================================================
            FEATURE 1: MANDATORY ELIGIBILITY VALIDATION
            ==================================================== */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-indigo-600" />
                Mandatory Hard Constraints & Eligibility
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation results against Maximum Budget, Delivery Days, Minimum Warranty, and Vendor Rating.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Evaluated Before Weighted Ranking
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {result.scores.map((s) => (
              <div key={s.quotationId} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{s.vendorName}</span>
                    <span className="text-xs text-slate-500">({s.vendorCompany})</span>
                    {s.isRecommended && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Trophy size={11} /> Winner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-0.5">
                    <span>Price: <strong>{formatCurrency(s.price)}</strong></span>
                    <span>Delivery: <strong>{s.deliveryDays} days</strong></span>
                    <span>Warranty: <strong>{s.warrantyMonths} mo</strong></span>
                    <span>Rating: <strong>★ {s.vendorRating}</strong></span>
                  </div>

                  {/* Ineligibility Reasons */}
                  {!s.isEligible && s.ineligibilityReasons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {s.ineligibilityReasons.map((r, i) => (
                        <p key={i} className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                          <XCircle size={13} className="flex-shrink-0" />
                          <span>{r}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {s.isEligible ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      ✓ Eligible for Recommendation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-bold">
                      <XCircle size={14} className="text-rose-600" />
                      ✕ Not Eligible (Disqualified)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ====================================================
            FEATURE 4: AUTOMATIC RED FLAGS
            ==================================================== */}
        {result.allRedFlags.length > 0 && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Automatic Procurement Red Flags
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deterministic rule-based risk indicators generated from quotation and requirement criteria.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {result.allRedFlags.length} Flags Detected
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.allRedFlags.map((flag) => {
                const isCrit = flag.severity === 'CRITICAL';
                const isWarn = flag.severity === 'WARNING';
                return (
                  <div
                    key={flag.id}
                    className={cn(
                      'p-3.5 rounded-xl border flex items-start gap-3 transition-colors',
                      isCrit ? 'bg-rose-50/70 border-rose-200 text-rose-900' :
                      isWarn ? 'bg-amber-50/70 border-amber-200 text-amber-900' :
                      'bg-blue-50/70 border-blue-200 text-blue-900'
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isCrit ? <XCircle size={16} className="text-rose-600" /> :
                       isWarn ? <AlertTriangle size={16} className="text-amber-600" /> :
                       <Info size={16} className="text-blue-600" />}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs truncate">{flag.vendorName}</span>
                        <span className={cn(
                          'text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded tracking-wider',
                          isCrit ? 'bg-rose-200/80 text-rose-800' :
                          isWarn ? 'bg-amber-200/80 text-amber-800' :
                          'bg-blue-200/80 text-blue-800'
                        )}>
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{flag.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ====================================================
            FEATURE 5: "WHY THIS VENDOR?" EXPLANATION
            ==================================================== */}
        {recommended && explanation && (
          <Card className="bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles size={20} />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Why {recommended.vendorName}? (Decision Rationale)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transparent, deterministic reasoning synthesized from weighted evaluation factors and competitor trade-offs.
                  </p>
                </div>

                <div className="bg-white/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    "{explanation.summary}"
                  </p>

                  {/* Key Strengths */}
                  {explanation.strengths.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Strengths & Differentiators:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {explanation.strengths.map((str, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-100 rounded-lg p-2 font-medium">
                            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{str}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Trade-offs */}
                  {explanation.tradeoffs.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Important Trade-off Considerations:</p>
                      <div className="space-y-1.5">
                        {explanation.tradeoffs.map((tr, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2 font-medium">
                            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>{tr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ====================================================
            VENDOR RANKING & FEATURE 2: SCORE BREAKDOWN
            ==================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vendor Ranking & Multi-Criteria Scores</h3>
              <p className="text-xs text-slate-500">Only eligible vendors participate in the ranking. Expand rows for detailed formulas.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-500">Active Weights:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">P: {weights.price}%</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">W: {weights.warranty}%</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">D: {weights.delivery}%</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">R: {weights.rating}%</span>
            </div>
          </div>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Vendor</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Price (Raw)</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Warranty</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Delivery</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Rating</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-indigo-600 uppercase">Score</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Eligibility</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.scores.map((s, idx) => {
                    const isExpanded = expandedBreakdown === s.quotationId;
                    return (
                      <React.Fragment key={s.quotationId}>
                        <tr className={cn(
                          'transition-colors',
                          s.isRecommended ? 'bg-indigo-50/60 font-semibold' : !s.isEligible ? 'bg-slate-50/40 text-slate-400' : 'hover:bg-slate-50/80'
                        )}>
                          <td className="px-5 py-3 text-xs font-bold">
                            {s.isEligible ? `#${idx + 1}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {s.isRecommended && <Trophy size={15} className="text-amber-500 flex-shrink-0" />}
                              <div>
                                <p className={cn('font-bold', s.isRecommended ? 'text-indigo-900' : s.isEligible ? 'text-slate-900' : 'text-slate-500')}>
                                  {s.vendorName}
                                </p>
                                <p className="text-[11px] text-slate-400">{s.vendorCompany}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(s.price)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{s.warrantyMonths} mo</td>
                          <td className="px-4 py-3 text-right text-slate-600">{s.deliveryDays} d</td>
                          <td className="px-4 py-3 text-right text-amber-600 font-semibold">★ {s.vendorRating}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-base">
                            {s.isEligible ? (
                              <span className={getScoreColor(s.finalScore)}>{s.finalScore}</span>
                            ) : (
                              <span className="text-xs text-rose-500 font-semibold">Ineligible</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.isEligible ? (
                              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                                Eligible
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">
                                Disqualified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.isEligible ? (
                              <button
                                type="button"
                                onClick={() => setExpandedBreakdown(isExpanded ? null : s.quotationId)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                              >
                                <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>

                        {/* FEATURE 2: Detailed Score Breakdown Expanded Row */}
                        {isExpanded && s.isEligible && s.breakdown && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                    Mathematical Score Breakdown for {s.vendorName}
                                  </h4>
                                  <span className="text-xs text-slate-500">
                                    Final Score: <strong>{s.finalScore}</strong> / 100
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {s.breakdown.map((b) => (
                                    <div key={b.factor} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700">{b.label}</span>
                                        <span className="text-slate-500 font-medium">Raw: {b.formattedRaw}</span>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                          <span>Normalized: {b.normalizedScore}/100</span>
                                          <span>Weight: {b.weight}%</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className={cn(
                                              'h-full rounded-full',
                                              b.factor === 'price' ? 'bg-indigo-600' :
                                              b.factor === 'warranty' ? 'bg-emerald-500' :
                                              b.factor === 'delivery' ? 'bg-blue-500' : 'bg-amber-500'
                                            )}
                                            style={{ width: `${Math.min(100, b.normalizedScore)}%` }}
                                          />
                                        </div>
                                      </div>

                                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                        <span className="text-slate-400 font-mono text-[11px]">{b.normalizedScore} × {b.weight}%</span>
                                        <span className="font-extrabold text-indigo-700">+{b.weightedContribution}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-900 flex items-center justify-between">
                                  <span>Formula: Σ (Normalized Score × Weight)</span>
                                  <span className="font-mono font-bold">
                                    {s.priceContribution} + {s.warrantyContribution} + {s.deliveryContribution} + {s.ratingContribution} = {s.finalScore}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ====================================================
            FEATURE 3: WHAT-IF ANALYSIS (SCENARIO SIMULATOR)
            ==================================================== */}
        <section aria-label="What-If Analysis">
          <Card className="border-indigo-200 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/20 shadow-md">
            <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold mb-1.5">
                  <Sliders size={13} />
                  <span>Interactive Scenario Simulator</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">What-If Analysis</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modify criteria weights temporarily to evaluate how sensitive the recommendation is to organizational priorities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleResetScenario} leftIcon={<RotateCcw size={13} />}>
                  Reset Scenario
                </Button>
                <Button
                  size="sm"
                  disabled={totalScenarioWeight !== 100}
                  onClick={() => setShowApplyConfirm(true)}
                  leftIcon={<Check size={14} />}
                >
                  Apply Scenario
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Sliders Area */}
              <div className="lg:col-span-5 space-y-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Test New Weight Scenario:</p>

                <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <WeightSlider
                    label="Price Weight"
                    value={scenarioWeights.price}
                    onChange={(v) => updateScenarioWeight('price', v)}
                    color="text-indigo-600"
                  />
                  <WeightSlider
                    label="Warranty Weight"
                    value={scenarioWeights.warranty}
                    onChange={(v) => updateScenarioWeight('warranty', v)}
                    color="text-emerald-600"
                  />
                  <WeightSlider
                    label="Delivery Weight"
                    value={scenarioWeights.delivery}
                    onChange={(v) => updateScenarioWeight('delivery', v)}
                    color="text-blue-600"
                  />
                  <WeightSlider
                    label="Rating Weight"
                    value={scenarioWeights.rating}
                    onChange={(v) => updateScenarioWeight('rating', v)}
                    color="text-amber-600"
                  />

                  {/* Weight Total Indicator */}
                  <div className={cn(
                    'rounded-xl p-2.5 text-center text-xs font-bold transition-colors',
                    totalScenarioWeight === 100 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  )}>
                    {totalScenarioWeight === 100 ? (
                      <p>✓ Total Weights: 100% (Valid Scenario)</p>
                    ) : (
                      <p>Criteria weights must total 100% (Current: {totalScenarioWeight}%)</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulation Result Area */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Simulation Outcome:</p>

                {scenarioResult ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex-1">
                    {/* Status Banner */}
                    <div className={cn(
                      'p-4 rounded-xl border flex items-start gap-3',
                      scenarioResult.recommendationChanged
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    )}>
                      {scenarioResult.recommendationChanged ? (
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold">
                          {scenarioResult.recommendationChanged ? 'Recommendation Changed under this Scenario' : 'Recommendation Unchanged'}
                        </h4>
                        <p className="text-xs mt-1 leading-relaxed">
                          {scenarioResult.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Winner Comparison Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[11px] uppercase font-bold text-slate-400 block">Original Winner</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scenarioResult.originalWinnerName ?? 'None'}</p>
                        <p className="text-xs text-slate-500">Score: {scenarioResult.originalWinnerScore ?? 0} / 100</p>
                      </div>
                      <div className={cn(
                        'p-3 rounded-lg border',
                        scenarioResult.recommendationChanged ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                      )}>
                        <span className="text-[11px] uppercase font-bold text-indigo-700 block">Scenario Winner</span>
                        <p className="text-sm font-bold text-indigo-900 mt-0.5">{scenarioResult.scenarioWinnerName ?? 'None'}</p>
                        <p className="text-xs text-indigo-700">Simulated Score: {scenarioResult.scenarioWinnerScore ?? 0} / 100</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      Note: What-If Analysis is purely a client-side simulation. It does not overwrite your saved comparison or active weights until you click <strong>Apply Scenario</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                    <AlertCircle size={28} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium">Scenario calculation disabled.</p>
                    <p className="text-xs text-slate-500">Please adjust weights so the total equals exactly 100%.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Visual Analytics (Recharts Bar & Radar Charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Score Distribution (Eligible Vendors)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={result.eligibleScores.map((s) => ({
                name: s.vendorName,
                'Final Score': s.finalScore,
                'Price Score': s.priceScore,
                'Warranty Score': s.warrantyScore,
              }))} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Final Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Price Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Warranty Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Multi-Criteria Radar Analysis</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={[
                { metric: 'Price', ...Object.fromEntries(result.eligibleScores.map((s) => [s.vendorName, s.priceScore])) },
                { metric: 'Warranty', ...Object.fromEntries(result.eligibleScores.map((s) => [s.vendorName, s.warrantyScore])) },
                { metric: 'Delivery', ...Object.fromEntries(result.eligibleScores.map((s) => [s.vendorName, s.deliveryScore])) },
                { metric: 'Rating', ...Object.fromEntries(result.eligibleScores.map((s) => [s.vendorName, s.ratingScore])) },
              ]}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                {result.eligibleScores.map((s, i) => (
                  <Radar
                    key={s.vendorId}
                    name={s.vendorName}
                    dataKey={s.vendorName}
                    stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fillOpacity={0.12}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Apply Scenario */}
      <ConfirmDialog
        open={showApplyConfirm}
        onClose={() => setShowApplyConfirm(false)}
        onConfirm={handleApplyScenario}
        title="Apply What-If Scenario?"
        description="Applying this scenario will change the comparison criteria weights and may change the recommended vendor. Continue?"
        confirmLabel="Apply Scenario"
      />
    </div>
  );
};

export default NewComparisonPage;
