# Build stage
FROM node:20 AS build
# Install Python3 and other build dependencies
RUN apt-get update
RUN apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg

# Remove package manager cache 
RUN rm -rf /var/lib/apt/lists/*

# Set the temp directory
WORKDIR /tmp/app

# Move source files
COPY . .

# Update npm 
RUN npm install -g npm@latest

# Install project dependencies
RUN npm install && npm install -g tsx

# Run migrations and build the project
RUN npm run build

# Main stage
FROM node:lts-alpine AS main

# Install dependencies
ENV PYTHONUNBUFFERED=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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

# Copy package.json from build
COPY --from=build /tmp/app/package.json /app/package.json

# Update npm
RUN npm install -g npm@latest

# Install dependencies
RUN npm install --omit=dev

# Move build files
COPY --from=build /tmp/app/build /app/build

# Copy other files
COPY --from=build /tmp/app/extra /app/extra
COPY --from=build /tmp/app /app/backup

# Run application
RUN chmod +x ./extra/script/entrypoint.sh
CMD ["./extra/script/entrypoint.sh"]