/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CampaignState, CalculatorInputs, TenantNegotiation, 
  MaintenanceIncident, NeighborhoodUpgrade, YearlyProjection 
} from '../types';
import { 
  getNegotiationDeck, getIncidentDeck, getNeighborhoodUpgradesList,
  calculateMonthlyMortgage, calculateMalaysianLegalFees, calculateStampDutyMOT,
  calculateLoanStampDuty, estimateValuationFee, calculateRPGT, getAmortizationSchedule
} from '../utils';
import { 
  TrendingUp, HardHat, Sparkles, User, AlertOctagon, 
  CheckCircle2, RefreshCw, ChevronRight, Landmark, ShoppingBag, Coins, Flame 
} from 'lucide-react';

interface SimCampaignProps {
  inputs: CalculatorInputs;
  onResetToCalculator: () => void;
}

export default function SimCampaign({ inputs, onResetToCalculator }: SimCampaignProps) {
  const [gameState, setGameState] = useState<CampaignState | null>(null);
  const [roundLog, setRoundLog] = useState<string[]>([]);
  const [totalStartingCapital, setTotalStartingCapital] = useState<number>(100000); // Starter Capital Pool

  // Core setup variables based on initial inputs
  const deposit = inputs.propertyPrice * (inputs.depositPercent / 100);
  const loanAmount = inputs.propertyPrice - deposit;
  const spaLegal = calculateMalaysianLegalFees(inputs.propertyPrice);
  const spaStampDuty = calculateStampDutyMOT(inputs.propertyPrice);
  const loanLegal = calculateMalaysianLegalFees(loanAmount);
  const loanStampDuty = calculateLoanStampDuty(loanAmount);
  const valuation = estimateValuationFee(inputs.propertyPrice);
  const totalUpfrontFees = spaLegal + spaStampDuty + loanLegal + loanStampDuty + valuation;
  const totalOutlayAtStart = deposit + totalUpfrontFees + inputs.renovationCost;

  // Initialize Game State
  const startGame = (startingCash: number) => {
    const remainingCashReserve = startingCash - totalOutlayAtStart;
    
    // Initial upgrades
    const initialUpgrades = getNeighborhoodUpgradesList();

    const initialState: CampaignState = {
      currentYear: 0,
      inputs: { ...inputs },
      cashReserve: remainingCashReserve,
      initialCapitalExpended: totalOutlayAtStart,
      activeTenant: {
        name: 'Empty (Property Newly Renovated)',
        rent: inputs.monthlyRent,
        occupancyMonths: 0,
        avatar: '🏠'
      },
      history: [{
        year: 0,
        log: ['Property acquired!', `Paid RM ${deposit.toLocaleString()} deposit, RM ${totalUpfrontFees.toLocaleString()} SPA paperwork fees, and RM ${inputs.renovationCost.toLocaleString()} renovations.`],
        rentIncome: 0,
        expenses: totalOutlayAtStart,
        cashBalance: remainingCashReserve,
        propertyValue: inputs.propertyPrice,
        loanRemaining: loanAmount
      }],
      activeIncident: null,
      activeNegotiation: null,
      availableUpgrades: initialUpgrades,
      isGameOver: false,
      gameSummary: null
    };

    setGameState(initialState);
    setRoundLog([
      `🏡 Purchased for RM ${inputs.propertyPrice.toLocaleString()}`,
      `💸 Subtotal Capital Used: RM ${totalOutlayAtStart.toLocaleString()}`,
      `💰 Remaining Emergency Cash Reserve: RM ${remainingCashReserve.toLocaleString()}`
    ]);
  };

  // Safe initialize on mount
  useEffect(() => {
    startGame(totalStartingCapital);
  }, [inputs]);

  if (!gameState) return null;

  // Next Year processing logic
  const handleNextYearTurn = () => {
    if (gameState.isGameOver) return;

    const nextYear = gameState.currentYear + 1;
    const yearLogs: string[] = [];

    // 1. Core Financial updates
    const currentInputs = gameState.inputs;
    const loanBalStart = gameState.history[gameState.history.length - 1].loanRemaining;
    
    // Mortgage payment
    const monthlyMortgage = calculateMonthlyMortgage(loanBalStart, currentInputs.interestRate, currentInputs.loanTermYears);
    const yearlyMortgageRepayment = monthlyMortgage * 12;
    
    // Mortgage amortization calculation for this specific year (12 months)
    const r = (currentInputs.interestRate / 100) / 12;
    let runningBalance = loanBalStart;
    let yearInterestPaid = 0;
    let yearPrincipalPaid = 0;

    for (let m = 1; m <= 12; m++) {
      if (runningBalance <= 0) {
        runningBalance = 0;
        continue;
      }
      const interestM = runningBalance * r;
      const principalM = Math.min(runningBalance, monthlyMortgage - interestM);
      runningBalance -= principalM;
      yearInterestPaid += interestM;
      yearPrincipalPaid += principalM;
    }

    // Rental collection
    const currentTenant = gameState.activeTenant;
    const activeMonths = currentTenant ? currentTenant.occupancyMonths : currentInputs.occupancyMonthsPerYear;
    const activeRent = currentTenant ? currentTenant.rent : currentInputs.monthlyRent;
    const yearlyRentCollected = activeRent * activeMonths;

    yearLogs.push(`Collected ${activeMonths}/12 months rent from '${currentTenant?.name || 'Standard Tenant'}' at RM ${activeRent}/mo = +RM ${yearlyRentCollected.toLocaleString()}`);

    // Maintenance Levy & Assessment bills
    const monthlyMaintenance = currentInputs.sizeSqft * currentInputs.maintenancePsf;
    const yearlyMaintenanceCost = monthlyMaintenance * 12;
    const yearlyExpenses = yearlyMaintenanceCost + currentInputs.quitRentAndAssessment;

    yearLogs.push(`Paid RM ${yearlyMaintenanceCost.toLocaleString()} condo maintenance (RM 0.30 psf) & RM ${currentInputs.quitRentAndAssessment} assessment quit rent`);
    yearLogs.push(`Paid RM ${yearlyMortgageRepayment.toLocaleString()} bank mortgage (Interest: RM ${Math.round(yearInterestPaid).toLocaleString()}, Principal: RM ${Math.round(yearPrincipalPaid).toLocaleString()})`);

    // Cash flow subtotal
    const operatingExpenses = yearlyExpenses + yearlyMortgageRepayment;
    const netOperatingCash = yearlyRentCollected - operatingExpenses;
    const newCashReserve = gameState.cashReserve + netOperatingCash;

    yearLogs.push(`Annual Operating Net Cash flow: ${netOperatingCash >= 0 ? '+' : ''}RM ${Math.round(netOperatingCash).toLocaleString()}`);

    // Capital property value appreciation
    const priorValue = gameState.history[gameState.history.length - 1].propertyValue;
    const updatedPropertyValue = priorValue * (1 + (currentInputs.appreciationRate / 100));

    // Next event preparation triggers
    // We alternate events: Year 1 = Tenant Negotiation, Year 2 = Maintenance emergency, Year 3 = Negotiation, etc.
    let selectedNegotiation: TenantNegotiation | null = null;
    let selectedIncident: MaintenanceIncident | null = null;

    if (nextYear % 2 === 1) {
      const negotiationDeck = getNegotiationDeck(currentInputs.monthlyRent);
      const randIdx = Math.floor(Math.random() * negotiationDeck.length);
      selectedNegotiation = negotiationDeck[randIdx];
      yearLogs.push(`Incoming Tenant Negotiation Alert matching Year ${nextYear}!`);
    } else {
      const incidentDeck = getIncidentDeck();
      const randIdx = Math.floor(Math.random() * incidentDeck.length);
      selectedIncident = incidentDeck[randIdx];
      yearLogs.push(`Warning: Maintenance Incident detected for Year ${nextYear}`);
    }

    // Update state
    setGameState(prev => {
      if (!prev) return null;
      
      const updatedHistory = [...prev.history, {
        year: nextYear,
        log: yearLogs,
        rentIncome: yearlyRentCollected,
        expenses: operatingExpenses,
        cashBalance: newCashReserve,
        propertyValue: updatedPropertyValue,
        loanRemaining: runningBalance
      }];

      return {
        ...prev,
        currentYear: nextYear,
        cashReserve: newCashReserve,
        activeIncident: selectedIncident,
        activeNegotiation: selectedNegotiation,
        history: updatedHistory
      };
    });

    setRoundLog(yearLogs);
  };

  // Handling Decision impacts (Tenant, Incident card clicks)
  const applyDecisionEffect = (decision: any, logPrefix: string) => {
    setGameState(prev => {
      if (!prev) return null;

      // Apply modifiers
      const updatedInputs = { ...prev.inputs };
      
      // Rent effect
      if (decision.rentEffect !== 0) {
        updatedInputs.monthlyRent = Math.max(1000, updatedInputs.monthlyRent + decision.rentEffect);
      }
      // Appreciation effect
      if (decision.appreciationEffect !== 0) {
        updatedInputs.appreciationRate = parseFloat((updatedInputs.appreciationRate + decision.appreciationEffect * 100).toFixed(2));
      }
      // CapEx renovation addition
      if (decision.renovationCostAdded > 0) {
        updatedInputs.renovationCost += decision.renovationCostAdded;
      }

      // Cash pool impact
      const adjustedCash = prev.cashReserve + decision.cashEffect;

      // Update Tenant parameters if Negotiation was resolved
      let nextTenant = prev.activeTenant;
      if (prev.activeNegotiation) {
        nextTenant = {
          name: prev.activeNegotiation.tenantName,
          rent: updatedInputs.monthlyRent,
          occupancyMonths: decision.occupancyEffect,
          avatar: prev.activeNegotiation.avatar
        };
      } else if (prev.activeIncident) {
        // Incident resolution can reduce occupancy next year due to grumbles
        if (nextTenant) {
          nextTenant = {
            ...nextTenant,
            occupancyMonths: decision.occupancyEffect
          };
        }
      }

      // Add decision to round log log
      const updatedHistory = [...prev.history];
      if (updatedHistory.length > 0) {
        const lastIdx = updatedHistory.length - 1;
        updatedHistory[lastIdx] = {
          ...updatedHistory[lastIdx],
          log: [...updatedHistory[lastIdx].log, `${logPrefix}: ${decision.text} (${decision.effectText})`],
          cashBalance: adjustedCash
        };
      }

      return {
        ...prev,
        inputs: updatedInputs,
        cashReserve: adjustedCash,
        activeTenant: nextTenant,
        activeIncident: null,
        activeNegotiation: null,
        history: updatedHistory
      };
    });

    setRoundLog(prev => [...prev, `${logPrefix} decision applied successfully: ${decision.effectText}`]);
  };

  // Triggering Neighborhood Upgrade Purchases
  const purchaseUpgradeItem = (upgrade: NeighborhoodUpgrade) => {
    if (gameState.cashReserve < upgrade.cost) return;

    setGameState(prev => {
      if (!prev) return null;

      const updatedInputs = { ...prev.inputs };
      updatedInputs.appreciationRate = parseFloat((updatedInputs.appreciationRate + upgrade.appreciationBoost).toFixed(2));
      updatedInputs.monthlyRent += upgrade.rentPremium;

      const nextCash = prev.cashReserve - upgrade.cost;
      const nextUpgrades = prev.availableUpgrades.map(u => 
        u.id === upgrade.id ? { ...u, purchased: true } : u
      );

      const updatedHistory = [...prev.history];
      if (updatedHistory.length > 0) {
        const lastIdx = updatedHistory.length - 1;
        updatedHistory[lastIdx] = {
          ...updatedHistory[lastIdx],
          log: [...updatedHistory[lastIdx].log, `Purchased Upgrade '${upgrade.title}' for RM ${upgrade.cost.toLocaleString()}`],
          cashBalance: nextCash
        };
      }

      return {
        ...prev,
        inputs: updatedInputs,
        cashReserve: nextCash,
        availableUpgrades: nextUpgrades,
        history: updatedHistory
      };
    });

    setRoundLog(prev => [...prev, `Bought Upgrade: '${upgrade.title}' (-RM ${upgrade.cost.toLocaleString()})`]);
  };

  // Selling Property & Triggering Game Over Breakdown
  const handleSellPropertySimulation = () => {
    const currentYear = gameState.currentYear;
    if (currentYear === 0) {
      alert("You can't sell in Year 0 immediately at purchase!");
      return;
    }

    const lastRecord = gameState.history[gameState.history.length - 1];
    const propertyValue = lastRecord.propertyValue;
    const loanBalance = lastRecord.loanRemaining;
    const agentFee = propertyValue * 0.03;

    // Capital gains calculations
    const entryBuyingCosts = spaLegal + spaStampDuty + loanLegal + loanStampDuty + valuation;
    const totalCostBase = inputs.propertyPrice + entryBuyingCosts + gameState.inputs.renovationCost;
    const capitalGain = propertyValue - totalCostBase - agentFee;

    const rpgt = capitalGain > 0 ? calculateRPGT(capitalGain, currentYear, inputs.citizenStatus === 'foreigner') : 0;

    // Transaction proceeds
    const transactionCashProceeds = propertyValue - loanBalance - agentFee - rpgt;

    // Net Liquid proceeds (adding accumulated pocket balance)
    const finalLiquidCash = transactionCashProceeds + gameState.cashReserve;

    // Profit is final pocket cash minus starting capital invested
    const totalCapitalInvested = totalStartingCapital;
    const netProfit = finalLiquidCash - totalCapitalInvested;
    const finalROI = (netProfit / totalCapitalInvested) * 100;

    // Score ratings
    let rating = 'Suboptimal Investment 📉';
    if (finalROI > 50) {
      rating = 'Tengku Millionaire Landlord 👑';
    } else if (finalROI > 20) {
      rating = 'Astute Property Strategist 🚀';
    } else if (finalROI > 0) {
      rating = 'Safe Breakeven Holder ⚖️';
    } else {
      rating = 'frictional Loss Trapped 💀';
    }

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isGameOver: true,
        gameSummary: {
          finalYear: currentYear,
          propertyValue,
          loanBalance,
          rpgt,
          netSaleCash: transactionCashProceeds,
          totalProfit: netProfit,
          finalROI,
          successRating: rating
        }
      };
    });
  };

  const isBankrupt = gameState.cashReserve < -20000;

  return (
    <div id="sim-campaign-panel" className="bg-white border border-slate-200 rounded-sm p-6 text-slate-800 font-sans shadow-sm relative overflow-hidden">
      
      {/* Subtle Malaysia Decal bar at very top of simulator box */}
      <div className="absolute top-0 left-0 w-full h-1 flex">
        <div className="flex-1 bg-[#01411C]"></div> {/* Green */}
        <div className="flex-1 bg-[#EE2C2C]"></div> {/* Red */}
        <div className="flex-1 bg-[#FCD116]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#000080]"></div> {/* Blue */}
      </div>

      {/* GAME SUMMARY PAGE CARD / GAME OVER DIALOG */}
      {gameState.isGameOver && gameState.gameSummary && (
        <div id="game-summary-card" className="bg-white border border-slate-300 rounded-sm p-6 lg:p-8 text-center space-y-6 relative z-10 animate-fade-in max-w-2xl mx-auto my-4 shadow-md">
          <div className="inline-block p-4 bg-indigo-50 text-indigo-700 rounded-sm border border-indigo-150 mb-1">
            <Landmark className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl lg:text-3xl font-black tracking-tight text-slate-900 uppercase font-display">
              Property Disposal Report Card
            </h2>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest font-bold">
              Sold at holding Year {gameState.gameSummary.finalYear} / 15
            </p>
          </div>

          {/* Large ROI Highlight */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-sm max-w-md mx-auto space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans font-bold">Total Capital Return (ROI)</span>
            <div className={`text-4xl lg:text-5xl font-black font-mono tracking-tighter ${gameState.gameSummary.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {gameState.gameSummary.totalProfit >= 0 ? '+' : ''}
              {gameState.gameSummary.finalROI.toFixed(1)}%
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider p-1 px-4 rounded-sm inline-block mt-1 ${gameState.gameSummary.totalProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {gameState.gameSummary.successRating}
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left text-xs bg-slate-50 p-4 rounded-sm border border-slate-200 shadow-sm">
            <div className="p-2 border-r border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Property Sale Value</span>
              <span className="font-bold font-mono text-sm block text-slate-900 mt-1">RM {Math.round(gameState.gameSummary.propertyValue).toLocaleString()}</span>
              <span className="text-[10px] text-slate-550 block font-medium">Bought at RM 300k</span>
            </div>

            <div className="p-2 border-r border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Bank Debt Settled</span>
              <span className="font-bold font-mono text-sm block text-rose-700 mt-1">RM {Math.round(gameState.gameSummary.loanBalance).toLocaleString()}</span>
              <span className="text-[10px] text-slate-550 block font-medium">Cleared from bank</span>
            </div>

            <div className="p-2">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">RPGT Tax Paid</span>
              <span className="font-bold text-sm text-amber-700 font-mono block mt-1">RM {Math.round(gameState.gameSummary.rpgt).toLocaleString()}</span>
              <span className="text-[10px] text-slate-550 block font-medium">{gameState.gameSummary.finalYear <= 5 ? `${35 - 5*gameState.gameSummary.finalYear}% Rate` : '0% (Exempt)'}</span>
            </div>

            <div className="p-2 border-t border-slate-200 border-r">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Investment Outlay</span>
              <span className="font-bold text-slate-905 mt-1 block font-mono">RM {totalStartingCapital.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Includes cash reserve</span>
            </div>

            <div className="p-2 border-t border-slate-200 border-r">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Cash in Hand Left</span>
              <span className="font-bold text-emerald-700 mt-1 block font-mono">RM {Math.round(gameState.gameSummary.netSaleCash).toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Liquid bank storage</span>
            </div>

            <div className="p-2 border-t border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Cumulative net yield</span>
              <span className={`font-bold mt-1 block font-mono ${gameState.gameSummary.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                RM {Math.round(gameState.gameSummary.totalProfit).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Net capital profit/loss</span>
            </div>
          </div>

          {/* Education message box */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 text-left rounded-sm space-y-1">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">🎓 Simulation Retrospective Guide:</h4>
            {gameState.gameSummary.finalYear <= 3 ? (
              <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                Selling in <strong>holding Year 1-3 represents immediate failure to optimize!</strong> Although the paper price grew, upfront SRO paperwork legal fees, MOT Stamp clearances, 3.0% realtor commissions (RM {Math.round(gameState.gameSummary.propertyValue * 0.03).toLocaleString()}), and the penalizing <strong>30% RPGT Tax</strong> completely vaporized your original pocket reserves. Bank interest rates consumed almost all early monthly payments, and you made no relative progress amortizing principal.
              </p>
            ) : (
              <p className="text-[11px] text-indigo-900 leading-relaxed font-semibold">
                By holding until <strong>holding Year {gameState.gameSummary.finalYear} (past the 5-year RPGT barrier)</strong>, your monthly amortizing loan schedule reduced bank debts, property value grew with compound appreciation, and RPGT tax fell to <strong>0%</strong> (Malaysian citizen). This allows you to walk away from the table with real compound equity!
              </p>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => startGame(totalStartingCapital)}
              className="flex items-center gap-2 p-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-sm cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> RESTART CAMPAIGN
            </button>
            <button
              onClick={onResetToCalculator}
              className="p-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-sm cursor-pointer transition-all"
            >
              INVESTMENT SANDBOX
            </button>
          </div>
        </div>
      )}

      {/* GAMEPLAY DISPLAY */}
      {!gameState.isGameOver && (
        <div className="space-y-6 relative z-10">
          
          {/* Top header navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 px-2.5 bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold uppercase rounded tracking-widest border border-indigo-200">
                  Interactive Simulator
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 uppercase font-display">Malaysia Landlord Campaign</h2>
              <p className="text-xs text-slate-500 font-medium">Can you beat vacancy rates, repair leaks, negotiate expat premiums, and sell at the ideal peak?</p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => startGame(100000)}
                className="flex-1 md:flex-initial p-2.5 px-4 border border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
                title="Restart simulation game"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Game
              </button>
              <button
                onClick={handleSellPropertySimulation}
                className="flex-1 md:flex-initial p-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer shadow-rose-950/20"
              >
                <Flame className="w-3.5 h-3.5" /> SELL PROPERTY NOW
              </button>
            </div>
          </div>

          {/* Main game board grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Panel Column A: Dashboard HUD Indicators */}
            <div className="space-y-4">
              
              {/* Year Timeline Badge */}
              <div className="bg-slate-55 border border-slate-250 rounded-sm p-4 relative overflow-hidden flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Current Ownership Timeline</span>
                  <div className="text-2xl font-black text-indigo-750 tracking-tight mt-1 font-mono">Year {gameState.currentYear} / 15</div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
                    Property price is compounding at {gameState.inputs.appreciationRate}% p.a.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-sm bg-indigo-50 border border-indigo-150 flex items-center justify-center text-xl shrink-0">
                  📅
                </div>
              </div>

              {/* Cash reserves Status Indicator (Liquidity danger) */}
              <div className={`border rounded-sm p-4 relative overflow-hidden flex items-center justify-between shadow-sm transition-colors ${gameState.cashReserve < 0 ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-55 border-slate-250'}`}>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Cash Pocket Reserves (Liquidity)</span>
                  <div className={`text-2xl font-black tracking-tight font-mono ${gameState.cashReserve >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    RM {Math.round(gameState.cashReserve).toLocaleString()}
                  </div>
                  {gameState.cashReserve < 0 ? (
                    <p className="text-[10.5px] text-rose-800 font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" /> Warning: Approaching closure (-RM20k)!
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Used to buffer vacancy and toilet pipe fixes</p>
                  )}
                </div>
                <div className={`h-10 w-10 rounded-sm flex items-center justify-center text-lg shrink-0 ${gameState.cashReserve < 0 ? 'bg-rose-100 text-rose-750 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-150'}`}>
                  <Coins className="w-5 h-5" />
                </div>
              </div>

              {/* Active Resident card HUD */}
              <div className="bg-slate-55 border border-slate-250 rounded-sm p-4 space-y-2 shadow-sm">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Active Resident Profile</span>
                
                {gameState.activeTenant ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-white border border-slate-200 text-xl flex items-center justify-center shrink-0">
                      {gameState.activeTenant.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{gameState.activeTenant.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-medium">
                        Rent: <span className="text-indigo-700 font-bold">RM {gameState.activeTenant.rent}/mo</span> | Vacancy: {gameState.activeTenant.occupancyMonths} mos/yr
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-750 italic">No Tenant Active! Re-advertise is required next year.</p>
                )}
              </div>

              {/* Quick Transaction Info */}
              <div className="bg-slate-55 border border-slate-250 rounded-sm p-4 text-xs space-y-2 shadow-sm">
                <span className="text-[9.5px] text-slate-400 uppercase tracking-widest block font-mono font-bold">Simulated Property DNA</span>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium">Asset Market Price:</span>
                  <span className="font-mono text-slate-900 font-bold">RM {Math.round(gameState.history[gameState.history.length - 1].propertyValue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium">Current Loan Remaining:</span>
                  <span className="font-mono text-slate-900 font-bold">RM {Math.round(gameState.history[gameState.history.length - 1].loanRemaining).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span className="text-slate-500 font-medium">Current RPGT Rate:</span>
                  <span className="font-mono">{gameState.currentYear <= 3 ? '30% (Early Loss risk)' : gameState.currentYear === 4 ? '20%' : gameState.currentYear === 5 ? '15%' : '0% (Exempt!)'}</span>
                </div>
              </div>

            </div>

            {/* Panel Column B: Centerpiece Action Decision Deck */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* IF BANKRUPT GAME STATE */}
              {isBankrupt && (
                <div className="bg-rose-50 border-2 border-rose-350 rounded-sm p-6 text-center space-y-4 shadow-sm">
                  <span className="text-4xl block">🚨</span>
                  <h3 className="text-lg font-black text-rose-800">Foreclosure Warning!</h3>
                  <p className="text-xs text-rose-900 leading-relaxed max-w-md mx-auto font-medium">
                    Your pocket reserves dropped to negative <b>RM {Math.round(gameState.cashReserve).toLocaleString()}</b>! Under Malaysian Banking laws, if you cannot clear your mortgage and pay assessment bills, a liquidator foreclosure forces auction selling of the asset immediately.
                  </p>
                  <button
                    onClick={handleSellPropertySimulation}
                    className="p-3 px-6 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-sm cursor-pointer inline-flex items-center gap-2 transition-all active:scale-95"
                  >
                    Foreclose Property & Sell now
                  </button>
                </div>
              )}

              {/* active decision decks: Tenant Negotiator Profile */}
              {!isBankrupt && gameState.activeNegotiation && (
                <div className="bg-indigo-50/20 border border-indigo-200 rounded-sm p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2.5 bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold uppercase rounded border border-indigo-150">
                      Tenant Offer Panel
                    </span>
                    <span className="p-1 px-2.5 bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold uppercase rounded border border-emerald-150">
                      Negotiation Mode
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-sm bg-indigo-50 border border-indigo-150 text-2xl flex items-center justify-center shrink-0 shadow-inner">
                      {gameState.activeNegotiation.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-slate-905 uppercase tracking-tight font-display">
                        {gameState.activeNegotiation.tenantName}
                      </h3>
                      <p className="text-xs text-indigo-750 font-bold">{gameState.activeNegotiation.profession}</p>
                      <p className="text-[11px] text-slate-505 font-medium leading-relaxed mt-1">
                        {gameState.activeNegotiation.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-indigo-150 p-4 rounded-sm space-y-1">
                    <span className="text-[10px] text-indigo-700 uppercase font-bold tracking-widest font-mono">The Counter Proposition:</span>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      "{gameState.activeNegotiation.demandText}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => applyDecisionEffect(gameState.activeNegotiation!.options.accept, 'Accept Syahmi Contract')}
                      className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-250 text-indigo-950 text-xs font-semibold rounded-sm text-left transition-all hover:scale-[1.01] active:scale-95 space-y-1 cursor-pointer shadow-sm"
                    >
                      <span className="font-bold block text-indigo-700">👍 Accept Proposal</span>
                      <span className="text-[10.5px] text-slate-500 block mt-1 leading-normal">{gameState.activeNegotiation.options.accept.text}</span>
                    </button>

                    <button
                      onClick={() => applyDecisionEffect(gameState.activeNegotiation!.options.counter, 'Counter Proposal Upgrade')}
                      className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-950 text-xs font-semibold rounded-sm text-left transition-all hover:scale-[1.01] active:scale-95 space-y-1 cursor-pointer shadow-sm"
                    >
                      <span className="font-bold block text-amber-700">💬 Counter-Offer Upgrade</span>
                      <span className="text-[10.5px] text-slate-500 block mt-1 leading-normal">{gameState.activeNegotiation.options.counter.text}</span>
                    </button>

                    <button
                      onClick={() => applyDecisionEffect(gameState.activeNegotiation!.options.reject, 'Reject and Vacate')}
                      className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-950 text-xs font-semibold rounded-sm text-left transition-all hover:scale-[1.01] active:scale-95 space-y-1 cursor-pointer shadow-sm"
                    >
                      <span className="font-bold block text-rose-700">❌ Reject Offer</span>
                      <span className="text-[10.5px] text-slate-500 block mt-1 leading-normal">{gameState.activeNegotiation.options.reject.text}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Maintenance incident cards */}
              {!isBankrupt && gameState.activeIncident && (
                <div className="bg-rose-50/40 border border-rose-200 rounded-sm p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2.5 bg-rose-100 text-rose-700 font-mono text-[9px] font-bold uppercase rounded border border-rose-200">
                      Maintenance Emergency
                    </span>
                    <span className="p-1 px-2.5 bg-amber-100 text-amber-800 font-mono text-[9px] font-bold uppercase rounded border border-amber-150">
                      Urgent Incident
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-sm bg-rose-100 border border-rose-200 text-3xl flex items-center justify-center shrink-0">
                      🛠️
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight font-display">
                        {gameState.activeIncident.title}
                      </h3>
                      <p className="text-xs text-slate-505 font-medium leading-relaxed mt-1">
                        {gameState.activeIncident.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => applyDecisionEffect(gameState.activeIncident!.options.repairPro, 'Appoint Professional Plumber')}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-950 text-xs font-semibold rounded-sm text-left transition-all hover:scale-[1.01] active:scale-95 space-y-1 cursor-pointer shadow-sm"
                    >
                      <span className="font-bold block text-emerald-700">🛠️ Hire Professional</span>
                      <span className="text-[10.5px] text-slate-500 block mt-1 leading-normal">{gameState.activeIncident.options.repairPro.text}</span>
                    </button>

                    <button
                      onClick={() => applyDecisionEffect(gameState.activeIncident!.options.diyCheap, 'DIY Spray Repair')}
                      className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-slate-900 text-xs font-semibold rounded-sm text-left transition-all hover:scale-[1.01] active:scale-95 space-y-1 cursor-pointer shadow-sm"
                    >
                      <span className="font-bold block text-amber-700">🔧 Do It Yourself (DIY/Cheap)</span>
                      <span className="text-[10.5px] text-slate-500 block mt-1 leading-normal">{gameState.activeIncident.options.diyCheap.text}</span>
                    </button>

                    <button
                      onClick={() => applyDecisionEffect(gameState.activeIncident!.options.ignore, 'Defer and ignore issue')}
                      className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-950 text-xs font-semibold rounded-sm text-left transition-all hover:scale-[1.01] active:scale-95 space-y-1 cursor-pointer shadow-sm"
                    >
                      <span className="font-bold block text-rose-700">⚠️ Defer / Ignore issue</span>
                      <span className="text-[10.5px] text-slate-500 block mt-1 leading-normal">{gameState.activeIncident.options.ignore.text}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Play Turn / Proceed command */}
              {!isBankrupt && !gameState.activeIncident && !gameState.activeNegotiation && (
                <div className="bg-slate-100 border border-slate-205 rounded-sm p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Ownership operations resolved!</h3>
                    <p className="text-xs text-slate-500 font-medium">Ready to collect rent and process the calendar to next year.</p>
                  </div>

                  <button
                    onClick={handleNextYearTurn}
                    className="w-full md:w-auto p-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-sm cursor-pointer transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    ADVANCE TO YEAR {gameState.currentYear + 1} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Neighborhood Upgrade Options Shop */}
              <div id="upgrades-shop" className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      Dynamic Neighborhood Upgrades Shop
                    </h3>
                    <p className="text-[11px] text-slate-505 font-medium">Co-invest with the residential council to elevate rents & appreciation rates</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gameState.availableUpgrades.map(upgrade => {
                    const canAfford = gameState.cashReserve >= upgrade.cost;
                    return (
                      <div 
                        key={upgrade.id} 
                        className={`p-4 rounded-sm border flex flex-col justify-between space-y-3 transition-all ${upgrade.purchased ? 'bg-indigo-50/50 border-indigo-200 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-705'}`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 justify-between">
                            {upgrade.title}
                            {upgrade.purchased && <span className="p-0.5 px-2 bg-indigo-100 text-indigo-700 text-[9px] rounded font-mono font-bold">ACTIVE</span>}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-normal font-medium">
                            {upgrade.description}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold pt-1 block">
                            Benefit: {upgrade.benefitText}
                          </p>
                        </div>

                        {!upgrade.purchased && (
                          <button
                            onClick={() => purchaseUpgradeItem(upgrade)}
                            disabled={!canAfford}
                            className={`p-2.5 w-full text-center font-bold font-mono text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer ${canAfford ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95 shadow-sm' : 'bg-slate-200 text-slate-405 cursor-not-allowed'}`}
                          >
                            Buy: RM {upgrade.cost.toLocaleString()}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Turn logs timeline */}
              <div className="bg-slate-100 border border-slate-200 rounded-sm p-4 md:p-6 space-y-3 shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">Simulated Operational Event Log</span>
                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar text-[11px] font-mono">
                  {roundLog.map((logLine, idx) => (
                    <div key={idx} className="flex gap-2 text-slate-700 leading-normal p-2 bg-white rounded-sm border border-slate-200">
                      <span className="text-slate-400 shrink-0 select-none">▶</span>
                      <span>{logLine}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Core ledger records breakdown table */}
          {gameState.history.length > 1 && (
            <div id="sim-history-ledger" className="bg-white border border-slate-200 rounded-sm p-5 md:p-6 space-y-4 shadow-sm">
              <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Investment Ledger Timeline (Year-by-Year Historical Checkpoints)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-2 text-right">Rent collected</th>
                      <th className="py-2.5 px-2 text-right">Expenses paid</th>
                      <th className="py-2.5 px-2 text-right">Cash Reserve</th>
                      <th className="py-2.5 px-2 text-right">Property Value</th>
                      <th className="py-2.5 px-2 text-right">Unpaid Mortgage</th>
                      <th className="py-2.5 px-3 text-right">Net Equity Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {gameState.history.map((record, index) => {
                      if (index === 0) return null; // Skip year 0 line
                      const netEquity = record.propertyValue - record.loanRemaining;
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-indigo-700">Y{record.year}</td>
                          <td className="py-2.5 px-2 text-right text-emerald-700 font-bold">RM {Math.round(record.rentIncome).toLocaleString()}</td>
                          <td className="py-2.5 px-2 text-right text-rose-700 font-bold">RM {Math.round(record.expenses).toLocaleString()}</td>
                          <td className={`py-2.5 px-2 text-right font-bold ${record.cashBalance >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-750 font-extrabold'}`}>
                            RM {Math.round(record.cashBalance).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-900">RM {Math.round(record.propertyValue).toLocaleString()}</td>
                          <td className="py-2.5 px-2 text-right text-rose-700">RM {Math.round(record.loanRemaining).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-indigo-750 font-extrabold">RM {Math.round(netEquity).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
