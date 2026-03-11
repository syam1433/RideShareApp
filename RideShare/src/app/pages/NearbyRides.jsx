import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, RefreshCw, Route } from "lucide-react";
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import toast from "react-hot-toast";
import API from "../../services/api";

const DISTANCE_OPTIONS = [
  { label: "100 m", value: 100 },
  { label: "200 m", value: 200 },
  { label: "300 m", value: 300 },
  { label: "500 m", value: 500 },
  { label: "800 m", value: 800 },
  { label: "1 km", value: 1000 },
];

const GOOGLE_MAP_LIBRARIES = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "480px",
};

const DEFAULT_CENTER = { lat: 16.3067, lng: 80.4365 };

const GEO_ERROR_MESSAGES = {
  1: "Location permission denied. Please allow location access in browser settings.",
  2: "Location is currently unavailable. Please turn on GPS/location service.",
  3: "Location request timed out. Retrying with lower accuracy...",
};

const getCurrentPositionAsync = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const NearbyRides = () => {
  const navigate = useNavigate();
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [userLocation, setUserLocation] = useState(null);
  const [locationSource, setLocationSource] = useState("gps");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingRides, setLoadingRides] = useState(false);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [activeCity, setActiveCity] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "nearby-rides-map",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const fallbackToDefaultLocation = useCallback((message) => {
    setLocationSource("fallback");
    setUserLocation(DEFAULT_CENTER);
    if (message) {
      toast(message);
    }
  }, []);

  const fetchCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLoadingLocation(false);
      return;
    }

    if (!window.isSecureContext) {
      toast.error("Location access requires HTTPS or localhost. Using default city center.");
      fallbackToDefaultLocation();
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);

    try {
      // Try high-accuracy first for better nearby ride precision.
      const precise = await getCurrentPositionAsync({
        enableHighAccuracy: true,
        timeout: 18000,
        maximumAge: 120000,
      });

      setUserLocation({
        lat: precise.coords.latitude,
        lng: precise.coords.longitude,
      });
      setLocationSource("gps");
    } catch (firstError) {
      const firstMessage = GEO_ERROR_MESSAGES[firstError?.code] || "Unable to fetch your current location.";

      if (Number(firstError?.code) === 3) {
        toast(firstMessage);
        try {
          // Retry with less strict settings for slow networks/devices.
          const fallback = await getCurrentPositionAsync({
            enableHighAccuracy: false,
            timeout: 25000,
            maximumAge: 600000,
          });

          setUserLocation({
            lat: fallback.coords.latitude,
            lng: fallback.coords.longitude,
          });
          setLocationSource("gps");
          toast.success("Location fetched successfully");
          setLoadingLocation(false);
          return;
        } catch (secondError) {
          const secondMessage =
            GEO_ERROR_MESSAGES[secondError?.code] || "Unable to fetch your current location.";
          toast.error(`${secondMessage} Using default city center.`);
          fallbackToDefaultLocation();
          setLoadingLocation(false);
          return;
        }
      }

      toast.error(`${firstMessage} Using default city center.`);
      fallbackToDefaultLocation();
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchNearbyRides = useCallback(async () => {
    if (!userLocation) return;

    setLoadingRides(true);
    setActiveCity(null);

    try {
      const radiusKm = radiusMeters / 1000;
      const params = new URLSearchParams({
        lat: String(userLocation.lat),
        lng: String(userLocation.lng),
        radius: String(radiusKm),
      });
      const res = await API.get(`/rides/nearby?${params.toString()}`);

      const rides = Array.isArray(res.data?.rides)
        ? res.data.rides
        : Array.isArray(res.data)
        ? res.data
        : [];

      setNearbyRides(rides);
      if (rides.length === 0) {
        toast("No rides found in selected radius");
      }
    } catch (error) {
      console.error("Nearby rides fetch failed:", error);
      toast.error(error.response?.data?.message || "Failed to fetch nearby rides");
      setNearbyRides([]);
    } finally {
      setLoadingRides(false);
    }
  }, [radiusMeters, userLocation]);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyRides();
    }
  }, [userLocation, radiusMeters, fetchNearbyRides]);

  const cityMarkers = useMemo(() => {
    const grouped = new Map();

    for (const ride of nearbyRides) {
      const cityName = ride.from || "Unknown City";
      const coords = ride.pickupLocation?.coordinates;

      if (!Array.isArray(coords) || coords.length !== 2) continue;

      const markerLat = Number(coords[1]);
      const markerLng = Number(coords[0]);
      if (!Number.isFinite(markerLat) || !Number.isFinite(markerLng)) continue;

      if (!grouped.has(cityName)) {
        grouped.set(cityName, {
          cityName,
          position: { lat: markerLat, lng: markerLng },
          rides: [],
        });
      }

      grouped.get(cityName).rides.push(ride);
    }

    return Array.from(grouped.values());
  }, [nearbyRides]);

  const ridesByDistance = useMemo(() => {
    return [...nearbyRides]
      .filter((ride) => Number.isFinite(Number(ride.distance)))
      .sort((a, b) => Number(a.distance) - Number(b.distance));
  }, [nearbyRides]);

  useEffect(() => {
    if (!mapRef || !window.google?.maps || !userLocation) return;

    if (cityMarkers.length === 0) {
      mapRef.setCenter(userLocation);
      mapRef.setZoom(14);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(userLocation);
    cityMarkers.forEach((city) => bounds.extend(city.position));
    mapRef.fitBounds(bounds, 60);
  }, [mapRef, userLocation, cityMarkers]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Nearby Rides</h1>
              <p className="text-gray-600">
                Choose a distance and find ride starting cities near your current location.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                <select
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full sm:w-44 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {DISTANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchCurrentLocation}
                disabled={loadingLocation}
                className="h-10 sm:self-end px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                {loadingLocation ? "Locating..." : "Use My Location"}
              </button>

              <button
                onClick={fetchNearbyRides}
                disabled={loadingRides || !userLocation}
                className="h-10 sm:self-end px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRides ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Selected Radius</p>
              <p className="font-semibold text-gray-900">{radiusMeters} m</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Nearby Rides</p>
              <p className="font-semibold text-gray-900">{nearbyRides.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Nearby Start Cities</p>
              <p className="font-semibold text-gray-900">{cityMarkers.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-semibold text-gray-900">
                {loadingRides ? "Searching..." : locationSource === "gps" ? "Live location" : "Fallback location"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-3">
            {loadError ? (
              <div className="h-[480px] flex items-center justify-center text-red-600 font-medium">
                Failed to load Google Map
              </div>
            ) : !isLoaded || loadingLocation ? (
              <div className="h-[480px] flex items-center justify-center text-gray-600">
                Loading map...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={userLocation || DEFAULT_CENTER}
                zoom={14}
                onLoad={setMapRef}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {userLocation && (
                  <Marker
                    position={userLocation}
                    title="Your Location"
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    }}
                  />
                )}

                {cityMarkers.map((city) => (
                  <Marker
                    key={city.cityName}
                    position={city.position}
                    title={`${city.cityName} (${city.rides.length} rides)`}
                    onClick={() => {
                      if (city.rides.length === 1) {
                        navigate(`/ride/${city.rides[0]._id}`);
                      } else {
                        setActiveCity(city);
                      }
                    }}
                  />
                ))}

                {activeCity && (
                  <InfoWindow
                    position={activeCity.position}
                    onCloseClick={() => setActiveCity(null)}
                  >
                    <div className="max-w-[260px]">
                      <h3 className="font-semibold text-gray-900 mb-2">{activeCity.cityName}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {activeCity.rides.length} ride(s) found in this city
                      </p>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {activeCity.rides.map((ride) => (
                          <button
                            key={ride._id}
                            onClick={() => navigate(`/ride/${ride._id}`)}
                            className="w-full text-left border border-gray-200 rounded-lg px-2 py-2 hover:bg-gray-50"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {ride.from} to {ride.to}
                            </p>
                            <p className="text-xs text-gray-600">
                              ₹{ride.pricePerSeat} per seat
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Route className="w-5 h-5 text-green-600" />
              Nearby Start Cities
            </h2>

            {loadingRides ? (
              <p className="text-gray-600">Fetching nearby rides...</p>
            ) : cityMarkers.length === 0 ? (
              <p className="text-gray-600">No nearby ride cities found for selected radius.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {cityMarkers.map((city) => (
                  <button
                    key={city.cityName}
                    onClick={() => {
                      if (city.rides.length === 1) {
                        navigate(`/ride/${city.rides[0]._id}`);
                      } else {
                        setActiveCity(city);
                      }
                    }}
                    className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {city.cityName}
                      </p>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                        {city.rides.length} rides
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Tap to view rides from this city
                    </p>
                  </button>
                ))}
              </div>
            )}

            {ridesByDistance.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Closest rides</h3>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {ridesByDistance.slice(0, 8).map((ride) => (
                    <button
                      key={ride._id}
                      onClick={() => navigate(`/ride/${ride._id}`)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{ride.from} to {ride.to}</p>
                      <p className="text-xs text-gray-600">
                        {Number(ride.distance).toFixed(1)} km away • {ride.seatsAvailable} seats • Rs. {ride.pricePerSeat}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyRides;
