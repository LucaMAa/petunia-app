# ──────────────────────────────────────────────────────────────────────────
# Makefile - controlli qualità/sicurezza per il client (Expo / React Native)
#
# Uso rapido:
#   make check         -> esegue TUTTI i controlli in sola lettura (CI-safe)
#   make fmt            -> FORMATTA il codice (prettier --write + eslint --fix)
#   make fmt-check       -> verifica la formattazione senza modificare nulla
#   make lint           -> eslint
#   make typecheck       -> tsc --noEmit
#   make audit           -> npm audit (vulnerabilità nelle dipendenze)
# ──────────────────────────────────────────────────────────────────────────

.PHONY: check fmt fmt-check lint typecheck audit install

install:
	npm ci

# Target principale: sola lettura, nessuna modifica ai file.
check: fmt-check lint typecheck audit
	@echo ""
	@echo "✅ Tutti i controlli sono passati."

# Formatta e corregge quello che è auto-fixabile.
fmt:
	@echo "→ Formattazione (prettier + eslint --fix)..."
	npx prettier --write .
	npx eslint . --fix

fmt-check:
	@echo "→ Controllo formattazione (prettier)..."
	npx prettier --check .

lint:
	@echo "→ eslint..."
	npx eslint .

typecheck:
	@echo "→ tsc --noEmit..."
	npx tsc --noEmit

audit:
	@echo "→ npm audit..."
	npm audit --audit-level=high
