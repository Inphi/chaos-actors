FROM node:16-alpine3.14

RUN apk --no-cache add ca-certificates bash
COPY *.json ./
RUN yarn install --frozen-lockfile && yarn cache clean
COPY . .

RUN yarn build

CMD ["npm", "run", "start"]
