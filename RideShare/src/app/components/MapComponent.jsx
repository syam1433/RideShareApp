import { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

const GOOGLE_MAP_LIBRARIES = ["places", "geometry"];

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 16.3067, // Vijayawada coordinates
  lng: 80.4365,
};

const normalizeLatLng = (value) => {
  if (!value || typeof value !== "object") return null;

  const lat = Number(value.lat);
  const lng = Number(value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const MapComponent = ({
  from,
  to,
  className = "",
  showDirections = false,
  showUserLocation = true,
  pickupLocation,
  destinationLocation
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [directionsError, setDirectionsError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Enhanced geolocation with better error handling
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsLoadingLocation(false);

        // Center map on user location if no other locations specified
        if (map && !pickupLocation && !destinationLocation) {
          map.panTo(location);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsLoadingLocation(false);

        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
      },
      options
    );
  }, [map, pickupLocation, destinationLocation]);

  // Get location on component mount
  useEffect(() => {
    if (isLoaded && showUserLocation) {
      getCurrentLocation();
    }
  }, [isLoaded, showUserLocation, getCurrentLocation]);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Calculate directions with modern API
  const calculateRoute = useCallback(async () => {
    if (!window.google || !window.google.maps || !showDirections) return;

    const normalizedPickup = normalizeLatLng(pickupLocation);
    const normalizedDestination = normalizeLatLng(destinationLocation);
    const normalizedUserLocation = normalizeLatLng(userLocation);
    const hasAddressRoute = Boolean(from?.trim() && to?.trim());
    const hasCoordinateRoute = Boolean(normalizedPickup && normalizedDestination);

    const fallbackOrigin = normalizedPickup || normalizedUserLocation || from;
    const fallbackDestination = normalizedDestination || to;

    if (!hasAddressRoute && !hasCoordinateRoute && !(fallbackOrigin && fallbackDestination)) return;

    try {
      setDirectionsError(null);
      setRouteInfo(null);

      const directionsService = new window.google.maps.DirectionsService();

      const request = {
        origin: hasCoordinateRoute ? normalizedPickup : fallbackOrigin,
        destination: hasCoordinateRoute ? normalizedDestination : fallbackDestination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
        provideRouteAlternatives: false,
      };

      const result = await directionsService.route(request);
      setDirectionsResponse(result);

      // Extract route information
      if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          distanceValue: leg.distance.value, // in meters
          durationValue: leg.duration.value, // in seconds
        });
      }
    } catch (error) {
      console.error("Directions error:", error);
      setDirectionsResponse(null);
      setDirectionsError("Could not calculate road route for these locations.");
    }
  }, [from, to, pickupLocation, destinationLocation, showDirections, userLocation]);

  // Re-calculate route when dependencies change
  useEffect(() => {
    if (!isLoaded || !showDirections) return;
    calculateRoute();
  }, [isLoaded, showDirections, calculateRoute]);

  // Clear directions when locations change
  useEffect(() => {
    if (!showDirections) {
      setDirectionsResponse(null);
      setDirectionsError(null);
      setRouteInfo(null);
    }
  }, [showDirections]);

  // Keep route visible when explicit coordinates are available.
  useEffect(() => {
    if (!map || !pickupLocation || !destinationLocation || !window.google?.maps) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickupLocation);
    bounds.extend(destinationLocation);
    map.fitBounds(bounds, 60);
  }, [map, pickupLocation, destinationLocation]);

  // Determine map center
  const getMapCenter = () => {
    if (pickupLocation) return pickupLocation;
    if (userLocation) return userLocation;
    return defaultCenter;
  };

  // Custom markers
  const createMarkerIcon = (color) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
        <circle cx="20" cy="20" r="8" fill="white"/>
      </svg>
    `)}`,
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 40),
  });

  if (loadError) {
    return (
      <div
        className={`bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 rounded-xl flex items-center justify-center relative overflow-hidden ${className}`}
        style={containerStyle}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">
            Map Loading Error
          </h3>
          <p className="text-red-600">
            Failed to load Google Maps. Please check your internet connection and API key.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`bg-gradient-to-br from-green-100 via-emerald-100 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden ${className}`}
        style={containerStyle}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Route Info Display */}
      {routeInfo && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Distance: {routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Duration: {routeInfo.duration}</span>
              </div>
            </div>
            {showUserLocation && (
              <button
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoadingLocation ? "Getting location..." : "📍 My Location"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Location Error Display */}
      {locationError && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {locationError}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={getMapCenter()}
        zoom={userLocation ? 14 : 10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* User Location Marker */}
        {userLocation && showUserLocation && (
          <Marker
            position={userLocation}
            icon={createMarkerIcon("#4285F4")}
            title="Your Current Location"
          />
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            position={pickupLocation}
            icon={createMarkerIcon("#34A853")}
            title="Pickup Location"
          />
        )}

        {/* Destination Location Marker */}
        {destinationLocation && (
          <Marker
            position={destinationLocation}
            icon={createMarkerIcon("#EA4335")}
            title="Destination"
          />
        )}

        {/* Directions Renderer */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: false,
              preserveViewport: false,
              polylineOptions: {
                strokeColor: "#2563eb",
                strokeOpacity: 0.9,
                strokeWeight: 6,
              },
            }}
          />
        )}

        {/* Error Display */}
        {directionsError && (
          <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow">
            {directionsError}
          </div>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
