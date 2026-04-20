import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Car,
  Wallet,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import API from "../../services/api";
import toast from "react-hot-toast";
import {
  initSocket,
  getSocket,
  joinUserDashboard,
  onOtpSent,
  onRideStatusUpdated,
  removeOtpListener,
  removeRideStatusListener,
} from "../../services/socket";

const UserDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const [userProfile, setUserProfile] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch bookings function
  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    try {
      const profileRes = await API.get("/users/me");
      setUserProfile(profileRes.data || null);

      const res = await API.get("/bookings/my");
      const data = res.data.bookings || res.data || [];
      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError("Could not load your rides. Please try again later.");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Poll bookings every 30 seconds
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 30000);

    // Initialize socket connection
    initSocket();
    if (userId) joinUserDashboard(userId);

    // Define handlers to avoid stale closures
    const handleOtpSent = ({ rideId, otp }) => {
      if (rideId) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.ride?._id === rideId
              ? { ...booking, ride: { ...booking.ride, otp } }
              : booking
          )
        );
      } else if (otp) {
        setBookings((prev) => {
          const idx = prev.findIndex((b) => b.ride && ["active", "ongoing", "in-progress"].includes(b.status));
          if (idx === -1) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ride: { ...copy[idx].ride, otp } };
          return copy;
        });
      }
      toast.success("OTP received! Check your active ride.", { icon: "🔐" });
    };
    const handleRideStatusUpdated = ({ rideId, status, otp }) => {
      if (status === "active" && otp) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.ride?._id === rideId
              ? { ...booking, ride: { ...booking.ride, otp, status } }
              : booking
          )
        );
        toast.success("Ride started! OTP received.", { icon: "🚗" });
      }
    };
    onOtpSent(handleOtpSent);
    onRideStatusUpdated(handleRideStatusUpdated);

    return () => {
      clearInterval(interval);
      removeOtpListener();
      removeRideStatusListener();
    };
  }, [userId]);

  // Categorize bookings
  const activeRide = bookings.find((b) =>
    ["active", "ongoing", "in-progress"].includes(b.status)
  );

  const upcomingRides = bookings.filter((b) =>
    ["pending", "confirmed", "upcoming"].includes(b.status)
  );

  const recentRides = bookings.filter((b) =>
    ["completed", "finished", "cancelled"].includes(b.status)
  );

  // Stats calculation
  const completedCount = recentRides.filter(b => b.status === "completed").length;
  const totalSpent = recentRides
    .filter(b => b.status === "completed")
    .reduce((sum, b) => {
      // Use totalFare if available (for completed rides), otherwise calculate
      if (b.ride?.totalFare) {
        return sum + b.ride.totalFare;
      }
      return sum + ((b.ride?.pricePerSeat || 0) * (b.seatsBooked || 1));
    }, 0);

  const averageRating = completedCount > 0
    ? (recentRides
        .filter(b => b.status === "completed" && b.ride?.driver?.rating)
        .reduce((sum, b) => sum + (b.ride.driver.rating || 0), 0) / completedCount
      ).toFixed(1)
    : 0;

  const effectiveUser = userProfile || user;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link to="/find-ride" className="text-green-600 hover:text-green-700">
            Search for Rides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-content mb-8 flex flex-col md:flex-row md:items-center md:justify-between animate-page-in gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {effectiveUser?.name || "Rider"}! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your rides today
            </p>
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-3 shadow-sm">
              <img
                src={effectiveUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=RideShareUser"}
                alt={effectiveUser?.name || "User"}
                className="w-10 h-10 rounded-full border border-green-100"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{effectiveUser?.name || "Rider"}</p>
                <p className="text-xs text-gray-500 leading-tight">{effectiveUser?.role || "user"}</p>
              </div>
            </div>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => fetchBookings(false)}
              disabled={refreshing}
              title="Refresh dashboard"
            >
              {refreshing ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.582M5.582 9A7.963 7.963 0 0112 5c3.866 0 7 3.134 7 7a7.963 7.963 0 01-2.418 5.418M18.418 15A7.963 7.963 0 0112 19c-3.866 0-7-3.134-7-7a7.963 7.963 0 012.418-5.418" /></svg>
              )}
              Refresh
            </button>
            <Link
              to="/find-ride"
              className="inline-flex items-center justify-center bg-white text-green-600 border border-green-200 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Book a Ride
            </Link>
          </div>
        </div>

        {/* Ride Activity Card */}
        <div className="page-content bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 mb-8 text-white animate-fade-scale hover-lift animate-gradient-shift">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ride Activity</h3>
              <p className="text-blue-100">Your current booking overview</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Active Ride</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold">{activeRide ? 1 : 0}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Upcoming</span>
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold">{upcomingRides.length}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Completed</span>
                <Car className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Active Ride Alert */}
        {activeRide && (
          <div className="page-content bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 mb-8 text-white animate-fade-scale hover-lift">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Active Ride</h3>
                    <p className="text-green-100">
                      {activeRide.ride?.from || "Unknown"} → {activeRide.ride?.to || "Unknown"}
                    </p>
                    <p className="text-sm text-green-100 mt-1">
                      Driver: {activeRide.ride?.driver?.name || "Unknown"}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/ride/${activeRide.ride?._id}`}
                  className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5"
                >
                  View Details
                </Link>
              </div>

              {/* OTP Display - Show if ride has OTP */}
              {activeRide.ride?.otp && (
                <div className="bg-white/10 border border-white/30 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-green-100 text-sm font-medium mb-3">Your Ride OTP</p>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 px-6 py-3 rounded-lg">
                      <p className="text-3xl font-mono font-bold tracking-wider">
                        {activeRide.ride.otp}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeRide.ride.otp);
                        toast.success("OTP copied to clipboard!");
                      }}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors flex items-center justify-center"
                      title="Copy OTP"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-green-100 text-xs mt-3">
                    ✓ Show this OTP to the driver when boarding
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/find-ride"
            className="bg-white/90 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Search className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Search for Rides
                </h3>
                <p className="text-sm text-gray-600">
                  Find the perfect ride for your journey
                </p>
              </div>
              <div className="text-green-600 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>

          <Link
            to="/find-ride"
            className="bg-white/90 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  My Bookings
                </h3>
                <p className="text-sm text-gray-600">
                  View all your upcoming and past rides
                </p>
              </div>
              <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Spending Summary */}
        {completedCount > 0 && (
          <div className="page-content bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6 mb-8 animate-fade-scale">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Spending Summary
              </h2>
              <div className="text-sm text-gray-600">
                Last {Math.min(recentRides.length, 10)} rides
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 border border-green-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{totalSpent.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Across {completedCount} completed rides
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average per Ride</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{completedCount > 0 ? (totalSpent / completedCount).toFixed(0) : 0}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Cost efficiency
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Driver Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {averageRating > 0 ? averageRating : "N/A"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Average driver rating
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Rides */}
        {upcomingRides.length > 0 ? (
          <div className="page-content bg-white/90 rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-fade-scale">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Upcoming Rides
            </h2>
            <div className="space-y-4">
              {upcomingRides.map((booking) => {
                const ride = booking.ride || {};
                return (
                  <div
                    key={booking._id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={ride.driver?.avatar || "/default-avatar.png"}
                        alt={ride.driver?.name}
                        className="w-14 h-14 rounded-full border-2 border-white shadow"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {ride.driver?.name || "Unknown Driver"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {ride.from || "N/A"} → {ride.to || "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(ride.dateTime), "hh:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(ride.dateTime), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                      <p className="text-xl font-bold text-green-600">
                        ₹{ride.pricePerSeat || "—"}
                      </p>
                      <Link
                        to={`/ride/${ride._id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="page-content bg-white/90 rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center animate-fade-scale">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No upcoming rides
            </h3>
            <p className="text-gray-600 mb-6">
              Book your first ride to get started!
            </p>
            <Link
              to="/find-ride"
              className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all duration-300 hover:-translate-y-0.5"
            >
              Find Rides Now
            </Link>
          </div>
        )}

        {/* Recent Rides Summary */}
        {recentRides.length > 0 && (
          <div className="page-content bg-white/90 rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-fade-scale">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Rides
              </h2>
              <div className="text-sm text-gray-600">
                {completedCount} completed • ₹{totalSpent.toLocaleString("en-IN")} total spent
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentRides.slice(0, 6).map((booking) => {
                const ride = booking.ride || {};
                const amount = ride.totalFare || ((ride.pricePerSeat || 0) * (booking.seatsBooked || 1));
                const isCompleted = booking.status === "completed";

                return (
                  <div
                    key={booking._id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={ride.driver?.avatar || "/default-avatar.png"}
                          alt={ride.driver?.name}
                          className="w-10 h-10 rounded-full border-2 border-white shadow"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {ride.driver?.name || "Unknown Driver"}
                          </h4>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs">{ride.driver?.rating || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-sm">₹{amount}</p>
                        <p className="text-xs text-gray-500">
                          {booking.seatsBooked > 1 ? `${booking.seatsBooked} seats` : '1 seat'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">
                          {ride.from || "N/A"} → {ride.to || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {ride.dateTime
                            ? format(new Date(ride.dateTime), "MMM dd, yyyy")
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </>
                        ) : (
                          "Cancelled"
                        )}
                      </span>
                      <Link
                        to={`/ride/${ride._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {recentRides.length > 6 && (
              <div className="text-center mt-6">
                <Link
                  to="/my-rides"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View all {recentRides.length} rides →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Recent / Completed Rides - Detailed Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Ride History
          </h2>

          {recentRides.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No rides yet
              </h3>
              <p className="text-gray-600 mb-6">
                Your completed and cancelled rides will appear here.
              </p>
              <Link
                to="/find-ride"
                className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Find Your First Ride
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Driver
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Route
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRides.map((booking) => {
                    const ride = booking.ride || {};
                    const amount = ride.totalFare || ((ride.pricePerSeat || 0) * (booking.seatsBooked || 1));
                    return (
                      <tr
                        key={booking._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={ride.driver?.avatar || "/default-avatar.png"}
                              alt={ride.driver?.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <span className="font-medium text-gray-900">
                                {ride.driver?.name || "Unknown"}
                              </span>
                              <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{ride.driver?.rating || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {ride.from || "N/A"} → {ride.to || "N/A"}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {ride.dateTime
                            ? format(new Date(ride.dateTime), "MMM dd, yyyy")
                            : "N/A"}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              ₹{amount}
                            </p>
                            {booking.seatsBooked > 1 && (
                              <p className="text-xs text-gray-500">
                                {booking.seatsBooked} seats × ₹{ride.pricePerSeat}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {booking.status === "completed" ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </>
                            ) : (
                              "Cancelled"
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            to={`/ride/${ride._id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 justify-end"
                          >
                            View Details <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;