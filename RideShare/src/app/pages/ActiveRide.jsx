import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  AlertTriangle,
  Navigation,
  MapPin,
  Clock,
  User,
  Star,
  Shield,
  Share2,
} from "lucide-react";
import MapComponent from "../components/MapComponent";
import ChatComponent from "../components/ChatComponent";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import API from "../../services/api";
import { format } from "date-fns";

const ActiveRide = () => {
  const { id } = useParams(); // booking _id
  const { user, isDriver } = useAuth();

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const fetchActiveRide = async () => {
      if (!id) {
        setError("No ride ID provided");
        setLoading(false);
        return;
      }

      try {
        const res = await API.get(`/bookings/${id}`);
        setBooking(res.data);
      } catch (err) {
        console.error("Failed to load active ride:", err);
        setError(
          err.response?.data?.message ||
            "Could not load ride details. It may have been cancelled or not found."
        );
        toast.error("Failed to load ride details");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRide();
  }, [id]);

  const handleShare = () => {
    toast.success("Trip details shared with emergency contacts");
  };

  const handleRatingSubmit = async () => {
    try {
      await API.post("/reviews/rate-ride", {
        rideId: booking.ride._id,
        rating,
        comment: ratingComment
      });
      toast.success("Thank you for your rating!");
      setHasRated(true);
      setShowRating(false);
    } catch (error) {
      toast.error("Failed to submit rating");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Ride not found"}
          </h2>
          <Link to="/dashboard" className="text-green-600 hover:text-green-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ride = booking.ride || {};
  const driver = ride.driver || {};
  const isOngoing = ride.status === "active" || ride.status === "upcoming";
  const isCompleted = ride.status === "completed";

  // Check if user has already rated
  useEffect(() => {
    if (isCompleted && !isDriver) {
      const userRating = ride.ratings?.find(r => r.passenger === user?.id);
      setHasRated(!!userRating);
    }
  }, [isCompleted, isDriver, ride.ratings, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Ride</h1>
            <p className="text-sm text-gray-600">
              {ride.from} → {ride.to}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Trip</span>
            </button>
            <button
              onClick={handleSOS}
              className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg"
            >
              <AlertTriangle className="w-5 h-5" />
              SOS
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <MapComponent from={ride.from} to={ride.to} className="h-96" showDirections={true} />

            {/* Trip Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Trip Progress
              </h2>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>On the way...</span>
                  <span>45% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>

              {/* Route Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ride.from}</h3>
                    <p className="text-sm text-gray-600">Pickup - Completed</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Started at {format(new Date(ride.dateTime), "hh:mm a")}
                    </p>
                  </div>
                </div>

                <div className="ml-5 border-l-2 border-dashed border-gray-300 h-8"></div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">En Route</h3>
                    <p className="text-sm text-gray-600">Currently traveling</p>
                    <p className="text-xs text-blue-600 mt-1">
                      ETA: 25 minutes {/* You can calculate real ETA later */}
                    </p>
                  </div>
                </div>

                <div className="ml-5 border-l-2 border-dashed border-gray-300 h-8"></div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-500">{ride.to}</h3>
                    <p className="text-sm text-gray-400">Destination</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Trip Chat
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  Chat with your {isDriver ? "passengers" : "driver"}
                </p>
                <button
                  onClick={() => setChatOpen(true)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Open Chat
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver/Passenger Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {isDriver ? "Passenger Info" : "Driver Info"}
              </h2>

              <div className="flex items-center gap-4 mb-4">
                <img
                  src={
                    isDriver
                      ? booking.passenger?.avatar || "/default-avatar.png"
                      : driver.avatar || "/default-avatar.png"
                  }
                  alt={isDriver ? booking.passenger?.name : driver.name}
                  className="w-16 h-16 rounded-full border-2 border-green-100"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {isDriver ? booking.passenger?.name : driver.name || "Unknown"}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-500 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium text-gray-900">
                      {isDriver
                        ? booking.passenger?.rating || "N/A"
                        : driver.rating || "4.8"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {!isDriver && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vehicle</span>
                      <span className="font-medium text-gray-900">
                        {driver.vehicleType || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vehicle No.</span>
                      <span className="font-medium text-gray-900">
                        {driver.vehicleNumber || "Not available"}
                      </span>
                    </div>
                  </>
                )}
                {driver.helmetCompliance !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <Shield className="w-4 h-4" />
                    <span>Helmet Verified</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => {
                    if (isDriver) {
                      window.location.href = `tel:${booking.passenger?.phone || 'Not available'}`;
                    } else {
                      window.location.href = `tel:${driver.phone || 'Not available'}`;
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </button>
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
              </div>
            </div>

            {/* Trip Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Trip Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-medium text-gray-900">
                    {/* Add real distance later if you store it */}
                    ~45 km (estimated)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">
                    ~1h 15m (estimated)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fare</span>
                  <span className="font-semibold text-green-600 text-lg">
                    ₹{ride.pricePerSeat || ride.price || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Features */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8" />
                <h2 className="text-lg font-bold">Safety Features</h2>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  ✓ Live GPS tracking
                </li>
                <li className="flex items-center gap-2">
                  ✓ Emergency SOS button
                </li>
                <li className="flex items-center gap-2">
                  ✓ Trip sharing with contacts
                </li>
                <li className="flex items-center gap-2">
                  ✓ 24/7 support available
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Your Ride</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {isCompleted && !isDriver && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Ride Completed!</h4>
            <span className="text-green-600 font-bold">₹{ride.totalFare || ride.pricePerSeat}</span>
          </div>
          {!hasRated && (
            <button
              onClick={() => setShowRating(true)}
              className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
            >
              Rate Your Driver
            </button>
          )}
          {hasRated && (
            <p className="text-green-600 text-sm">✓ Thanks for rating!</p>
          )}
        </div>
      )}

      {/* Chat Component */}
      <ChatComponent
        rideId={booking?.ride?._id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentUser={user}
      />
    </div>
  );
};

export default ActiveRide;