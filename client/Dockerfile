FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base as source
COPY . /app
WORKDIR /app

FROM source AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM source AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=source app/package.json package.json
COPY --from=prod-deps app/node_modules node_modules
COPY --from=build app/build build
EXPOSE 3000
CMD [ "pnpm", "start" ]