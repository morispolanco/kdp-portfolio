export enum Genre {
  FICTION = 'fiction',
  NON_FICTION = 'non_fiction',
  BUSINESS = 'business'
}

export interface Book {
  id: string;
  title: string;
  launchDate: string; // YYYY-MM-DD
  wordCount: number;
  quality: number; // 1-10
  initialReviews: number;
  genre: Genre;
  isSeries: boolean;
  seriesLTV: number;
  adBudgetMonthly: number;
  manualPricing: boolean;
  priceLaunch: number;
  priceNormal: number;
}

export interface MonthlySimulation {
  monthKey: string; // YYYY-MM format for aggregation
  monthLabel: string; // Human readable
  unitsSold: number;
  kuReads: number;
  grossRevenue: number; // Sales + KENP + Series LTV
  adSpend: number;
  netProfit: number;
}

export interface PortfolioSummary {
  totalRevenue: number;
  totalAdSpend: number;
  totalNetProfit: number;
  roi: number;
}