import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CityContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    // Load from localStorage or default to Moscow
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedCity') || 'Москва';
    }
    return 'Москва';
  });

  // Persist to localStorage whenever city changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCity', selectedCity);
    }
  }, [selectedCity]);

  return (
    <CityContext.Provider value={{ selectedCity, setSelectedCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
