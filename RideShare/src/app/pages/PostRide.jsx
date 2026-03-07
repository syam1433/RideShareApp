import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Car,
  Shield,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const PostRide = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: "1",
    pricePerSeat: "",
    vehicleType: "Bike",
    dlNumber: "",
    vehicleNumber: "",
    vehicleModel: "",
    safetyNote: "",
  });

  const [viaPoints, setViaPoints] = useState([]); // Optional via stops

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addViaPoint = () => {
    if (viaPoints.length < 5) {
      setViaPoints([...viaPoints, ""]);
    } else {
      toast.warning("Maximum 5 via points allowed");
    }
  };

  const removeViaPoint = (index) => {
    setViaPoints(viaPoints.filter((_, i) => i !== index));
  };

  const updateViaPoint = (index, value) => {
    const updated = [...viaPoints];
    updated[index] = value.trim();
    setViaPoints(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required field validation
    if (
      !formData.from.trim() ||
      !formData.to.trim() ||
      !formData.date ||
      !formData.time ||
      !formData.pricePerSeat ||
      !formData.vehicleNumber.trim() ||
      !formData.vehicleModel.trim() ||
      !formData.dlNumber.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        from: formData.from.trim(),
        to: formData.to.trim(),
        viaPoints: viaPoints.filter((point) => point.trim()), // clean empty ones
        dateTime: `${formData.date}T${formData.time}:00`,
        pricePerSeat: Number(formData.pricePerSeat),
        seatsAvailable: Number(formData.seats),
        vehicleType: formData.vehicleType,
        dlNumber: formData.dlNumber.trim(),
        vehicleNumber: formData.vehicleNumber.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        safetyNote: formData.safetyNote.trim() || "",
      };

      const res = await API.post("/rides", payload);

      toast.success("Ride posted successfully! It will auto-expire in 24 hours.");
      navigate("/driver-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Ride</h1>
          <p className="text-gray-600">
            Share your journey — ride expires automatically after 24 hours
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Route Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="from"
                      value={formData.from}
                      onChange={handleChange}
                      placeholder="e.g. Rajahmundry Railway Station"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="to"
                      value={formData.to}
                      onChange={handleChange}
                      placeholder="e.g. Vijayawada Bus Stand"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Via Points */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Via Points (Optional Stops)
                  </label>
                  <button
                    type="button"
                    onClick={addViaPoint}
                    className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {viaPoints.map((point, index) => (
                  <div key={index} className="flex gap-3 mb-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateViaPoint(index, e.target.value)}
                      placeholder={`Via Point ${index + 1} (e.g. Kakinada Junction)`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeViaPoint(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Date & Time</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ride Details</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Seats <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="seats"
                      value={formData.seats}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      {[1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "seat" : "seats"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Seat (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="pricePerSeat"
                      value={formData.pricePerSeat}
                      onChange={handleChange}
                      placeholder="80"
                      min="10"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Bike">Bike</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Car">Car</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver & Vehicle Verification */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Driver & Vehicle Details
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driving License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="dlNumber"
                    value={formData.dlNumber}
                    onChange={handleChange}
                    placeholder="e.g. TS12 20230012345"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g. AP39 XY 1234"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="e.g. Honda Activa 6G / Hyundai i20"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Safety Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Note (Optional)
              </label>
              <textarea
                name="safetyNote"
                value={formData.safetyNote}
                onChange={handleChange}
                rows="3"
                placeholder="e.g. Helmets provided for all passengers, no overloading"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Auto-delete Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important Notice</p>
                <p>This ride will automatically expire and be removed from the system 24 hours after posting.</p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting Ride...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Post Ride
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/driver-dashboard")}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostRide;