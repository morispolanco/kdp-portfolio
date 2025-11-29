import { Book, Genre, MonthlySimulation, PortfolioSummary } from '../types';

// Constants
const KENP_RATE = 0.004;
const WORDS_PER_KENP_UNIT = 250;

const GENRE_FACTORS: Record<Genre, number> = {
  [Genre.FICTION]: 0.8,
  [Genre.NON_FICTION]: 1.1,
  [Genre.BUSINESS]: 1.5,
};

export const calculatePricing = (quality: number): { normal: number; launch: number } => {
  let normal = 7.99;
  if (quality >= 9) normal = 9.99;
  else if (quality < 5) normal = 3.99;

  return {
    normal,
    launch: 2.99
  };
};

const getRoyaltyRate = (price: number): number => {
  if (price >= 2.99 && price <= 9.99) return 0.70;
  return 0.35;
};

export const simulateBookPerformance = (book: Book): MonthlySimulation[] => {
  const results: MonthlySimulation[] = [];
  
  const [yearStr, monthStr, dayStr] = book.launchDate.split('-').map(Number);
  const startDate = new Date(yearStr, monthStr - 1, 15);

  for (let i = 0; i < 12; i++) {
    const currentMonthDate = new Date(startDate);
    currentMonthDate.setMonth(startDate.getMonth() + i);
    
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth() + 1;
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const monthLabel = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const isLaunchMonth = i === 0;
    const ageInMonths = i;

    // 1. Pricing
    let price = 0;
    if (book.manualPricing) {
        price = isLaunchMonth ? book.priceLaunch : book.priceNormal;
    } else {
        const autoPrices = calculatePricing(book.quality);
        price = isLaunchMonth ? autoPrices.launch : autoPrices.normal;
    }

    // 2. Royalty
    const royaltyRate = getRoyaltyRate(price);

    // 3. Social Proof & Genre
    const socialProof = 1.0 + (Math.log(1 + book.initialReviews) * 0.05);
    const genreFactor = GENRE_FACTORS[book.genre];

    // 4. Paid Sales (Ad Fatigue Logic)
    // As time goes on, ads become slightly less effective (CPA rises) due to audience saturation.
    // Base CPA depends on quality.
    const baseCPA = Math.max(1.5, 12.0 - book.quality); 
    // CPA increases by ~5% per month (Ad Fatigue)
    const adFatigue = 1.0 + (ageInMonths * 0.05); 
    
    const effectiveCPA = ((baseCPA / socialProof) * genreFactor) * adFatigue;
    
    // Direct monthly budget usage
    const monthlyAdSpend = book.adBudgetMonthly;
    const paidSales = monthlyAdSpend > 0 ? monthlyAdSpend / effectiveCPA : 0;

    // 5. Organic Sales (Demand Decay Logic)
    // Concept: "The Cliff"
    // Month 0 (Launch): Huge boost (Honeymoon).
    // Month 1+: Decay sets in based on quality. High quality decays slower.
    
    // Launch Multiplier (Honeymoon Period)
    let launchMultiplier = 1.0;
    if (ageInMonths === 0) launchMultiplier = 4.0; // Huge launch visibility
    else if (ageInMonths === 1) launchMultiplier = 1.8; // Echo effect
    else if (ageInMonths === 2) launchMultiplier = 1.1; // Tailing off

    // Decay Factor (Long Tail)
    // High Quality (10) retains ~98% month-over-month.
    // Low Quality (1) retains ~80% month-over-month.
    // Formula: Retention = 1.0 - ((11 - Quality) * Scale)
    const decaySeverity = 0.02; // 2% per quality point differential
    const retentionRate = 1.0 - ((11 - book.quality) * decaySeverity); 
    const timeDecayFactor = Math.pow(Math.max(0.5, retentionRate), ageInMonths);

    // Base Organic Volume
    const baseOrganic = (book.quality * 4) * socialProof;
    
    // Combine Factors
    let organicSales = baseOrganic * launchMultiplier * timeDecayFactor;

    // Ghost Mode penalty (If no ads running, organic is suppressed slightly)
    if (monthlyAdSpend <= 0) {
      organicSales = organicSales * 0.6;
    }
    
    const totalUnits = Math.floor(paidSales + organicSales);

    // 6. KU Reads
    // KU now scales with total units (paid visibility drives reads)
    // Base ratio of reads to sales varies by quality (better books get read more)
    const readsPerSaleBase = book.quality > 6 ? 1.5 : 0.8;
    const kuReads = Math.floor(totalUnits * readsPerSaleBase);
    
    const kenpPayout = (book.wordCount / WORDS_PER_KENP_UNIT) * KENP_RATE;
    const kuRevenue = kuReads * kenpPayout;

    // 7. Revenue Calculation
    const salesRevenue = totalUnits * price * royaltyRate;
    const seriesRevenue = book.isSeries ? (totalUnits * book.seriesLTV) : 0;
    
    const grossRevenue = salesRevenue + kuRevenue + seriesRevenue;
    const netProfit = grossRevenue - monthlyAdSpend;

    results.push({
      monthKey,
      monthLabel,
      unitsSold: totalUnits,
      kuReads: kuReads,
      grossRevenue,
      adSpend: monthlyAdSpend,
      netProfit
    });
  }

  return results;
};

export const aggregateSimulations = (books: Book[]): { monthly: MonthlySimulation[], summary: PortfolioSummary } => {
  const map = new Map<string, MonthlySimulation>();

  books.forEach(book => {
    const bookSim = simulateBookPerformance(book);
    bookSim.forEach(sim => {
      if (!map.has(sim.monthKey)) {
        map.set(sim.monthKey, {
          monthKey: sim.monthKey,
          monthLabel: sim.monthLabel,
          unitsSold: 0,
          kuReads: 0,
          grossRevenue: 0,
          adSpend: 0,
          netProfit: 0
        });
      }
      const existing = map.get(sim.monthKey)!;
      existing.unitsSold += sim.unitsSold;
      existing.kuReads += sim.kuReads;
      existing.grossRevenue += sim.grossRevenue;
      existing.adSpend += sim.adSpend;
      existing.netProfit += sim.netProfit;
    });
  });

  const monthly = Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const summary = monthly.reduce((acc, curr) => ({
    totalRevenue: acc.totalRevenue + curr.grossRevenue,
    totalAdSpend: acc.totalAdSpend + curr.adSpend,
    totalNetProfit: acc.totalNetProfit + curr.netProfit,
    roi: 0
  }), { totalRevenue: 0, totalAdSpend: 0, totalNetProfit: 0, roi: 0 });

  if (summary.totalAdSpend > 0) {
    summary.roi = ((summary.totalRevenue - summary.totalAdSpend) / summary.totalAdSpend) * 100;
  } else if (summary.totalRevenue > 0) {
    summary.roi = 1000;
  }

  return { monthly, summary };
};