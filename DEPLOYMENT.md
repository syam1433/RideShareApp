# RideShare Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the RideShare application, including frontend, backend, database, and AI components.

## Prerequisites

### System Requirements
- Node.js 18+ and npm
- Python 3.8+ with pip
- MongoDB 5.0+
- Git
- SSL certificate (for production)

### Environment Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd RideShare
```

2. Install dependencies for all components:
```bash
# Frontend
cd RideShare
npm install

# Backend
cd ../server
npm install

# Python AI Service
cd python/Rideshare_Overloading_Detection
pip install -r requirements.txt
```

## Environment Configuration

### Backend Environment Variables (.env)
Create `.env` file in the server directory:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/rideshare
JWT_SECRET=your-super-secure-jwt-secret-here
CLIENT_URL=https://yourdomain.com
OTP_SERVICE_API_KEY=your-otp-service-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Frontend Environment Variables
Create `.env` file in the RideShare directory:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Database Setup

### MongoDB Configuration
1. Install MongoDB locally or use MongoDB Atlas
2. Create database indexes (automatically handled by the application)
3. Enable authentication in production

### Database Migration
The application automatically creates necessary indexes on startup. For production:
```bash
# Connect to MongoDB
mongosh
use rideshare

# Create indexes manually if needed
db.rides.createIndex({ "pickupLocation": "2dsphere" })
db.rides.createIndex({ "destinationLocation": "2dsphere" })
```

## AI Model Setup

### YOLO Overloading Detection
1. Download YOLOv8 model:
```bash
cd server/python/Rideshare_Overloading_Detection
# yolov8n.pt is already included in the repository
```

2. Test the model:
```bash
python main.py test_image.jpg 4
```

## Build Process

### Frontend Build
```bash
cd RideShare
npm run build
```

### Backend Build
```bash
cd ../server
npm run build  # if using TypeScript
```

## Deployment Options

### Option 1: Single Server Deployment (Recommended for small scale)

#### Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'rideshare-backend',
      script: 'server/src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'rideshare-frontend',
      script: 'serve',
      args: 'RideShare/dist -s -l 3000',
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
EOF

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Using Docker
```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]

# Docker Compose
version: '3.8'
services:
  rideshare-backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb

  rideshare-frontend:
    build: ./RideShare
    ports:
      - "3000:80"

  mongodb:
    image: mongo:5.0
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### Option 2: Cloud Deployment

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd RideShare
vercel --prod
```

#### Railway/Heroku (Backend + Database)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

#### AWS EC2 Deployment
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2
sudo npm install -g pm2

# Clone and setup application
git clone <repository-url>
cd RideShare

# Setup backend
cd server
npm install
cp .env.example .env
# Edit .env with production values

# Setup frontend
cd ../RideShare
npm install
npm run build

# Start services
pm2 start ecosystem.config.js
sudo systemctl start mongod
```

## Nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/rideshare
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /uploads/ {
        alias /path/to/server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Monitoring and Maintenance

### Health Checks
```javascript
// Add to backend routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Log Management
```bash
# PM2 logs
pm2 logs

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Application logs
tail -f /path/to/logs/app.log
```

### Backup Strategy
```bash
# Database backup
mongodump --db rideshare --out /path/to/backup/$(date +%Y%m%d)

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /path/to/uploads/
```

## Security Considerations

### Environment Variables
- Never commit `.env` files
- Use strong, unique secrets
- Rotate keys regularly

### Network Security
- Use HTTPS everywhere
- Configure firewall rules
- Implement rate limiting
- Use security headers

### Data Protection
- Encrypt sensitive data
- Implement proper authentication
- Regular security audits
- GDPR/CCPA compliance

## Performance Optimization

### Database
- Connection pooling
- Query optimization
- Index monitoring
- Read/write separation (if needed)

### Application
- Compression middleware
- Caching layers
- CDN for static assets
- Horizontal scaling

### Monitoring
- Response times
- Error rates
- Resource usage
- User metrics

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Check connection string
   - Verify network access
   - Check MongoDB logs

2. **Socket.io Connection Problems**
   - Verify CORS settings
   - Check firewall rules
   - Confirm WebSocket support

3. **AI Model Failures**
   - Verify Python dependencies
   - Check model file integrity
   - Monitor memory usage

4. **Build Failures**
   - Clear node_modules and rebuild
   - Check Node.js version
   - Verify environment variables

### Support
For additional support, check:
- Application logs
- MongoDB logs
- System resource usage
- Network connectivity

## Update Process

1. Backup current deployment
2. Pull latest changes
3. Install dependencies
4. Run database migrations
5. Build and restart services
6. Monitor for issues
7. Rollback if necessary

---

*Last updated: $(date)*</content>
<parameter name="filePath">c:\Users\shyam\OneDrive\Desktop\RideShareMain\DEPLOYMENT.md