import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { CityProvider } from "./contexts/CityContext";

// Main App Component
export default function App() {
  return (
    <CityProvider>
      <RouterProvider router={router} />
      <Toaster 
        theme="dark" 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A22',
            border: '1px solid #7C5CFF',
            color: '#fff',
          },
        }}
      />
    </CityProvider>
  );
}