import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ResultsDashboard from './components/ResultsDashboard';
import { Book } from './types';

const STORAGE_KEY = 'kdp_portfolio_data';

function App() {
  // Initialize state from localStorage if available with migration logic
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const savedBooks = localStorage.getItem(STORAGE_KEY);
      if (!savedBooks) return [];
      
      const parsed = JSON.parse(savedBooks);
      if (!Array.isArray(parsed)) return [];
      
      // Migration Logic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsed.map((b: any) => {
        // Migration from previous versions to include autoOptimize
        const hasAmazon = b.amazonAdBudget !== undefined;
        
        let amazonBudget = b.amazonAdBudget;
        let facebookBudget = b.facebookAdBudget;

        // Old migration logic for daily/monthly total
        if (!hasAmazon) {
            let previousTotalMonthly = 0;
            if (b.adBudgetMonthly !== undefined) {
                previousTotalMonthly = b.adBudgetMonthly;
            } else if (b.adBudgetDaily !== undefined) {
                previousTotalMonthly = b.adBudgetDaily * 30;
            } else {
                previousTotalMonthly = 100;
            }
            amazonBudget = previousTotalMonthly;
            facebookBudget = 0;
        }

        return {
            ...b,
            amazonAdBudget: amazonBudget,
            facebookAdBudget: facebookBudget || 0,
            autoOptimize: b.autoOptimize || false, // Default new flag to false
            synopsis: b.synopsis || '', // Init text fields
            firstChapter: b.firstChapter || '', // Init text fields
            adBudgetMonthly: undefined,
            adBudgetDaily: undefined
        };
      });
    } catch (error) {
      console.error("Failed to load portfolio from localStorage:", error);
      return [];
    }
  });

  // Use a ref to access current state inside the event listener without adding it as a dependency
  const booksRef = useRef(books);

  // Save to localStorage whenever books change
  useEffect(() => {
    booksRef.current = books;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.error("Failed to save portfolio to localStorage:", error);
    }
  }, [books]);

  // Ensure data is saved on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(booksRef.current));
      } catch (error) {
        console.error("Failed to save portfolio on unload:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleAddBook = (book: Book) => {
    setBooks((prev) => [...prev, book]);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
  };

  const handleRemoveBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearPortfolio = () => {
    if (window.confirm("Are you sure you want to delete all books from the portfolio?")) {
        setBooks([]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar 
        books={books} 
        onAddBook={handleAddBook} 
        onUpdateBook={handleUpdateBook} 
        onRemoveBook={handleRemoveBook}
        onClearPortfolio={handleClearPortfolio}
      />
      <ResultsDashboard books={books} />
    </div>
  );
}

export default App;