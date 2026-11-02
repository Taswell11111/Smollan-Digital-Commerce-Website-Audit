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

5. **Simulated Cart & Checkout Journey**:
   - The cart and checkout journey browser worker simulation operates on client-side safety guardrails and does not complete live payment authorization or place real commercial orders. Explicit authorization confirmation is required from the user before execution.

6. **Network Environment Restrictions**:
   - Automated browser rendering and crawling depend on target storefront availability and outbound network connectivity. Firewalls or Web Application Firewalls (WAF) blocking automated user-agents may result in partial scan results or rate-limiting by the target domain.
