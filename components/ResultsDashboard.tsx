import React, { useMemo } from 'react';
import { Book } from '../types';
import { aggregateSimulations } from '../services/simulationService';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

interface ResultsDashboardProps {
  books: Book[];
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ books }) => {
  const { monthly, summary } = useMemo(() => aggregateSimulations(books), [books]);

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

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Simulation</h1>
            <p className="text-gray-500 mt-1">Projected performance for {books.length} book{books.length !== 1 ? 's' : ''} over the next 12+ months.</p>
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

        {/* Consolidated Monthly Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Consolidated Monthly Projection</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Month</th>
                            <th className="px-6 py-4 text-right">Units Sold</th>
                            <th className="px-6 py-4 text-right">KU Reads</th>
                            <th className="px-6 py-4 text-right">Gross Rev</th>
                            <th className="px-6 py-4 text-right">Ad Spend</th>
                            <th className="px-6 py-4 text-right">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {monthly.map((m) => (
                            <tr key={m.monthKey} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{m.monthLabel}</td>
                                <td className="px-6 py-4 text-right font-mono">{m.unitsSold.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono">{m.kuReads.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono text-green-700">{currencyFormatterDec.format(m.grossRevenue)}</td>
                                <td className="px-6 py-4 text-right font-mono text-red-500">{currencyFormatterDec.format(m.adSpend)}</td>
                                <td className={`px-6 py-4 text-right font-mono font-bold ${m.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                    {currencyFormatterDec.format(m.netProfit)}
                                </td>
                            </tr>
                        ))}
                        {monthly.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t border-gray-200">
                        <tr>
                            <td className="px-6 py-4">Total</td>
                            <td className="px-6 py-4 text-right">{monthly.reduce((a, b) => a + b.unitsSold, 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">{monthly.reduce((a, b) => a + b.kuReads, 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-green-800">{currencyFormatter.format(summary.totalRevenue)}</td>
                            <td className="px-6 py-4 text-right text-red-700">{currencyFormatter.format(summary.totalAdSpend)}</td>
                            <td className="px-6 py-4 text-right text-indigo-700">{currencyFormatter.format(summary.totalNetProfit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        {/* Portfolio Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Book Portfolio</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Launch Date</th>
                            <th className="px-6 py-4">Genre</th>
                            <th className="px-6 py-4 text-center">Quality</th>
                            <th className="px-6 py-4 text-right">Monthly Budget</th>
                            <th className="px-6 py-4 text-center">Pricing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {books.map((book) => (
                            <tr key={book.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">{book.title}</td>
                                <td className="px-6 py-4">{book.launchDate}</td>
                                <td className="px-6 py-4 capitalize">{book.genre.replace('_', ' ')}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        book.quality >= 8 ? 'bg-green-100 text-green-700' :
                                        book.quality >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {book.quality}/10
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono">${book.adBudgetMonthly.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center text-xs text-gray-500">
                                    {book.manualPricing ? (
                                        <span>Manual<br/>(L:${book.priceLaunch}/N:${book.priceNormal})</span>
                                    ) : (
                                        <span className="text-indigo-600">Auto</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ResultsDashboard;