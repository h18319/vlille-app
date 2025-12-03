# apps/web/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# 1) dépendances
COPY package*.json ./
RUN npm install

# 2) code
COPY . .

# build Next en mode prod
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Next démarre en prod sur le port 3000
CMD ["npm", "start"]