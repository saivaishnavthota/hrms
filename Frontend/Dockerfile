# Frontend Dockerfile
FROM node:22-alpine as build

WORKDIR /app
COPY package*.json ./

# Install dependencies ignoring peer conflicts
RUN npm install --legacy-peer-deps

COPY . .

# Build React app with Vite
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
