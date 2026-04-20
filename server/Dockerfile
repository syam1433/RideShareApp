FROM node:20-bookworm-slim

# Install Python runtime and minimal system libs needed by OpenCV/Ultralytics on Debian.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

# Install Node dependencies first for better Docker layer caching.
COPY server/package*.json ./
RUN npm ci --omit=dev

# Install Python dependencies for the overloading model.
COPY python/Rideshare_Overloading_Detection/requirements.txt /app/python/Rideshare_Overloading_Detection/requirements.txt
RUN pip3 install --no-cache-dir -r /app/python/Rideshare_Overloading_Detection/requirements.txt

# Copy app source.
COPY server/ ./
COPY python/ /app/python/

# Ensure runtime folders exist for uploads/log outputs.
RUN mkdir -p /app/server/uploads/temp /app/python/Rideshare_Overloading_Detection/uploads /app/python/Rideshare_Overloading_Detection/output/logs /app/python/Rideshare_Overloading_Detection/output/results

ENV NODE_ENV=production
ENV PYTHON_BIN=python3

EXPOSE 10000
CMD ["npm", "start"]
