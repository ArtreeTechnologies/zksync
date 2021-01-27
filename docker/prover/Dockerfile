# syntax=docker/dockerfile:experimental
FROM rust:1.45 as builder
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo install sccache
WORKDIR /usr/src/zksync
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/root/.cache/sccache \
    RUSTC_WRAPPER=/usr/local/cargo/bin/sccache \
    cargo build --release

FROM debian:buster-slim
RUN apt-get update && apt-get install -y axel ca-certificates && rm -rf /var/lib/apt/lists/*
# Docs of env variables used for this image
# to test this locally just run
# docker build -t tmp_prover -f =(f envsubst < ./docker/prover/Dockerfile) .; docker run --rm  tmp_prover:latest
ENV SUPPORTED_BLOCK_CHUNKS_SIZES 6,30,74,150,320,630
ENV SUPPORTED_BLOCK_CHUNKS_SIZES_SETUP_POWERS 21,22,23,24,25,26
ENV BLOCK_CHUNK_SIZES 6,30
ENV KEY_DIR keys/plonk-975ae851
ENV ACCOUNT_TREE_DEPTH 32
ENV BALANCE_TREE_DEPTH 11
ENV PROVER_SERVER_URL http://operator:8088
ENV REQ_SERVER_TIMEOUT 10
ENV RUST_BACKTRACE 1
ENV RUST_LOG "zksync_api=debug,zksync_core=debug,zksync_eth_sender=debug,zksync_witness_generator=debug,zksync_server=debug,zksync_prover=debug,dummy_prover=info,key_generator=info,zksync_data_restore=info,zksync_eth_client=info,zksync_storage=info,zksync_state=info,zksync_types=info,exodus_test=info,loadtest=info,kube=debug,dev_ticker=info,block_sizes_test=info,zksync_config=debug"
ENV PROVER_DOWNLOAD_SETUP false
ENV PROVER_SETUP_NETWORK_DIR "-"
ENV PROVER_PREPARE_DATA_INTERVAL 500
ENV PROVER_HEARTBEAT_INTERVAL 1000
ENV PROVER_CYCLE_WAIT 500
ENV PROVER_GONE_TIMEOUT 60000
ENV DOCKER_DUMMY_PROVER false
COPY --from=builder /usr/src/zksync/target/release/plonk_step_by_step_prover /bin/
COPY --from=builder /usr/src/zksync/target/release/dummy_prover /bin/
COPY docker/prover/prover-entry.sh /bin/
COPY keys/packed /keys/packed

CMD ["prover-entry.sh"]
