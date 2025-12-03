# apps/api/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# 1) dépendances
COPY package*.json ./
RUN npm install

# 2) code
COPY . .

# 3) build TypeScript :
RUN npm run build

# 4) on enlève les devDependencies après build
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# start
CMD ["npm", "run", "start"]