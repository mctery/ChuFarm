FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3000

CMD ["node", "server.js"]
