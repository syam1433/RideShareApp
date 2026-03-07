import { Star, CheckCircle } from "lucide-react";

const ProfileCard = ({ user, showVerified = true }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-4">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-16 h-16 rounded-full border-2 border-green-100"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{user.name}</h3>
            {showVerified && user.verified && (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium text-gray-900">
              {user.rating}
            </span>
          </div>
          <p className="text-sm text-gray-600 capitalize mt-1">{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
