import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Car, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/find-ride", label: "Find a Ride" },
    { to: "/post-ride", label: "Offer a Ride" },
    { to: "/login", label: "Login" },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 top-0 bg-white/85 backdrop-blur-xl border-b border-gray-200 z-50 shadow-[0_8px_30px_rgba(15,23,42,0.08)] animate-fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center animate-soft-pulse">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">RideShare Connect</h1>
              </div>
            </Link>

            {/* Desktop + Tablet Navigation */}
            <div className="hidden md:flex items-center gap-5 lg:gap-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                      isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/register"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all duration-300 font-medium hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>

            {/* Phone Navigation Toggle */}
            <button
              className="md:hidden p-2 rounded-lg transition-transform duration-300 hover:scale-105 hover:bg-gray-100"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          className="absolute inset-0 bg-black/35"
          onClick={() => setIsOpen(false)}
          aria-label="Close mobile menu overlay"
        />
        <div
          className={`absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl transition-transform duration-300 ${
            isOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-lg px-3 py-2 font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
