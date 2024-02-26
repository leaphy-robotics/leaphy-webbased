# Pinned node version, 20.6.0 is buggy
FROM node:20.5.1 as builder

COPY . /build
WORKDIR /build

RUN yarn install --immutable && yarn build

FROM nginx:stable

COPY --from=builder /build/dist/ /usr/share/nginx/html
