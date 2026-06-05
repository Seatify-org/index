import { Outlet } from "react-router";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../contexts/AuthContext";

export default function Root() {
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      const theme = localStorage.getItem('vite-ui-theme') || 'dark';
      
      root.classList.remove('light', 'dark', 'light-theme');
      body.classList.remove('light-theme');
      
      if (theme === 'light') {
        root.classList.add('light-theme');
        body.classList.add('light-theme');
      } else if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (systemTheme === 'light') {
          root.classList.add('light-theme');
          body.classList.add('light-theme');
        } else {
          root.classList.add('dark');
        }
      } else {
        root.classList.add('dark');
      }
    };

    applyTheme();

    window.addEventListener('storage', applyTheme);
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