const mongoose = require("mongoose");

const safetyRecordSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    helmetCompliance: { type: Number, default: 100 },
    overloadViolations: { type: Number, default: 0 },
    lastChecked: Date,
    aiStatus: {
      type: String,
      enum: ["passed", "warning", "failed"],
      default: "passed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SafetyRecord", safetyRecordSchema);