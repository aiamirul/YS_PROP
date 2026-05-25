/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalculatorInputs } from './types';
import { generateProjections } from './utils';
import FinancialCalculator from './components/FinancialCalculator';
import ProceedsChart from './components/ProceedsChart';
import SimCampaign from './components/SimCampaign';
import EducatorSection from './components/EducatorSection';
import PropertyComparison from './components/PropertyComparison';
import { 
  Building, LayoutDashboard, Compass, BookOpen, 
  HelpCircle, ShieldCheck, Coins, Landmark, Sparkles 
} from 'lucide-react';

const DEFAULT_INPUTS: CalculatorInputs = {
  propertyPrice: 300000,          // RM 300,000
  depositPercent: 10,             // 10% (RM 30,000)
  loanTermYears: 30,              // 30 Years
  interestRate: 4.0,              // 4% reducing balance mortgage
  sizeSqft: 800,                  // 800 sqft
  maintenancePsf: 0.30,           // RM 0.30 psf
  quitRentAndAssessment: 500,     // RM 500 / year (default)
  monthlyRent: 1600,              // Rent at RM 1,600 (default)
  renovationCost: 15000,          // RM 15,000 (optional renovation)
  appreciationRate: 3.0,          // Toggle scenarios
  occupancyMonthsPerYear: 11,     // 11 months out of 12 (typical)
  citizenStatus: 'citizen'        // Malaysian citizen
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'campaign' | 'sandbox'>('campaign');
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);

  // Saved Property sets for side by side comparisons
  const [savedProperties, setSavedProperties] = useState<Record<'A' | 'B' | 'C', CalculatorInputs | null>>(() => {
    try {
      const saved = localStorage.getItem('propsim_saved_properties');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage access is blocked or restricted:', e);
    }
    return { A: null, B: null, C: null };
  });

  const saveProperty = (slot: 'A' | 'B' | 'C') => {
    setSavedProperties(prev => {
      const updated = { ...prev, [slot]: { ...inputs } };
      try {
        localStorage.setItem('propsim_saved_properties', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save is blocked or restricted:', e);
      }
      return updated;
    });
  };

  const loadProperty = (slot: 'A' | 'B' | 'C') => {
    const saved = savedProperties[slot];
    if (saved) {
      setInputs(saved);
    }
  };

  const clearProperty = (slot: 'A' | 'B' | 'C') => {
    setSavedProperties(prev => {
      const updated = { ...prev, [slot]: null };
      try {
        localStorage.setItem('propsim_saved_properties', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage clear has failed:', e);
      }
      return updated;
    });
  };

  // Projection timeframe state
  const [forecastYears, setForecastYears] = useState<number>(15);

  // Compute live calculations
  const { upfrontCosts, yearlyData } = generateProjections(inputs, forecastYears);

  const totalUpfrontFees = upfrontCosts.spaLegal + upfrontCosts.spaStampDuty + upfrontCosts.loanLegal + upfrontCosts.loanStampDuty + upfrontCosts.valuation;

  const monthlyMaintenance = inputs.sizeSqft * inputs.maintenancePsf;
  const loanAmount = inputs.propertyPrice - upfrontCosts.deposit;

  // Monthly mortgage repayment calculated on standard amortized reducing balance formula
  const r = (inputs.interestRate / 100) / 12;
  const n = inputs.loanTermYears * 12;
  const monthlyMortgage = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-600 selection:text-white pb-12 font-sans">
      
      {/* Dynamic Header with Malaysian Flag Accent at Very Top */}
      <header className="bg-white border-b border-slate-200 py-5 px-4 md:px-8 relative overflow-hidden shadow-sm">
        {/* Subtle Malaysia Theme Decal */}
        <div className="absolute top-0 left-0 w-full h-1 flex">
          <div className="flex-1 bg-[#01411C]"></div> {/* Green */}
          <div className="flex-1 bg-[#EE2C2C]"></div> {/* Red */}
          <div className="flex-1 bg-[#FCD116]"></div> {/* Yellow */}
          <div className="flex-1 bg-[#000080]"></div> {/* Blue */}
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold uppercase rounded border border-indigo-200">
                Financial Literacy Applet
              </span>
              <span className="text-slate-500 font-mono text-xs">• Malaysia Context</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Geometric Balance Logo Block */}
              <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded-sm rotate-45 hover:rotate-90 transition-transform duration-300">
                <div className="w-4 h-4 border-2 border-white -rotate-45"></div>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase font-display">
                PropSim <span className="font-light text-slate-500 underline underline-offset-4 decoration-1">MY-Landlord</span>
              </h1>
            </div>

            <p className="text-xs text-slate-500 leading-normal max-w-2xl font-medium">
              An educational sandbox visualizer detailing the hidden frictional buying costs, reducing loan balance amortizations, RPGT taxes, and vacancies of Malaysian landlord portfolios.
            </p>
          </div>

          <div className="flex gap-2 items-center bg-slate-100 p-3 border border-slate-200 rounded-sm max-w-xs w-full text-left shadow-sm">
            <span className="text-2xl select-none">📊</span>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono font-bold">Simulated Property</span>
              <span className="text-xs font-bold text-slate-800">RM 300k, USJ Subang Flat</span>
              <span className="block text-[10px] text-slate-500 font-mono">Size: 800 sqft • Rent: RM 1.6k/mo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main navigation controls */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        
        {/* Navigation Tabs - Clean Geometric segment control */}
        <div id="navigation-tabs" className="flex bg-slate-200/80 p-1.5 rounded-md gap-2 w-fit">
          <button
            onClick={() => setActiveTab('campaign')}
            className={`py-2 px-5 font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'campaign' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 hover:text-slate-950 hover:bg-white/40'}`}
          >
            <Compass className="w-4 h-4" /> Interactive Campaign Game
          </button>
          
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-2 px-5 font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'sandbox' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 hover:text-slate-950 hover:bg-white/40'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Static Sandbox Modeler
          </button>
        </div>

        {/* Tab Content 1: Interactive Landlord Campaign Story */}
        {activeTab === 'campaign' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-lg p-5 md:p-6 text-xs md:text-sm text-slate-650 max-w-4xl flex flex-col md:flex-row items-center gap-4 shadow-sm">
              <span className="text-3xl p-3.5 bg-indigo-50 text-indigo-700 rounded-sm">🎯</span>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-xs">The Campaign Challenge:</p>
                <p className="leading-relaxed text-slate-500 font-medium">
                  Welcome to the landlord office! You will play through consecutive years of property ownership. Your task is to handle <strong>tenant negotiations</strong>, cover <strong>leak plumbing bills</strong>, purchase <strong>community LRT accessibility upgrades</strong>, and survive high-vacancy gaps. Hold or Sell your property at the absolute peak holding Year to bypass SRO lawyers and lock in heavy capital returns.
                </p>
              </div>
            </div>
            <SimCampaign inputs={inputs} onResetToCalculator={() => setActiveTab('sandbox')} />
          </div>
        )}

        {/* Tab Content 2: Sandboxed Sandbox Estimator Modeler */}
        {activeTab === 'sandbox' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Quick Metrics HUD Top line */}
            <div id="quick-metrics-hud" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Purchase Base Outlay */}
              <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Calculated Initial Outlay</span>
                  <div className="text-xl font-mono font-bold text-slate-900 border-b-2 border-slate-900 pb-0.5 mt-1">
                    RM {Math.round(upfrontCosts.totalInitialOutlay).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Incl. deposit, SRO lawyers, MOT</span>
                </div>
                <div className="h-9 w-9 rounded-sm bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 font-bold text-sm shrink-0">
                  💰
                </div>
              </div>

              {/* Monthly Cost Outflow */}
              <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Monthly Cash commitment</span>
                  <div className="text-xl font-mono font-bold text-slate-900 border-b-2 border-slate-900 pb-0.5 mt-1">
                    RM {Math.round(monthlyMortgage + monthlyMaintenance).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Mortgage RM {Math.round(monthlyMortgage)} + Maint RM {Math.round(monthlyMaintenance)}</span>
                </div>
                <div className="h-9 w-9 rounded-sm bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 font-bold text-sm shrink-0">
                  💸
                </div>
              </div>

              {/* Net monthly rental yield surplus */}
              {(() => {
                const occupancyRatio = inputs.occupancyMonthsPerYear / 12;
                const monthlyAvgIncome = inputs.monthlyRent * occupancyRatio;
                const monthlyExpenses = (monthlyMaintenance + (inputs.quitRentAndAssessment / 12));
                const averageSurplus = monthlyAvgIncome - monthlyMortgage - monthlyExpenses;
                return (
                  <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Net Operating cash surplus</span>
                      <div className={`text-xl font-mono font-bold border-b-2 pb-0.5 mt-1 ${averageSurplus >= 0 ? 'text-emerald-650 border-emerald-600' : 'text-rose-650 border-rose-600'}`}>
                        {averageSurplus >= 0 ? '+' : ''}RM {Math.round(averageSurplus).toLocaleString()}/mo
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 block">Averaging out vacancy gaps</span>
                    </div>
                    <div className={`h-9 w-9 rounded-sm flex items-center justify-center font-bold text-sm shrink-0 ${averageSurplus >= 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-rose-55 border border-rose-200 text-rose-600'}`}>
                      📈
                    </div>
                  </div>
                );
              })()}

              {/* SRO legal and MOT Paperwork cost percentage */}
              <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">MALAYSIA PAPERWORK Sunk Costs</span>
                  <div className="text-xl font-mono font-bold text-amber-700 border-b-2 border-amber-500 pb-0.5 mt-1">
                    RM {Math.round(totalUpfrontFees).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Equivalent to {(totalUpfrontFees / inputs.propertyPrice * 100).toFixed(1)}% of price!</span>
                </div>
                <div className="h-9 w-9 rounded-sm bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-750 shrink-0">
                  📜
                </div>
              </div>

            </div>

            {/* RESTILES LAYOUT: Plot is placed on top of Settings for tight and logical visual flow */}
            <div id="sandbox-plot-top" className="space-y-6">
              
              {/* Top Row Full-width: Visualizer Chart Timeline */}
              <ProceedsChart 
                projections={yearlyData} 
                initialOutlay={upfrontCosts.totalInitialOutlay} 
                forecastYears={forecastYears}
                onForecastYearsChange={setForecastYears}
              />

              {/* Middle Row Full-width: Saved Property Side-by-Side Comparison Matrix */}
              <PropertyComparison
                activeInputs={inputs}
                savedProperties={savedProperties}
                onSave={saveProperty}
                onLoad={loadProperty}
                onClear={clearProperty}
              />

              {/* Bottom Row: Split layout with tighter settings inputs and static breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Calculator Modeler (which can be collapsed to standard formula) */}
                <div className="lg:col-span-7">
                  <FinancialCalculator inputs={inputs} setInputs={setInputs} />
                </div>

                {/* Right side: Detailed legal breakdowns & Sunk entry commissions card */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Sunk Fees and Legal breakdown card */}
                  <div className="bg-white border border-slate-200 rounded-sm p-5 md:p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                      Upfront Purchasing Fees Breakdown (Malaysia Regulations)
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-center">
                      <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 shadow-sm">
                        <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">SPA Legal fee</span>
                        <strong className="block text-slate-900 text-sm mt-1">RM {Math.round(upfrontCosts.spaLegal).toLocaleString()}</strong>
                        <span className="text-[9px] text-slate-400">1.25% bracket</span>
                      </div>

                      <div className="bg-slate-55 p-3 rounded-sm border border-slate-200 shadow-sm">
                        <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">SPA Stamp (MOT)</span>
                        <strong className="block text-slate-900 text-sm mt-1">RM {Math.round(upfrontCosts.spaStampDuty).toLocaleString()}</strong>
                        <span className="text-[9px] text-slate-400">Tiered (1%-2%)</span>
                      </div>

                      <div className="bg-slate-55 p-3 rounded-sm border border-slate-250 shadow-sm">
                        <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">Loan Legal & Stamp</span>
                        <strong className="block text-slate-900 text-sm mt-1">RM {Math.round(upfrontCosts.loanLegal + upfrontCosts.loanStampDuty).toLocaleString()}</strong>
                        <span className="text-[9px] text-slate-400">Incl. 0.5% duty</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 shadow-sm">
                        <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">Valuation fee</span>
                        <strong className="block text-slate-900 text-sm mt-1">RM {Math.round(upfrontCosts.valuation).toLocaleString()}</strong>
                        <span className="text-[9px] text-slate-400">Scale estimation</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-650 leading-relaxed bg-indigo-50/50 p-4 rounded-sm border border-indigo-150 font-medium">
                      💡 <strong>Real Estate Entry Friction Note:</strong> Before receiving rental keys, a Malaysian landlord has spent <strong className="text-indigo-800">RM {Math.round(totalUpfrontFees).toLocaleString()}</strong> in purely fictional paper fees and stamp clearances. These charges represent an immediate <strong>frictional penalty gap of -{(totalUpfrontFees / inputs.propertyPrice * 100).toFixed(1)}% on your portfolio</strong>. This is why quick house flipping in under 3 years almost guarantees financial losses under RPGT controls limits.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* Global Educational Resource Center below */}
        <EducatorSection />

        {/* Dynamic Warning Notice */}
        <div className="border border-slate-200 bg-white rounded-lg p-5 text-center text-xs text-slate-500 max-w-4xl mx-auto space-y-1 shadow-sm">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">⚠️ Educational & Computational Use Only</p>
          <p className="leading-relaxed">
            This simulator applies reducing-balance monthly interest calculations based on standard banking formulas, statutory Solicitors’ Remuneration SRO 2023 fees, stamp duty scales, and real property gains taxes of Malaysia. Actual loan approvals, interest rates, valuation reports, and individual RPGT exclusions (e.g. lifetime RPGT waiver on residential flats) depend on bank underwriters and LHDN audits.
          </p>
        </div>

      </div>
    </div>
  );
}
