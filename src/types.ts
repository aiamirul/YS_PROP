/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CalculatorInputs {
  propertyPrice: number;       // e.g. RM 300,000
  depositPercent: number;      // e.g. 10%
  loanTermYears: number;       // e.g. 30 years
  interestRate: number;        // e.g. 4.0%
  sizeSqft: number;            // e.g. 800 sqft
  maintenancePsf: number;      // e.g. RM 0.30 psf
  quitRentAndAssessment: number; // e.g. RM 500 / year
  monthlyRent: number;         // e.g. RM 1,600
  renovationCost: number;      // e.g. RM 15,000
  appreciationRate: number;    // e.g. 3.0% (Scenario driven)
  occupancyMonthsPerYear: number; // e.g. 11, 10, 12 months
  citizenStatus: 'citizen' | 'foreigner'; // RPGT rates differ
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  mortgageBalance: number;
  cumulativeRentReceived: number;
  cumulativeExpensesPaid: number; // maintenance, quit rent, interest, agent fee, entry costs
  cumulativePrincipalRepaid: number;
  cumulativeInterestPaid: number;
  mortgageRepaymentPaid: number;
  rpgtTax: number;
  agentFeeOnSale: number;
  grossSalePrice: number;
  netProceedsIfSold: number;   // Proceeds after clearing mortgage, paying agent and RPGT
  netProfitIfSold: number;     // Net proceeds - initial capital (deposit, legal, reno, stamp duties)
  roiPercentIfSold: number;    // Total return / initial capital * 100
  annualizedRoiPercent: number;// CAGR or annualized simple return
  isLoss: boolean;
}

export interface EventDecision {
  text: string;
  effectText: string;
  cashEffect: number;          // One-off cash flow
  rentEffect: number;          // Change in rent per month
  appreciationEffect: number;  // Change in appreciation rate (absolute % e.g. +0.01)
  occupancyEffect: number;     // Change in monthly occupancy (value 0 to 12)
  renovationCostAdded: number; // Capital expenditure added to cost base
}

export interface TenantNegotiation {
  id: string;
  tenantName: string;
  profession: string;
  riskRating: 'Low' | 'Medium' | 'High';
  avatar: string;
  description: string;
  proposedRent: number;
  demandText: string;
  options: {
    accept: EventDecision;
    counter: EventDecision;
    reject: EventDecision; // risks 1-2 months vacancy
  };
}

export interface MaintenanceIncident {
  id: string;
  title: string;
  description: string;
  options: {
    repairPro: EventDecision; // High cost, resolves cleanly, happy tenant
    diyCheap: EventDecision;  // Half cost, risks tenant unhappiness (reduced occupancy next year)
    ignore: EventDecision;    // 0 cost now, rent decreases or tenant leaves
  };
}

export interface NeighborhoodUpgrade {
  id: string;
  title: string;
  cost: number;
  description: string;
  benefitText: string;
  appreciationBoost: number;  // e.g. +0.01 (1%)
  rentPremium: number;        // e.g. +100 RM/month
  purchased: boolean;
}

// Campaign Play State
export interface CampaignState {
  currentYear: number;
  inputs: CalculatorInputs;
  cashReserve: number;          // Set initially to some cash pool or cash left after purchase
  initialCapitalExpended: number; // Deposit + entry fees + renovation
  activeTenant: {
    name: string;
    rent: number;
    occupancyMonths: number;
    avatar: string;
  } | null;
  history: {
    year: number;
    log: string[];
    rentIncome: number;
    expenses: number;
    cashBalance: number;
    propertyValue: number;
    loanRemaining: number;
  }[];
  activeIncident: MaintenanceIncident | null;
  activeNegotiation: TenantNegotiation | null;
  availableUpgrades: NeighborhoodUpgrade[];
  isGameOver: boolean;
  gameSummary: {
    finalYear: number;
    propertyValue: number;
    loanBalance: number;
    rpgt: number;
    netSaleCash: number;
    totalProfit: number;
    finalROI: number;
    successRating: string;
  } | null;
}
