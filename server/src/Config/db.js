const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Create database indexes for better performance
    await createIndexes();
  } catch (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Ride collection indexes
    const rideCollection = db.collection('rides');

    // Compound index for common queries
    await rideCollection.createIndex(
      { status: 1, dateTime: 1, seatsAvailable: -1 },
      { name: "ride_status_datetime_seats" }
    );

    // Text index for location search
    await rideCollection.createIndex(
      { from: "text", to: "text" },
      { name: "ride_locations_text" }
    );

    // Geospatial indexes (already defined in schema)
    await rideCollection.createIndex(
      { pickupLocation: "2dsphere" },
      { name: "pickup_location_2dsphere" }
    );

    await rideCollection.createIndex(
      { destinationLocation: "2dsphere" },
      { name: "destination_location_2dsphere" }
    );

    // Booking collection indexes
    const bookingCollection = db.collection('bookings');

    await bookingCollection.createIndex(
      { passenger: 1, status: 1 },
      { name: "booking_passenger_status" }
    );

    await bookingCollection.createIndex(
      { ride: 1, status: 1 },
      { name: "booking_ride_status" }
    );

    // User collection indexes
    const userCollection = db.collection('users');

    await userCollection.createIndex(
      { email: 1 },
      { name: "user_email_unique", unique: true }
    );

    await userCollection.createIndex(
      { phone: 1 },
      { name: "user_phone_unique", unique: true }
    );

    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
};

module.exports = connectDB;