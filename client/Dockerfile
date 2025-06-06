FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
# VITE_ prefixes need to be known at build time. Pass these into "docker build" as parameters.
COPY --from=prod-deps app/node_modules node_modules
COPY --from=build app/build build
EXPOSE 3000
CMD [ "pnpm", "start" ]