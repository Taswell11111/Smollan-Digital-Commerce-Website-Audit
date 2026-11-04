# Known Limitations - Smollan Digital Commerce Intelligence Platform

This document outlines the known architectural and operational limitations of the current build.

1. **Synchronous Crawler & Execution**:
   - Web crawling and audit processing run synchronously within the HTTP request lifecycle or browser worker process. For large-scale multi-page deep audits (100+ pages), request durations may approach server timeout thresholds.

2. **No Persistent Job Queue**:
   - There is currently no distributed job queue (e.g. Redis/BullMQ) backing asynchronous audit execution. All crawls and worker renderings execute on demand.

3. **In-Memory Rate Limiting**:
   - API rate limiters utilize in-memory storage (`express-rate-limit`). Rate limit counters reset upon server restart and are not shared across multi-instance horizontal scaling without external Redis backing.

4. **Corpus Benchmarks Sample Size**:
   - Industry corpus benchmarks require a minimum threshold of 100 audited stores per platform and metric before percentile bands (p25, p50, p75) are displayed. Until this sample size is reached, benchmarks display "insufficient sample".

5. **Cart & Checkout Journey Not Implemented**:
   - The browser worker only evaluates the homepage. The `cart_path` scenario is accepted by the API but not executed, and audits report `cartJourneyRun: false` and `scenariosRun: ['home']`.
   - Collection and product-page rendering are likewise not run by the worker.

6. **Network Environment Restrictions**:
   - Automated browser rendering and crawling depend on target storefront availability and outbound network connectivity. Firewalls or Web Application Firewalls (WAF) blocking automated user-agents may result in partial scan results or rate-limiting by the target domain.

7. **Access control is a single shared token**:
   - When `API_TOKEN` is set, every `/api` route requires it, either as a bearer token or through a session cookie created at `POST /api/session`. Production refuses to start without `API_TOKEN`.
   - There are no per-user accounts, roles or audit trail. Anyone holding the token has full access.
   - Sessions are in memory, so a restart logs everyone out. Login attempts are rate limited per IP, and the limiter's counters are also in memory.
   - Rotate `API_TOKEN` if it is ever shared outside the team. Per-user accounts are needed before wider rollout.
