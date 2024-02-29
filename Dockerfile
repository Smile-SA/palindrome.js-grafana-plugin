FROM node:20-alpine
# WORKDIR /app/palindromeJsGrafana
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "run", "build"]
