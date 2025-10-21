# ---------- Build Stage ----------
FROM node:22-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_API_BASE_URL
ARG VITE_ENTRA_ENABLED

# Set them as environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ENTRA_ENABLED=${VITE_ENTRA_ENABLED}

RUN npm run build

# ---------- Serve with Nginx ----------
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]