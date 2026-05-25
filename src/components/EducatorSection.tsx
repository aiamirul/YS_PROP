/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldAlert, Coins, Sparkles, Building, Percent } from 'lucide-react';

export default function EducatorSection() {
  return (
    <div id="educator-section" className="bg-white border border-slate-205 rounded-sm p-6 md:p-8 text-slate-800 max-w-5xl mx-auto my-8 font-sans shadow-sm">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-700">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm md:text-base font-bold font-sans uppercase tracking-tight text-slate-900 font-display">Malaysia Real Estate Investment Guide</h2>
          <p className="text-slate-505 text-xs">Why timing your sale matters & understanding transaction costs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cost Loading Warning */}
        <div className="space-y-4">
          <div className="bg-rose-50/50 border border-rose-250 rounded-sm p-5 space-y-3">
            <h3 className="font-bold text-rose-900 flex items-center gap-2 text-xs uppercase tracking-widest font-display">
              <ShieldAlert className="w-4 h-4 shrink-0 border-rose-200" />
              The Danger Zone: Why Selling Early Causes Losses
            </h3>
            <p className="text-xs text-rose-955 leading-relaxed font-semibold">
              When you purchase a house in Malaysia, your entry costs are substantial. If you list the property on the market within <strong>1 to 3 years</strong>, you face the compound pressure of <strong>triple frictional drags</strong>:
            </p>
            <ul className="text-xs text-rose-950 space-y-2 list-disc pl-5 font-normal">
              <li>
                <strong className="text-rose-950 font-bold">Front-Loaded Interest:</strong> In a <b>reducing-balance mortgage</b>, the interest is computed monthly based on the outstanding principal. During the first few years, up to <b>70% of your monthly installment</b> is interest payments to the bank, while very little goes toward reducing the principal balance.
              </li>
              <li>
                <strong className="text-rose-950 font-bold font-semibold">Frictional Transaction Fees:</strong> Buying requires lawyer fees (SRO 2023 scaling rates) and heavy stamp duty (MOT up to 4%). Selling requires a <strong>3% agent brokerage commission</strong>. That is around ~7-10% of the entire asset value burnt in paper fees!
              </li>
              <li>
                <strong className="text-rose-950 font-bold font-semibold">RPGT Tax:</strong> Real Property Gains Tax charges individuals <strong>30%</strong> of net capital gains if disposed within the first 3 years.
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest font-display">
              <Coins className="w-4 h-4 shrink-0 text-slate-650" />
              Malaysian RPGT Rates Explained
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-slate-505 font-medium leading-relaxed">
                Real Property Gains Tax (RPGT) is levied on the profit made from selling properties. Below is the holding tax bracket for citizens:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono mt-1">
                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                  <span className="block text-rose-700 font-bold text-sm font-sans font-black">30%</span>
                  <span className="text-slate-500 font-bold block mt-1 uppercase text-[9px]">Sold Year 1-3</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                  <span className="block text-amber-700 font-bold text-sm font-sans font-black">20%</span>
                  <span className="text-slate-500 font-bold block mt-1 uppercase text-[9px]">Sold Year 4</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                  <span className="block text-amber-600 font-bold text-sm font-sans font-black">15%</span>
                  <span className="text-slate-500 font-bold block mt-1 uppercase text-[9px]">Sold Year 5</span>
                </div>
              </div>
              <p className="text-emerald-800 font-bold text-center mt-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs">
                🎉 Year 6 onwards: 0% Tax for Citizens!
              </p>
              <p className="text-[10px] text-slate-400 text-center italic font-semibold">
                *Note: Non-citizen/Foreigners are charged a flat rate of 10% from Year 6 onwards.
              </p>
            </div>
          </div>
        </div>

        {/* Localized Malaysian Math */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold text-slate-905 uppercase tracking-widest font-display flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-700 font-bold" />
            Breaking Down The Standard Fees
          </h3>

          <div className="space-y-4 font-sans text-slate-702">
            {/* MOT stamp duty */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-sm bg-slate-100 border border-slate-200 text-xs font-mono font-bold flex items-center justify-center text-slate-700 shrink-0 shadow-sm">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-display tracking-widest">MOT Stamp Duty Scaling</h4>
                <p className="text-[11px] text-slate-505 leading-relaxed mt-1 font-medium">
                  Memorandum of Transfer stamp duty operates in tiers. First RM 100k is 1%, next RM 400k is 2%. For a standard RM 300,000 property, your stamp duty is <b>RM 5,000</b>.
                </p>
              </div>
            </div>

            {/* Legal Fees */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-sm bg-slate-100 border border-slate-200 text-xs font-mono font-bold flex items-center justify-center text-slate-700 shrink-0 shadow-sm">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-display tracking-widest">SRO Legal Fee Structure</h4>
                <p className="text-[11px] text-slate-505 leading-relaxed mt-1 font-medium">
                  Lawyer fees are strictly regulated in Malaysia. For properties below RM 500k, a standardized rate of <b>1.25%</b> applies both to the SPA and the Loan Agreements separately.
                </p>
              </div>
            </div>

            {/* Vacancy impact */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-sm bg-slate-100 border border-slate-200 text-xs font-mono font-bold flex items-center justify-center text-slate-700 shrink-0 shadow-sm">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-display tracking-widest">Vacancy (The Silent Profit Killer)</h4>
                <p className="text-[11px] text-slate-505 leading-relaxed mt-1 font-medium">
                  Tenants do not stay forever. Standard assumptions assume 100% occupancy. But in the real world, advertising, repainting, and tenant hunt causes <b>1 to 2 months of vacancy every few years</b>. Renting at 10 or 11 months out of 12 slices cashflow margins by 8%-16% immediately!
                </p>
              </div>
            </div>

            {/* Asset vs Expense tip */}
            <div className="flex gap-3 bg-indigo-50/50 border border-indigo-150 rounded-sm p-3.5 mt-2 shadow-sm">
              <div className="p-1 px-2.5 bg-indigo-100 border border-indigo-200 text-indigo-700 h-fit text-[9px] font-mono font-bold">
                TIP
              </div>
              <p className="text-xs text-indigo-905 leading-relaxed font-semibold">
                <strong>Cost Base Optimization:</strong> Keep your renovation receipts! Under Malaysian IRB tax law, any permanent renovation cost (kitchen tiling, wardrobes) is a <i>permissible deduction</i> that increases your property cost base, reducing your calculated RPGT taxable profit upon sale!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
