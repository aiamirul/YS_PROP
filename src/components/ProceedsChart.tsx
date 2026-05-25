/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { YearlyProjection } from '../types';
import { Landmark, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface ProceedsChartProps {
  projections: YearlyProjection[];
  initialOutlay: number;
  forecastYears: number;
  onForecastYearsChange: (years: number) => void;
}

export default function ProceedsChart({ 
  projections, 
  initialOutlay,
  forecastYears,
  onForecastYearsChange
}: ProceedsChartProps) {
  const [activeYearIndex, setActiveYearIndex] = useState<number>(Math.min(4, projections.length - 1));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Keep index synchronized safely when list length changes
  React.useEffect(() => {
    setActiveYearIndex(prev => Math.max(0, Math.min(prev, projections.length - 1)));
  }, [projections.length]);

  const safeIndex = Math.max(0, Math.min(activeYearIndex, projections.length - 1));
  const activeData = projections[safeIndex] || projections[0];

  // Boundaries for graph 1: Property Value vs Loan Balance
  const maxVal = Math.max(...projections.map(d => d.propertyValue)) * 1.1;
  const minVal = 0;
  const graphWidth = 500;
  const graphHeight = 220;
  const paddingLeft = 65;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Map data to SVG coordinates for Graph 1 (scissors)
  const getCoords = (index: number, value: number) => {
    const x = paddingLeft + (index / (projections.length - 1)) * (graphWidth - paddingLeft - paddingRight);
    const y = paddingTop + (1 - (value - minVal) / (maxVal - minVal)) * (graphHeight - paddingTop - paddingBottom);
    return { x, y };
  };

  const propertyPoints = projections.map((d, idx) => getCoords(idx, d.propertyValue));
  const loanPoints = projections.map((d, idx) => getCoords(idx, d.mortgageBalance));

  const propertyPathString = propertyPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const loanPathString = loanPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // SVG coordinates for Graph 2: Net Profit & ROI
  // Profit can be negative, so we need a zero baseline
  const profits = projections.map(d => d.netProfitIfSold);
  const maxProfit = Math.max(...profits, 10000);
  const minProfit = Math.min(...profits, -30000);
  // Pad the bounds slightly
  const profitYMax = maxProfit * 1.15;
  const profitYMin = minProfit < 0 ? minProfit * 1.15 : minProfit - 5000;

  const getProfitCoords = (index: number, val: number) => {
    const x = paddingLeft + (index / (projections.length - 1)) * (graphWidth - paddingLeft - paddingRight);
    const y = paddingTop + (1 - (val - profitYMin) / (profitYMax - profitYMin)) * (graphHeight - paddingTop - paddingBottom);
    return { x, y };
  };

  const profitPoints = projections.map((d, idx) => getProfitCoords(idx, d.netProfitIfSold));
  const profitPathString = profitPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const zeroBaselineY = getProfitCoords(0, 0).y;

  return (
    <div id="proceeds-chart-panel" className="bg-white border border-slate-200 rounded-sm p-5 md:p-6 text-slate-800 font-sans shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
        <div>
          <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Yearly Return On Investment (ROI) Timeline
          </h3>
          <p className="text-xs text-slate-505">Click years or hover over the curves to see detailed simulated sale yields</p>
        </div>

        {/* Term Selector & Live Data Indicator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          
          {/* Term Toggle */}
          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">PROJECTION TERM:</span>
            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-sm w-fit self-start">
              {[5, 10, 15, 20, 25, 30].map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => onForecastYearsChange(y)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-black rounded-sm transition-all cursor-pointer ${
                    forecastYears === y
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-slate-250/50'
                  }`}
                  title={`Project ${y} Years Timeline`}
                >
                  {y}Y
                </button>
              ))}
            </div>
          </div>

          {/* Selected Year Stats Badge */}
          <div className="flex gap-2 items-center bg-slate-50 p-2 px-3 border border-slate-200 rounded-sm shadow-sm flex-1 sm:flex-initial">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Selected:</span>
            <span className="bg-indigo-600 text-white font-mono font-bold text-xs p-1 px-2.5 rounded-sm shadow-sm">
              Year {activeData.year}
            </span>
            <span className="text-xs text-slate-505 font-mono">
              {activeData.netProfitIfSold >= 0 ? '🟩 Net Profit: ' : '🟥 Net Loss: '}
              <strong className={activeData.netProfitIfSold >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                RM {Math.round(activeData.netProfitIfSold).toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 1: Scissors (Property Value vs Debt) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 font-display flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-600" />
              Equity Scissors: Property Value vs Loan Debt
            </h4>
            <div className="flex gap-3 text-[10px] font-bold font-mono text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span> Value
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span> Debt
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 relative">
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-auto overflow-visible">
              {/* Y-axis grid lines & labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const val = minVal + ratio * (maxVal - minVal);
                const y = paddingTop + (1 - ratio) * (graphHeight - paddingTop - paddingBottom);
                return (
                  <g key={idx} className="opacity-90">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={graphWidth - paddingRight}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeDasharray="4"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      RM {Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {projections.map((d, idx) => {
                const { x } = getCoords(idx, d.propertyValue);
                const isSelected = activeYearIndex === idx;
                return (
                  <g key={idx} className="cursor-pointer" onClick={() => setActiveYearIndex(idx)}>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={graphHeight - paddingBottom}
                      stroke={isSelected ? '#4f46e5' : '#e2e8f0'}
                      strokeWidth={isSelected ? 1.8 : 0.8}
                      strokeDasharray={isSelected ? '0' : '4'}
                    />
                    <text
                      x={x}
                      y={graphHeight - paddingBottom + 16}
                      fill={isSelected ? '#4f46e5' : '#64748b'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      Y{d.year}
                    </text>
                    {/* Tick point on Property Curve */}
                    <circle
                      cx={x}
                      cy={getCoords(idx, d.propertyValue).y}
                      r={isSelected ? 5.5 : 3.5}
                      fill="#34d399"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Tick point on Loan Curve */}
                    <circle
                      cx={x}
                      cy={getCoords(idx, d.mortgageBalance).y}
                      r={isSelected ? 5.5 : 3.5}
                      fill="#f87171"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* Lines linking coordinates */}
              <path d={propertyPathString} fill="none" stroke="#10b981" strokeWidth="2.5" className="opacity-90" />
              <path d={loanPathString} fill="none" stroke="#ef4444" strokeWidth="2.5" className="opacity-90" />

              {/* Custom SVG Shaded Area representing Equity Growth (gap between value and loan) */}
              {(() => {
                // Build a polygon between the two lines
                let polyPoints = '';
                for (let i = 0; i < propertyPoints.length; i++) {
                  polyPoints += `${propertyPoints[i].x},${propertyPoints[i].y} `;
                }
                for (let i = loanPoints.length - 1; i >= 0; i--) {
                  polyPoints += `${loanPoints[i].x},${loanPoints[i].y} `;
                }
                return (
                  <polygon
                    points={polyPoints}
                    className="fill-indigo-500/5 stroke-none pointer-events-none"
                  />
                );
              })()}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-700/10 bg-indigo-50/50 px-2.5 py-1 rounded inline-block select-none font-mono">
                Property Equity Loop
              </span>
            </div>
          </div>
        </div>

        {/* CHART 2: Net Profit & ROI Percentage */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Profit Threshold: Net Exit ROI % if Sold
            </h4>
            <div className="flex gap-3 text-[10px] font-bold font-mono text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block"></span> Profit
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 relative">
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-auto overflow-visible">
              {/* Grid Background */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, idx) => {
                const val = profitYMin + ratio * (profitYMax - profitYMin);
                const y = paddingTop + (1 - ratio) * (graphHeight - paddingTop - paddingBottom);
                return (
                  <g key={idx} className="opacity-90">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={graphWidth - paddingRight}
                      y2={y}
                      stroke={Math.abs(val) < 100 ? '#ef4444' : '#cbd5e1'} // Bold the zero line!
                      strokeWidth={Math.abs(val) < 1000 ? 1.5 : 0.8}
                      strokeDasharray={Math.abs(val) < 1000 ? '0' : '4'}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      fill={Math.abs(val) < 1000 ? '#ef4444' : '#64748b'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      RM {Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Zero baseline highlight explicitly */}
              <line
                x1={paddingLeft}
                y1={zeroBaselineY}
                x2={graphWidth - paddingRight}
                y2={zeroBaselineY}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="2"
                className="opacity-50"
              />
              <text
                x={graphWidth - paddingRight - 10}
                y={zeroBaselineY - 4}
                fill="#475569"
                fontSize="8"
                fontFamily="sans-serif"
                className="opacity-75"
                textAnchor="end"
              >
                BREAKEVEN LINE (0)
              </text>

              {/* Draw Profit Bars (Red for negative / Loss, Green for positive / Profit) */}
              {projections.map((d, idx) => {
                const { x, y } = getProfitCoords(idx, d.netProfitIfSold);
                const isSelected = activeYearIndex === idx;

                const barWidth = 14;
                const barX = x - barWidth / 2;
                const barY = d.netProfitIfSold >= 0 ? y : zeroBaselineY;
                const barHeight = Math.abs(y - zeroBaselineY);

                return (
                  <g key={idx} className="cursor-pointer" onClick={() => setActiveYearIndex(idx)}>
                    {/* Render Bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={Math.max(2, barHeight)}
                      rx="2"
                      className={`${d.netProfitIfSold >= 0 ? 'fill-emerald-500/10 stroke-emerald-500' : 'fill-rose-500/10 stroke-rose-400'} ${isSelected ? 'stroke-[2] opacity-100' : 'stroke-[1] opacity-75'} hover:opacity-100 transition-all`}
                    />
                    {/* Hover indicator dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 4 : 2}
                      className={d.netProfitIfSold >= 0 ? 'fill-emerald-600' : 'fill-rose-500'}
                    />
                    {/* Year text below */}
                    <text
                      x={x}
                      y={graphHeight - paddingBottom + 16}
                      fill={isSelected ? '#4f46e5' : '#64748b'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      Y{d.year}
                    </text>
                  </g>
                );
              })}

              <path d={profitPathString} fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3" className="opacity-40 pointer-events-none" />
            </svg>
          </div>
        </div>

      </div>

      {/* Numerical breakdown row */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Future Sales Value</span>
          <span className="text-base font-mono font-bold text-slate-900 block border-b border-slate-200 pb-0.5">
            RM {Math.round(activeData.propertyValue).toLocaleString()}
          </span>
          <span className="text-[10.5px] text-slate-505 font-medium">
            At {activeData.year === 1 ? '1st year' : `${activeData.year} years`} holding
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Unpaid Bank Loan</span>
          <span className="text-base font-bold text-slate-900 block font-mono border-b border-slate-200 pb-0.5">
            RM {Math.round(activeData.mortgageBalance).toLocaleString()}
          </span>
          <span className="text-[10.5px] text-slate-505 font-medium">
            {Math.round((activeData.mortgageBalance / projections[0].mortgageBalance) * 100)}% of principal remaining
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Malaysian RPGT Tax</span>
          <span className="text-base font-bold text-slate-900 block font-mono border-b border-slate-200 pb-0.5">
            RM {Math.round(activeData.rpgtTax).toLocaleString()}
          </span>
          <span className="text-[10.5px] text-indigo-700 font-semibold font-mono">
            {activeData.year <= 3 ? '30%' : activeData.year === 4 ? '20%' : activeData.year === 5 ? '15%' : '0% (Citizen Rate)'} Tax bracket
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Annualized Exit ROI</span>
          <span className={`text-base font-extrabold block font-mono border-b border-slate-200 pb-0.5 ${activeData.roiPercentIfSold >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {activeData.roiPercentIfSold >= 0 ? '+' : ''}
            {activeData.roiPercentIfSold.toFixed(1)}% ({activeData.annualizedRoiPercent.toFixed(1)}% p.a.)
          </span>
          <span className="text-[10.5px] text-slate-505 font-medium block mt-0.5">
            Initial Outlay: RM {Math.round(initialOutlay).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Warning Alert if Sold Early */}
      {activeData.year <= 3 && (
        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-sm p-4 flex items-center gap-3">
          <span className="text-2xl shrink-0 p-1.5 bg-rose-100 rounded">⚠️</span>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            <strong>Warning:</strong> Selling in Year {activeData.year} produces
            {activeData.isLoss ? ' a substantial financial loss ' : ' a highly compressed yield '}
            of <strong className="text-rose-950 underline decoration-rose-400 underline-offset-2">RM {Math.round(activeData.netProfitIfSold).toLocaleString()}</strong>.
            This is due to the <strong>30% RPGT Tax rate</strong>, the high upfront SPA & MOT paperwork costs, and high interest percentages paid during early years amortizations.
          </p>
        </div>
      )}

      {activeData.year > 5 && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex items-center gap-3">
          <span className="text-2xl shrink-0 p-1.5 bg-emerald-100 rounded">🎉</span>
          <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
            <strong>Optimal Exit:</strong> Selling in Year {activeData.year} enjoys a <strong>0% RPGT Tax rate</strong> (as a Malaysian citizen), and significant mortgage principal reduction. The net cash return of <strong className="text-emerald-950 underline decoration-emerald-500 underline-offset-2">RM {Math.round(activeData.netProceedsIfSold).toLocaleString()}</strong> can safely clear your original pocket outlays!
          </p>
        </div>
      )}
    </div>
  );
}
