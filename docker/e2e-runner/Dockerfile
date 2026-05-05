FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /workspace

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CI=1

COPY docker/e2e-runner/package.json ./package.json
RUN npm install --no-fund --no-audit

COPY playwright.config.ts ./playwright.config.ts
COPY playwright.config.js ./playwright.config.js
COPY e2e ./e2e

ENTRYPOINT ["npx", "playwright", "test"]