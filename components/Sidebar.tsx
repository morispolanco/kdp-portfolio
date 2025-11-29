import React, { useState } from 'react';
import { Book, Genre } from '../types';
import { PlusCircle, Trash2, BookOpen, Pencil, X, Save, Info } from 'lucide-react';
import { calculatePricing } from '../services/simulationService';

interface SidebarProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onRemoveBook: (id: string) => void;
  onClearPortfolio: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ books, onAddBook, onUpdateBook, onRemoveBook, onClearPortfolio }) => {
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  // Default date
  const [launchDate, setLaunchDate] = useState(new Date().toISOString().split('T')[0]);
  const [words, setWords] = useState(50000);
  const [quality, setQuality] = useState(7);
  const [reviews, setReviews] = useState(0);
  const [genre, setGenre] = useState<Genre>(Genre.FICTION);
  const [isSeries, setIsSeries] = useState(false);
  const [seriesLTV, setSeriesLTV] = useState(0);
  const [adBudget, setAdBudget] = useState(50); // Monthly budget
  const [manualPricing, setManualPricing] = useState(false);
  const [priceLaunch, setPriceLaunch] = useState(2.99);
  const [priceNormal, setPriceNormal] = useState(7.99);

  const resetForm = () => {
    setTitle('');
    setLaunchDate(new Date().toISOString().split('T')[0]);
    setWords(50000);
    setQuality(7);
    setReviews(0);
    setGenre(Genre.FICTION);
    setIsSeries(false);
    setSeriesLTV(0);
    setAdBudget(50);
    setManualPricing(false);
    setPriceLaunch(2.99);
    setPriceNormal(7.99);
    setEditingId(null);
  };

  const handleEditClick = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setLaunchDate(book.launchDate);
    setWords(book.wordCount);
    setQuality(book.quality);
    setReviews(book.initialReviews);
    setGenre(book.genre);
    setIsSeries(book.isSeries);
    setSeriesLTV(book.seriesLTV);
    setAdBudget(book.adBudgetMonthly);
    setManualPricing(book.manualPricing);
    setPriceLaunch(book.priceLaunch);
    setPriceNormal(book.priceNormal);
  };

  const handleManualPricingToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
        const confirmed = window.confirm("⚠️ Manual Override Warning\n\nEnabling manual pricing will stop automatic price adjustments based on book quality. You will need to manage Launch and Normal prices yourself.\n\nAre you sure you want to proceed?");
        if (confirmed) {
            setManualPricing(true);
        }
    } else {
        setManualPricing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const bookData: Book = {
      id: editingId || crypto.randomUUID(),
      title,
      launchDate,
      wordCount: words,
      quality,
      initialReviews: reviews,
      genre,
      isSeries,
      seriesLTV: isSeries ? seriesLTV : 0,
      adBudgetMonthly: adBudget,
      manualPricing,
      priceLaunch,
      priceNormal
    };

    if (editingId) {
        onUpdateBook(bookData);
        resetForm(); // Exit edit mode
    } else {
        onAddBook(bookData);
        setTitle('');
        // Keep other fields for batch entry
    }
  };

  const autoPrices = calculatePricing(quality);

  return (
    <div className="w-full md:w-80 flex-shrink-0 bg-slate-900 text-white h-screen flex flex-col shadow-xl border-r border-slate-800">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          KDP Manager
        </h1>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-sm uppercase tracking-wider font-semibold ${editingId ? 'text-amber-400' : 'text-slate-400'}`}>
                    {editingId ? 'Editing Book' : 'Add New Book'}
                </h2>
                {editingId && (
                    <button 
                        onClick={resetForm}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                        <X className="w-3 h-3" /> Cancel
                    </button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className={`space-y-4 ${editingId ? 'bg-slate-800/50 p-3 -m-3 rounded-lg border border-amber-500/30' : ''}`}>
              
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Book Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. The Silent Star"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Launch Date</label>
                <input 
                  type="date" 
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Genre</label>
                <select 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as Genre)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value={Genre.FICTION}>Fiction (Romance/Thriller)</option>
                  <option value={Genre.NON_FICTION}>Non-Fiction</option>
                  <option value={Genre.BUSINESS}>Business</option>
                </select>
              </div>

              {/* Row: Words & Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Word Count</label>
                  <input 
                    type="number" 
                    value={words}
                    onChange={(e) => setWords(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    step={1000}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Reviews (Start)</label>
                  <input 
                    type="number" 
                    value={reviews}
                    onChange={(e) => setReviews(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quality Slider */}
              <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-400">Book Quality (1-10)</label>
                    <span className="text-xs font-bold text-indigo-400">{quality}</span>
                 </div>
                 <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={quality} 
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
              </div>

              {/* Series */}
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                 <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="checkbox" 
                        id="isSeries"
                        checked={isSeries}
                        onChange={(e) => setIsSeries(e.target.checked)}
                        className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <label htmlFor="isSeries" className="text-xs font-medium text-slate-300">Is Series?</label>
                 </div>
                 {isSeries && (
                    <div>
                        <div className="flex items-center gap-1 mb-1 group relative w-fit">
                            <label className="block text-xs font-medium text-slate-400 cursor-help">Series LTV ($)</label>
                            <Info className="w-3 h-3 text-slate-500" />
                            
                            {/* Tooltip */}
                            <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                    <strong>Lifetime Value (Read-through):</strong><br/>
                                    The average <em>additional</em> profit per customer from subsequent books.<br/><br/>
                                    <span className="text-slate-400">Ex: If 50% of buyers purchase Book 2 (Profit $4), add $2.00 here.</span>
                                </p>
                            </div>
                        </div>
                        <input 
                            type="number"
                            step="0.1"
                            value={seriesLTV}
                            onChange={(e) => setSeriesLTV(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Extra profit per sale"
                        />
                    </div>
                 )}
              </div>

              {/* Ads */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Ad Budget ($)</label>
                <input 
                    type="number"
                    step="10"
                    value={adBudget}
                    onChange={(e) => setAdBudget(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Pricing */}
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                 <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="checkbox" 
                        id="manualPricing"
                        checked={manualPricing}
                        onChange={handleManualPricingToggle}
                        className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="manualPricing" className="text-xs font-medium text-slate-300 cursor-pointer">Manual Pricing</label>
                 </div>
                 
                 {manualPricing ? (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-slate-400">Launch ($)</label>
                            <input 
                                type="number" 
                                step="0.5"
                                value={priceLaunch}
                                onChange={(e) => setPriceLaunch(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400">Normal ($)</label>
                            <input 
                                type="number" 
                                step="0.5"
                                value={priceNormal}
                                onChange={(e) => setPriceNormal(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                            />
                        </div>
                    </div>
                 ) : (
                    <div className="text-[10px] text-slate-500 italic">
                        Auto: Launch ${autoPrices.launch} / Normal ${autoPrices.normal}
                    </div>
                 )}
              </div>

              <button 
                type="submit"
                className={`w-full font-medium py-2 px-4 rounded shadow-lg transition-all flex items-center justify-center gap-2 ${
                    editingId 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {editingId ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                {editingId ? 'Update Book' : 'Add to Portfolio'}
              </button>
            </form>
        </div>

        {/* Mini List */}
        <div className="border-t border-slate-800 pt-6">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Current Portfolio</h2>
                {books.length > 0 && (
                    <button onClick={onClearPortfolio} className="text-[10px] text-red-400 hover:text-red-300 underline">
                        Clear All
                    </button>
                )}
            </div>
            
            {books.length === 0 ? (
                <div className="text-slate-600 text-xs text-center py-4 bg-slate-800/30 rounded border border-slate-800 border-dashed">
                    No books added yet.
                </div>
            ) : (
                <ul className="space-y-2">
                    {books.map(book => (
                        <li 
                            key={book.id} 
                            className={`rounded p-3 flex justify-between items-start group border transition-all ${
                                editingId === book.id 
                                ? 'bg-indigo-900/30 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <div className="cursor-pointer flex-1" onClick={() => handleEditClick(book)}>
                                <div className={`font-medium text-sm ${editingId === book.id ? 'text-indigo-300' : 'text-slate-200'}`}>{book.title}</div>
                                <div className="text-[10px] text-slate-400">
                                    {book.launchDate} • Q: {book.quality}/10
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEditClick(book)}
                                    className={`p-1.5 rounded transition-colors ${editingId === book.id ? 'text-indigo-400 bg-indigo-900/50' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700'}`}
                                    title="Edit"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveBook(book.id);
                                        if (editingId === book.id) resetForm();
                                    }}
                                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;