import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../services/api";

const reasons = [
  "Overloading",
  "Driver not responding",
  "Wrong route / delay",
  "Personal reason",
  "Other",
];

const CancelBooking = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // If user and ride were passed via navigation state, use them to prefill
  const [currentUser, setCurrentUser] = useState<any>(location.state?.user || null);

  const [ride, setRide] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [actualMembersCount, setActualMembersCount] = useState<number | "">("");
  const [overloadedCount, setOverloadedCount] = useState<number | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [modelResult, setModelResult] = useState<any>(null);

  // Fetch ride details to get seatsOffered, but prefer location.state if available
  useEffect(() => {
    if (location.state?.ride) {
      setRide(location.state.ride);
      return;
    }

    const fetchRide = async () => {
      try {
        const res = await API.get(`/rides/${rideId}`);
        setRide(res.data);
      } catch (err) {
        console.error("Failed to load ride:", err);
        toast.error("Failed to load ride information");
      }
    };
    if (rideId) fetchRide();
  }, [rideId, location.state]);

  const seatsOffered = Math.max(
    Number(ride?.seatCapacity || 0),
    Number(ride?.seatsAvailable || 0),
    1
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = ""; // clear input
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError(null);
  setModelResult(null);

  // Validation
  if (!reason) {
    setFormError("Please select a reason");
    toast.error("Please select a reason");
    return;
  }

  if (reason === "Overloading") {
    if (!actualMembersCount || actualMembersCount < 1) {
      setFormError("Please enter actual number of people in vehicle");
      toast.error("Please enter a valid number");
      return;
    }
    if (!overloadedCount || overloadedCount < 1) {
      setFormError("Please enter how many extra/overloaded");
      toast.error("Please enter a valid number");
      return;
    }
  }

  if (reason === "Other" && !customReason.trim()) {
    setFormError("Please specify your reason");
    toast.error("Please specify your reason");
    return;
  }

  setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("rideId", rideId || "");
      formData.append("reason", reason);
      // attach user context if available (prefilled via navigation state)
      if (currentUser?.id) {
        formData.append("userId", currentUser.id);
        if (currentUser.name) formData.append("userName", currentUser.name);
        if (currentUser.email) formData.append("userEmail", currentUser.email);
      }
      if (reason === "Other") formData.append("customReason", customReason);
      if (reason === "Overloading") {
        formData.append("actualMembersCount", String(actualMembersCount));
        formData.append("overloadedCount", String(overloadedCount));
      }
      if (photo instanceof File) formData.append("proofImage", photo);

      // Debug send — list entries safely
      console.log("Sending FormData:");
      for (const pair of (formData as any).entries()) {
        const [key, value] = pair;
        console.log(key, value instanceof File ? `${value.name} (file, ${value.size} bytes)` : value);
      }

      // THE ONLY POST CALL – NO HEADERS. Let browser set Content-Type with boundary.
      const res = await API.post(`/bookings/cancel/${rideId}`, formData);

    setModelResult(res.data.modelResult || {
      status: res.data.overloaded ? "OVERLOADED" : "NORMAL",
      message: res.data.message,
      detected: res.data.detected || 0,
      seatsOffered,
    });

    toast.success(res.data.message || "Cancellation processed");
    setTimeout(() => navigate("/dashboard"), 1500);
  } catch (err: any) {
    console.error("Cancel error:", err);
    const msg = err.response?.data?.message || err.message || "Cancellation failed";
    toast.error(msg);
    setFormError(msg);
  } finally {
    setSubmitting(false);
  }
};

  const shownSeatsOffered = Number(modelResult?.seatsOffered || seatsOffered || 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cancel Booking</h1>
        <p className="text-gray-600 mb-6">
          Please provide a reason for cancellation. For <strong>Overloading</strong> claims, upload a photo and specify details.
          Seats offered: <strong>{shownSeatsOffered}</strong>
        </p>

        {formError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {formError}
          </div>
        )}

        {modelResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            modelResult.status === "OVERLOADED" 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-green-50 border-green-200 text-green-800"
          }`}>
            <h3 className="font-bold mb-2 text-lg">
              {modelResult.status === "OVERLOADED" ? "🚨 OVERLOADING DETECTED!" : "✅ No Overloading Detected"}
            </h3>
            <p className="mb-2">{modelResult.message}</p>
            {modelResult.detected > 0 && (
              <p className="font-medium">
                Detected: <strong>{modelResult.detected}</strong> people (vs {shownSeatsOffered} seats offered)
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Reason */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Overloading fields */}
          {reason === "Overloading" && (
            <>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Total people actually in the vehicle <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={actualMembersCount}
                  onChange={(e) => setActualMembersCount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 7"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the actual total number of people present in the vehicle.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  How many extra / overloaded people? <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={overloadedCount}
                  onChange={(e) => setOverloadedCount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of people exceeding the vehicle's capacity.
                </p>
              </div>
            </>
          )}

          {/* Other reason */}
          {reason === "Other" && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Please specify <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Describe your reason..."
                required
              />
            </div>
          )}

          {/* Photo Upload */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              Upload photo (strongly recommended for Overloading claim)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              JPEG/PNG only. Max 5MB. Clear photo helps verify claims.
            </p>

            {photoPreview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img 
                  src={photoPreview} 
                  alt="Uploaded preview" 
                  className="max-h-48 rounded-lg border border-gray-300 object-contain"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Processing..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelBooking;