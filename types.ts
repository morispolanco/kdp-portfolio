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
  synopsis: string;
  firstChapter: string;
  isSeries: boolean;
  seriesLTV: number;
  amazonAdBudget: number;
  facebookAdBudget: number;
  autoOptimize: boolean; // New flag for dynamic monthly strategy
  manualPricing: boolean;
  priceLaunch: number;
  priceNormal: number;
}

export interface PeriodSimulation {
  periodKey: string; // YYYY-MM-H1 or YYYY-MM-H2
  label: string; // e.g., "Jan (1st Half)"
  monthLabel: string; // "January 2024"
  isFirstHalf: boolean;
  unitsSold: number;
  kuReads: number;
  grossRevenue: number; // Sales + KENP + Series LTV
  amazonSpend: number; // Dynamic spend for this fortnight
  facebookSpend: number; // Dynamic spend for this fortnight
  totalAdSpend: number;
  netProfit: number;
}

export interface PortfolioSummary {
  totalRevenue: number;
  totalAdSpend: number;
  totalNetProfit: number;
  roi: number;
}