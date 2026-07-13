# Complaint Resolution System

A complaint management platform with Landing Page, Campus Voice, Campus Resolve, and Campus Admin.

## Installation

```bash
pnpm install
```

## Run Development

**Terminal 1:**
```bash
pnpm dev:apps
```

**Terminal 2:**
```bash
pnpm dev
```

Then open: http://localhost:3000

## Access Apps

- **Landing Page:** http://localhost:3000/
- **Campus Voice:** http://localhost:3000/voice/
- **Campus Resolve:** http://localhost:3000/resolve/
- **Campus Admin:** http://localhost:3000/admin/

## Build for Production

```bash
pnpm build
```

## Available Commands

- `pnpm dev` - Start proxy server
- `pnpm dev:apps` - Start all 4 dev servers
- `pnpm dev:landing` - Landing page only
- `pnpm dev:voice` - Campus Voice only
- `pnpm dev:resolve` - Campus Resolve only
- `pnpm dev:admin` - Campus Admin only
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps

## Troubleshooting

- **404 errors?** Make sure both terminals are running
- **Port in use?** Kill process on port 3000: `lsof -i :3000 && kill -9 <PID>`
- **Styles missing?** Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
