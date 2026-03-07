import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  Car,
  Shield,
  CheckCircle,
  MapPin,
  CreditCard,
  Leaf,
  Zap,
  ArrowRight,
} from "lucide-react";
import { mockTeamMembers } from "../data/mockData";

const Home = () => {
  const navigate = useNavigate();

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));

      if (decoded.role === "driver") {
        navigate("/driver-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Invalid token");
      localStorage.removeItem("token");
    }
  }, [navigate]);

  const features = [
    {
      icon: Zap,
      title: "Real-time Matching",
      description:
        "Find rides instantly with our smart matching algorithm. Connect with riders going your way in seconds.",
    },
    {
      icon: Shield,
      title: "AI Safety Checks",
      description:
        "Advanced AI detects helmet usage and vehicle overload before every ride. Your safety is our priority.",
    },
    {
      icon: CheckCircle,
      title: "Verified Drivers",
      description:
        "All drivers undergo thorough verification. Documents, ratings, and safety records are checked.",
    },
    {
      icon: MapPin,
      title: "Live Tracking",
      description:
        "Track your ride in real-time with GPS. Share your trip details with family for added safety.",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description:
        "Cashless, secure transactions. Pay through wallet, UPI, or cards with complete transparency.",
    },
    {
      icon: Leaf,
      title: "Eco Impact",
      description:
        "Reduce carbon footprint by sharing rides. Track your environmental contribution with every trip.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Sign Up",
      description:
        "Create your account as a rider or driver in under 2 minutes",
    },
    {
      step: "2",
      title: "Find or Post",
      description:
        "Search for rides or post your own with route and timing",
    },
    {
      step: "3",
      title: "AI Verification",
      description:
        "Our AI checks helmet compliance and vehicle safety automatically",
    },
    {
      step: "4",
      title: "Ride & Enjoy",
      description:
        "Travel safely with live tracking and emergency SOS features",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  AI-Powered Safety First
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Ride Together.
                <br />
                <span className="text-green-600">Ride Safer.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                India's first carpooling platform with AI-powered helmet
                detection and overload prevention. Travel smart, save money, and
                protect the environment—all while ensuring maximum safety.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/find-ride"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg hover:shadow-xl transition-all font-semibold text-center flex items-center justify-center gap-2 group"
                >
                  Find a Ride
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="bg-white border-2 border-green-500 text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition-all font-semibold text-center"
                >
                  Offer a Ride
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-200">
                <div>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-gray-600 mt-1">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-600 mt-1">Safety Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-gray-600 mt-1">Daily Rides</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-12 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Vijayawada → Guntur
                      </p>
                      <p className="text-sm text-gray-500">Tomorrow, 9:00 AM</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-lg">
                      <span className="text-sm text-gray-700">
                        AI Safety Check
                      </span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-lg">
                      <span className="text-sm text-gray-700">
                        Helmet Verified
                      </span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-lg">
                      <span className="text-sm text-gray-700">Live Tracking</span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg mt-6 font-semibold">
                    Book Now - ₹80
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose RideShare Connect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of safe, smart, and sustainable carpooling
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built by passionate developers committed to safer roads
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mockTeamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all text-center border border-gray-100"
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-green-100"
                />
                <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-green-600 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-xs text-gray-500">{member.rollNo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Safe Journey?
          </h2>
          <p className="text-xl text-green-50 mb-8">
            Join thousands of riders and drivers making travel safer and more
            sustainable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-green-600 px-8 py-4 rounded-lg hover:shadow-xl transition-all font-semibold"
            >
              Get Started Free
            </Link>
            <Link
              to="/find-ride"
              className="bg-green-700 text-white px-8 py-4 rounded-lg hover:bg-green-800 transition-all font-semibold"
            >
              Browse Rides
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">RideShare Connect</span>
              </div>
              <p className="text-sm">
                Making carpooling safer with AI-powered technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>Help Center</li>
                <li>Safety</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 RideShare Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
