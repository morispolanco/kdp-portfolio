import React, { useMemo } from 'react';
import { Book } from '../types';
import { aggregateSimulations, calculatePricing } from '../services/simulationService';
import { TrendingUp, DollarSign, Activity, Megaphone, Tag, Book as BookIcon, BrainCircuit, BarChart3, CalendarClock } from 'lucide-react';

interface ResultsDashboardProps {
  books: Book[];
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ books }) => {
  const { periods, summary } = useMemo(() => aggregateSimulations(books), [books]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const currencyFormatterDec = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (books.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-400">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-gray-500">Your portfolio is empty</h2>
            <p className="text-sm">Add books using the sidebar to start the simulation.</p>
        </div>
    )
  }

  const optimizedBooks = books.filter(b => b.autoOptimize);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Simulation</h1>
            <p className="text-gray-500 mt-1">Projected performance (Bi-weekly) for {books.length} book{books.length !== 1 ? 's' : ''}.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900">{currencyFormatter.format(summary.totalRevenue)}</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full w-full"></div>
                </div>
            </div>

            {/* Ad Spend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Ad Spend</p>
                        <h3 className="text-2xl font-bold text-gray-900">{currencyFormatter.format(summary.totalAdSpend)}</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                        <Activity className="w-5 h-5 text-red-600" />
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((summary.totalAdSpend / summary.totalRevenue) * 100, 100)}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    {summary.totalRevenue > 0 ? ((summary.totalAdSpend / summary.totalRevenue) * 100).toFixed(1) : 0}% of Revenue
                </p>
            </div>

            {/* Net Profit & ROI */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Net Profit</p>
                        <h3 className={`text-2xl font-bold ${summary.totalNetProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {currencyFormatter.format(summary.totalNetProfit)}
                        </h3>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${summary.roi > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {summary.roi.toFixed(0)}% ROI
                    </span>
                    <span className="text-xs text-gray-400">Return on Ad Spend</span>
                </div>
            </div>
        </div>

        {/* AI STRATEGY CHAPTER */}
        {optimizedBooks.length > 0 && (
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <BrainCircuit className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">AI Strategy Analysis</h3>
                        <p className="text-sm text-indigo-700/80">Active dynamic optimization for {optimizedBooks.length} book(s).</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Bi-Weekly Dynamic Budget Allocation
                        </h4>
                        <div className="h-40 flex items-end gap-0.5 pb-2 border-b border-gray-100">
                            {periods.map((p, i) => {
                                const maxSpend = Math.max(...periods.map(x => x.totalAdSpend));
                                const height = maxSpend > 0 ? Math.max(5, (p.totalAdSpend / maxSpend) * 100) : 0;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        <div className="w-full flex flex-col justify-end h-full gap-px">
                                             <div style={{ height: `${p.totalAdSpend > 0 ? (p.facebookSpend / p.totalAdSpend) * height : 0}%` }} className="w-full bg-blue-500/80 rounded-t-sm"></div>
                                             <div style={{ height: `${p.totalAdSpend > 0 ? (p.amazonSpend / p.totalAdSpend) * height : 0}%` }} className="w-full bg-amber-500/80 rounded-b-sm"></div>
                                        </div>
                                        {/* Tooltip */}
                                        <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-800 text-white text-[10px] p-2 rounded z-10 w-40 shadow-xl pointer-events-none">
                                            <p className="font-bold border-b border-gray-600 mb-1 pb-1">{p.label}</p>
                                            <p className="flex justify-between"><span>FB:</span> <span>${p.facebookSpend}</span></p>
                                            <p className="flex justify-between"><span>Amz:</span> <span>${p.amazonSpend}</span></p>
                                            <p className="flex justify-between border-t border-gray-600 mt-1 pt-1"><span>Profit:</span> <span>${p.netProfit.toFixed(0)}</span></p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
                            <span>Launch</span>
                            <span>Month 12</span>
                        </div>
                        <div className="flex gap-4 mt-4 justify-center">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Amazon
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Facebook
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                             <h5 className="font-semibold text-gray-800 text-sm mb-1">Bi-Weekly Optimization</h5>
                             <p className="text-xs text-gray-600 leading-relaxed">
                                The AI recalculates ROI every 14 days. If a book launches after the 10th of the month, the system skips the first partial fortnight and begins optimization in the second half of the month to avoid inefficient ad spend.
                             </p>
                         </div>
                         <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                             <h5 className="font-semibold text-gray-800 text-sm mb-1">Platform Split Strategy</h5>
                             <p className="text-xs text-gray-600 leading-relaxed">
                                Budget is distributed between Amazon and Facebook based on <strong>Genre historical data</strong>. 
                                Fiction titles are allocated more heavily to Facebook (impulse buys), while Non-Fiction prioritizes Amazon (search intent).
                             </p>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Portfolio Overview Cards (Strategy Snapshot) */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-500" />
                Book Strategy Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => {
                    const prices = book.manualPricing 
                        ? { launch: book.priceLaunch, normal: book.priceNormal }
                        : calculatePricing(book.quality);
                    const totalStatic = book.amazonAdBudget + book.facebookAdBudget;

                    return (
                        <div key={book.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-100 rounded text-gray-600">
                                        <BookIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1" title={book.title}>{book.title}</h4>
                                        <p className="text-xs text-gray-500">{book.genre.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${
                                        book.quality >= 8 ? 'bg-green-100 text-green-700' :
                                        book.quality >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    Q: {book.quality}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded p-2 border border-gray-100">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Tag className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pricing Strategy</span>
                                        {!book.manualPricing && <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100 ml-auto">Auto</span>}
                                        {book.manualPricing && <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-100 ml-auto">Manual</span>}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400">Launch</span>
                                            <span className="font-mono font-semibold text-gray-800">${prices.launch}</span>
                                        </div>
                                        <div className="w-px bg-gray-200"></div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-400">Normal</span>
                                            <span className="font-mono font-semibold text-gray-800">${prices.normal}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`rounded p-2 border ${book.autoOptimize ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        {book.autoOptimize ? <BrainCircuit className="w-3 h-3 text-indigo-500" /> : <Activity className="w-3 h-3 text-gray-400" />}
                                        <span className={`text-xs font-medium uppercase tracking-wide ${book.autoOptimize ? 'text-indigo-700' : 'text-gray-600'}`}>
                                            {book.autoOptimize ? 'AI Dynamic Budget' : 'Fixed Monthly Budget'}
                                        </span>
                                    </div>
                                    
                                    {!book.autoOptimize ? (
                                        <>
                                        <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200 mb-1">
                                            <div className="bg-amber-500 h-full" style={{ width: `${totalStatic > 0 ? (book.amazonAdBudget / totalStatic) * 100 : 0}%` }}></div>
                                            <div className="bg-blue-600 h-full" style={{ width: `${totalStatic > 0 ? (book.facebookAdBudget / totalStatic) * 100 : 0}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Amz: ${book.amazonAdBudget}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> FB: ${book.facebookAdBudget}
                                            </span>
                                        </div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-indigo-600/80 leading-snug">
                                            System adjusts spend every 14 days.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Consolidated Monthly Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-gray-500" />
                    Consolidated Bi-Weekly Projection
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-4 py-4 min-w-[120px]">Period</th>
                            <th className="px-4 py-4 text-right">Units</th>
                            <th className="px-4 py-4 text-right">KU Reads</th>
                            <th className="px-4 py-4 text-right">Gross Rev</th>
                            <th className="px-4 py-4 text-right text-amber-600 bg-amber-50/50">Amazon Ads</th>
                            <th className="px-4 py-4 text-right text-blue-600 bg-blue-50/50">FB Ads</th>
                            <th className="px-4 py-4 text-right">Total Ads</th>
                            <th className="px-4 py-4 text-right">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {periods.map((p) => (
                            <tr key={p.periodKey} className={`hover:bg-gray-50/50 transition-colors ${!p.isFirstHalf ? 'bg-gray-50/30' : ''}`}>
                                <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100/50">
                                    <div className="flex flex-col">
                                        <span>{p.label}</span>
                                        {/* <span className="text-[10px] text-gray-400 font-normal">{p.monthLabel}</span> */}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right font-mono">{p.unitsSold.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono">{p.kuReads.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono text-green-700">{currencyFormatterDec.format(p.grossRevenue)}</td>
                                <td className="px-4 py-3 text-right font-mono text-amber-600 bg-amber-50/20">{currencyFormatter.format(p.amazonSpend)}</td>
                                <td className="px-4 py-3 text-right font-mono text-blue-600 bg-blue-50/20">{currencyFormatter.format(p.facebookSpend)}</td>
                                <td className="px-4 py-3 text-right font-mono text-red-500">{currencyFormatterDec.format(p.totalAdSpend)}</td>
                                <td className={`px-4 py-3 text-right font-mono font-bold ${p.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                    {currencyFormatterDec.format(p.netProfit)}
                                </td>
                            </tr>
                        ))}
                        {periods.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t border-gray-200">
                        <tr>
                            <td className="px-4 py-4">Total</td>
                            <td className="px-4 py-4 text-right">{periods.reduce((a, b) => a + b.unitsSold, 0).toLocaleString()}</td>
                            <td className="px-4 py-4 text-right">{periods.reduce((a, b) => a + b.kuReads, 0).toLocaleString()}</td>
                            <td className="px-4 py-4 text-right text-green-800">{currencyFormatter.format(summary.totalRevenue)}</td>
                            <td className="px-4 py-4 text-right text-amber-700">{currencyFormatter.format(periods.reduce((a,b) => a + b.amazonSpend, 0))}</td>
                            <td className="px-4 py-4 text-right text-blue-700">{currencyFormatter.format(periods.reduce((a,b) => a + b.facebookSpend, 0))}</td>
                            <td className="px-4 py-4 text-right text-red-700">{currencyFormatter.format(summary.totalAdSpend)}</td>
                            <td className="px-4 py-4 text-right text-indigo-700">{currencyFormatter.format(summary.totalNetProfit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ResultsDashboard;