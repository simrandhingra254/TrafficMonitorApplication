# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY flowsight-web/package*.json flowsight-web/
RUN cd flowsight-web && npm install
COPY flowsight-web/ flowsight-web/
RUN cd flowsight-web && npm run build

# ---- runtime stage (nginx) ----
FROM nginx:1.27-alpine AS runtime
COPY frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/flowsight-web/dist/flowsight-web/browser /usr/share/nginx/html
EXPOSE 80
