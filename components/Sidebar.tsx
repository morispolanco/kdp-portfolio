import React, { useState } from 'react';
import { Book, Genre } from '../types';
import { PlusCircle, Trash2, BookOpen, Pencil, X, Save, Info, ChevronDown, ChevronRight, Settings, Sparkles, BrainCircuit, Wand2, Loader2 } from 'lucide-react';
import { calculatePricing } from '../services/simulationService';
import { analyzeBookQuality } from '../services/geminiService';

interface SidebarProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onRemoveBook: (id: string) => void;
  onClearPortfolio: () => void;
}

// Simple ID generator fallback
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const Sidebar: React.FC<SidebarProps> = ({ books, onAddBook, onUpdateBook, onRemoveBook, onClearPortfolio }) => {
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [launchDate, setLaunchDate] = useState(new Date().toISOString().split('T')[0]);
  const [words, setWords] = useState(50000);
  const [quality, setQuality] = useState(7);
  const [reviews, setReviews] = useState(0);
  const [genre, setGenre] = useState<Genre>(Genre.FICTION);
  const [isSeries, setIsSeries] = useState(false);
  const [seriesLTV, setSeriesLTV] = useState(0);
  
  // Content State
  const [synopsis, setSynopsis] = useState('');
  const [firstChapter, setFirstChapter] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReasoning, setAnalysisReasoning] = useState<string | null>(null);
  
  // Strategy States
  const [amazonBudget, setAmazonBudget] = useState(50);
  const [facebookBudget, setFacebookBudget] = useState(50);
  const [autoOptimize, setAutoOptimize] = useState(false);
  
  const [manualPricing, setManualPricing] = useState(false);
  const [priceLaunch, setPriceLaunch] = useState(2.99);
  const [priceNormal, setPriceNormal] = useState(7.99);

  // UI State
  const [showStrategyConfig, setShowStrategyConfig] = useState(false);
  const [showContentInput, setShowContentInput] = useState(false);

  const resetForm = () => {
    setTitle('');
    setLaunchDate(new Date().toISOString().split('T')[0]);
    setWords(50000);
    setQuality(7);
    setReviews(0);
    setGenre(Genre.FICTION);
    setSynopsis('');
    setFirstChapter('');
    setIsSeries(false);
    setSeriesLTV(0);
    setAmazonBudget(50);
    setFacebookBudget(50);
    setAutoOptimize(false);
    setManualPricing(false);
    setPriceLaunch(2.99);
    setPriceNormal(7.99);
    setEditingId(null);
    setShowStrategyConfig(false);
    setShowContentInput(false);
    setAnalysisReasoning(null);
  };

  const handleEditClick = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setLaunchDate(book.launchDate);
    setWords(book.wordCount);
    setQuality(book.quality);
    setReviews(book.initialReviews);
    setGenre(book.genre);
    setSynopsis(book.synopsis || '');
    setFirstChapter(book.firstChapter || '');
    setIsSeries(book.isSeries);
    setSeriesLTV(book.seriesLTV);
    setAmazonBudget(book.amazonAdBudget);
    setFacebookBudget(book.facebookAdBudget);
    setAutoOptimize(book.autoOptimize || false);
    setManualPricing(book.manualPricing);
    setPriceLaunch(book.priceLaunch);
    setPriceNormal(book.priceNormal);
    
    // Auto-open sections if data exists
    setShowStrategyConfig(book.manualPricing || book.autoOptimize); 
    setShowContentInput(!!book.synopsis || !!book.firstChapter);
    setAnalysisReasoning(null);
  };

  const handleManualPricingToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualPricing(e.target.checked);
  };

  const handleAIAnalysis = async () => {
    if (!synopsis && !firstChapter) {
        alert("Please enter a synopsis or first chapter to analyze.");
        return;
    }
    
    setIsAnalyzing(true);
    setAnalysisReasoning(null);
    try {
        const result = await analyzeBookQuality(title || "Untitled Book", genre, synopsis, firstChapter);
        setQuality(result.score);
        setAnalysisReasoning(result.reasoning);
    } catch (error) {
        console.error(error);
        alert("Failed to analyze book content. Please ensure your API key is configured.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const bookData: Book = {
      id: editingId || generateId(),
      title,
      launchDate,
      wordCount: words,
      quality,
      initialReviews: reviews,
      genre,
      synopsis,
      firstChapter,
      isSeries,
      seriesLTV: isSeries ? seriesLTV : 0,
      amazonAdBudget: amazonBudget,
      facebookAdBudget: facebookBudget,
      autoOptimize,
      manualPricing,
      priceLaunch,
      priceNormal
    };

    if (editingId) {
        onUpdateBook(bookData);
        resetForm(); 
    } else {
        onAddBook(bookData);
        setTitle('');
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

              {/* Content Analysis (New) */}
              <div className="border border-slate-700/50 rounded overflow-hidden">
                <button 
                    type="button"
                    onClick={() => setShowContentInput(!showContentInput)}
                    className="w-full flex items-center justify-between p-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-300">Content & AI Analysis</span>
                    </div>
                    {showContentInput ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                </button>
                
                {showContentInput && (
                    <div className="p-3 bg-slate-900/30 space-y-3 border-t border-slate-700/30">
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Synopsis</label>
                            <textarea 
                                value={synopsis}
                                onChange={(e) => setSynopsis(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 h-20"
                                placeholder="Paste synopsis here..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">First Chapter Excerpt</label>
                            <textarea 
                                value={firstChapter}
                                onChange={(e) => setFirstChapter(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 h-20"
                                placeholder="Paste first chapter or first few pages..."
                            />
                        </div>
                    </div>
                )}
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

              {/* Quality Slider & Pricing Feedback */}
              <div className="bg-slate-800/30 p-2 rounded border border-slate-700/50">
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-400">Book Quality (1-10)</label>
                    <div className="flex items-center gap-2">
                        {analysisReasoning && (
                            <div className="group relative">
                                <Info className="w-3 h-3 text-indigo-400 cursor-help" />
                                <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 border border-indigo-500/30 rounded shadow-xl z-50 text-[10px] text-slate-300">
                                    AI Reasoning: {analysisReasoning}
                                </div>
                            </div>
                        )}
                        <span className={`text-xs font-bold ${quality >= 9 ? 'text-amber-400' : quality >= 5 ? 'text-indigo-400' : 'text-red-400'}`}>{quality}</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2 items-center mb-3">
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={quality} 
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    {showContentInput && (
                        <button 
                            type="button"
                            onClick={handleAIAnalysis}
                            disabled={isAnalyzing || (!synopsis && !firstChapter)}
                            className="p-1.5 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Determine Quality with AI"
                        >
                            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Sparkles className="w-3 h-3 text-white" />}
                        </button>
                    )}
                 </div>
                 
                 {/* Suggested Pricing Display */}
                 <div className="flex justify-between items-center bg-slate-900/50 rounded px-2 py-1.5 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400">Suggested Price:</span>
                    <div className="text-xs font-mono text-slate-200">
                        <span className="text-amber-500/80">L: ${autoPrices.launch}</span>
                        <span className="mx-1 text-slate-600">|</span>
                        <span className="text-indigo-400/80">N: ${autoPrices.normal}</span>
                    </div>
                 </div>
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
                            <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                    <strong>Lifetime Value (Read-through):</strong><br/>
                                    Extra profit from subsequent books per sale.
                                </p>
                            </div>
                        </div>
                        <input 
                            type="number"
                            step="0.1"
                            value={seriesLTV}
                            onChange={(e) => setSeriesLTV(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                 )}
              </div>

              {/* COLLAPSIBLE STRATEGY SETTINGS */}
              <div className="border border-slate-700/50 rounded overflow-hidden">
                <button 
                    type="button"
                    onClick={() => setShowStrategyConfig(!showStrategyConfig)}
                    className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-300">Configure Strategy</span>
                    </div>
                    {showStrategyConfig ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                </button>

                {showStrategyConfig && (
                    <div className="p-3 bg-slate-900/30 space-y-4 border-t border-slate-700/30">
                        {/* AI Optimization Toggle */}
                        <div className="flex items-start gap-2 bg-indigo-900/20 p-2 rounded border border-indigo-500/20">
                            <div className="pt-0.5">
                                <input 
                                    type="checkbox" 
                                    id="autoOptimize"
                                    checked={autoOptimize}
                                    onChange={(e) => setAutoOptimize(e.target.checked)}
                                    className="rounded bg-slate-700 border-indigo-500 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                />
                            </div>
                            <div>
                                <label htmlFor="autoOptimize" className="text-[11px] font-bold text-indigo-300 cursor-pointer flex items-center gap-1">
                                    <BrainCircuit className="w-3 h-3" />
                                    Enable AI Dynamic Strategy
                                </label>
                                <p className="text-[9px] text-indigo-200/60 leading-tight mt-1">
                                    Automatically varies monthly ad spend and platform split (FB vs Amazon) to maximize ROI based on ad fatigue and decay.
                                </p>
                            </div>
                        </div>

                        {/* Ads Inputs (Hidden if Optimized) */}
                        {!autoOptimize && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Amazon Ads ($/mo)</label>
                                    <input 
                                        type="number"
                                        step="10"
                                        value={amazonBudget}
                                        onChange={(e) => setAmazonBudget(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Facebook Ads ($/mo)</label>
                                    <input 
                                        type="number"
                                        step="10"
                                        value={facebookBudget}
                                        onChange={(e) => setFacebookBudget(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Pricing Override */}
                        <div className="pt-2 border-t border-slate-700/30">
                            <div className="flex items-center gap-2 mb-2">
                                <input 
                                    type="checkbox" 
                                    id="manualPricing"
                                    checked={manualPricing}
                                    onChange={handleManualPricingToggle}
                                    className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                />
                                <label htmlFor="manualPricing" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer">Manual Pricing Override</label>
                            </div>
                            
                            {manualPricing ? (
                                <div className="grid grid-cols-2 gap-2 mt-2">
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
                                <div className="text-[10px] text-slate-500 italic pl-5">
                                    Unchecked: Using quality-based pricing.
                                </div>
                            )}
                        </div>
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
            <h2 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-3">Current Portfolio</h2>
            
            {books.length === 0 ? (
                <div className="text-slate-600 text-xs text-center py-4 bg-slate-800/30 rounded border border-slate-800 border-dashed">
                    No books added yet.
                </div>
            ) : (
                <ul className="space-y-2">
                    {books.map(book => {
                        return (
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
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                                    <span>{book.launchDate}</span>
                                    {book.autoOptimize && <span className="text-indigo-400 bg-indigo-900/40 px-1 rounded flex items-center gap-0.5"><Sparkles className="w-2 h-2"/> AI</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEditClick(book)}
                                    className={`p-1.5 rounded transition-colors ${editingId === book.id ? 'text-indigo-400 bg-indigo-900/50' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700'}`}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveBook(book.id);
                                        if (editingId === book.id) resetForm();
                                    }}
                                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </li>
                    )})}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;