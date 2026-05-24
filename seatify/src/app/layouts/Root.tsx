import { Outlet } from "react-router";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../contexts/AuthContext";

export default function Root() {
  // Apply theme class to body element
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem('theme') || 'dark';
      if (theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
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