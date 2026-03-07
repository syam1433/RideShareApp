import { Shield, CheckCircle, AlertCircle } from "lucide-react";

const SafetyStatus = ({ helmetCompliance, overloadViolations, lastCheck }) => {
  const safetyScore =
    helmetCompliance >= 90 && overloadViolations === 0 ? "excellent" : "good";

  return (
    <div
      className={`rounded-xl p-6 ${
        safetyScore === "excellent"
          ? "bg-gradient-to-br from-green-500 to-emerald-600"
          : "bg-gradient-to-br from-yellow-500 to-orange-600"
      } text-white`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Safety Compliance</h3>
          <p className="text-white/80">AI-powered safety verification</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90">Helmet Compliance</span>
            {helmetCompliance >= 90 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <p className="text-3xl font-bold">{helmetCompliance}%</p>
        </div>

        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90">Overload Violations</span>
            {overloadViolations === 0 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <p className="text-3xl font-bold">{overloadViolations}</p>
        </div>

        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90">Last Check</span>
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold">{lastCheck}</p>
          <p className="text-xs text-white/70 mt-1">2 hours ago</p>
        </div>
      </div>
    </div>
  );
};

export default SafetyStatus;
