import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Shield,
  Car,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  Phone,
  AlertCircle,
  XCircle,
  PlayCircle,
  Copy,
} from "lucide-react";
import MapComponent from "../components/MapComponent";
import ChatComponent from "../components/ChatComponent";
import toast from "react-hot-toast";
import API from "../../services/api";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { joinRide, onOtpSent, onRideStatusUpdated, removeOtpListener, removeRideStatusListener } from "../../services/socket";

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookedByMe, setIsBookedByMe] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);

  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [selectedPassengerId, setSelectedPassengerId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [verifiedCount, setVerifiedCount] = useState(0);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userRatingComment, setUserRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRatedRide, setHasRatedRide] = useState(false);

  const isPassengerBooked = (passengers = [], passengerId) => {
    const targetId = String(passengerId || "");
    return passengers.some((passenger) => {
      if (!passenger) return false;
      return String(passenger._id || passenger) === targetId;
    });
  };

  useEffect(() => {
    const fetchRide = async () => {
      if (!id) {
        setError("No ride ID provided");
        setLoading(false);
        return;
      }

      try {
        const res = await API.get(`/rides/${id}`);
        setRide(res.data);
        // if backend included OTP, mark as sent for UI
        if (res.data.otp) setOtpSent(true);

        // Safe passenger check using string comparison
        if (user?.id && isPassengerBooked(res.data.passengers, user.id)) {
          setIsBookedByMe(true);
        }

        setVerifiedCount(res.data.verifiedPassengers?.length || 0);
        setHasRatedRide(
          !!res.data.ratings?.some((r) => String(r.passenger) === String(user?.id))
        );
      } catch (err) {
        console.error("Failed to load ride:", err);
        setError(err.response?.data?.message || "Ride not found.");
        toast.error("Could not load ride details");
      } finally {
        setLoading(false);
      }
    };

    fetchRide();

    // Join ride room for socket updates
    if (id) {
      joinRide(id);

      // Listen for OTP updates
      const handleOtpSent = ({ rideId, otp }) => {
        // Accept both { rideId, otp } and payloads without rideId (driver may emit directly)
        if (!rideId && otp) {
          setRide((prev) => prev ? { ...prev, otp } : prev);
          setOtpSent(true);
          toast.success("OTP received!", { icon: "🔐" });
          return;
        }

        if (rideId === id) {
          setRide((prev) => prev ? { ...prev, otp } : null);
          setOtpSent(true);
          toast.success("OTP received!", { icon: "🔐" });
        }
      };

      // Listen for ride status updates
      const handleRideStatusUpdated = ({ rideId, status, otp }) => {
        if (rideId === id) {
          setRide((prev) =>
            prev ? { ...prev, status, otp: otp || prev.otp } : null
          );
          if (status === "active" && otp) {
            setOtpSent(true);
          }
        }
      };

      onOtpSent(handleOtpSent);
      onRideStatusUpdated(handleRideStatusUpdated);

      return () => {
        removeOtpListener();
        removeRideStatusListener();
      };
    }
  }, [id, user]);

  const refreshRide = async () => {
    try {
      const res = await API.get(`/rides/${id}`);
      setRide(res.data);
      if (res.data.otp) setOtpSent(true);
      setVerifiedCount(res.data.verifiedPassengers?.length || 0);

      // Re-check if booked (in case of refresh after booking/cancel)
      if (user?.id && isPassengerBooked(res.data.passengers, user.id)) {
        setIsBookedByMe(true);
      } else {
        setIsBookedByMe(false);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const handleBookRide = async () => {
    setBookingActionLoading(true);
    try {
      await API.post("/bookings", { rideId: id, seatsBooked: 1 });
      toast.success("Ride booked successfully!");
      setIsBookedByMe(true);
      await refreshRide();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book ride");
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setBookingActionLoading(true);
    try {
      await API.put(`/bookings/cancel`, { rideId: id });
      toast.success("Booking cancelled successfully");
      setIsBookedByMe(false);
      await refreshRide();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!window.confirm("Start the ride? This will generate OTP for passengers.")) return;

    try {
      await API.put(`/rides/${id}/status`, { status: "active" });

      // Ask backend to send OTP to passengers (backend should return otpSent and optionally otpValue)
      try {
        const sendRes = await API.post(`/rides/${id}/send-otp`);
        const { otpSent: sent, otpValue } = sendRes.data || {};
        if (sent) {
          setOtpSent(true);
          // update ride OTP locally for immediate UI
          setRide((r) => ({ ...r, otp: otpValue || r?.otp }));
        }
      } catch (e) {
        console.warn('send-otp failed', e);
      }

      toast.success("Ride started! OTP generated for passengers.");
      await refreshRide();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start ride");
    }
  };

  const handleVerifyPassenger = async () => {
    if (otpInput.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    if (unverifiedPassengers.length > 0 && !selectedPassengerId) {
      toast.error("Please select a passenger to verify");
      return;
    }

    setVerifying(true);
    try {
      const res = await API.post(`/rides/${id}/verify-passenger`, {
        otp: otpInput,
        passengerId: selectedPassengerId || undefined,
      });
      
      // Update ride data and verified count immediately from response
      if (res.data.ride) {
        setRide(res.data.ride);
        setVerifiedCount(res.data.verifiedCount || res.data.ride.verifiedPassengers?.length || 0);
      }
      
      toast.success("Passenger verified successfully!");
      setOtpInput("");
      setSelectedPassengerId("");
      setShowOtpSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleFinishRide = async () => {
    if (!window.confirm("Are you sure you want to finish this ride?")) return;

    try {
      await API.put(`/rides/${id}/finish`, { paymentDone: paymentConfirmed });
      toast.success("Ride completed successfully!");
      await refreshRide();
    } catch (err) {
  console.error("Finish ride failed:", err);
  const message = err.response?.data?.message || "Failed to finish ride – server error";
  toast.error(message);
}
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      const res = await API.post("/reviews/rate-ride", {
        rideId: ride._id,
        rating: userRating,
        comment: userRatingComment.trim(),
      });

      setHasRatedRide(true);
      setRide((prev) =>
        prev
          ? {
              ...prev,
              ratings: [
                ...(prev.ratings || []),
                { passenger: user?.id, rating: userRating, comment: userRatingComment.trim() },
              ],
            }
          : prev
      );
      toast.success(`Thanks! Driver rating updated to ${res.data.avgRating}/5`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-6">
        <div>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Ride not found"}
          </h2>
          <Link to="/find-ride" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Find Rides
          </Link>
        </div>
      </div>
    );
  }

  // FIXED: Safe string comparison for driver check
  const isDriver = user?.id && ride?.driver?._id && String(ride.driver._id) === String(user.id);

  const canBook = ride.status === "upcoming" && ride.seatsAvailable > 0;
  const isRideActive = ride.status === "active";
  const isRideCompleted = ride.status === "completed";
  const canRateRide = isRideCompleted && !isDriver && isBookedByMe && !hasRatedRide;

  const pickupLocation =
    Array.isArray(ride.pickupLocation?.coordinates) &&
    ride.pickupLocation.coordinates.length === 2
      ? {
          lat: Number(ride.pickupLocation.coordinates[1]),
          lng: Number(ride.pickupLocation.coordinates[0]),
        }
      : null;

  const destinationLocation =
    Array.isArray(ride.destinationLocation?.coordinates) &&
    ride.destinationLocation.coordinates.length === 2
      ? {
          lat: Number(ride.destinationLocation.coordinates[1]),
          lng: Number(ride.destinationLocation.coordinates[0]),
        }
      : null;

  const showPassengerOtp = !isDriver && isRideActive && (ride.otp || otpSent) && isBookedByMe;
  const allVerified = verifiedCount === ride.passengers?.length && ride.passengers?.length > 0;
  const showFinishButton = isDriver && isRideActive && allVerified;
  const verifiedPassengerIds = new Set((ride.verifiedPassengers || []).map((pid) => String(pid)));
  const unverifiedPassengers = (ride.passengers || []).filter(
    (passenger) => !verifiedPassengerIds.has(String(passenger._id || passenger))
  );

  return (
    <div className="page-shell min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/find-ride"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-all duration-300 hover:translate-x-1 page-content"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to search
        </Link>

        <div className="page-content grid lg:grid-cols-3 gap-6 animate-page-in">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <MapComponent
              from={ride.from}
              to={ride.to}
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              className="h-72 sm:h-80"
              showDirections={true}
              showUserLocation={false}
            />

            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-sm border p-6 hover-lift transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6">Trip Details</h2>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pickup</p>
                    <h3 className="font-semibold text-lg">{ride.from}</h3>
                  </div>
                </div>

                {ride.viaPoints?.length > 0 && (
                  <div className="ml-16">
                    <p className="text-sm font-medium text-gray-700">Via:</p>
                    <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                      {ride.viaPoints.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}

                <div className="ml-6 border-l-2 border-dashed border-gray-300 h-10 my-2"></div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Drop-off</p>
                    <h3 className="font-semibold text-lg">{ride.to}</h3>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mt-8 pt-6 border-t">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Date</span>
                  </div>
                  <p className="font-bold">{ride.dateTime ? format(new Date(ride.dateTime), "MMM dd, yyyy") : "Date not set"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">Time</span>
                  </div>
                  <p className="font-bold">{ride.dateTime ? format(new Date(ride.dateTime), "hh:mm a") : "Time not set"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-sm border p-6 hover-lift transition-all duration-300">
              <h2 className="text-xl font-bold mb-6">Driver & Ride Info</h2>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                <img
                  src={ride.driver?.avatar || "/default-avatar.png"}
                  alt={ride.driver?.name}
                  className="w-20 h-20 rounded-full border-4 border-green-100 object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{ride.driver?.name || "Driver"}</h3>
                    <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-yellow-500 mb-5">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-bold text-gray-900">{ride.driver?.rating?.toFixed(1) || "4.8"}</span>
                    <span className="text-sm text-gray-600">
                      ({ride.driver?.totalReviews || 0} reviews)
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-600">Vehicle</p>
                      <p className="font-medium">{ride.vehicleType} • {ride.vehicleModel}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Number Plate</p>
                      <p className="font-medium">{ride.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">License</p>
                      <p className="font-medium">{ride.dlNumber}</p>
                    </div>
                    {ride.safetyNote && (
                      <div className="sm:col-span-2 mt-2">
                        <p className="text-gray-600">Safety Note</p>
                        <p className="font-medium text-gray-800">{ride.safetyNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center text-sm font-medium text-green-700">
                  Helmet Verified
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center text-sm font-medium text-blue-700">
                  Documents OK
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center text-sm font-medium text-purple-700">
                  Background Check
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border p-6 sticky top-6 hover-lift transition-all duration-300">
              <div className="text-center mb-6 pb-6 border-b">
                <p className="text-gray-600 mb-1">Price per seat</p>
                <p className="text-4xl font-bold text-green-600">₹{ride.pricePerSeat}</p>
              </div>

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehicle
                  </span>
                  <span className="font-medium">{ride.vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Seats left
                  </span>
                  <span className="font-medium text-red-600">
                    {Math.max(ride.seatsAvailable, 0)} {/* Prevent negative display */}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time
                  </span>
                  <span className="font-medium">{ride.dateTime ? format(new Date(ride.dateTime), "hh:mm a") : "Time not set"}</span>
                </div>
              </div>

              {/* Status / Action Buttons */}
              {ride.status !== "upcoming" ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center mb-4 animate-fade-up">
                  Ride is {ride.status}
                </div>
              ) : isDriver ? (
                <button
                  onClick={handleStartRide}
                  disabled={bookingActionLoading || ride.passengers?.length === 0}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  <PlayCircle className="w-5 h-5" />
                  {bookingActionLoading ? "Starting..." : "Start Ride"}
                </button>
              ) : isBookedByMe ? (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full bg-green-100 text-green-700 py-4 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2 animate-fade-up"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Booked
                  </button>
                  <button
                    onClick={() => navigate(`/cancel-booking/${id}`, { state: { ride, user } })}
                    disabled={bookingActionLoading}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
                  >
                    <XCircle className="w-4 h-4" />
                    {bookingActionLoading ? "Cancelling..." : "Cancel Booking"}
                  </button>
                </div>
              ) : canBook ? (
                <button
                  onClick={handleBookRide}
                  disabled={bookingActionLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 hover:-translate-y-0.5"
                >
                  {bookingActionLoading ? "Booking..." : "Book This Ride"}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-4 rounded-lg font-semibold cursor-not-allowed animate-fade-up"
                >
                  Fully Booked
                </button>
              )}

              {canRateRide && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 animate-fade-scale">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Rate your driver</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    Share your experience to help improve future rides.
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className={`text-3xl transition-all duration-300 hover:scale-110 ${star <= userRating ? "text-yellow-400" : "text-gray-300"}`}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={userRatingComment}
                    onChange={(e) => setUserRatingComment(e.target.value)}
                    placeholder="Write a short comment (optional)"
                    className="w-full min-h-24 rounded-lg border border-amber-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />

                  <button
                    type="button"
                    onClick={handleSubmitRating}
                    disabled={submittingRating}
                    className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {submittingRating ? "Submitting..." : "Submit Rating"}
                  </button>
                </div>
              )}

              {!isDriver && isRideCompleted && hasRatedRide && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-green-700 animate-fade-up">
                  ✓ Thanks for rating this ride.
                </div>
              )}

              {/* Booked Passengers (driver only) */}
              {isDriver && ride.passengers?.length > 0 && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Booked Passengers ({ride.passengers.length})
                  </h3>
                  <div className="space-y-4">
                    {ride.passengers.map((passenger) => (
                      <div
                        key={passenger._id}
                        className="flex items-center gap-4 p-3 bg-white rounded border border-gray-100"
                      >
                        <img
                          src={passenger.avatar || "/default-avatar.png"}
                          alt={passenger.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{passenger.name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            {passenger.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verify Passengers + Finish Ride (driver only) */}
              {isDriver && isRideActive && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-bold mb-4">Verify Passengers</h3>

                  <div className="mb-4 text-center">
                    <p className="text-sm font-medium">
                      Verified: {verifiedCount} / {ride.passengers?.length || 0}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-green-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${(verifiedCount / (ride.passengers?.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {!showOtpSection ? (
                    <button
                      onClick={() => {
                        const firstUnverifiedId = unverifiedPassengers[0]?._id;
                        setSelectedPassengerId(firstUnverifiedId ? String(firstUnverifiedId) : "");
                        setShowOtpSection(true);
                      }}
                      disabled={unverifiedPassengers.length === 0}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {unverifiedPassengers.length === 0
                        ? "All Passengers Verified"
                        : "Verify Passenger with OTP"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {unverifiedPassengers.length > 0 ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Passenger to verify
                          </label>
                          <select
                            value={selectedPassengerId}
                            onChange={(e) => setSelectedPassengerId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                          >
                            <option value="">-- Select a passenger --</option>
                            {unverifiedPassengers.map((passenger) => {
                              const passengerId = String(passenger._id || passenger);
                              const passengerName = passenger?.name || `Passenger ${passengerId.slice(-6)}`;
                              return (
                                <option key={passengerId} value={passengerId}>
                                  {passengerName}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <p className="text-center text-sm font-medium text-green-700">
                          All passengers are already verified.
                        </p>
                      )}

                      <div className="flex gap-3 justify-center">
                        {[...Array(6)].map((_, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            value={otpInput[i] || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val) {
                                const newOtp = otpInput.split("");
                                newOtp[i] = val;
                                setOtpInput(newOtp.join(""));
                                if (i < 5) e.target.nextSibling?.focus();
                              }
                            }}
                            className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowOtpSection(false)}
                          className="flex-1 bg-gray-200 py-3 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleVerifyPassenger}
                          disabled={verifying || otpInput.length !== 6 || unverifiedPassengers.length === 0}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {verifying ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                    </div>
                  )}

                  {showFinishButton && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={paymentConfirmed}
                          onChange={(e) => setPaymentConfirmed(e.target.checked)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label className="text-sm font-medium">
                          Payment completed
                        </label>
                      </div>

                      <button
                        onClick={handleFinishRide}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Finish Ride
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Passenger OTP Display */}
              {showPassengerOtp && (
                <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                  <h3 className="text-lg font-bold text-amber-800 mb-3 text-center">
                    Your Ride OTP
                  </h3>
                  <div className="text-center bg-white p-5 rounded-lg border border-amber-100 mb-4">
                    <p className="text-5xl font-mono font-bold tracking-widest text-amber-900">
                      {ride.otp}
                    </p>
                  </div>
                  <p className="text-sm text-amber-700 text-center mb-3">
                    Show this to the driver when boarding
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ride.otp);
                      toast.success("OTP copied!");
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy OTP
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-lg hover:bg-blue-100"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button className="flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-lg hover:bg-green-100">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              </div>

              <div className="mt-8 pt-6 border-t text-sm text-gray-600 flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Safety first</p>
                  <p className="text-xs mt-1">All rides are AI-verified. Share trip details with family.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      <ChatComponent
        rideId={id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentUser={user}
      />
    </div>
  );
};

export default RideDetails;