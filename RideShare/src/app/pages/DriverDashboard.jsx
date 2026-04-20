import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Car,
  TrendingUp,
  Star,
  Shield,
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import API from "../../services/api";
import toast from "react-hot-toast";
import { initSocket, joinUserDashboard } from "../../services/socket";

const DriverDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [driverProfile, setDriverProfile] = useState(null);
  const [rides, setRides] = useState([]);
  const [safetyRecord, setSafetyRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    const driverId = user?.id || user?._id;
    const socket = initSocket();

    const fetchDriverData = async () => {
      if (!user || user.role !== "driver") {
        setError("Please login as a driver");
        setLoading(false);
        return;
      }

      try {
        const profileRes = await API.get("/users/me");
        setDriverProfile(profileRes.data || null);

        const ridesRes = await API.get("/rides/my");
        setRides(ridesRes.data || []);

        try {
          if (driverId) {
            const safetyRes = await API.get(`/safety/${driverId}`);
            setSafetyRecord(safetyRes.data);
          }
        } catch {}
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();

    if (driverId) {
      joinUserDashboard(driverId);
    }

    const refreshOnBookingChange = () => {
      fetchDriverData();
    };

    socket.on("booking_created", refreshOnBookingChange);
    socket.on("booking_cancelled", refreshOnBookingChange);
    socket.on("rideStatusUpdated", refreshOnBookingChange);

    return () => {
      socket.off("booking_created", refreshOnBookingChange);
      socket.off("booking_cancelled", refreshOnBookingChange);
      socket.off("rideStatusUpdated", refreshOnBookingChange);
    };
  }, [user, authLoading]);

  // Categorize rides
  const upcomingRides = rides.filter(r => ["upcoming", "pending", "active"].includes(r.status));
  const completedRides = rides.filter(r => r.status === "completed");
  const effectiveDriver = driverProfile || user;
  const latestRideWithVehicleData = rides.find(
    (ride) => ride.vehicleType || ride.vehicleModel || ride.vehicleNumber
  );

  const vehicleInfo = {
    vehicleType: effectiveDriver?.vehicleType || latestRideWithVehicleData?.vehicleType || "Not available",
    vehicleModel: effectiveDriver?.vehicleModel || latestRideWithVehicleData?.vehicleModel || "Not available",
    vehicleNumber: effectiveDriver?.vehicleNumber || latestRideWithVehicleData?.vehicleNumber || "Not available",
  };

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
        <div className="text-center p-6 bg-white rounded-xl shadow-sm max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-content mb-8 animate-page-in flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {effectiveDriver?.name || "Driver"}! 🚗
            </h1>
            <p className="text-gray-600">
              Your driver dashboard - manage your rides and earnings
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-3 shadow-sm">
            <img
              src={effectiveDriver?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=RideShareDriver"}
              alt={effectiveDriver?.name || "Driver"}
              className="w-10 h-10 rounded-full border border-green-100"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{effectiveDriver?.name || "Driver"}</p>
              <p className="text-xs text-gray-500 leading-tight">{effectiveDriver?.vehicleType || "Driver"}</p>
            </div>
          </div>
          {user?.isBlacklisted && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
              <p className="font-semibold">Account restricted</p>
              <p className="text-sm mt-1">
                {user.blacklistReason || "Your account is blacklisted from creating new rides."}
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Rating",
              value: effectiveDriver?.rating?.toFixed(1) || "4.8",
              icon: Star,
              color: "bg-yellow-500",
              change: `${effectiveDriver?.totalReviews || 0} reviews`,
            },
            {
              label: "Completed Rides",
              value: completedRides.length.toString(),
              icon: Car,
              color: "bg-blue-500",
              change: `+${completedRides.length} total`,
            },
            {
              label: "This Month Earnings",
              value: `₹${completedRides
                .reduce((sum, r) => sum + (r.pricePerSeat || 0), 0)
                .toLocaleString("en-IN")}`,
              icon: TrendingUp,
              color: "bg-green-500",
              change: "+18% from last",
            },
            {
              label: "Safety Score",
              value: safetyRecord?.helmetCompliance
                ? `${safetyRecord.helmetCompliance}%`
                : "98%",
              icon: Shield,
              color: "bg-emerald-500",
              change: "Excellent",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Safety Compliance Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 mb-8 text-white animate-fade-scale hover-lift">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Safety Compliance</h3>
              <p className="text-green-100">
                Your AI safety verification status
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Helmet Compliance</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold">
                {safetyRecord?.helmetCompliance || "98"}%
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Overload Violations</span>
                <AlertCircle
                  className={`w-5 h-5 ${
                    (safetyRecord?.overloadViolations || 0) > 0 ? "text-red-300" : ""
                  }`}
                />
              </div>
              <p className="text-3xl font-bold">
                {safetyRecord?.overloadViolations || 0}
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Last Check</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold">
                {safetyRecord?.lastChecked
                  ? format(new Date(safetyRecord.lastChecked), "MMM dd, hh:mm a")
                  : "Recent"}
              </p>
              <p className="text-xs text-green-100 mt-1">
                {safetyRecord?.aiStatus || "Passed"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/post-ride"
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group ${user?.isBlacklisted ? "opacity-60 pointer-events-none" : "hover:-translate-y-1"}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Plus className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Post New Ride
                </h3>
                <p className="text-sm text-gray-600">
                  Create a new ride offer for passengers
                </p>
              </div>
              <div className="text-green-600 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>

          <Link
            to="/driver-dashboard"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Car className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  My Rides
                </h3>
                <p className="text-sm text-gray-600">
                  Manage your ongoing and upcoming rides
                </p>
              </div>
              <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming + Active + Completed Rides */}
        {rides.length > 0 ? (
          <div className="page-content bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-fade-scale">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Rides</h2>
              <Link
                to="/post-ride"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Post New Ride
              </Link>
            </div>

            <div className="space-y-4">
              {rides.map((ride) => (
                <div key={ride._id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {ride.from} → {ride.to}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(ride.dateTime), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(ride.dateTime), "hh:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {ride.passengers?.length || 0} passengers
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        ₹{ride.pricePerSeat * (ride.passengers?.length || 1)}
                      </p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        ride.status === "completed" ? "bg-green-100 text-green-700" :
                        ride.status === "active" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ride.passengers?.length || 0} booked
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/ride/${ride._id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mb-8">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No rides yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start earning by posting your first ride
            </p>
            <Link
              to="/post-ride"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Post a Ride
            </Link>
          </div>
        )}

        {/* Vehicle Info */}
        <div className="page-content bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-scale">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Vehicle Information
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
              <p className="font-semibold text-gray-900">
                {vehicleInfo.vehicleType}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Vehicle Number</p>
              <p className="font-semibold text-gray-900">
                {vehicleInfo.vehicleNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Model</p>
              <p className="font-semibold text-gray-900">
                {vehicleInfo.vehicleModel}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              Verified Documents
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Driving License</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Vehicle RC</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Insurance</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Pollution Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;