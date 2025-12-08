# 🦉 Hungry Owl

An AI-powered recipe generation app that helps you cook delicious meals with what you already have in your kitchen.

[![Build Status](https://github.com/ecda909/hungry-owl/actions/workflows/build-push.yaml/badge.svg)](https://github.com/ecda909/hungry-owl/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Smart Inventory Management** - Track fridge, freezer, and pantry items with expiration alerts
- **AI-Powered Recipe Generation** - Get personalized recipes based on ingredients you have
- **USDA Food Database Integration** - Search from thousands of ingredients with nutritional data
- **Multi-Step Onboarding** - Set up dietary preferences, allergies, and kitchen capabilities
- **Smart Shopping Lists** - Auto-generated lists with "Add to Inventory" on purchase
- **Time-Based Cooking** - Find recipes that fit your schedule (15 min to 3 hours)
- **Freshness Tracking** - Automatic expiration status (Fresh, Use Soon, Expiring, Expired)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   App Router │  │   Server    │  │   API Routes       │  │
│  │   (React)    │  │   Actions   │  │   /api/*           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌────────────────────┐
│    Clerk     │   │  PostgreSQL  │   │  External APIs     │
│    (Auth)    │   │   (Prisma)   │   │  - Claude AI       │
└──────────────┘   └──────────────┘   │  - USDA FoodData   │
                                      └────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, shadcn/ui, Framer Motion |
| **Backend** | Next.js Server Actions & API Routes |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | Clerk |
| **AI** | Claude API (Anthropic) |
| **Infrastructure** | Docker, Kubernetes (EKS), Helm, Traefik |
| **CI/CD** | GitHub Actions, ArgoCD |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Clerk account (for authentication)
- Anthropic API key (for recipe generation)
- USDA API key (optional, for food database)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ecda909/hungry-owl.git
   cd hungry-owl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables)).

4. **Start the development environment**
   ```bash
   ./deploy.sh dev-start
   ```
   This starts PostgreSQL, runs migrations, seeds the database, and starts the dev server.

5. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

### Manual Setup

```bash
# Start database
docker-compose up -d postgres

# Run migrations
npm run db:push

# Seed the database
npm run db:seed

# Start dev server
npm run dev
```

## 📦 Deployment

### Kubernetes (EKS)

The application includes a Helm chart for Kubernetes deployment:

```bash
# Install/upgrade the release
helm upgrade --install hungry-owl ./helm/hungry-owl \
  --namespace hungry-owl \
  --create-namespace \
  --set image.tag=1.0.0

# Check deployment status
kubectl get pods -n hungry-owl
```

### Docker

```bash
# Build the image
docker build -t hungry-owl:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=your_database_url \
  -e CLERK_SECRET_KEY=your_clerk_secret \
  hungry-owl:latest
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Builds the Docker image on push to `main`
2. Tags with semantic versioning (v1.0.0, v1.0.1, etc.)
3. Pushes to Google Artifact Registry
4. Creates a git tag for the release

To trigger a specific version bump:
- **Patch** (default): Automatic on push to main
- **Minor/Major**: Use workflow dispatch with version selector

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key for recipe generation |
| `USDA_API_KEY` | ❌ | USDA FoodData Central API key |
| `REDIS_URL` | ❌ | Redis connection string (for caching) |

## 📁 Project Structure

```
hungry-owl/
├── .github/workflows/     # CI/CD pipelines
├── helm/                  # Kubernetes Helm chart
│   └── hungry-owl/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── prisma/                # Database schema & migrations
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (protected)/   # Authenticated routes
│   │   │   ├── dashboard/ # Main dashboard
│   │   │   └── onboarding/
│   │   ├── api/           # API routes
│   │   ├── sign-in/       # Auth pages
│   │   └── sign-up/
│   ├── components/        # React components
│   │   ├── layout/
│   │   ├── onboarding/
│   │   ├── recipes/
│   │   └── ui/            # shadcn/ui
│   └── lib/               # Utilities
│       ├── actions/       # Server actions
│       ├── db.ts          # Prisma client
│       └── utils.ts
├── Dockerfile             # Production Docker image
├── docker-compose.yaml    # Local development
└── deploy.sh              # Deployment scripts
```

## 🔒 Security

- All sensitive data stored in environment variables
- Secrets managed via AWS Secrets Manager (production)
- Clerk handles authentication securely
- API keys never exposed to client

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [USDA FoodData Central](https://fdc.nal.usda.gov/) for ingredient data
- [Anthropic Claude](https://www.anthropic.com/) for AI recipe generation
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
