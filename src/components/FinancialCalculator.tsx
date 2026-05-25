/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, useState } from 'react';
import { CalculatorInputs } from '../types';
import { generateProjections } from '../utils';
import { 
  Home, Sliders, DollarSign, ShieldCheck, Ruler, Percent, HelpCircle, Eye, EyeOff, LayoutTemplate 
} from 'lucide-react';

interface FinancialCalculatorProps {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

export default function FinancialCalculator({ inputs, setInputs }: FinancialCalculatorProps) {
  const [isCompressed, setIsCompressed] = useState(false);
  
  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSliderChange = (field: keyof CalculatorInputs, e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    handleInputChange(field, val);
  };

  // Presets for Appreciation Rates
  const appreciationRatePresets = [
    { label: 'Stagnant (1.0%)', val: 1.0 },
    { label: 'Standard (3.0%)', val: 3.0 },
    { label: 'Healthy (4.5%)', val: 4.5 },
    { label: 'Booming (6.0%)', val: 6.0 }
  ];

  // Presets for Occupancy (monthly rental scenarios)
  const occupancyPresets = [
    { label: 'Perfect Year (12/12 mos)', val: 12 },
    { label: 'Typical Gap (11/12 mos)', val: 11 },
    { label: 'Hard Vacancy (10/12 mos)', val: 10 }
  ];

  // Compute live calculations for the formula views using existing utils
  const { upfrontCosts, yearlyData } = generateProjections(inputs, 15);
  const totalUpfrontFees = upfrontCosts.spaLegal + upfrontCosts.spaStampDuty + upfrontCosts.loanLegal + upfrontCosts.loanStampDuty + upfrontCosts.valuation;
  const monthlyMaintenance = inputs.sizeSqft * inputs.maintenancePsf;
  const loanAmount = inputs.propertyPrice * (1 - inputs.depositPercent / 100);

  const r = (inputs.interestRate / 100) / 12;
  const n = inputs.loanTermYears * 12;
  const monthlyMortgage = r > 0 
    ? loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : loanAmount / n;

  const occupancyRatio = inputs.occupancyMonthsPerYear / 12;
  const effectiveMonthlyRent = inputs.monthlyRent * occupancyRatio;
  const monthlyExpenses = monthlyMaintenance + (inputs.quitRentAndAssessment / 12);
  const monthlySurplus = effectiveMonthlyRent - monthlyMortgage - monthlyExpenses;

  // Year 5 exit estimation data
  const y5 = yearlyData[4] || yearlyData[yearlyData.length - 1];
  const y5Value = y5?.propertyValue ?? 0;
  const y5Loan = y5?.mortgageBalance ?? 0;
  const y5Profit = y5?.netProfitIfSold ?? 0;
  const y5Roi = y5?.roiPercentIfSold ?? 0;

  return (
    <div id="calculator-inputs-panel" className="bg-white border border-slate-200 rounded-sm p-6 text-slate-800 font-sans shadow-sm">
      
      {/* Header with compress button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight font-display">Investment Sandbox Modeler</h3>
            <p className="text-xs text-slate-500">Adjust variables or compress to formula</p>
          </div>
        </div>

        {/* Compress toggle button */}
        <button
          type="button"
          onClick={() => setIsCompressed(!isCompressed)}
          className={`py-1.5 px-3 rounded-sm font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            isCompressed 
              ? 'bg-amber-100 border border-amber-200 text-amber-800 hover:bg-amber-200 animate-pulse' 
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
          title={isCompressed ? 'Decompress & show inputs' : 'Compress to formula view'}
        >
          {isCompressed ? (
            <>
              <Eye className="w-3.5 h-3.5" /> Adjust Slides
            </>
          ) : (
            <>
              <LayoutTemplate className="w-3.5 h-3.5" /> Formula View
            </>
          )}
        </button>
      </div>

      {isCompressed ? (
        <div 
          onClick={() => setIsCompressed(false)}
          className="border border-indigo-200 bg-indigo-50/5 hover:bg-indigo-50/10 rounded-sm p-5 cursor-pointer transition-all space-y-5 shadow-inner"
          title="Click to expand controls"
        >
          <div className="flex items-center justify-between text-[9px] font-mono font-black text-indigo-700 border-b border-indigo-100 pb-2 mb-2">
            <span>📐 SYSTEM COMPRESSED TO FORMULA VIEW</span>
            <span className="underline uppercase tracking-wide">CLICK TO EDIT VARIABLES</span>
          </div>

          <div className="space-y-4 font-mono text-[11px] leading-relaxed text-slate-800">
            {/* Identity 1: Upfront Pocket Outlay */}
            <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-sm shadow-sm transition-all hover:border-slate-350">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Formula 1: Upfront Outlay</span>
              <div className="text-[11px] font-extrabold text-indigo-900 border-b border-slate-100 pb-1.5 font-mono">
                Outlay = Deposit + Purchasing Fees + Renovation
              </div>
              <div className="space-y-1 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>• Deposit ({inputs.depositPercent}% of RM {inputs.propertyPrice.toLocaleString()}):</span>
                  <span className="text-slate-900 font-bold">RM {Math.round(inputs.propertyPrice * inputs.depositPercent / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Stamp Duty & lawyers (SRO):</span>
                  <span className="text-slate-900 font-bold">RM {Math.round(totalUpfrontFees).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Renovation budget:</span>
                  <span className="text-slate-900 font-bold">RM {Math.round(inputs.renovationCost).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-indigo-50 p-2 border-t border-indigo-100 rounded-sm mt-2 text-[11px] font-bold">
                <span className="font-sans text-[9px] uppercase text-indigo-700 tracking-wider">Total Pocket Outlay:</span>
                <span className="text-indigo-800">RM {Math.round(upfrontCosts.totalInitialOutlay).toLocaleString()}</span>
              </div>
            </div>

            {/* Identity 2: Monthly Cashflow */}
            <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-sm shadow-sm transition-all hover:border-slate-350">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Formula 2: Operational Flow</span>
              <div className="text-[11px] font-extrabold text-indigo-900 border-b border-slate-100 pb-1.5">
                Surplus = Avg Rent - Mortgage - Maint - Cukai
              </div>
              <div className="space-y-1 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>• Eff. Rent ({inputs.occupancyMonthsPerYear}/12m average):</span>
                  <span className="text-slate-900 font-bold">RM {Math.round(effectiveMonthlyRent).toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>• Bank Mortgage ({inputs.interestRate}%, {inputs.loanTermYears}y):</span>
                  <span className="text-slate-900 font-bold">-RM {Math.round(monthlyMortgage).toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>• Maintenance & Cukai bills:</span>
                  <span className="text-slate-900 font-bold">-RM {Math.round(monthlyExpenses).toLocaleString()}/mo</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-indigo-50 p-2 border-t border-indigo-100 rounded-sm mt-2 text-[11px] font-bold">
                <span className="font-sans text-[9px] uppercase text-indigo-700 tracking-wider">Net Operating Surplus:</span>
                <span className={`p-0.5 px-1.5 rounded text-[11px] font-extrabold ${monthlySurplus >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {monthlySurplus >= 0 ? '+' : ''}RM {Math.round(monthlySurplus).toLocaleString()}/mo
                </span>
              </div>
            </div>

            {/* Identity 3: capital gain returns */}
            <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-sm shadow-sm transition-all hover:border-slate-350">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Formula 3: Exit Capital Returns (Y5)</span>
              <div className="text-[11px] font-extrabold text-indigo-900 border-b border-slate-100 pb-1.5">
                Profit = Value - Debt - Stamp - Agent + Cash - Outlay
              </div>
              <div className="space-y-1 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>• Future Value (+{inputs.appreciationRate}% p.a.):</span>
                  <span className="text-slate-900 font-bold">RM {Math.round(y5Value).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Outstanding Principal:</span>
                  <span className="text-slate-900 font-bold">-RM {Math.round(y5Loan).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Agent 3% & RPGT Tax (15%):</span>
                  <span className="text-slate-900 font-bold">-RM {Math.round(y5Value * 0.03 + y5?.rpgtTax).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-indigo-50 p-2 border-t border-indigo-100 rounded-sm mt-2 text-[11px] font-bold">
                <span className="font-sans text-[9px] uppercase text-indigo-700 tracking-wider">Estimated Year 5 Return:</span>
                <span className={`p-0.5 px-1.5 rounded text-[11px] font-extrabold ${y5Profit >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {y5Profit >= 0 ? '+' : ''}{y5Roi.toFixed(1)}% ROI
                </span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] font-mono text-indigo-600 font-bold tracking-wider">
            ⚙️ CLICK ANYONCE ON CONTAINER TO POP BACK SLIDERS
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* Core property values */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">1. Acquisition & Financing</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Price */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Property Purchase Price (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold select-none">RM</span>
                  <input
                    type="number"
                    value={inputs.propertyPrice}
                    onChange={(e) => handleInputChange('propertyPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-sm text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="flex justify-end text-[10px] text-indigo-600 font-mono font-bold">
                  RM {inputs.propertyPrice.toLocaleString()}
                </div>
              </div>

              {/* Deposit Percent */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex justify-between">
                  <span>Deposit Sunk-in ({inputs.depositPercent}%)</span>
                  <span className="text-indigo-600 font-bold font-mono">
                    RM {(inputs.propertyPrice * inputs.depositPercent / 100).toLocaleString()}
                  </span>
                </label>
                <div className="pt-2">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={inputs.depositPercent}
                    onChange={(e) => handleSliderChange('depositPercent', e)}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>5% (RM {(inputs.propertyPrice * 0.05).toLocaleString()})</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mortgage Rate */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex justify-between">
                  <span>Mortgage Rate (p.a.)</span>
                  <span className="text-indigo-600 font-bold font-mono">{inputs.interestRate}%</span>
                </label>
                <div className="pt-2">
                  <input
                    type="range"
                    min="2.5"
                    max="7.0"
                    step="0.1"
                    value={inputs.interestRate}
                    onChange={(e) => handleSliderChange('interestRate', e)}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>2.5%</span>
                  <span>7.0%</span>
                </div>
              </div>

              {/* Renovation Cost */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Renovation CapEx (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold select-none">RM</span>
                  <input
                    type="number"
                    value={inputs.renovationCost}
                    onChange={(e) => handleInputChange('renovationCost', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-sm text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="flex justify-end text-[10px] text-slate-500 font-mono">
                  RM {inputs.renovationCost.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Property Size and ongoing structural bills */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">2. Condo Dimension & Maintenance</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Units SQFT */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-indigo-500" />
                  <span>Unit Size (sqft)</span>
                </label>
                <input
                  type="number"
                  value={inputs.sizeSqft}
                  onChange={(e) => handleInputChange('sizeSqft', parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-sm text-xs font-mono font-bold text-slate-900"
                />
              </div>

              {/* Maintenance psf */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                  <Percent className="w-3 h-3 text-indigo-500" />
                  <span>Maint. (psf)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-slate-400 text-[10px] font-bold">RM</span>
                  <input
                    type="number"
                    step="0.05"
                    value={inputs.maintenancePsf}
                    onChange={(e) => handleInputChange('maintenancePsf', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-sm text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <span className="text-[10px] text-indigo-600 font-mono block mt-0.5 font-bold">
                  = RM {Math.round(inputs.sizeSqft * inputs.maintenancePsf)}/mo
                </span>
              </div>

              {/* Quit Rent */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-indigo-500" />
                  <span>Quit Rent / Cukai</span>
                </label>
                <input
                  type="number"
                  value={inputs.quitRentAndAssessment}
                  onChange={(e) => handleInputChange('quitRentAndAssessment', parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-sm text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Rent & Vacancy options */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">3. Rental Yields & Vacancies</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rent Rate */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Proposed Monthly Rent (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold select-none">RM</span>
                  <input
                    type="number"
                    value={inputs.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-sm text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="flex justify-end text-[10px] text-slate-500 font-mono">
                  RM {inputs.monthlyRent.toLocaleString()}/month
                </div>
              </div>

              {/* Citizen status toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Citizenship Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('citizenStatus', 'citizen')}
                    className={`p-2 rounded text-[11px] font-bold transition-all cursor-pointer ${inputs.citizenStatus === 'citizen' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-605 border border-slate-200'}`}
                  >
                    🇲🇾 Citizen (0% RPGT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('citizenStatus', 'foreigner')}
                    className={`p-2 rounded text-[11px] font-bold transition-all cursor-pointer ${inputs.citizenStatus === 'foreigner' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-605 border border-slate-200'}`}
                  >
                    🇺🇳 Foreigner (10%)
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Vacancy Scenario Toggle
              </span>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {occupancyPresets.map(preset => (
                  <button
                    type="button"
                    key={preset.val}
                    onClick={() => handleInputChange('occupancyMonthsPerYear', preset.val)}
                    className={`p-2.5 rounded text-[10.5px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${inputs.occupancyMonthsPerYear === preset.val ? 'bg-indigo-600 text-white border border-indigo-500 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-605 border border-slate-200'}`}
                  >
                    {preset.label.split(' ')[0]} {preset.label.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed mt-1">
                • Renting at {inputs.occupancyMonthsPerYear}/12 months results in <strong className="text-slate-800">RM {(inputs.monthlyRent * inputs.occupancyMonthsPerYear).toLocaleString()}</strong> gross annual revenue.
              </p>
            </div>
          </div>

          {/* Appreciation rates */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">4. Property Growth (Appreciation)</h4>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex justify-between">
                <span>Expected Annual Appreciation</span>
                <span className="text-indigo-600 font-bold font-mono">+{inputs.appreciationRate}% p.a.</span>
              </label>
              <div className="pt-1">
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.5"
                  value={inputs.appreciationRate}
                  onChange={(e) => handleSliderChange('appreciationRate', e)}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {appreciationRatePresets.map(preset => (
                  <button
                    type="button"
                    key={preset.val}
                    onClick={() => handleInputChange('appreciationRate', preset.val)}
                    className={`p-1.5 rounded text-[10px] font-semibold text-center transition-all cursor-pointer ${inputs.appreciationRate === preset.val ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'}`}
                  >
                    {preset.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
