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

# Expose port
EXPOSE 3000

# Start (serve built frontend)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
