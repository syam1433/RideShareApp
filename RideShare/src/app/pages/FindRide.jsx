import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Car,
  CheckCircle,
  Filter,
  Clock,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../services/api";
import { format, isValid } from "date-fns";

const FindRide = () => {
  const [searchForm, setSearchForm] = useState({
    from: "",
    to: "",
    date: "",
    passengers: "1",
  });

  const [activeFilters, setActiveFilters] = useState({
    price: "all",
    time: "all",
    vehicleType: "all",
  });

  const [rides, setRides] = useState([]);           // ← always array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRides = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchForm.from.trim()) params.append("from", searchForm.from.trim());
      if (searchForm.to.trim()) params.append("to", searchForm.to.trim());
      if (searchForm.date) params.append("date", searchForm.date);
      if (searchForm.passengers !== "1") {
        params.append("passengers", searchForm.passengers);
      }

      const res = await API.get(`/rides?${params.toString()}`);

      // Normalize response – make sure we always get an array
      let rideList = [];

      if (Array.isArray(res.data)) {
        rideList = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        rideList = res.data.data;
      } else if (res.data?.rides && Array.isArray(res.data.rides)) {
        rideList = res.data.rides;
      } else if (res.data?.success && Array.isArray(res.data.results)) {
        rideList = res.data.results;
      } else {
        console.warn("Unexpected rides response format:", res.data);
        rideList = [];
      }

      // Apply vehicle type filter (client-side)
      if (activeFilters.vehicleType !== "all") {
        rideList = rideList.filter(
          (ride) => ride.vehicleType === activeFilters.vehicleType
        );
      }

      setRides(rideList);
    } catch (err) {
      console.error("Failed to fetch rides:", err);
      setError("Couldn't load rides. Please try again later.");
      toast.error("Failed to load rides");
      setRides([]); // ← important: prevent map crash on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [
    searchForm.from,
    searchForm.to,
    searchForm.date,
    searchForm.passengers,
    activeFilters.vehicleType, // only this filter is client-side
  ]);

  const handleBookRide = async (rideId) => {
    try {
      await API.post("/bookings", {
        rideId,
        seatsBooked: Number(searchForm.passengers),
      });
      toast.success("Ride booked! Check your dashboard.");
      fetchRides(); // refresh list after booking
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    }
  };

  // Safe date formatter
  const formatSafe = (dateValue, fmt, fallback = "—") => {
    if (!dateValue) return fallback;
    const d = new Date(dateValue);
    return isValid(d) ? format(d, fmt) : fallback;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Ride</h1>
          <p className="text-gray-600">Search for available rides in your area</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); fetchRides(); }}>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchForm.from}
                    onChange={(e) => setSearchForm({ ...searchForm, from: e.target.value })}
                    placeholder="Enter starting location"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchForm.to}
                    onChange={(e) => setSearchForm({ ...searchForm, to: e.target.value })}
                    placeholder="Enter destination"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={searchForm.date}
                    onChange={(e) => setSearchForm({ ...searchForm, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passengers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={searchForm.passengers}
                    onChange={(e) => setSearchForm({ ...searchForm, passengers: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "passenger" : "passengers"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search Rides
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 text-gray-700 font-medium whitespace-nowrap">
            <Filter className="w-5 h-5" />
            <span>Filters:</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilters({ ...activeFilters, vehicleType: "all" })}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeFilters.vehicleType === "all"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-green-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilters({ ...activeFilters, vehicleType: "Bike" })}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeFilters.vehicleType === "Bike"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-green-300"
              }`}
            >
              Bike
            </button>
            <button
              onClick={() => setActiveFilters({ ...activeFilters, vehicleType: "Car" })}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeFilters.vehicleType === "Car"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-green-300"
              }`}
            >
              Car
            </button>
          </div>
        </div>

        {/* Results summary */}
        <div className="mb-6">
          {loading ? (
            <p className="text-gray-600">Loading rides...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-gray-600">
              Found <span className="font-semibold text-gray-900">{rides.length}</span> rides
            </p>
          )}
        </div>

        {/* Ride list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          </div>
        ) : error ? null : rides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No rides found
            </h3>
            <p className="text-gray-600">Try different locations, dates or filters</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {rides.map((ride) => (
              <div
                key={ride._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Driver Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={ride.driver?.avatar || "/default-avatar.png"}
                      alt={ride.driver?.name || "Driver"}
                      className="w-16 h-16 rounded-full border-2 border-green-100"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">
                        {ride.driver?.name || "Unknown Driver"}
                      </h3>
                      <div className="flex items-center gap-1 text-yellow-500 mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {ride.driver?.rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <Shield className="w-4 h-4" />
                        <span>AI Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Ride Details */}
                  <div className="flex-1">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="font-semibold text-gray-900">
                            {ride.from || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="font-semibold text-gray-900">{ride.to || "—"}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatSafe(ride.dateTime, "MMM dd, yyyy", "—")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatSafe(ride.dateTime, "hh:mm a", "—")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span>{ride.vehicleType || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{ride.seatsAvailable ?? "?"} seats left</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col items-end justify-between min-w-[140px]">
                    <div className="text-right mb-4">
                      <p className="text-3xl font-bold text-green-600">
                        ₹{ride.pricePerSeat ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">per seat</p>
                    </div>

                    <div className="space-y-2 w-full">
                      {ride.seatsAvailable > 0 ? (
                        <>
                          <button
                            onClick={() => handleBookRide(ride._id)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                          >
                            Book Now
                          </button>
                          <Link
                            to={`/ride/${ride._id}`}
                            className="block w-full text-center bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
                          >
                            View Details
                          </Link>
                        </>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                        >
                          Fully Booked
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindRide;