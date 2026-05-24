import { createBrowserRouter } from "react-router";
import Root from "./layouts/Root";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import SeatSelection from "./pages/SeatSelection";
import GeneralAdmission from "./pages/GeneralAdmission";
import PhoneBooking from "./pages/PhoneBooking";
import SnacksCheckout from "./pages/SnacksCheckout";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import PurchaseHistory from "./pages/PurchaseHistory";
import Admin from "./pages/Admin";
import CinemaSchedule from "./pages/CinemaSchedule";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "movie/:id", Component: MovieDetails },
      { path: "movie/:id/seats", Component: SeatSelection },
      { path: "movie/:id/general-admission", Component: GeneralAdmission },
      { path: "movie/:id/phone-booking", Component: PhoneBooking },
      { path: "cinema/:id", Component: CinemaSchedule },
      { path: "snacks", Component: SnacksCheckout },
      { path: "checkout", Component: Checkout },
      { 
        path: "profile", 
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      { 
        path: "purchase-history", 
        element: (
          <ProtectedRoute>
            <PurchaseHistory />
          </ProtectedRoute>
        )
      },
      { 
        path: "admin", 
        element: (
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        )
      },
      { path: "*", Component: NotFound },
    ],
  },
]);