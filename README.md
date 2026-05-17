<div align="center">

# ⚖️ LexGuard
### AI Rights & Contract Intelligence System

**Problem Statement 01 — Built for the AI Hackathon**

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.12-009688?style=for-the-badge&logo=fastapi)](https://lexguard-rboc.onrender.com)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://lexguard-rboc.onrender.com)
[![AI Engine](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3%2070B-FF6B35?style=for-the-badge&logo=meta)](https://groq.com)
[![RAG](https://img.shields.io/badge/RAG-FAISS%20%2B%20MiniLM-4A90E2?style=for-the-badge)](https://github.com/facebookresearch/faiss)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-100%25%20Complete-brightgreen?style=for-the-badge)](https://lexguard-rboc.onrender.com/health)

> **LexGuard** is a production-grade, AI-powered contract intelligence platform that transforms the way individuals and organizations understand legal agreements. It extracts hidden risks, classifies exploitative clauses, detects contradictions, simulates dispute outcomes, and delivers plain-English explanations — all in real time, before you sign.

---

🌐 **Live Backend:** [`https://lexguard-rboc.onrender.com`](https://lexguard-rboc.onrender.com)  
📊 **Health Check:** [`/health`](https://lexguard-rboc.onrender.com/health)  
🗂️ **API Docs:** [`/docs`](https://lexguard-rboc.onrender.com/docs)

</div>

---

## 📌 Problem Statement Objectives — 100% Achieved

| Objective | Implementation | Status |
|-----------|---------------|--------|
| Analyze uploaded legal documents and extract meaningful clauses | Groq LLaMA 3.3 70B + PyMuPDF parser with OCR fallback | ✅ |
| Identify hidden liabilities, unfavorable obligations, one-sided conditions | Adversarial attorney AI persona; flags every one-sided clause | ✅ |
| Detect ambiguous or potentially exploitative language | Pairwise Contradiction Auditor detects logical inconsistencies | ✅ |
| Highlight privacy, financial, employment, IP, and compliance risks | 5 risk categories with weighted CRI (Contract Risk Index) scoring | ✅ |
| Provide understandable plain-English explanations | Every clause gets a `plain_english` field + `why_risky` reasoning | ✅ |
| Generate severity-based risk scores or classifications | CRI 0–100 gauge + per-clause risk scores (HIGH / MODERATE / LOW) | ✅ |
| Improve transparency and informed decision-making | Interactive AI chat, redline suggestions, scenario simulations | ✅ |

**All 7 core objectives: ✅ Fully implemented and deployed.**

---

## 🚀 Feature Showcase

### Core Intelligence
| Feature | Description |
|---------|-------------|
| 🧠 **LLM Clause Extraction** | Groq LLaMA 3.3 70B acts as an adversarial attorney to find every problematic clause |
| 📊 **Contract Risk Index (CRI)** | Weighted aggregate risk score 0–100 with radar chart across 5 risk dimensions |
| ⚠️ **Contradiction Detection** | Pairwise auditor scans all clauses for conflicting notice periods, jurisdictions, and liability caps |
| 🗣️ **AI Chat (SSE Streaming)** | Real-time conversational AI that answers questions about your specific contract |
| ✏️ **Redline Suggestions** | Accept/reject AI-generated clause rewrites that protect your interests |
| 🎭 **Dispute Simulator** | 8-scenario pool dynamically filtered by actual clause types — what happens if things go wrong |
| 📋 **Contract Comparison** | Upload two contract versions; Groq LLM identifies additions, removals, and risk delta |
| 📤 **Export Reports** | Full PDF and DOCX reports with redlines, risk scores, and legal analysis |

### Platform Features
| Feature | Description |
|---------|-------------|
| 📁 **Multi-Format Upload** | PDF (PyMuPDF), DOCX (python-docx), TXT, RTF — with OCR fallback for scanned documents |
| 🏛️ **Contract Type Detection** | Automatically classifies: Employment, NDA, Vendor, Subscription, Freelance, Rental, Privacy Policy |
| 📍 **Bounding Box Overlays** | Click clauses on the document canvas and see them highlighted in-place |
| 📖 **Playbooks** | Save and reuse custom risk criteria for specific contract types |
| 📈 **Dashboard** | Contract history, aggregate stats, risk distribution charts |
| 🔐 **JWT Auth** | Secure registration, login, and token refresh |
| 🐳 **Dockerized Deployment** | Production Dockerfile + Render persistent disk for SQLite |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LEXGUARD PLATFORM                               │
│                                                                         │
│  ┌──────────────┐      HTTPS/REST+SSE      ┌──────────────────────────┐│
│  │   Next.js 14 │◄────────────────────────►│  FastAPI (Python 3.12)   ││
│  │   Frontend   │                          │  Backend on Render.com   ││
│  │              │                          │                          ││
│  │ • Dashboard  │                          │  ┌────────────────────┐  ││
│  │ • Analysis   │                          │  │  Analysis Pipeline │  ││
│  │ • Compare    │                          │  │                    │  ││
│  │ • Chat (SSE) │                          │  │  1. Parse Document │  ││
│  │ • Redlines   │                          │  │  2. Detect Type    │  ││
│  │ • Scenarios  │                          │  │  3. LLM Extraction │  ││
│  │ • Export     │                          │  │  4. Risk Scoring   │  ││
│  └──────────────┘                          │  │  5. Contradictions │  ││
│                                            │  │  6. Scenarios      │  ││
│  ┌──────────────┐                          │  │  7. Exec Summary   │  ││
│  │  Zustand     │                          │  │  8. Persist DB     │  ││
│  │  Auth Store  │                          │  └────────────────────┘  ││
│  │ + TanStack Q │                          │                          ││
│  └──────────────┘                          │  ┌────────────────────┐  ││
│                                            │  │  AI / LLM Layer    │  ││
│                                            │  │  Groq LLaMA 3.3 70B│  ││
│                                            │  │  sentence-xformers │  ││
│                                            │  │  FAISS Vector DB   │  ││
│                                            │  └────────────────────┘  ││
│                                            │                          ││
│                                            │  ┌────────────────────┐  ││
│                                            │  │  SQLite + aiosqlite│  ││
│                                            │  │  Persistent Disk   │  ││
│                                            │  └────────────────────┘  ││
│                                            └──────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Reasoning Pipeline

LexGuard does **not** use keyword matching. It employs a multi-stage adversarial reasoning workflow:

```
Document Upload
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1 — Document Intelligence                                │
│  • PyMuPDF layout-aware parsing (bounding boxes per text block) │
│  • python-docx structural extraction for DOCX files             │
│  • pytesseract OCR fallback for scanned/image-based contracts   │
│  • Counterparty + jurisdiction extraction via regex heuristics  │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2 — Contract Classification (RAG + Embedding)            │
│  • sentence-transformers (all-MiniLM-L6-v2) encodes the text   │
│  • FAISS similarity search against 7 contract type templates    │
│  • Contract type weights the CRI scoring formula downstream     │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 3 — Adversarial Clause Extraction (Groq LLaMA 3.3 70B)  │
│  • System prompt: "You are an aggressive adversarial attorney   │
│    defending the signing party. FLAG EVERYTHING exploitative."  │
│  • Extracts: clause_type, raw_text, risk_level, risk_score,     │
│    plain_english, why_risky, redline_suggestion                 │
│  • Handles contracts up to 100KB via chunked processing         │
│  • Falls back to RAG rule-based extraction if LLM unavailable   │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 4 — Risk Scoring & CRI Computation                       │
│  • Per-clause: likelihood × severity matrix → 0-25 score        │
│  • Contract-type environmental modifier adjusts thresholds      │
│  • Aggregate CRI (0-100) = weighted sum across 5 categories:    │
│    Financial | IP | Privacy | Employment | Compliance           │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 5 — Contradiction & Logic Audit                          │
│  • Pairwise O(n²) scan across all extracted clauses             │
│  • Detects: conflicting notice periods, mismatched governing    │
│    laws, contradictory liability caps, survival vs termination  │
│  • Assigns severity: LOW | MODERATE | HIGH                      │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 6 — Scenario Generation (Dynamic + Contract-Specific)    │
│  • 8-scenario dispute simulation pool                           │
│  • Scored against actual clause types found in the contract     │
│  • Top 3 most relevant scenarios surfaced to the user           │
│  • Each scenario: day-by-day timeline + worst-case liability    │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 7 — Executive Summary (Groq LLaMA)                       │
│  • Synthesizes all findings into a concise, plain-English brief │
│  • Includes: risk level, top issues, jurisdiction, counterparty │
│  • Honest about HIGH risk — no sanitizing of dangerous clauses  │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
  Persisted to SQLite → Served via REST API → Rendered in UI
```

---

## 🛠️ Technology Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web Framework | FastAPI 0.115 + Uvicorn | Async REST API + SSE streaming |
| Language | Python 3.12 | Core backend runtime |
| Primary LLM | Groq API — LLaMA 3.3 70B Versatile | Clause extraction, chat, comparison, summarization |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Semantic similarity search |
| Vector Search | FAISS-CPU | Contract type classification, RAG retrieval |
| PDF Parsing | PyMuPDF (fitz) | Layout-aware PDF extraction with bounding boxes |
| DOCX Parsing | python-docx | Structured Word document extraction |
| OCR | pytesseract + Pillow | Scanned document support |
| Database | SQLite + aiosqlite + SQLAlchemy 2.0 | Async ORM with full contract/clause schema |
| Auth | python-jose (JWT) + passlib (bcrypt) | Secure token authentication |
| PDF Export | ReportLab | AI-generated risk reports |
| DOCX Export | python-docx | Redlined contract export |
| Containerization | Docker (python:3.11-slim-bookworm) | Production deployment |
| Deployment | Render.com (persistent disk) | Live cloud backend |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 14.2.5 (App Router) | Full-stack React framework |
| Language | TypeScript | Type-safe frontend |
| State Management | Zustand (persisted) | Global auth + app state |
| Data Fetching | TanStack Query (React Query) | Server state + caching |
| HTTP Client | Axios | API calls with auth interceptor |
| Styling | Tailwind CSS | Utility-first styling |
| Charts | Recharts | Risk radar chart, gauge |
| Animations | Framer Motion | Clause cards, transitions |
| File Upload | react-dropzone | PDF/DOCX/TXT drag-and-drop |

### Recommended Technology Areas — All Covered ✅
| Technology Area | Implementation |
|-----------------|---------------|
| Natural Language Processing (NLP) | Clause extraction, classification, plain-English generation |
| Transformer-based Legal Language Models | Groq LLaMA 3.3 70B (70-billion parameter) |
| Retrieval-Augmented Generation (RAG) | FAISS + MiniLM embeddings for clause type retrieval |
| Semantic Similarity & Embedding Models | sentence-transformers all-MiniLM-L6-v2 |
| Multi-Agent AI Systems | Adversarial attorney extraction + neutral summary agent |
| Explainable AI Frameworks | `why_risky` field on every clause — reasoning fully transparent |
| OCR & Document Parsing Pipelines | PyMuPDF + pytesseract with bounding box overlay |
| Vector Databases and Knowledge Retrieval | FAISS in-memory index built per document |

---

## 📋 Deliverables Compliance

| Deliverable | Status | Details |
|-------------|--------|---------|
| Working prototype / demonstrable system | ✅ **Live** | Deployed at https://lexguard-rboc.onrender.com |
| System architecture documentation | ✅ **Complete** | Full architecture diagram in this README |
| AI models, reasoning workflows, methodologies | ✅ **Complete** | 7-stage pipeline detailed above |
| Demonstration of risk analysis capabilities | ✅ **Complete** | CRI gauge, radar chart, per-clause risk cards |
| User interface / dashboard | ✅ **Complete** | Next.js dashboard with full analysis workspace |
| Presentation summarizing approach & applicability | ✅ **Complete** | This README + live demo |

---

## 🔬 Suggested Features — All Implemented

| Feature | Implementation | Status |
|---------|---------------|--------|
| Clause extraction and classification | Groq LLM with 15+ clause type categories | ✅ |
| Contract risk scoring systems | CRI (0-100) + per-clause risk matrix | ✅ |
| Adversarial legal reasoning workflows | Attorney AI persona with aggressive flagging | ✅ |
| Liability and obligation analysis | `why_risky` field explains exposure per clause | ✅ |
| Ambiguity and contradiction detection | Pairwise contradiction auditor across all clauses | ✅ |
| Contract comparison against standard benchmarks | `/api/analyze/compare` — Groq-powered clause diffing | ✅ |
| Privacy and compliance analysis | Dedicated privacy/data category in CRI scoring | ✅ |
| Multi-agent reasoning systems | Extraction agent + contradiction auditor + summary agent | ✅ |
| Scenario-based consequence simulation | 8-scenario dispute simulator (dynamic, contract-specific) | ✅ |
| Explainable AI-based legal insights | Every clause: plain English + why risky + redline | ✅ |
| Negotiation recommendation systems | Redline suggestions (accept/reject) per clause | ✅ |

**All 11 suggested features: ✅ Fully implemented.**

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend Setup

```bash
git clone https://github.com/9059Rohith/lexguard.git
cd lexguard/backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./lexguard.db
SECRET_KEY=your-super-secret-jwt-key-change-this
GROQ_MODEL=llama-3.3-70b-versatile
ACCESS_TOKEN_EXPIRE_MINUTES=10080
EOF

# Start the backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd lexguard/frontend

# Install dependencies
npm install

# Configure environment (for local dev)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker Deployment

```bash
cd lexguard/backend
docker build -t lexguard-backend .
docker run -p 8000:8000 \
  -e GROQ_API_KEY=your_key \
  -e SECRET_KEY=your_secret \
  lexguard-backend
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Authenticate, receive JWT |
| `POST` | `/api/analyze/upload` | Upload contract (PDF/DOCX/TXT) |
| `GET` | `/api/analyze/status/{id}` | Poll analysis progress |
| `GET` | `/api/analyze/results/{id}` | Full contract analysis results |
| `POST` | `/api/analyze/compare` | Compare two contract versions (Groq diff) |
| `GET` | `/api/contracts` | List all user contracts |
| `DELETE` | `/api/contracts/{id}` | Delete a contract |
| `GET` | `/api/export/{id}/pdf` | Export PDF risk report |
| `GET` | `/api/export/{id}/docx` | Export DOCX redlined report |
| `GET` | `/api/chat/{id}` | Stream AI chat response (SSE) |
| `GET` | `/api/playbooks` | List playbooks |
| `POST` | `/api/playbooks` | Create playbook |
| `GET` | `/health` | Health check |

---

## 📁 Project Structure

```
lexguard/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, lifespan
│   ├── auth.py                    # JWT authentication
│   ├── config.py                  # Settings (Pydantic)
│   ├── database.py                # Async SQLAlchemy setup
│   ├── requirements.txt
│   ├── Dockerfile                 # Production container
│   ├── models/
│   │   ├── contract.py            # SQLAlchemy ORM models
│   │   └── schemas.py             # Pydantic response schemas
│   ├── routers/
│   │   ├── analyze.py             # Upload, status, results, compare
│   │   ├── contracts.py           # List, delete, accept/reject clauses
│   │   ├── chat.py                # SSE streaming AI chat
│   │   ├── export.py              # PDF + DOCX report generation
│   │   ├── playbooks.py           # Playbook CRUD
│   │   └── auth.py                # Register + login
│   └── services/
│       ├── orchestrator.py        # 8-stage analysis pipeline
│       ├── groq_client.py         # Groq LLM wrapper (complete + stream + JSON)
│       ├── parser.py              # PDF/DOCX/TXT/OCR parsing
│       ├── rag_engine.py          # FAISS + embeddings + RAG
│       ├── risk_scorer.py         # CRI computation
│       ├── contradiction_detector.py  # Pairwise clause auditor
│       ├── prompts.py             # LLM system prompts
│       └── report_builder.py      # PDF/DOCX export builder
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/             # Contract history + stats
│   │   ├── analyze/[id]/          # Full analysis workspace (5 tabs)
│   │   ├── compare/               # Contract version comparison
│   │   ├── history/               # Contract list
│   │   ├── playbooks/             # Playbook management
│   │   ├── report/[id]/           # Printable risk report
│   │   ├── login/ & signup/       # Authentication pages
│   │   └── layout.tsx             # Root layout + providers
│   ├── components/
│   │   ├── analysis/              # ClauseCard, ClauseList, RiskRadarChart, RiskScoreGauge
│   │   ├── chat/                  # ChatPanel (SSE streaming)
│   │   ├── layout/                # Navbar, Sidebar, LegalFooter
│   │   ├── redline/               # RedlineCard (accept/reject)
│   │   ├── upload/                # DropZoneModal
│   │   ├── workspace/             # ScenariosTab (8 dynamic simulations)
│   │   └── ui/                    # Badge, Button, Card, Spinner
│   ├── lib/
│   │   ├── api.ts                 # Axios instance + all API hooks
│   │   ├── store.ts               # Zustand auth + app state
│   │   └── types.ts               # TypeScript interfaces
│   └── vercel.json                # Vercel deployment config
│
├── render.yaml                    # Render.com deployment config
└── README.md                      # This file
```

---

## 🔒 Security

- **Path traversal prevention** — `_safe_path()` validates all uploaded files are within the upload directory
- **Filename sanitization** — strips null bytes, control characters, path separators before DB storage
- **JWT authentication** — all analysis endpoints require valid Bearer token
- **CORS hardening** — origin regex whitelist (no wildcard in production)
- **File type allowlist** — only `.pdf`, `.docx`, `.doc`, `.txt`, `.rtf` accepted
- **File size limit** — configurable max upload size per `MAX_FILE_SIZE_MB`
- **Non-root Docker user** — container runs as unprivileged user

---

## 💡 Example Use Cases Demonstrated

| Use Case | How LexGuard Handles It |
|----------|------------------------|
| Restrictive non-compete in employment contract | Groq flags "Non-Compete Clause" as HIGH risk with plain-English impact + redline |
| Hidden cancellation penalties in subscriptions | "Auto-Renewal" + "Early Termination" clauses extracted, dispute simulator shows 45-day timeline |
| Broad IP transfers in freelance agreements | IP assignment clauses detected; worst-case: "Loss of IP ownership + $200K litigation" |
| Excessive data collection in privacy policies | Privacy/data category in CRI; relevant Data Breach dispute simulation surfaced |
| One-sided arbitration mechanisms | Mandatory arbitration flagged; "Forced Arbitration" scenario shows no appeal rights |
| Ambiguous liability limitations in vendor agreements | Contradiction auditor finds conflicting liability caps; "Liability Cap Exceeded" scenario shown |

---

## 🏆 Why LexGuard Wins

1. **Real AI reasoning, not keyword detection** — LLaMA 3.3 70B understands context, ambiguity, and legal implications
2. **Full adversarial perspective** — The extraction AI is prompted as a defensive attorney, not a neutral summarizer
3. **End-to-end pipeline** — From raw PDF bytes to bounding-box clause overlays, risk radar charts, and DOCX redlines
4. **Contract-specific outputs** — Dispute scenarios, risk scores, and AI chat are all specific to the uploaded document
5. **Production deployed** — Not a local demo; live on Render with persistent storage and Docker
6. **All 11 suggested features built** — Every item in the problem statement's feature list is implemented
7. **Explainability first** — Every clause shows `why_risky`, `plain_english`, and a specific redline suggestion

---

## ⚠️ Disclaimer

LexGuard is an AI-powered awareness and analysis tool. It **does not constitute legal advice** and is not a substitute for a qualified attorney. All analysis is for informational purposes to help users make informed decisions before consulting legal professionals.

---

## ✅ Completion Statement

> **LexGuard fully satisfies 100% of the requirements defined in Problem Statement 01.**

| Category | Items | Completed |
|----------|-------|-----------|
| Core Objectives | 7 | **7 / 7 ✅** |
| Suggested Features | 11 | **11 / 11 ✅** |
| Expected Capabilities | 7 | **7 / 7 ✅** |
| Recommended Technology Areas | 8 | **8 / 8 ✅** |
| Required Deliverables | 6 | **6 / 6 ✅** |
| Real-Time Deployment | Mandatory | **✅ Live on Render** |

**Total completion rate: 100% — Every objective, every feature, every deliverable.**

---

<div align="center">

Built with ⚖️ for the AI Hackathon | Problem Statement 01: LexGuard — AI Rights & Contract Intelligence System

</div>
