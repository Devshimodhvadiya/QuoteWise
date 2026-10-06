import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Trophy, TrendingDown, Shield, Clock, Star,
  CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getComparison } from '../../firebase/firestore';
import { Card } from '../../components/ui/Card';
import { PageHeader, PageLoader, EmptyState } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/comparison';
import { timeAgo, getScoreColor, cn } from '../../utils';
import type { Comparison, QuotationScore } from '../../types';

const RADAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const ComparisonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !userProfile?.companyName) return;
    getComparison(id, userProfile.companyName).then((c) => {
      if (c && c.companyId.trim().toLowerCase() !== userProfile.companyName.trim().toLowerCase()) {
        setComparison(null);
      } else {
        setComparison(c);
      }
      setLoading(false);
    });
  }, [id, userProfile?.companyName]);

  if (loading) return <PageLoader />;
  if (!comparison) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Trophy size={40} />}
          title="Comparison not found"
          action={
            <Link to="/history"><Button variant="outline">View History</Button></Link>
          }
        />
      </div>
    );
  }

  const eligibleScores = comparison.scores.filter((s) => s.isEligible !== false);
  const recommended = eligibleScores.find((s) => s.isRecommended) || comparison.scores[0];
  const budgetAnalysis = comparison.budgetAnalysis;
  const explanation = comparison.recommendationExplanation;

  return (
    <div className="pb-16">
      <PageHeader
        title="Saved Comparison Results"
        description={`${comparison.requirementTitle} · Saved ${timeAgo(comparison.createdAt)} by ${comparison.createdByName}`}
        breadcrumb={
          <Link to="/history" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} />
            Comparison History
          </Link>
        }
        action={
          <Link to={`/comparisons/new?requirementId=${comparison.requirementId}`}>
            <Button variant="outline" size="sm">
              Re-evaluate Comparison
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Weights & Constraints Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Weights Applied:</span>
            <WeightChip label="Price" value={comparison.weights.price} color="text-indigo-600" />
            <WeightChip label="Warranty" value={comparison.weights.warranty} color="text-emerald-600" />
            <WeightChip label="Delivery" value={comparison.weights.delivery} color="text-blue-600" />
            <WeightChip label="Rating" value={comparison.weights.rating} color="text-amber-600" />
          </div>

          {comparison.constraints && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-500">Constraints:</span>
              {comparison.constraints.maxBudget && (
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  Budget Cap: {formatCurrency(comparison.constraints.maxBudget)}
                </span>
              )}
              {comparison.constraints.maxDeliveryDays && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  Max Delivery: {comparison.constraints.maxDeliveryDays}d
                </span>
              )}
              {comparison.constraints.minWarrantyMonths && (
                <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                  Min Warranty: {comparison.constraints.minWarrantyMonths}m
                </span>
              )}
              {comparison.constraints.minVendorRating && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  Min Rating: ★{comparison.constraints.minVendorRating}
                </span>
              )}
            </div>
          )}
        </div>

        {/* DECISION SUMMARY CARD */}
        {recommended ? (
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Trophy size={14} className="text-amber-300" />
                  <span>Approved Recommended Vendor</span>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-white">{comparison.recommendedVendorName}</h2>
                  <p className="text-indigo-200 text-sm">{recommended.vendorCompany}</p>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed pt-1">
                  {comparison.recommendationReason}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[170px] self-start lg:self-auto">
                <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold">Composite Score</p>
                <p className="text-5xl font-extrabold text-white my-1">{recommended.finalScore}</p>
                <p className="text-xs text-indigo-200">out of 100 points</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-indigo-200 uppercase font-medium">Quotation</p>
                <p className="text-base font-bold text-white mt-0.5">{formatCurrency(recommended.price)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-indigo-200 uppercase font-medium">Warranty</p>
                <p className="text-base font-bold text-white mt-0.5">{recommended.warrantyMonths} months</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-indigo-200 uppercase font-medium">Delivery</p>
                <p className="text-base font-bold text-white mt-0.5">{recommended.deliveryDays} days</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-indigo-200 uppercase font-medium">Rating</p>
                <p className="text-base font-bold text-amber-300 mt-0.5">★ {recommended.vendorRating} / 5</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-indigo-200 uppercase font-medium">Estimated Savings</p>
                <p className="text-base font-bold text-emerald-300 mt-0.5">
                  {formatCurrency(comparison.estimatedSavings ?? 0)}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-indigo-200 uppercase font-medium">Budget Status</p>
                <p className="text-base font-bold text-emerald-300 mt-0.5">
                  {budgetAnalysis?.isWithinBudget !== false ? '✓ Within Budget' : '⚠ Exceeds Budget'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* WHY THIS VENDOR EXPLANATION */}
        {explanation && (
          <Card className="bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles size={20} />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Why This Vendor? (Decision Rationale)
                  </h3>
                  <p className="text-xs text-slate-500">Documented justification captured at evaluation time.</p>
                </div>

                <div className="bg-white/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    "{explanation.summary}"
                  </p>

                  {explanation.strengths?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Strengths:</p>
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

                  {explanation.tradeoffs?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trade-off Considerations:</p>
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

        {/* RED FLAGS */}
        {comparison.allRedFlags && comparison.allRedFlags.length > 0 && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Recorded Risk Red Flags
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated flags identified during comparison.</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {comparison.allRedFlags.length} Flags
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {comparison.allRedFlags.map((flag) => {
                const isCrit = flag.severity === 'CRITICAL';
                const isWarn = flag.severity === 'WARNING';
                return (
                  <div
                    key={flag.id}
                    className={cn(
                      'p-3.5 rounded-xl border flex items-start gap-3',
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
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded tracking-wider">
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

        {/* SCORE TABLE WITH DETAILED BREAKDOWN */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Score Breakdown & Vendor Performance</h3>
            <span className="text-xs text-slate-500">Normalized Scores & Contributions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Warranty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Delivery</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-indigo-600 uppercase">Price Score</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-green-600 uppercase">Warranty Score</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600 uppercase">Delivery Score</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-600 uppercase">Rating Score</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-800 uppercase">Final</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {comparison.scores.map((s) => {
                  const isExpanded = expandedBreakdown === s.quotationId;
                  return (
                    <React.Fragment key={s.quotationId}>
                      <tr className={cn(s.isRecommended ? 'bg-indigo-50/50' : 'hover:bg-slate-50', 'transition-colors')}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {s.isRecommended && <Trophy size={14} className="text-amber-500" />}
                            <div>
                              <p className={`font-medium ${s.isRecommended ? 'text-indigo-700' : 'text-slate-900'}`}>{s.vendorName}</p>
                              <p className="text-xs text-slate-400">{s.vendorCompany}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.price)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{s.warrantyMonths} mo.</td>
                        <td className="px-4 py-3 text-right text-slate-600">{s.deliveryDays} days</td>
                        <td className="px-4 py-3 text-right text-amber-500">★ {s.vendorRating}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${getScoreColor(s.priceScore)}`}>{s.priceScore}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${getScoreColor(s.warrantyScore)}`}>{s.warrantyScore}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${getScoreColor(s.deliveryScore)}`}>{s.deliveryScore}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${getScoreColor(s.ratingScore)}`}>{s.ratingScore}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span className={getScoreColor(s.finalScore)}>{s.finalScore}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.breakdown && s.breakdown.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedBreakdown(isExpanded ? null : s.quotationId)}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              {isExpanded ? 'Hide' : 'Formulas'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && s.breakdown && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={11} className="px-6 py-3">
                            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                              <p className="font-bold text-slate-700">Detailed Contribution Formula for {s.vendorName}:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {s.breakdown.map((b) => (
                                  <div key={b.factor} className="bg-slate-50 p-2 rounded border border-slate-200">
                                    <p className="text-slate-500 font-medium">{b.label} (Weight: {b.weight}%)</p>
                                    <p className="text-slate-800 font-mono mt-0.5">{b.normalizedScore} × {b.weight}% = <strong>+{b.weightedContribution}</strong></p>
                                  </div>
                                ))}
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

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Score Comparison (Bar)</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={comparison.scores.map((s) => ({
                name: s.vendorName,
                'Final Score': s.finalScore,
                'Price Score': s.priceScore,
                'Warranty Score': s.warrantyScore,
              }))} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Final Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Price Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Warranty Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Multi-Criteria Radar Comparison</h3>
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={[
                { metric: 'Price', ...Object.fromEntries(comparison.scores.map((s) => [s.vendorName, s.priceScore])) },
                { metric: 'Warranty', ...Object.fromEntries(comparison.scores.map((s) => [s.vendorName, s.warrantyScore])) },
                { metric: 'Delivery', ...Object.fromEntries(comparison.scores.map((s) => [s.vendorName, s.deliveryScore])) },
                { metric: 'Rating', ...Object.fromEntries(comparison.scores.map((s) => [s.vendorName, s.ratingScore])) },
              ]}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                {comparison.scores.map((s, i) => (
                  <Radar
                    key={s.vendorId}
                    name={s.vendorName}
                    dataKey={s.vendorName}
                    stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fillOpacity={0.1}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

const WeightChip: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
    <span className="text-slate-500">{label}:</span>
    <span className={`font-bold ${color}`}>{value}%</span>
  </div>
);

export default ComparisonDetailPage;
