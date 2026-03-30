# Crosstraining Dockerfile for Zeabur
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port (Zeabur expects 3000)
EXPOSE 3000

# Install serve globally and use it
RUN npm install -g serve

# Start - serve the built dist folder
CMD ["serve", "-s", "dist", "-l", "3000"]
