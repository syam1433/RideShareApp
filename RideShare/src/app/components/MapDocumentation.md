# Map Component Documentation

## Overview
The RideShare app uses Google Maps to display ride locations, routes, and directions through the `MapComponent.jsx`.

## How It Works

### 1. Google Maps Integration
- Uses `@react-google-maps/api` library for React integration
- Loads Google Maps JavaScript API dynamically
- Requires a valid Google Maps API key

### 2. API Key Configuration
- Set `VITE_GOOGLE_MAPS_API_KEY` in the frontend `.env` file
- The key should have the following APIs enabled:
  - Maps JavaScript API
  - Directions API (for route calculation)
  - Places API (optional, for location search)

### 3. Component Features
- **Default View**: Shows Vijayawada, India as center (lat: 16.3067, lng: 80.4365)
- **Directions**: Calculates and displays driving routes between pickup and destination
- **Markers**: Shows start/end points on the map
- **Error Handling**: Displays user-friendly error messages if map fails to load

### 4. Props
- `from`: Starting location string
- `to`: Destination location string
- `className`: CSS classes for styling
- `showDirections`: Boolean to enable/disable route calculation

### 5. Troubleshooting Map Issues

#### Common Problems:
1. **Map not loading**: Check if API key is set correctly in `.env`
2. **Directions not showing**: Ensure `from` and `to` props are valid location strings
3. **API errors**: Verify Google Cloud Console has required APIs enabled

#### API Key Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Maps JavaScript API and Directions API
4. Create credentials (API key)
5. Restrict the key to your domain for security

#### Testing the Map:
- The map should load with a default center
- When `showDirections=true` and valid locations provided, routes should appear
- Check browser console for any JavaScript errors

### 6. Usage Examples
```jsx
// Basic map
<MapComponent />

// Map with directions
<MapComponent from="Vijayawada" to="Hyderabad" showDirections={true} />
```

### 7. Performance Notes
- Map loads asynchronously to avoid blocking page render
- Directions are calculated only when needed
- Error states provide fallback UI</content>
<parameter name="filePath">c:\Users\shyam\OneDrive\Desktop\RideShareMain\RideShare\src\app\components\MapDocumentation.md