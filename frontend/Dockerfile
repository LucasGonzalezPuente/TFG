FROM node:20-slim

WORKDIR /app

# Install dependencies (cached layer unless package*.json changes)
COPY package.json package-lock.json ./
RUN npm install

# Source and node_modules are managed via bind-mount + anonymous volume in
# docker-compose.yml; this COPY only ensures the image works standalone.
COPY . .

# Expose Vite's default port and bind to all interfaces so it is reachable
# from the host machine.
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
