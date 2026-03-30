# Crosstraining Dockerfile for Zeabur
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy package files for dependency install
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Expose the PORT from environment (Zeabur sets this)
EXPOSE ${PORT:-8080}

# Start - serve the built dist folder on the PORT Zeabur provides (single page app mode)
CMD sh -c "serve -s dist -l $PORT -n"
