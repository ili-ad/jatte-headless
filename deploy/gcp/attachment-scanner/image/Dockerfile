# syntax=docker/dockerfile:1.7
# GoogleCloudPlatform/docker-clamav-malware-scanner, pinned for reproducibility.
ARG UPSTREAM_COMMIT=4e51c17b1db6adef5daaaf7caeff6cfe546f21bf

FROM alpine/git:2.47.2 AS source
ARG UPSTREAM_COMMIT
RUN git clone https://github.com/GoogleCloudPlatform/docker-clamav-malware-scanner.git /src \
    && git -C /src checkout --detach "${UPSTREAM_COMMIT}" \
    && test "$(git -C /src rev-parse HEAD)" = "${UPSTREAM_COMMIT}"
COPY jatte-server.ts /src/cloudrun-malware-scanner/server.ts

FROM node:24.18.0-alpine AS node
FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:alpine AS gcloud-cli
FROM node AS build
COPY --from=source /src/cloudrun-malware-scanner /app
WORKDIR /app
RUN npm ci && npm run build && npm ci --omit=dev

FROM clamav/clamav:1.5.3_base
ARG CVDUPDATE_VERSION=1.2.0
ENV PATH="$PATH:/opt/google-cloud-sdk/bin:/usr/local/bin:/root/.local/bin"
RUN mkdir -p /var/lib/clamav && rm -f /var/lib/clamav/*.cvd \
    && apk update && apk upgrade \
    && apk add bash ca-certificates curl gawk gettext-envsubst gnupg jq lsb-release \
      pipx py3-crcmod py3-pip python3 \
    && pipx install "cvdupdate==${CVDUPDATE_VERSION}"
COPY --from=node /usr/local /usr/local
COPY --from=gcloud-cli /google-cloud-sdk /opt/google-cloud-sdk
RUN /opt/google-cloud-sdk/install.sh --usage-reporting=false --command-completion=false --path-update=false --quiet \
    && /opt/google-cloud-sdk/bin/gcloud config set core/disable_usage_reporting true \
    && /opt/google-cloud-sdk/bin/gcloud config set component_manager/disable_update_check true
WORKDIR /app
COPY --from=build /app /app
CMD ["bash", "bootstrap.sh"]
HEALTHCHECK NONE
