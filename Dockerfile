FROM node:16-alpine3.14

RUN apk --no-cache add \
  bash \
  python3 \
  ca-certificates \
  git \
  make \
  gcc \
  musl-dev \
  linux-headers \
  bash \
  build-base \
  gcompat

COPY *.json ./
RUN yarn install --frozen-lockfile && yarn cache clean
COPY . .

RUN yarn build

CMD ["npm", "run", "start"]
