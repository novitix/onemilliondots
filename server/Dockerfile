FROM golang:1.24.2-alpine AS build

WORKDIR /
COPY . .
RUN CGO_ENABLED=0 go build -o server main.go

# FROM build as dev-envs

# RUN <<EOF
# apt-get update
# apt-get install -y --no-install-recommends git
# EOF

# RUN <<EOF
# useradd -s /bin/bash -m vscode
# groupadd docker
# usermod -aG docker vscode
# EOF
# install Docker tools (cli, buildx, compose)
# COPY --from=gloursdocker/docker / /
FROM scratch
WORKDIR /
COPY --from=build server server
EXPOSE 80
ENTRYPOINT [ "./server" ]

# FROM scratch
# COPY --from=build /compose/hello-docker/backend /usr/local/bin/backend
# CMD ["/usr/local/bin/backend"]