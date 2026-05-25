/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculatorInputs, YearlyProjection, TenantNegotiation, MaintenanceIncident, NeighborhoodUpgrade } from './types';

/**
 * Calculates legal fees for SPA (Sale & Purchase Agreement) or Loan Agreement in Malaysia
 * Under the Solicitors’ Remuneration (Amendment) Order 2023:
 * - First RM 500,000: 1.25%
 * - Next RM 500,000: 1.00%
 */
export function calculateMalaysianLegalFees(amount: number): number {
  if (amount <= 500000) {
    return amount * 0.0125;
  } else {
    return (500000 * 0.0125) + ((amount - 500000) * 0.01);
  }
}

/**
 * Calculates Stamp Duty for Transfer (MOT - Memorandum of Transfer) in Malaysia:
 * - First RM 100,000: 1%
 * - RM 100,001 to RM 500,000: 2%
 * - RM 500,001 to RM 1,000,000: 3%
 * - Above RM 1,000,000: 4%
 */
export function calculateStampDutyMOT(propertyPrice: number): number {
  let duty = 0;
  if (propertyPrice <= 100000) {
    duty = propertyPrice * 0.01;
  } else if (propertyPrice <= 500000) {
    duty = (100000 * 0.01) + ((propertyPrice - 100000) * 0.02);
  } else if (propertyPrice <= 1000000) {
    duty = (100000 * 0.01) + (400000 * 0.02) + ((propertyPrice - 500000) * 0.03);
  } else {
    duty = (100000 * 0.01) + (400000 * 0.02) + (500000 * 0.03) + ((propertyPrice - 1000000) * 0.04);
  }
  return duty;
}

/**
 * Calculates Loan Stamp Duty:
 * - Flat 0.5% of the total loan amount
 */
export function calculateLoanStampDuty(loanAmount: number): number {
  return loanAmount * 0.005;
}

/**
 * Estimates Valuation Fee in Malaysia:
 * - First RM 100,000: 0.25%
 * - Next RM 1,900,000: 0.20%
 * For simplified estimation, we return the scale or standard RM 1,000.
 */
export function estimateValuationFee(propertyPrice: number): number {
  if (propertyPrice <= 100000) {
    return Math.max(400, propertyPrice * 0.0025);
  } else {
    return (100000 * 0.0025) + ((propertyPrice - 100000) * 0.002);
  }
}

/**
 * Calculates Monthly Mortgage Installment:
 * P = Loan principal
 * r = monthly interest rate (annual_rate / 12 / 100)
 * n = number of months
 */
export function calculateMonthlyMortgage(principal: number, annualRate: number, termYears: number): number {
  const r = (annualRate / 100) / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Runs a monthly reducing balance mortgage amortization to find yearly checkpoints.
 */
export function getAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  yearsToForecast: number
): {
  balances: number[];            // Index corresponds to year. Index 0 = initial principal
  cumulativeInterest: number[];  // Cumulative interest paid at the end of each year
  cumulativePrincipal: number[]; // Cumulative principal repaid at the end of each year
} {
  const r = (annualRate / 100) / 12;
  const monthlyRepayment = calculateMonthlyMortgage(principal, annualRate, termYears);
  
  const balances: number[] = [principal];
  const cumulativeInterest: number[] = [0];
  const cumulativePrincipal: number[] = [0];

  let currentBalance = principal;
  let totalInterestSpent = 0;
  let totalPrincipalSpent = 0;

  for (let year = 1; year <= yearsToForecast; year++) {
    for (let month = 1; month <= 12; month++) {
      if (currentBalance <= 0) {
        currentBalance = 0;
        continue;
      }
      const interestForMonth = currentBalance * r;
      const principalForMonth = Math.min(currentBalance, monthlyRepayment - interestForMonth);
      
      currentBalance -= principalForMonth;
      totalInterestSpent += interestForMonth;
      totalPrincipalSpent += principalForMonth;
    }
    balances.push(currentBalance);
    cumulativeInterest.push(totalInterestSpent);
    cumulativePrincipal.push(totalPrincipalSpent);
  }

  return { balances, cumulativeInterest, cumulativePrincipal };
}

/**
 * Calculates Malaysian Real Property Gains Tax (RPGT)
 * Standard individual citizen RPGT rates (SST-adjusted):
 * - Within 3 years: 30% of capital gains
 * - In 4th year (holding > 3, <= 4 years): 20%
 * - In 5th year (holding > 4, <= 5 years): 15%
 * - In 6th year and onwards: 0% for citizens, 10% for foreigners
 */
export function calculateRPGT(
  gain: number,
  yearOfHolding: number,
  isForeigner: boolean
): number {
  if (gain <= 0) return 0;
  
  if (yearOfHolding <= 3) {
    return gain * 0.30;
  } else if (yearOfHolding === 4) {
    return gain * 0.20;
  } else if (yearOfHolding === 5) {
    return gain * 0.15;
  } else {
    return isForeigner ? (gain * 0.10) : 0; // 0% for citizens in Year 6+
  }
}

/**
 * Main project projection builder
 */
export function generateProjections(inputs: CalculatorInputs, yearsToForecast: number = 15): {
  upfrontCosts: {
    deposit: number;
    spaLegal: number;
    spaStampDuty: number;
    loanLegal: number;
    loanStampDuty: number;
    valuation: number;
    renovation: number;
    totalInitialOutlay: number;
  };
  yearlyData: YearlyProjection[];
} {
  const {
    propertyPrice,
    depositPercent,
    loanTermYears,
    interestRate,
    sizeSqft,
    maintenancePsf,
    quitRentAndAssessment,
    monthlyRent,
    renovationCost,
    appreciationRate,
    occupancyMonthsPerYear,
    citizenStatus,
  } = inputs;

  const deposit = propertyPrice * (depositPercent / 100);
  const loanAmount = propertyPrice - deposit;

  // Upfront entries
  const spaLegal = calculateMalaysianLegalFees(propertyPrice);
  const spaStampDuty = calculateStampDutyMOT(propertyPrice);
  const loanLegal = calculateMalaysianLegalFees(loanAmount);
  const loanStampDuty = calculateLoanStampDuty(loanAmount);
  const valuation = estimateValuationFee(propertyPrice);
  const totalInitialOutlay = deposit + spaLegal + spaStampDuty + loanLegal + loanStampDuty + valuation + renovationCost;

  // Monthly items
  const monthlyMaintenance = sizeSqft * maintenancePsf;
  const yearlyMaintAndQuit = (monthlyMaintenance * 12) + quitRentAndAssessment;
  
  const monthlyMortgage = calculateMonthlyMortgage(loanAmount, interestRate, loanTermYears);
  const yearlyMortgageRepayment = monthlyMortgage * 12;

  // Mortgage curve
  const { balances, cumulativeInterest, cumulativePrincipal } = getAmortizationSchedule(
    loanAmount,
    interestRate,
    loanTermYears,
    yearsToForecast
  );

  const stats: YearlyProjection[] = [];

  for (let year = 1; year <= yearsToForecast; year++) {
    // Property value at year N
    const propertyValue = propertyPrice * Math.pow(1 + (appreciationRate / 100), year);
    const loanBalance = balances[year];

    // Cumulative Rent
    const rentalPerYear = monthlyRent * occupancyMonthsPerYear;
    const cumulativeRentReceived = rentalPerYear * year;

    // Cumulative Operating Expenses
    const cumulativeMaintAssessPaid = yearlyMaintAndQuit * year;
    const cumulativeInterestPaid = cumulativeInterest[year];
    const cumulativeMortgagePaymentsPaid = yearlyMortgageRepayment * year;

    // Total cumulative out-of-flow expenses during ownership (maint, assessments, and mortgage total)
    const cumulativeExpensesPaid = cumulativeMaintAssessPaid + cumulativeMortgagePaymentsPaid;

    // Agent Sales Fee: 3% of sales value
    const agentFeeOnSale = propertyValue * 0.03;

    // Capital gains calculation (Malaysian IRB formula):
    // Gain = Disposal Price - Acquisition Price - Permitted Expenses (renovation, entry commissions, stamp duties/legal of buy)
    const entryBuyingCosts = spaLegal + spaStampDuty + loanLegal + loanStampDuty + valuation;
    const totalCostBase = propertyPrice + entryBuyingCosts + renovationCost;
    
    // Gain before RPGT = Property Sales Value - Cost Base - Sales Agent Fee
    const grossSalePrice = propertyValue;
    const capitalGains = propertyValue - totalCostBase - agentFeeOnSale;
    const isForeigner = citizenStatus === 'foreigner';
    const rpgtTax = capitalGains > 0 ? calculateRPGT(capitalGains, year, isForeigner) : 0;

    // Running accumulated cash balance during holding years:
    // Rental Collected minus (Mortgage Payments + Maintenance & Quit Rent)
    const netCashFlowAccumulated = cumulativeRentReceived - cumulativeExpensesPaid;

    // Net cash proceeds directly from the sales transaction:
    // Cash from Sale = Gross Sales Price - Outstanding Loan Loan - Sales Agent Fee - RPGT Tax 
    const transactionProceeds = grossSalePrice - loanBalance - agentFeeOnSale - rpgtTax;

    // Net Proceeds if Sold = Transaction Proceeds + ongoing Cash Flow Accumulated
    // This is the total liquid value in bank at the end of Year N (which includes return of deposit)
    const netProceedsIfSold = transactionProceeds + netCashFlowAccumulated;

    // Net Profit If Sold = Net proceeds after settlement - What we originally pulled from pockets
    const netProfitIfSold = netProceedsIfSold - totalInitialOutlay;

    // ROI percent if sold = Real profit / Real Upfront Cash Invested
    const roiPercentIfSold = (netProfitIfSold / totalInitialOutlay) * 100;

    // Annualized compound ROI (CAGR)
    // CAGR = (NetProceedsIfSold / InitialOutlay) ^ (1/year) - 1
    const rawRatio = netProceedsIfSold / totalInitialOutlay;
    let annualizedRoiPercent = 0;
    if (rawRatio > 0) {
      annualizedRoiPercent = (Math.pow(rawRatio, 1 / year) - 1) * 100;
    } else {
      annualizedRoiPercent = -100;
    }

    stats.push({
      year,
      propertyValue,
      mortgageBalance: loanBalance,
      cumulativeRentReceived,
      cumulativeExpensesPaid,
      cumulativePrincipalRepaid: cumulativePrincipal[year],
      cumulativeInterestPaid,
      mortgageRepaymentPaid: cumulativeMortgagePaymentsPaid,
      rpgtTax,
      agentFeeOnSale,
      grossSalePrice,
      netProceedsIfSold,
      netProfitIfSold,
      roiPercentIfSold,
      annualizedRoiPercent,
      isLoss: netProfitIfSold < 0
    });
  }

  return {
    upfrontCosts: {
      deposit,
      spaLegal,
      spaStampDuty,
      loanLegal,
      loanStampDuty,
      valuation,
      renovation: renovationCost,
      totalInitialOutlay
    },
    yearlyData: stats
  };
}


/** Game Cards / Scenarios list generator */
export function getNegotiationDeck(currentRent: number): TenantNegotiation[] {
  return [
    {
      id: 'neg_1',
      tenantName: 'Syahmi (The Young Accountant)',
      profession: 'Auditor at Big-4, KL Sentral',
      riskRating: 'Low',
      avatar: '💼',
      description: 'Single, highly professional, but extremely calculative with his money. Prefers long stability and takes great care of appliances.',
      proposedRent: currentRent - 100,
      demandText: `Offers RM ${currentRent - 100} instead of RM ${currentRent}. In exchange, he will sign a 2-year lease immediately and pay 3 months deposit on time.`,
      options: {
        accept: {
          text: 'Accept lower rent for stability',
          effectText: `Rent set to RM ${currentRent - 100} (-RM 100). Occupancy locked at 12/12 months next year.`,
          cashEffect: 0,
          rentEffect: -100,
          appreciationEffect: 0,
          occupancyEffect: 12,
          renovationCostAdded: 0
        },
        counter: {
          text: 'Demand original rent with fully-furnished microwave & fridge upgrade',
          effectText: `Rent remains RM ${currentRent}. Must pay RM 1,500 upfront for kitchen appliances today.`,
          cashEffect: -1500,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 12,
          renovationCostAdded: 1500
        },
        reject: {
          text: 'Reject Syahmi. Seek another tenant.',
          effectText: 'He walks away. Property undergoes 2-month vacancy period to re-advertise. Seek standard rate.',
          cashEffect: 0,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 10,
          renovationCostAdded: 0
        }
      }
    },
    {
      id: 'neg_2',
      tenantName: 'The Expat College Teachers (Alice & Dave)',
      profession: 'International School Lecturers, USJ',
      riskRating: 'Medium',
      avatar: '🇺🇸',
      description: 'Extremely polite, earning high expat salaries, but love host parties. They request minor cosmetic updates to suit their taste.',
      proposedRent: currentRent + 150,
      demandText: `Willing to pay a premium of RM ${currentRent + 150} (+RM 150), BUT demands a custom feature wall paint and deep professional cleaning before key handover.`,
      options: {
        accept: {
          text: 'Agree. Pay RM 2,000 for cleaning & accent wall',
          effectText: `Premium rent RM ${currentRent + 150}. Pays RM 2,000 upfront cosmetic costs. Occupancy locked at 11/12.`,
          cashEffect: -2000,
          rentEffect: 150,
          appreciationEffect: 0,
          occupancyEffect: 11,
          renovationCostAdded: 2000
        },
        counter: {
          text: 'Offer split cost: Landlord pays RM 1,000, rent stays at original',
          effectText: `Rent at RM ${currentRent}. Pay RM 1,000 cosmetic cost. Occupancy locked at 11/12.`,
          cashEffect: -1000,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 11,
          renovationCostAdded: 1000
        },
        reject: {
          text: 'Reject expats: Too high upkeep risk',
          effectText: 'They find another place on iProperty. Leads to 1-month vacancy while waiting for local tenant.',
          cashEffect: 0,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 11,
          renovationCostAdded: 0
        }
      }
    },
    {
      id: 'neg_3',
      tenantName: 'Encik Rosli & Family',
      profession: 'Public Service Executive/Small Business Owner',
      riskRating: 'Low',
      avatar: '👨‍👩‍👧‍👦',
      description: 'Lovely family of four. They want to make this place their long-term home. However, they request the old worn carpets be replaced with tiles.',
      proposedRent: currentRent,
      demandText: `Agrees to pay RM ${currentRent}. Demands landlord tiling replacement for kids' allergies (estimated cost RM 3,500).`,
      options: {
        accept: {
          text: 'Approve tiling replacement (RM 3,500 CapEx)',
          effectText: `Original rent RM ${currentRent}. Floor upgraded! (CapEx added to Cost Base for lower future tax). 12/12 months occupancy.`,
          cashEffect: -3500,
          rentEffect: 0,
          appreciationEffect: 0.002, // tiles slightly improve value
          occupancyEffect: 12,
          renovationCostAdded: 3500
        },
        counter: {
          text: 'Offer vinyl self-install discount (Cut RM 100 rent for 12 months)',
          effectText: `Saves RM 3,500 cash today. Rent lowered to RM ${currentRent - 100} next year. Tenant installs overlay floor themselves.`,
          cashEffect: 0,
          rentEffect: -100,
          appreciationEffect: 0,
          occupancyEffect: 12,
          renovationCostAdded: 0
        },
        reject: {
          text: 'Decline tiling demand',
          effectText: 'Family declines lease. Seek lower budget tenant, risking 2 months of standard vacancy.',
          cashEffect: 0,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 10,
          renovationCostAdded: 0
        }
      }
    }
  ];
}

export function getIncidentDeck(): MaintenanceIncident[] {
  return [
    {
      id: 'inc_1',
      title: 'Water Pipe Burst in the Bathroom!',
      description: 'Water is dripping through the ceiling of the downstairs neighbour. They threatened to call the Joint Management Body (JMB) and fine you.',
      options: {
        repairPro: {
          text: 'Hire Authorized Plumber (RM 1,200)',
          effectText: 'Professional repair done in 3 hours. Issues certified guarantee. Tenant is incredibly grateful.',
          cashEffect: -1200,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 12,
          renovationCostAdded: 0
        },
        diyCheap: {
          text: 'Call a helper to patch with sealant tape (RM 300)',
          effectText: 'Immediate leak stopped, but looks ugly. Tenant grumbles and demands rent discount next lease renew.',
          cashEffect: -300,
          rentEffect: -50,
          appreciationEffect: 0,
          occupancyEffect: 11,
          renovationCostAdded: 0
        },
        ignore: {
          text: 'Argue it is JMB’s internal main-pipe issue and drag your feet',
          effectText: 'Downstairs tenant reports you, JMB forces entry. Substantial legal fine + leak damage forces RM 2,800 payment.',
          cashEffect: -2800,
          rentEffect: -100,
          appreciationEffect: -0.005,
          occupancyEffect: 10,
          renovationCostAdded: 0
        }
      }
    },
    {
      id: 'inc_2',
      title: 'Air Conditioner Compressor Dead',
      description: 'It is a scorching April in Malaysia (35°C!). Your tenant calls sweating and says the master bed AC only blows warm air. Compressor unit needs replacement.',
      options: {
        repairPro: {
          text: 'Install a brand new inverter Panasonic AC (RM 1,800)',
          effectText: 'Inverter class. Reduced utility bills for tenant, increases asset score. Tenant happy.',
          cashEffect: -1800,
          rentEffect: 0,
          appreciationEffect: 0.001,
          occupancyEffect: 12,
          renovationCostAdded: 1800
        },
        diyCheap: {
          text: 'Buy a reliable second-hand non-inverter AC (RM 800)',
          effectText: 'Works, but noisy and power-hungry. Tenant is placated.',
          cashEffect: -800,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 12,
          renovationCostAdded: 800
        },
        ignore: {
          text: 'Provide a basic portable stand fan instead (RM 150)',
          effectText: 'Tenant is furious, refuses to pay rent on time, and leaves the property immediately. Vacation vacancy hits!',
          cashEffect: -150,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 9,
          renovationCostAdded: 0
        }
      }
    },
    {
      id: 'inc_3',
      title: 'Termite infestation detected!',
      description: 'The kitchen cabinets (installed during renovation) show signs of woodworking dust of termites. If left untreated, they will digest the structural doorframes.',
      options: {
        repairPro: {
          text: 'Call Pest Control Specialist with 3-yr baiting license (RM 2,500)',
          effectText: 'Termites successfully exterminated and structural integrity saved on contract.',
          cashEffect: -2500,
          rentEffect: 0,
          appreciationEffect: 0,
          occupancyEffect: 12,
          renovationCostAdded: 0
        },
        diyCheap: {
          text: 'Buy supermarket anti-termite spray and do it yourself (RM 120)',
          effectText: 'Hidden colonies survive. They spread to bedroom cupboards. Value degrades slightly.',
          cashEffect: -120,
          rentEffect: -50,
          appreciationEffect: -0.01,
          occupancyEffect: 11,
          renovationCostAdded: 0
        },
        ignore: {
          text: 'Do nothing and blame tenant for food waste',
          effectText: 'Widespread structural wood decay. Repair bills stack. Value falls heavily (-RM 8k). Tenant breaks agreement.',
          cashEffect: -8000,
          rentEffect: -150,
          appreciationEffect: -0.02,
          occupancyEffect: 8,
          renovationCostAdded: 0
        }
      }
    }
  ];
}

export function getNeighborhoodUpgradesList(): NeighborhoodUpgrade[] {
  return [
    {
      id: 'upg_lrt',
      title: 'LRT Extension Station Lobbying',
      cost: 4000,
      description: 'Contribute to the residential council action committee co-advertising legal petitions to secure a pedestrian bridge directly linking your neighborhood to the new LRT Sri Petaling station line.',
      benefitText: 'Guarantees easier commute. Elevates property appreciation rate by +1.5% and commands RM 100/mo premium.',
      appreciationBoost: 1.5,
      rentPremium: 100,
      purchased: false
    },
    {
      id: 'upg_security',
      title: 'Gated-and-Guarded Security Retrofit',
      cost: 3000,
      description: 'Support the neighborhood Joint Management Body’s proposal to install card-access boom-gates, 24/7 CCTV, and professional guard patrols.',
      benefitText: 'Crime rates dive. High-quality family tenants prefer your area. Increases appreciation by +0.8% and rent by RM 50/mo.',
      appreciationBoost: 0.8,
      rentPremium: 50,
      purchased: false
    },
    {
      id: 'upg_interior',
      title: 'Premium Smart-Home Lock & Wardrobes',
      cost: 6000,
      description: 'Equip the flat with professional built-in floor-to-ceiling Ikea wardrobes and install a passcode-locking digital smart lock on the grille gate.',
      benefitText: 'Attracts executive-grade corporate professionals. Increases rent by RM 150/mo instantly.',
      appreciationBoost: 0.2,
      rentPremium: 150,
      purchased: false
    }
  ];
}
