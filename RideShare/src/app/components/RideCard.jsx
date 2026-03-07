import { Link } from "react-router";
import { MapPin, Calendar, Clock, Users, Star, Car } from "lucide-react";

const RideCard = ({ ride, onBook }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Driver Info */}
        <div className="flex items-start gap-4">
          <img
            src={ride.driverAvatar}
            alt={ride.driverName}
            className="w-16 h-16 rounded-full border-2 border-green-100"
          />
          <div>
            <h3 className="font-bold text-gray-900 mb-1">{ride.driverName}</h3>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium text-gray-900">
                {ride.driverRating}
              </span>
            </div>
          </div>
        </div>

        {/* Ride Details */}
        <div className="flex-1">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-semibold text-gray-900">{ride.from}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-semibold text-gray-900">{ride.to}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{ride.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{ride.time}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span>
                {ride.vehicleType} - {ride.vehicleModel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{ride.seatsLeft} seats available</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{ride.distance}</span>
            </div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex flex-col items-end justify-between min-w-[140px]">
          <div className="text-right mb-4">
            <p className="text-3xl font-bold text-green-600">₹{ride.price}</p>
            <p className="text-xs text-gray-500">per seat</p>
          </div>

          <div className="space-y-2 w-full">
            {ride.seatsLeft > 0 ? (
              <>
                <button
                  onClick={() => onBook && onBook(ride.id)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Book Now
                </button>
                <Link
                  to={`/ride/${ride.id}`}
                  className="block w-full text-center bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  View Details
                </Link>
              </>
            ) : (
              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Fully Booked
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
