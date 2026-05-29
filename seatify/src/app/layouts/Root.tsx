import { Outlet } from "react-router";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../contexts/AuthContext";

export default function Root() {
  // Apply theme class to html element
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const theme = localStorage.getItem('vite-ui-theme') || 'dark';
      
      // Remove all theme classes first
      root.classList.remove('light', 'dark', 'light-theme');
      
      if (theme === 'light') {
        root.classList.add('light-theme');
      } else if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light-theme';
        root.classList.add(systemTheme === 'dark' ? 'dark' : 'light-theme');
      } else {
        root.classList.add('dark');
      }
    };

    // Apply theme on mount
    applyTheme();

    // Listen for storage changes (theme updates)
    window.addEventListener('storage', applyTheme);
    
    // Listen for custom theme change event
    window.addEventListener('themeChange', applyTheme);

    return () => {
      window.removeEventListener('storage', applyTheme);
      window.removeEventListener('themeChange', applyTheme);
    };
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen transition-colors duration-500">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}