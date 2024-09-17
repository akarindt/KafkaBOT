# Use node latest image
FROM node:20

# Install Python3 and other build dependencies
RUN apt-get update
RUN apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg

# Remove package manager cache 
RUN rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/KafkaBOT

# Copy the project files into the container
COPY . .

# Install project dependencies
RUN npm install && npm install -g tsx

# Run migrations and build the project
RUN npm run build

# Run application
RUN chmod +x ./extra/script/entrypoint.sh
CMD ["./extra/script/entrypoint.sh"]
