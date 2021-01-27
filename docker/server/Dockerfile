# syntax=docker/dockerfile:experimental
FROM rust:1.45
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo install sccache
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/root/.cache/sccache \
    RUSTC_WRAPPER=/usr/local/cargo/bin/sccache \
    cargo build --bin zksync_server --release
RUN apt-get update && apt-get install -y libpq5 ca-certificates postgresql && rm -rf /var/lib/apt/lists/*
EXPOSE 3000
EXPOSE 3031
EXPOSE 3030
EXPOSE 8088
COPY docker/server/ .
RUN touch /etc/tokens/localhost.json
RUN echo "[]" > /etc/tokens/localhost.json
ENV POSTGRES_PASSWORD=password
ENTRYPOINT ["sh", "wait_postgres.sh", "postgres", "sh", "start.sh"]
