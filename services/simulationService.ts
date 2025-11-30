import { Book, Genre, PeriodSimulation, PortfolioSummary } from '../types';

// Constants
const KENP_RATE = 0.004;
const WORDS_PER_KENP_UNIT = 250;

const GENRE_FACTORS: Record<Genre, number> = {
  [Genre.FICTION]: 0.8,
  [Genre.NON_FICTION]: 1.1,
  [Genre.BUSINESS]: 1.5,
};

// Genre preference for ad platforms (0.0 to 1.0, where 1.0 is 100% Amazon)
const GENRE_PLATFORM_SPLIT: Record<Genre, number> = {
    [Genre.FICTION]: 0.4, // Fiction leans towards FB (60% FB, 40% Amazon)
    [Genre.NON_FICTION]: 0.7, // Non-Fic leans Amazon (30% FB, 70% Amazon)
    [Genre.BUSINESS]: 0.8, // Business heavy Amazon (20% FB, 80% Amazon)
};

export const calculatePricing = (quality: number): { normal: number; launch: number } => {
  if (quality >= 9) {
    return { launch: 3.99, normal: 9.99 };
  }
  if (quality >= 5) {
    return { launch: 2.99, normal: 7.99 };
  }
  return { launch: 0.99, normal: 3.99 };
};

const getRoyaltyRate = (price: number): number => {
  if (price >= 2.99 && price <= 9.99) return 0.70;
  return 0.35;
};

// Helper to calculate profit for a specific period scenario
const calculatePeriodProfit = (
    budget: number, 
    baseParams: {
        price: number, 
        royaltyRate: number, 
        effectiveCPA: number, 
        organicSales: number,
        seriesLTV: number, 
        wordCount: number,
        readsPerSaleBase: number,
        isSeries: boolean
    }
) => {
    const paidSales = budget > 0 ? budget / baseParams.effectiveCPA : 0;
    
    // Diminishing returns on ads (simple simulation: efficiency drops as scale increases)
    // Adjusted for bi-weekly scale (2500 instead of 5000)
    const efficiencyDrag = Math.max(0.5, 1.0 - (budget / 2500)); 
    const effectivePaidSales = paidSales * efficiencyDrag;

    const totalUnits = Math.floor(effectivePaidSales + baseParams.organicSales);

    // KU Revenue
    const kuReads = Math.floor(totalUnits * baseParams.readsPerSaleBase);
    const kenpPayout = (baseParams.wordCount / WORDS_PER_KENP_UNIT) * KENP_RATE;
    const kuRevenue = kuReads * kenpPayout;

    // Sales Revenue
    const salesRevenue = totalUnits * baseParams.price * baseParams.royaltyRate;
    const seriesRevenue = baseParams.isSeries ? (totalUnits * baseParams.seriesLTV) : 0;
    
    const grossRevenue = salesRevenue + kuRevenue + seriesRevenue;
    return grossRevenue - budget;
};

export const simulateBookPerformance = (book: Book): PeriodSimulation[] => {
  const results: PeriodSimulation[] = [];
  
  const [launchYear, launchMonth, launchDay] = book.launchDate.split('-').map(Number);
  // launchMonth is 1-based from input string

  // We simulate 12 months (24 fortnights)
  // We need to determine the start period.
  // Rule: If launch is > 10th of the month, skip H1 and start calculation in H2.
  // If launch is <= 10th, start in H1.
  
  const startDate = new Date(launchYear, launchMonth - 1, 1);

  for (let m = 0; m < 12; m++) {
    const currentMonthDate = new Date(startDate);
    currentMonthDate.setMonth(startDate.getMonth() + m);
    
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth() + 1;
    const monthName = currentMonthDate.toLocaleString('default', { month: 'short' });
    const fullMonthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Process two fortnights per month: H1 (1-15) and H2 (16-End)
    for (let h = 1; h <= 2; h++) {
        const isH1 = h === 1;
        const periodKey = `${year}-${month.toString().padStart(2, '0')}-${isH1 ? 'H1' : 'H2'}`;
        const label = `${monthName} (${isH1 ? '1st Half' : '2nd Half'})`;
        
        // Skip periods before launch
        // Simple logic: 
        // If we are in the launch month (m=0):
        //   - If Launch Day > 10 and this is H1: Skip (Result is 0 or empty)
        //   - If Launch Day > 25 (very late) and this is H2: Maybe skip? sticking to >10 rule for H1 split.
        
        let isActive = true;
        
        // Check if this period is historically before the launch date
        if (m === 0) {
            if (isH1 && launchDay > 10) isActive = false;
        }

        if (!isActive) {
             results.push({
                periodKey,
                label,
                monthLabel: fullMonthName,
                isFirstHalf: isH1,
                unitsSold: 0,
                kuReads: 0,
                grossRevenue: 0,
                amazonSpend: 0,
                facebookSpend: 0,
                totalAdSpend: 0,
                netProfit: 0
            });
            continue;
        }

        const ageInFortnights = (m * 2) + (h - 1);
        // If we skipped the first H1 in month 0, we effectively shift the "age" curve?
        // Let's keep age simple: actual time passed since simulation start month.

        const isLaunchPeriod = (m === 0 && ((launchDay <= 10 && isH1) || (launchDay > 10 && !isH1)));

        // 1. Pricing
        let price = 0;
        if (book.manualPricing) {
            price = isLaunchPeriod ? book.priceLaunch : book.priceNormal;
        } else {
            const autoPrices = calculatePricing(book.quality);
            price = isLaunchPeriod ? autoPrices.launch : autoPrices.normal;
        }

        const royaltyRate = getRoyaltyRate(price);
        const socialProof = 1.0 + (Math.log(1 + book.initialReviews) * 0.05);
        const genreFactor = GENRE_FACTORS[book.genre];

        // 2. CPA & Organic Parameters (Adjusted for Fortnightly scale)
        const baseCPA = Math.max(1.5, 12.0 - book.quality); 
        // Fatigue grows slightly slower per step since steps are smaller
        const adFatigue = 1.0 + (ageInFortnights * 0.025); 
        const effectiveCPA = ((baseCPA / socialProof) * genreFactor) * adFatigue;

        // Organic Logic (Halved for bi-weekly)
        let launchMultiplier = 1.0;
        // First 2 fortnights (Month 1) get boost
        if (ageInFortnights === 0) launchMultiplier = 4.0;
        else if (ageInFortnights === 1) launchMultiplier = 2.5;
        else if (ageInFortnights === 2) launchMultiplier = 1.5;
        else if (ageInFortnights === 3) launchMultiplier = 1.2;

        const decaySeverity = 0.02;
        const retentionRate = 1.0 - ((11 - book.quality) * decaySeverity); 
        const timeDecayFactor = Math.pow(Math.max(0.5, retentionRate), ageInFortnights / 2); // Divide by 2 to align with monthly decay feel
        
        // Base organic is monthly, so divide by 2 for fortnight
        const baseOrganic = ((book.quality * 4) * socialProof) / 2;
        let organicSales = baseOrganic * launchMultiplier * timeDecayFactor;

        const readsPerSaleBase = book.quality > 6 ? 1.5 : 0.8;

        // 3. Determine Budget (Manual vs Auto-Optimize)
        // Manual budget is entered as Monthly, so divide by 2
        let periodAdSpend = 0;
        let amazonSpend = 0;
        let facebookSpend = 0;

        if (book.autoOptimize) {
            // AI Optimization: Find the "Sweet Spot" budget for THIS fortnight
            let bestProfit = -Infinity;
            let optimalBudget = 0;

            const baseParams = {
                price, royaltyRate, effectiveCPA, organicSales, 
                seriesLTV: book.seriesLTV, wordCount: book.wordCount, 
                readsPerSaleBase, isSeries: book.isSeries
            };

            // Scan budgets from $0 to $1000 (bi-weekly) in $25 increments
            for (let budget = 0; budget <= 1000; budget += 25) {
                const profit = calculatePeriodProfit(budget, baseParams);
                if (profit > bestProfit) {
                    bestProfit = profit;
                    optimalBudget = budget;
                }
            }
            
            if (bestProfit < 0 && !isLaunchPeriod) {
                const zeroProfit = calculatePeriodProfit(0, baseParams);
                if (zeroProfit > bestProfit) optimalBudget = 0;
            }

            periodAdSpend = optimalBudget;

            const amazonShare = GENRE_PLATFORM_SPLIT[book.genre];
            amazonSpend = Math.round(periodAdSpend * amazonShare);
            facebookSpend = periodAdSpend - amazonSpend;

        } else {
            // Manual Budget (Monthly / 2)
            amazonSpend = book.amazonAdBudget / 2;
            facebookSpend = book.facebookAdBudget / 2;
            periodAdSpend = amazonSpend + facebookSpend;
        }

        // Ghost Mode penalty
        if (periodAdSpend <= 0) {
            organicSales = organicSales * 0.6;
        }
        
        // 4. Final Calculation
        const paidSales = periodAdSpend > 0 ? periodAdSpend / effectiveCPA : 0;
        
        // Efficiency drag (scale 2500 for bi-weekly)
        const efficiencyDrag = Math.max(0.5, 1.0 - (periodAdSpend / 2500));
        const effectivePaidSales = paidSales * efficiencyDrag;

        const totalUnits = Math.floor(effectivePaidSales + organicSales);
        const kuReads = Math.floor(totalUnits * readsPerSaleBase);
        
        const kenpPayout = (book.wordCount / WORDS_PER_KENP_UNIT) * KENP_RATE;
        const kuRevenue = kuReads * kenpPayout;

        const salesRevenue = totalUnits * price * royaltyRate;
        const seriesRevenue = book.isSeries ? (totalUnits * book.seriesLTV) : 0;
        
        const grossRevenue = salesRevenue + kuRevenue + seriesRevenue;
        const netProfit = grossRevenue - periodAdSpend;

        results.push({
            periodKey,
            label,
            monthLabel: fullMonthName,
            isFirstHalf: isH1,
            unitsSold: totalUnits,
            kuReads: kuReads,
            grossRevenue,
            amazonSpend,
            facebookSpend,
            totalAdSpend: periodAdSpend,
            netProfit
        });
    }
  }

  return results;
};

export const aggregateSimulations = (books: Book[]): { periods: PeriodSimulation[], summary: PortfolioSummary } => {
  const map = new Map<string, PeriodSimulation>();

  books.forEach(book => {
    const bookSim = simulateBookPerformance(book);
    bookSim.forEach(sim => {
      if (!map.has(sim.periodKey)) {
        map.set(sim.periodKey, {
          periodKey: sim.periodKey,
          label: sim.label,
          monthLabel: sim.monthLabel,
          isFirstHalf: sim.isFirstHalf,
          unitsSold: 0,
          kuReads: 0,
          grossRevenue: 0,
          amazonSpend: 0,
          facebookSpend: 0,
          totalAdSpend: 0,
          netProfit: 0
        });
      }
      const existing = map.get(sim.periodKey)!;
      existing.unitsSold += sim.unitsSold;
      existing.kuReads += sim.kuReads;
      existing.grossRevenue += sim.grossRevenue;
      existing.amazonSpend += sim.amazonSpend;
      existing.facebookSpend += sim.facebookSpend;
      existing.totalAdSpend += sim.totalAdSpend;
      existing.netProfit += sim.netProfit;
    });
  });

  const periods = Array.from(map.values()).sort((a, b) => a.periodKey.localeCompare(b.periodKey));

  const summary = periods.reduce((acc, curr) => ({
    totalRevenue: acc.totalRevenue + curr.grossRevenue,
    totalAdSpend: acc.totalAdSpend + curr.totalAdSpend,
    totalNetProfit: acc.totalNetProfit + curr.netProfit,
    roi: 0
  }), { totalRevenue: 0, totalAdSpend: 0, totalNetProfit: 0, roi: 0 });

  if (summary.totalAdSpend > 0) {
    summary.roi = ((summary.totalRevenue - summary.totalAdSpend) / summary.totalAdSpend) * 100;
  } else if (summary.totalRevenue > 0) {
    summary.roi = 1000;
  }

  return { periods, summary };
};

// No longer needed
export const findOptimalBudget = (book: Book): number => {
  return 0; 
};