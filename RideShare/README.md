# RideShare Connect 🚗

A modern, safety-focused carpooling application built with React, featuring AI-powered helmet detection and vehicle overload prevention.

## ✨ Features

### 🔐 User Authentication
- Dual role system (User & Driver)
- Fake authentication with local storage persistence
- Protected routes with role-based access control

### 👥 User Features
- Search and book rides
- View upcoming and past rides
- Real-time ride tracking (UI simulation)
- Safety score and eco-impact tracking
- Wallet and payment management (UI)

### 🚙 Driver Features
- Post new rides with route and pricing
- Vehicle verification and document management
- AI safety compliance dashboard
- Earnings and ride history tracking
- Safety score monitoring (helmet & overload detection)

### 🛡️ Safety Features
- AI-powered helmet compliance verification
- Vehicle overload detection
- Live GPS tracking simulation
- Emergency SOS button
- Trip sharing with emergency contacts

### 🎨 UI/UX
- Modern, clean design with Tailwind CSS
- Responsive mobile-first layout
- Dark/Light theme ready
- Interactive components with smooth transitions
- Toast notifications for user feedback

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── DashboardLayout.jsx    # Layout wrapper for dashboard pages
│   │   ├── MapPlaceholder.jsx     # Google Maps placeholder component
│   │   ├── Navbar.jsx             # Main navigation bar
│   │   ├── ProfileCard.jsx        # Reusable profile card
│   │   ├── ProtectedRoute.jsx     # Route guard component
│   │   ├── RideCard.jsx           # Ride listing card
│   │   ├── SafetyStatus.jsx       # Safety compliance widget
│   │   └── Sidebar.jsx            # Dashboard sidebar navigation
│   ├── pages/
│   │   ├── Home.jsx               # Landing page
│   │   ├── Login.jsx              # Login page
│   │   ├── Register.jsx           # Registration page
│   │   ├── UserDashboard.jsx      # User dashboard
│   │   ├── DriverDashboard.jsx    # Driver dashboard
│   │   ├── FindRide.jsx           # Search rides page
│   │   ├── PostRide.jsx           # Create ride page (driver)
│   │   ├── RideDetails.jsx        # Single ride details
│   │   ├── ActiveRide.jsx         # Live ride tracking
│   │   └── Profile.jsx            # User/driver profile
│   ├── context/
│   │   └── AuthContext.jsx        # Authentication context
│   ├── data/
│   │   └── mockData.js            # Mock data for rides, users, etc.
│   ├── App.jsx                    # Main app component
│   └── routes.js                  # Route configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rideshare-connect
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Start development server
```bash
npm run dev
# or
pnpm dev
```

4. Open browser
Navigate to `http://localhost:5173`

## 🔑 Demo Credentials

### User Account
- Email: `user@example.com`
- Password: Any password

### Driver Account
- Email: `driver@example.com`
- Password: Any password

> **Note:** Any email containing "driver" will be registered/logged in as a driver, otherwise as a regular user.

## 🛠️ Technologies Used

- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **date-fns** - Date formatting
- **Vite** - Build tool

## 📱 Key Pages

### Landing Page (`/`)
- Hero section with value proposition
- Features grid (6 key features)
- How it works (4 steps)
- Team section
- CTA sections

### Authentication
- `/login` - User login
- `/register` - User registration with role selection

### User Routes
- `/dashboard` - User dashboard with stats
- `/find-ride` - Search and browse rides
- `/ride/:id` - View ride details
- `/active-ride/:id` - Track ongoing ride
- `/profile` - User profile

### Driver Routes
- `/driver-dashboard` - Driver dashboard with earnings
- `/post-ride` - Create new ride
- `/profile` - Driver profile with vehicle info

## 🎨 Design System

### Colors
- **Primary Green**: `#10b981` (green-500)
- **Secondary Emerald**: `#059669` (emerald-600)
- **Success**: Green shades
- **Danger**: Red shades
- **Warning**: Yellow/Orange shades

### Key Components
All components are responsive and include hover states, loading states, and error handling.

## 🔒 Security Features

- Client-side route protection
- Role-based access control
- Form validation
- Mock authentication (ready for backend integration)

## 🌐 Backend Integration Ready

The app is structured to easily integrate with a backend:
- All API calls are centralized in mock data
- Replace mock functions with actual API endpoints
- Authentication context ready for JWT tokens
- Form submissions ready for POST requests

## 👥 Team

- **P.Durga Syamalarao** (22P31A05H2) - Full Stack Developer
- **B.Gopalakrishna** (22P31A05E6) - -  AI/ML Engineer
- **M.Victor Richards** (22P31A05G8) - Backend Developer
- **Summit Kumar Gupta** (22P31A05I7) - Frontend Developer

## 📄 License

This project is created for educational purposes.

## 🔮 Future Enhancements

- Real backend integration (Node.js + Express + MongoDB)
- Actual Google Maps integration
- Real-time chat functionality
- Payment gateway integration
- Push notifications
- Advanced AI safety verification
- Mobile app (React Native)

---

Built with ❤️ by the RideShare Connect Team
