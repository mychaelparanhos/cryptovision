# Project State — CryptoVision SaaS

Last updated: 2026-04-16

## 🎯 Current Task
Sprint 2 Expandida — COMPLETA. 20 stories implementadas, 108 testes passando.
3 commits: Parte A (6d1663d) → Parte B (313902f) → Parte C (37fe4e6). Pushed to GitHub.

**Próximo passo EXATO:** Deploy para produção (Vercel + Railway + Upstash + Stripe).

**CEO Plan Sprint 2:** ~/.gstack/projects/.../ceo-plans/2026-04-15-cryptovision-sprint2-expanded.md
**Briefing original:** docs/briefings/cryptovision/BRIEFING-Sprint2-Expandida.md
**Design Doc:** ~/.gstack/projects/mychaelparanhos-cryptovision/mychaelparanhos-main-design-2026-04-16-sprint2-expanded.md
**Test Plan:** ~/.gstack/projects/mychaelparanhos-cryptovision/mychaelparanhos-main-eng-review-test-plan-20260416-011436.md

## ✅ Reviews Concluídos
| Review | Status | Detalhes |
|--------|--------|---------|
| /plan-ceo-review | CLEARED | 6 propostas, 5 aceitas, 1 deferred (embeddable widget) |
| /plan-design-review | CLEARED | 5/10 → 8/10, 15 decisões de design, 7 passes |
| /design-consultation | DONE | DESIGN.md 430+ linhas, preview HTML gerada |
| /plan-eng-review (Sprint 1) | CLEARED | 7 issues, 4 ADRs adicionados (011-014), outside voice |
| @ux-design-expert | DONE | 7/10, 3 HIGH corrigidos, DESIGN.md 10/10, anti-slop 6/6 |
| /plan-ceo-review (Sprint 2) | CLEARED | SELECTIVE EXPANSION, 4 cherry-picks aceitos, 19 stories |
| /office-hours (Sprint 2) | DONE | Design doc + persona Leo + premissas + alternatives |
| /plan-eng-review (Sprint 2) | CLEARED | 11 issues, outside voice, full test coverage 38/38 |

## ✅ Documentos Produzidos
| Documento | Localização |
|-----------|-------------|
| CEO Plan | ~/.gstack/projects/.../ceo-plans/2026-04-14-cryptovision-saas.md |
| PRD | docs/prd/cryptovision/PRD-CryptoVision-SaaS.md |
| Arquitetura | docs/architecture/cryptovision/ARCHITECTURE.md (v1.1) |
| Design System | DESIGN.md (raiz do repo) |
| Copy Landing | docs/copy/cryptovision/landing-page-copy.md |
| UX Review | docs/qa/cryptovision/ux-review-landing-page.md |

## ✅ Sprint 0 — Scaffold (COMPLETO)
| Story | Título | Status |
|-------|--------|--------|
| S0-1 | Monorepo Scaffold + GitHub Repo | DONE |
| S0-2 | Supabase + Drizzle Schema + RLS | DONE |
| S0-3 | Stripe Webhook + PWA + Rate Limiter | DONE |
| S0-4 | Shared Types + Constants + ExchangeAdapter | DONE |
| S0-5 | BinanceAdapter v1 + Ingestion Pipeline | DONE |
| S0-6 | SSE Real-time Endpoints + Auth | DONE |

## ✅ Sprint 1 — Landing + Validation (COMPLETO)
| Story | Título | Status |
|-------|--------|--------|
| S1-1 | Landing Page (8 seções + UX fixes) | DONE |
| S1-2 | Public Screener (20 pares, sort, search) | DONE |
| S1-3 | SEO Pages /[symbol] + OG Images (20 ISR) | DONE |
| S1-4 | Waitlist + Email Capture (Resend) | DONE |
| S1-5 | Custom 404 + Sitemap + robots.txt | DONE |

## ⏳ Validation Gate
- **Meta:** 300+ waitlist signups em 14 dias
- **Status:** Não iniciado — aguardando deploy + lançamento
- **Se atingir:** Sprint 2a (Big 3 Pipeline)
- **Se não:** Reavaliar positioning

## 🔄 Sprints Futuros
| Sprint | Scope | Status |
|--------|-------|--------|
| 2a | Big 3 Pipeline (Bybit + OKX adapters) | PENDENTE (pós-gate) |
| 2b | Pipeline Polish + Status Page | PENDENTE |
| 3a | Auth + Billing + Dashboard Skeleton | PENDENTE |
| 3b | Full Dashboard Widget Suite | PENDENTE |
| 4a | Alert Engine + Telegram | PENDENTE |
| 4b | API + Discord Alerts | PENDENTE |
| 5 | Launch Prep (NOWPayments, Legal, v1.0) | PENDENTE |
| 6 | Buffer + Polish | PENDENTE |
| 7+ | Pro Tier (Confluence, AI Brief, Arb Scanner) | DEFERRED |

## 🏛️ Decisões Arquiteturais (14 ADRs)
| ADR | Decisão |
|-----|---------|
| 001 | Drizzle over Prisma (native Supabase compat) |
| 002 | ~~Supabase Realtime~~ → Substituído por ADR-011 |
| 003 | Monorepo Turborepo (pnpm workspaces) |
| 004 | pnpm workspaces (disk efficiency) |
| 005 | Tier gating em middleware (não RLS) |
| 006 | Monthly partitioning (não TimescaleDB) |
| 007 | API key SHA-256 hashing |
| 008 | Railway separados (ingestion vs alerts) |
| 009 | Canvas heatmap (não SVG/D3) |
| 010 | Batch inserts 1s buffer |
| 011 | SSE via Redis PUB/SUB no Railway (não Vercel serverless, não Supabase Realtime) |
| 012 | numeric/decimal para valores financeiros |
| 013 | 1s OHLCV candles na ingestão (6M→1.7M rows/dia) |
| 014 | ExchangeAdapter interface leve no Sprint 0 |

## 🌿 Git State
- **Repo:** mychaelparanhos/cryptovision (GitHub, público)
- **Branch:** main
- **Commits:** 16 total
- **Último commit:** feat: Sprint 2C complete — Entrega do Valor Pago (6 stories)

## 🔧 Infraestrutura
| Serviço | Status | Detalhes |
|---------|--------|---------|
| GitHub | ✅ Live | mychaelparanhos/cryptovision |
| Supabase | ✅ Live | ukwgzzeetdbekvhoklfv (us-east-1), Org CryptoVision |
| Vercel | ⬜ Pendente | Repo existe, precisa conectar |
| Railway | ⬜ Pendente | Projetos placeholder |
| Upstash Redis | ⬜ Pendente | Precisa criar instância |
| Stripe | ⬜ Test mode | Products/prices pendentes |
| Domínio | ⬜ Pendente | Não comprado |

## 📋 Eng Review Decisions (Sprint 2, 2026-04-16)
| # | Decision | Resolution |
|---|----------|------------|
| 1 | Stripe webhook idempotency | Redis event ID dedup (TTL 48h) → S2B-2 AC |
| 2 | Publisher cache keys | Per-exchange + aggregated keys |
| 3 | Middleware DRY | Single check against prefixes → S2B-1 |
| 4 | Migration strategy | 1 migration per Parte |
| 5 | Alert engine architecture | In-memory rule cache, 60s refresh |
| 6 | Middleware route protection | DRY fix → S2B-1 |
| 7 | Redis client singleton | Extract to lib/redis.ts |
| 8 | Test coverage | Full 38/38 paths, Vitest + Playwright |
| 9 | Redis MGET | Batch reads for dashboard |
| 10 | SSE real-time | Move to Railway (Vercel can't SUBSCRIBE) |
| 11 | Data partitioning | Monthly partitions in Parte A |

## ⚡ Próximo Passo Exato
1. Comprar domínio (cryptovision.io ou similar)
2. Conectar repo ao Vercel + configurar env vars
3. Criar Upstash Redis instance
4. Criar Sentry project
5. Iniciar Stripe business verification + criar products/prices
6. Criar Telegram bot (@CryptoVisionBot)
7. Configurar Resend com domínio próprio
8. Deploy production (Vercel web + Railway workers)
9. Thread de lançamento Crypto Twitter
10. Monitor 7-day organic interest

## 🚧 Blockers
- Nenhum blocker de código
- Infra precisa ser provisionada (Vercel, Upstash, Stripe products, Sentry, Telegram bot, domínio)
- Stripe business verification pode demorar 2-3 dias
- DATABASE_URL no .env precisa da senha correta pra conexão do app
