/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalculatorInputs } from '../types';
import { generateProjections } from '../utils';
import { Save, RefreshCw, Trash2, ArrowRight, Layers, FileSpreadsheet, Percent, Coins, Landmark } from 'lucide-react';

interface PropertyComparisonProps {
  activeInputs: CalculatorInputs;
  savedProperties: Record<'A' | 'B' | 'C', CalculatorInputs | null>;
  onSave: (slot: 'A' | 'B' | 'C') => void;
  onLoad: (slot: 'A' | 'B' | 'C') => void;
  onClear: (slot: 'A' | 'B' | 'C') => void;
}

export default function PropertyComparison({
  activeInputs,
  savedProperties,
  onSave,
  onLoad,
  onClear
}: PropertyComparisonProps) {
  
  // Helper to pre-calculate values for a set of inputs
  const getMetrics = (inputs: CalculatorInputs | null) => {
    if (!inputs) return null;
    const { upfrontCosts, yearlyData } = generateProjections(inputs, 15);
    
    // Monthly details
    const loanAmount = inputs.propertyPrice * (1 - inputs.depositPercent / 100);
    const r = (inputs.interestRate / 100) / 12;
    const n = inputs.loanTermYears * 12;
    const monthlyMortgage = r > 0 
      ? loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      : loanAmount / n;
    
    const monthlyMaintenance = inputs.sizeSqft * inputs.maintenancePsf;
    const monthlyExpenses = monthlyMaintenance + (inputs.quitRentAndAssessment / 12);
    
    const occupancyRatio = inputs.occupancyMonthsPerYear / 12;
    const effectiveMonthlyRent = inputs.monthlyRent * occupancyRatio;
    const monthlySurplus = effectiveMonthlyRent - monthlyMortgage - monthlyExpenses;
    const initialOutlay = upfrontCosts.totalInitialOutlay;
    const sunkPurchasingFees = upfrontCosts.spaLegal + upfrontCosts.spaStampDuty + upfrontCosts.loanLegal + upfrontCosts.loanStampDuty + upfrontCosts.valuation;

    // Year 5
    const y5 = yearlyData[4]; // index 4 is Year 5
    // Year 10
    const y10 = yearlyData[9]; // index 9 is Year 10

    return {
      inputs,
      initialOutlay,
      sunkPurchasingFees,
      monthlyMortgage,
      monthlyMaintenance,
      effectiveMonthlyRent,
      monthlySurplus,
      y5ProjectedProfit: y5?.netProfitIfSold ?? 0,
      y5ProjectedROI: y5?.roiPercentIfSold ?? 0,
      y5Value: y5?.propertyValue ?? 0,
      y10ProjectedProfit: y10?.netProfitIfSold ?? 0,
      y10ProjectedROI: y10?.roiPercentIfSold ?? 0,
    };
  };

  const activeMetrics = getMetrics(activeInputs)!;
  const metricsA = getMetrics(savedProperties.A);
  const metricsB = getMetrics(savedProperties.B);
  const metricsC = getMetrics(savedProperties.C);

  interface Column {
    key: 'active' | 'A' | 'B' | 'C';
    label: string;
    metrics: ReturnType<typeof getMetrics>;
    isCurrent?: boolean;
    slot?: 'A' | 'B' | 'C';
  }

  const columns: Column[] = [
    { key: 'active', label: 'Active Sandbox', metrics: activeMetrics, isCurrent: true },
    { key: 'A', label: 'Property A', metrics: metricsA, slot: 'A' },
    { key: 'B', label: 'Property B', metrics: metricsB, slot: 'B' },
    { key: 'C', label: 'Property C', metrics: metricsC, slot: 'C' }
  ];

  return (
    <div id="property-comparison-matrix" className="bg-white border border-slate-200 rounded-sm p-5 md:p-6 text-slate-800 font-sans shadow-sm space-y-6">
      
      {/* Header section with modern badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
              Side-by-Side Property Comparison Portfolio
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Compare key inputs, cashflows, entry paperwork liabilities, and projected investment returns across saved simulations.
          </p>
        </div>
        
        {/* Quick Help Label */}
        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-sm block w-fit self-start sm:self-center">
          SAVE MULTIPLE SCENARIOS TO COMPARE
        </span>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col, idx) => {
          const { label, metrics, isCurrent } = col;
          const isSlotActive = !!metrics;

          return (
            <div 
              key={col.key} 
              id={`col-${col.key}`}
              className={`border rounded-sm flex flex-col justify-between overflow-hidden transition-all ${
                isCurrent 
                  ? 'border-indigo-600 bg-indigo-50/5 ring-1 ring-indigo-600/25 shadow-md md:scale-[1.01]' 
                  : isSlotActive 
                    ? 'border-slate-300 bg-white hover:border-slate-400 shadow-sm' 
                    : 'border-dashed border-slate-300 bg-slate-50/30'
              }`}
            >
              {/* Header Box */}
              <div 
                className={`p-3 border-b flex items-center justify-between ${
                  isCurrent 
                    ? 'bg-indigo-600 text-white border-indigo-700' 
                    : isSlotActive 
                      ? 'bg-slate-100 border-slate-200 text-slate-800' 
                      : 'bg-slate-100/50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isCurrent && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block"></span>}
                  <span className="text-xs font-black uppercase font-display tracking-wider">
                    {label}
                  </span>
                </div>
                
                {/* Save/Restore/Clear buttons for property slots */}
                {!isCurrent && (
                  <div className="flex gap-1.5">
                    {isSlotActive ? (
                      <>
                        <button
                          onClick={() => onLoad(col.slot as 'A' | 'B' | 'C')}
                          title="Load this set back into active modeler"
                          className="p-1 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-300 rounded-sm cursor-pointer transition-all hover:scale-105"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSave(col.slot as 'A' | 'B' | 'C')}
                          title="Overwrite this slot with active sandbox inputs"
                          className="p-1 bg-white hover:bg-slate-50 text-emerald-700 border border-slate-300 rounded-sm cursor-pointer transition-all hover:scale-105"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onClear(col.slot as 'A' | 'B' | 'C')}
                          title="Clear this slot"
                          className="p-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 rounded-sm cursor-pointer transition-all hover:scale-105"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onSave(col.slot as 'A' | 'B' | 'C')}
                        className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Save className="w-3 h-3" /> Save Cur.
                      </button>
                    )}
                  </div>
                )}
                {isCurrent && (
                  <span className="text-[9px] font-bold tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-full font-mono uppercase">
                    Active
                  </span>
                )}
              </div>

              {/* Metrics Box */}
              <div className="p-3.5 space-y-4 flex-1">
                {isSlotActive && metrics ? (
                  <div className="space-y-4 text-xs font-mono">
                    
                    {/* Item 1: Capital inputs */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Property & Purchase</span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                        <div className="bg-slate-50 p-1 px-1.5 rounded-sm border border-slate-100">
                          <span className="text-[8px] text-slate-400 block uppercase font-sans">Price</span>
                          <strong className="text-slate-900">RM {Math.round(metrics.inputs.propertyPrice).toLocaleString()}</strong>
                        </div>
                        <div className="bg-slate-50 p-1 px-1.5 rounded-sm border border-slate-100">
                          <span className="text-[8px] text-slate-400 block uppercase font-sans">Deposit</span>
                          <strong className="text-slate-900">{metrics.inputs.depositPercent}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Financial Outputs */}
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Initial Capital Outlay</span>
                      <div className="text-slate-900 text-sm font-extrabold flex justify-between items-baseline">
                        <span>RM {Math.round(metrics.initialOutlay).toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 font-normal">Sunk: RM {Math.round(metrics.sunkPurchasingFees).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Item 3: Rent Flow */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Monthly Cash Flow</span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-505">
                          <span>Eff. Rent ({metrics.inputs.occupancyMonthsPerYear}/12m):</span>
                          <span>RM {Math.round(metrics.effectiveMonthlyRent)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-505">
                          <span>Mortgage ({metrics.inputs.interestRate}%):</span>
                          <span>-RM {Math.round(metrics.monthlyMortgage)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-555 pb-1 border-b border-dashed border-slate-100">
                          <span>Expenses/Maint:</span>
                          <span>-RM {Math.round(metrics.monthlyMaintenance + metrics.inputs.quitRentAndAssessment / 12)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-1">
                          <span className="font-sans font-bold text-[10px] text-slate-500 uppercase">MONTHLY SURPLUS:</span>
                          <span className={`text-[12px] font-black p-0.5 px-1.5 rounded-sm ${
                            metrics.monthlySurplus >= 0 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {metrics.monthlySurplus >= 0 ? '+' : ''}RM {Math.round(metrics.monthlySurplus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 4: Scenarios & Appreciations */}
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Growth & Status</span>
                      <div className="flex justify-between text-[10px] text-slate-650">
                        <span>Appreciation:</span>
                        <span className="text-indigo-700 font-bold">+{metrics.inputs.appreciationRate}% p.a.</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-650">
                        <span>Citizenship:</span>
                        <span className="font-bold text-slate-800 uppercase text-[9px]">{metrics.inputs.citizenStatus}</span>
                      </div>
                    </div>

                    {/* Item 5: Exit Projections Comparative */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Projected Sale Results</span>
                      
                      <div className="space-y-1.5 bg-slate-50 p-2 rounded border border-slate-150">
                        <div className="flex justify-between text-[10.5px]">
                          <strong className="text-slate-800 font-sans">Year 5 Holding exit:</strong>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-505">Value:</span>
                          <span className="text-slate-900 font-bold">RM {Math.round(metrics.y5Value).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-505">Profit / Loss:</span>
                          <span className={`font-black ${metrics.y5ProjectedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metrics.y5ProjectedProfit >= 0 ? '+' : ''}RM {Math.round(metrics.y5ProjectedProfit).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-505">ROI % (p.a.):</span>
                          <span className={`font-extrabold ${metrics.y5ProjectedROI >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metrics.y5ProjectedROI >= 0 ? '+' : ''}{metrics.y5ProjectedROI.toFixed(1)}% ({ (metrics.y5ProjectedROI / 5).toFixed(1)}% p.a.)
                          </span>
                        </div>
                      </div>

                      {/* Year 10 Exit */}
                      <div className="space-y-1.5 bg-slate-50 p-2 rounded border border-slate-150">
                        <div className="flex justify-between text-[10.5px]">
                          <strong className="text-slate-800 font-sans">Year 10 Holding exit:</strong>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-505">Profit / Loss:</span>
                          <span className={`font-black ${metrics.y10ProjectedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metrics.y10ProjectedProfit >= 0 ? '+' : ''}RM {Math.round(metrics.y10ProjectedProfit).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-505">ROI % (p.a.):</span>
                          <span className={`font-extrabold ${metrics.y10ProjectedROI >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metrics.y10ProjectedROI >= 0 ? '+' : ''}{metrics.y10ProjectedROI.toFixed(1)}% ({ (metrics.y10ProjectedROI / 10).toFixed(1)}% p.a.)
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="h-44 flex flex-col justify-center items-center text-center p-4 py-8 space-y-2">
                    <span className="text-2xl opacity-60">📁</span>
                    <p className="text-xs text-slate-400 font-sans">Comparison Slot is Empty</p>
                    <button
                      onClick={() => onSave(col.slot as 'A' | 'B' | 'C')}
                      className="py-1 px-3 border border-indigo-200 hover:border-indigo-500 bg-indigo-50 text-indigo-700 rounded-sm font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                    >
                      <Save className="w-3 h-3" /> Save Sandbox Inputs
                    </button>
                  </div>
                )}
              </div>

              {/* Overwrite shortcut footer */}
              {isSlotActive && !isCurrent && (
                <div className="bg-slate-50 p-2 border-t text-center">
                  <button
                    onClick={() => onLoad(col.slot as 'A' | 'B' | 'C')}
                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    Load into Sandbox <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
