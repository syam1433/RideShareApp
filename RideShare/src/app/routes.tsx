import { createBrowserRouter, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import FindRide from "./pages/FindRide";
import PostRide from "./pages/PostRide";
import RideDetails from "./pages/RideDetails";
import Profile from "./pages/Profile";
import ActiveRide from "./pages/ActiveRide";
import CancelBooking from "./pages/CancelBooking"; // ← New page

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
// import NotFound from "./pages/NotFound"; // Optional 404 page

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  // Protected routes with Dashboard Layout
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // Passenger-only dashboard (default /dashboard)
      {
        path: "dashboard",
        element: <UserDashboard />,
      },

      // Find Ride (passenger)
      {
        path: "find-ride",
        element: <FindRide />,
      },

      // Ride Details (both roles)
      {
        path: "ride/:id",
        element: <RideDetails />,
      },

      // Cancel Booking confirmation page
      {
        path: "cancel-booking/:rideId",
        element: <CancelBooking />,
      },

      // Active Ride tracking (both roles)
      {
        path: "active-ride/:id",
        element: <ActiveRide />,
      },

      // Profile (both roles)
      {
        path: "profile",
        element: <Profile />,
      },

      // Driver-only routes
      {
        path: "driver-dashboard",
        element: (
          <ProtectedRoute requireDriver>
            <DriverDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "post-ride",
        element: (
          <ProtectedRoute requireDriver>
            <PostRide />
          </ProtectedRoute>
        ),
      },

      // Fallback for unknown sub-paths under dashboard
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },

  // Catch-all 404
  // {
  //   path: "*",
  //   element: <NotFound />,
  // },
]);