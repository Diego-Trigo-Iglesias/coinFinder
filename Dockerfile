FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Use npm install instead of npm ci because lockfile may be out of sync
# (ensures updated `serve` dependency from package.json is installed)
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4321

# Serve the built static output using the `serve` script (works with adapters)
CMD ["npm", "run", "serve:static"]