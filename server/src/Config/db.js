const mongoose = require("mongoose");

const MAX_DB_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log("MongoDB Connected");

      // Create database indexes for better performance
      await createIndexes();
      return;
    } catch (error) {
      console.error(`DB connection attempt ${attempt}/${MAX_DB_RETRIES} failed:`, error.message);

      // Helpful hint for intermittent ISP/router DNS blocks on Atlas SRV lookup.
      if (error.code === "EREFUSED" && error.syscall === "querySrv") {
        console.error(
          "DNS SRV lookup was refused. Check internet/router DNS, allow MongoDB Atlas domains, or switch DNS to 8.8.8.8 / 1.1.1.1."
        );
      }

      if (attempt === MAX_DB_RETRIES) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

const createIndexSafe = async (collection, spec, options) => {
  try {
    await collection.createIndex(spec, options);
  } catch (error) {
    // Ignore conflicts where an equivalent index already exists with another auto-generated name.
    const isIndexConflict =
      Number(error.code) === 85 ||
      error.codeName === "IndexOptionsConflict" ||
      String(error.message || "").includes("Index already exists with a different name");

    if (isIndexConflict) {
      return;
    }
    throw error;
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Ride collection indexes
    const rideCollection = db.collection('rides');

    // Compound index for common queries
    await createIndexSafe(rideCollection,
      { status: 1, dateTime: 1, seatsAvailable: -1 },
      { name: "ride_status_datetime_seats" }
    );

    // Text index for location search
    await createIndexSafe(rideCollection,
      { from: "text", to: "text" },
      { name: "ride_locations_text" }
    );

    // Geospatial indexes (already defined in schema)
    await createIndexSafe(rideCollection,
      { pickupLocation: "2dsphere" },
      { name: "pickup_location_2dsphere" }
    );

    await createIndexSafe(rideCollection,
      { destinationLocation: "2dsphere" },
      { name: "destination_location_2dsphere" }
    );

    // Booking collection indexes
    const bookingCollection = db.collection('bookings');

    await createIndexSafe(bookingCollection,
      { passenger: 1, status: 1 },
      { name: "booking_passenger_status" }
    );

    await createIndexSafe(bookingCollection,
      { ride: 1, status: 1 },
      { name: "booking_ride_status" }
    );

    // User collection indexes
    const userCollection = db.collection('users');

    await createIndexSafe(userCollection,
      { email: 1 },
      { name: "user_email_unique", unique: true }
    );

    await createIndexSafe(userCollection,
      { phone: 1 },
      { name: "user_phone_unique", unique: true }
    );

    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
};

module.exports = connectDB;