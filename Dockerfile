# Build stage
FROM node:latest AS build

# Install Python3 and other build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ ffmpeg && \
    rm -rf /var/lib/apt/lists/*  # Clean up apt cache in the same layer to reduce image size

# Set the temp directory
WORKDIR /tmp/app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Update npm and install project dependencies
RUN npm install -g npm@latest

RUN npm install typescript tsc-alias -g

RUN npm install 

# Copy the rest of the project files
COPY . .

# Run migrations and build the project
RUN npm run build

# Main stage
FROM node:lts-alpine AS main

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install dependencies in one step to minimize layers
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    ffmpeg \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    fontconfig \
    curl

# Set work directory
WORKDIR /app

# Copy package.json and install only production dependencies
COPY --from=build /tmp/app/package.json ./
RUN npm install --omit=dev

# Copy the built files and other necessary files from build stage
COPY --from=build /tmp/app/build ./build
COPY --from=build /tmp/app/extra ./extra
COPY --from=build /tmp/app /app/backup

# Ensure script has execution permissions and run the application
RUN chmod +x ./extra/script/entrypoint.sh
CMD ["./extra/script/entrypoint.sh"]
