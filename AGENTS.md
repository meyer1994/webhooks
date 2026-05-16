# Commands

## jq

Prefer `jq` over inline scripts for JSON parsing analyzing:

- Do: `cat FILE | jq .`
- Don't: `python -c import json; ...`

```bash
cat file.json | jq .  # pretty-print
cat file.json | jq '.key'  # extract field
cat file.json | jq '.items[]'  # iterate array
cat file.json | jq '.items[] | .name'  # pluck field from each item
cat file.json | jq '.items[] | select(.active == true)'  # filter
cat file.json | jq '{name: .name, id: .id}'  # reshape object
cat file.json | jq 'keys'  # list top-level keys
cat file.json | jq 'length'  # count items in array or object
cat file.json | jq -r '.name'  # raw output (no quotes)
cat file.json | jq -c '.items[]'  # compact one-line output per item
```

## grep

```bash
grep -rin "pattern" .  # recursive, case-insensitive, line numbers
grep -rin "pattern" . --include="*.ts"  # limit to file type
grep -rin "pattern" . -l  # list matching files only
grep -rin "pattern" . -A 3 -B 3  # show 3 lines of context around matches
grep -rn "pattern" . --exclude-dir=node_modules  # skip node_modules
grep -rn "TODO\|FIXME" .  # multiple patterns (OR)
grep -rn "^export" server/  # lines starting with "export" in server/
```

## find

```bash
find . -name "*.ts"  # find by extension
find . -name "*.ts" -not -path "*/node_modules/*"  # exclude node_modules
find . -type f -newer package.json  # files modified after package.json
find . -type d -name "__tests__"  # find directories by name
find . -name "*.log" -delete  # find and delete
find . -type f -size +1M  # files larger than 1MB
find server -name "*.ts" | xargs grep -l "useDB"  # find files using a symbol
```

## ls

```bash
ls -la  # long format with hidden files
ls -lah  # human-readable sizes
ls -lt  # sort by modification time (newest first)
ls -ltr  # sort by modification time (oldest first)
ls -R dir/  # recursive listing
ls -la | grep "^d"  # directories only
```

## tree

```bash
tree  # full directory tree
tree -L 2  # limit depth to 2 levels
tree -a  # include hidden files
tree -I "node_modules"  # exclude a directory
tree -I "node_modules|.nuxt|.output"  # exclude multiple directories
tree --gitignore  # respect .gitignore
tree -f  # show full paths
tree -d  # directories only
tree -L 2 server/  # tree of a specific directory
```

## Development

- `pnpm dev`: start dev server
- `pnpm build`: production build
- `pnpm preview`: preview production build locally
- `pnpm clean`: remove `.output`, `.wrangler`, `.nuxt`

## Code Quality

- `pnpm lint`: run ESLint
- `pnpm lint:fix`: auto-fix ESLint issues
- `pnpm typecheck`: run TypeScript type checking via Nuxt

## Database (Drizzle + Cloudflare D1)

- `pnpm db:generate`: generate migrations from schema changes (`server/db/schema.ts`)
- `pnpm db:migrate`: apply migrations to D1 (`wrangler d1 migrations apply webhooks`)
- `pnpm cf:types`: regenerate Cloudflare Workers type bindings (`shared/wrangler.d.ts`)

## Cloudflare Deployment

- `pnpm cf:deploy`: build and deploy to Cloudflare Workers (`wrangler deploy`)

## Dependency Management

- `pnpm install`: install dependencies
- `pnpm reset`: full reset — clean, reinstall, lint, typecheck, build
