import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Eye, Database, BellRing, Trash2 } from "lucide-react";

const policySections = [
  {
    icon: ShieldCheck,
    title: "What we collect",
    items: [
      "Profile details such as name, email, phone number, and role.",
      "Trip information, booking history, and ride preferences.",
      "Device and usage information to keep the app secure and stable.",
    ],
  },
  {
    icon: Eye,
    title: "How we use your data",
    items: [
      "To create and manage your account.",
      "To match riders and drivers and show ride details.",
      "To send booking updates, OTPs, and safety notifications.",
    ],
  },
  {
    icon: Lock,
    title: "How we protect it",
    items: [
      "Encrypted authentication and secure API requests.",
      "Role-based access to limit sensitive ride information.",
      "Regular checks to reduce abuse, fraud, and unauthorized access.",
    ],
  },
  {
    icon: BellRing,
    title: "Notifications",
    items: [
      "We may send ride confirmations, reminders, OTPs, and support messages.",
      "You can contact support if you need help with unwanted notifications.",
      "Critical safety alerts may still be sent even if some notifications are disabled.",
    ],
  },
  {
    icon: Database,
    title: "Sharing and retention",
    items: [
      "Ride participants can see the trip details required to complete a booking.",
      "We do not sell personal data.",
      "We keep information only as long as needed for service, safety, and legal reasons.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safety enforcement",
    items: [
      "Repeated overloading cancellations may be recorded as safety violations.",
      "Drivers can be blacklisted from creating new rides after repeated violations.",
      "Safety status may be used to protect riders, drivers, and platform integrity.",
    ],
  },
  {
    icon: Trash2,
    title: "Your choices",
    items: [
      "You can review and update your profile data anytime.",
      "You may request deletion of your account where applicable.",
      "You can stop using the service at any time.",
    ],
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="page-shell min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-12">
      <div className="page-content max-w-5xl mx-auto">
        <div className="text-center mb-10 animate-page-in">
          <Link to="/register" className="inline-flex items-center gap-2 text-green-600 font-medium hover:text-green-700 transition-colors">
            ← Back to sign up
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full animate-soft-pulse">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-semibold">Privacy Policy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-4">
            Your privacy matters
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            This page explains how RideShare Connect handles your information so you can ride with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {policySections.map((section, index) => {
            const Icon = section.icon;
            return (
              <section
                key={section.title}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-sm p-6 hover-lift animate-fade-up"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-3 text-gray-600 leading-relaxed list-disc list-inside">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 shadow-xl animate-fade-scale">
          <h2 className="text-2xl font-bold mb-3">Need help?</h2>
          <p className="text-green-50 leading-relaxed mb-6 max-w-3xl">
            If you have questions about privacy, account access, or how your ride data is used, please contact the support team from the app.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 hover:-translate-y-0.5"
          >
            Create your account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
