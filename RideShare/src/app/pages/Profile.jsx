import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  Shield,
  Car,
  CheckCircle,
  Edit,
  Camera,
  Award,
  TrendingUp,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import { format } from "date-fns";

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  // Recent activity (placeholder until real fetch is added)
const recentActivity = [
  {
    type: "ride",
    title: "Vijayawada → Guntur",
    date: "Feb 5, 2026",
    status: "completed",
  },
  {
    type: "ride",
    title: "Tenali → Vijayawada",
    date: "Feb 4, 2026",
    status: "completed",
  },
  {
    type: "payment",
    title: "Payment received",
    date: "Feb 3, 2026",
    status: "success",
  },
];

  // Fetch real profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/users/me");
        const data = res.data;
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (authUser) fetchProfile();
  }, [authUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      const res = await API.patch("/users/me", formData);
      setProfile(res.data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Stats based on real profile data
  const stats = profile?.role === "driver"
    ? [
        { label: "Total Rides", value: profile?.totalRides || 0, icon: Car },
        { label: "Rating", value: profile?.rating || "N/A", icon: Star, suffix: "/5" },
        { label: "Total Earnings", value: `₹${(profile?.totalEarnings || 0).toLocaleString()}`, icon: TrendingUp },
        { label: "Safety Score", value: `${profile?.safetyScore || "N/A"}%`, icon: Shield },
      ]
    : [
        { label: "Rides Taken", value: profile?.ridesTaken || 0, icon: Car },
        { label: "Rating", value: profile?.rating || "N/A", icon: Star, suffix: "/5" },
        { label: "Money Saved", value: `₹${(profile?.moneySaved || 0).toLocaleString()}`, icon: TrendingUp },
        { label: "CO₂ Saved", value: `${profile?.co2Saved || 0} kg`, icon: Award },
      ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your personal information and settings
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={profile?.avatar || "https://via.placeholder.com/128"}
                    alt={profile?.name}
                    className="w-32 h-32 rounded-full border-4 border-green-100 mx-auto"
                  />
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-4">
                  {profile?.name || "User"}
                </h2>
                <p className="text-green-600 font-medium capitalize">
                  {profile?.role || "Passenger"}
                </p>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-xl font-bold text-gray-900">
                      {profile?.rating || "N/A"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({profile?.totalReviews || 0} reviews)
                  </span>
                </div>

                {/* Verification Badge */}
                {profile?.isVerifiedDriver && (
                  <div className="flex items-center justify-center gap-2 mt-4 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Verified Driver</span>
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Member since</p>
                    <p className="font-semibold text-gray-900">
                      {profile?.createdAt
                        ? format(new Date(profile.createdAt), "MMMM yyyy")
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Icon className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {stat.value}
                        {stat.suffix || ""}
                      </p>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Personal Information
                </h2>
                <button
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  {isEditing ? "Save" : "Edit"}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        !isEditing ? "bg-gray-50" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        !isEditing ? "bg-gray-50" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        !isEditing ? "bg-gray-50" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={
                        profile?.createdAt
                          ? format(new Date(profile.createdAt), "MMMM yyyy")
                          : "Unknown"
                      }
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Driver-specific Information */}
            {profile?.role === "driver" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Vehicle Information
                </h2>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-gray-900">
                        {profile?.vehicleType || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vehicle Number</p>
                    <p className="font-semibold text-gray-900">
                      {profile?.vehicleNumber || "Not registered"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Model</p>
                    <p className="font-semibold text-gray-900">
                      {profile?.vehicleModel || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Verified Documents
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Driving License</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Vehicle RC</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Insurance</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Pollution Certificate</span>
                    </div>
                  </div>
                </div>

                {/* Safety Score */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      Safety Compliance Score
                    </h3>
                    <span className="text-2xl font-bold text-green-600">
                      {profile?.safetyScore || "N/A"}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                      style={{ width: `${profile?.safetyScore || 98}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Based on AI verification checks and ride history
                  </p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.type === "ride" ? (
                        <MapPin className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600">{activity.date}</p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        activity.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;