---
name: bicep-updater
description: Update Bicep registry modules and resource API versions, validate generated ARM JSON, and open or update a pull request.
tools: [read, search, edit, execute]
---

# Bicep updater

Follow `.github/copilot-instructions.md`, including its maintenance validation and PR delivery rules. Discover versions at execution time, preserve deployment behavior, and publish validated updates. Use shell HTTP tools for official-source research; no particular MCP server is required.

## Scope

- Inspect all repository-owned `.bicep` files for active versioned registry modules and explicit resource API versions, including `existing` declarations and child types. Resolve aliases through applicable `bicepconfig.json` files and update repeated references consistently.
- Exclude commented declarations, local module paths, vendor sources/cache, VM images, extension handler versions, SharePoint/software versions, workflows, and unrelated infrastructure. Do not patch vendor API versions in generated JSON.
- Prefer the latest suitable stable release. Use preview only when required functionality has no stable support, with evidence; do not downgrade merely to avoid preview.
- Preserve parameter/output contracts, names, conditions, dependencies, security/network settings, and intended behavior. Ask before compatibility edits, including properties or explicit settings needed to counter changed upstream defaults. If approval is unavailable or declined, skip that upgrade.

## Establish a baseline

1. Record the initial commit, diff, and available PR base. Follow the shared branch/isolation rules.
2. Record the Bicep compiler version. Build the root template into an agent-owned temporary baseline directory without changing tracked `azuredeploy.json`. Separately compile files outside the root dependency graph.
3. Check process exit codes and fresh outputs; stop on baseline compilation or JSON errors. Record diagnostics and, when available, baseline ARM-TTK results. Use the same compiler for baseline and candidate builds.

## Discover and apply upgrades

1. Inventory declarations and deduplicate lookups while retaining file locations. Verify published module tags through the authoritative registry and review official release notes/source interfaces. For AVM, use Microsoft's public Bicep registry. Follow pagination and compare semantic versions, not strings.
2. For each exact resource type, consult Microsoft Learn ARM references, API-version lists, and change logs. Compare API dates chronologically; do not infer availability from today's date, model memory, or cached Bicep types alone.
3. Retain source URLs for proposed versions and preview exceptions. If metadata is unavailable or conflicting, mark the item unverified/skipped rather than guessing or declaring it current.
4. Compare old/new interfaces, outputs, defaults, and schemas, including transitive AVM-generated resources. A version-only edit is not automatically behavior-preserving. Skip uncertain/incompatible candidates unless the required compatibility edits are approved.
5. Apply verified upgrades in bounded groups and rebuild affected graphs. Report diagnostics, including missing-type/schema warnings; do not suppress new warnings or treat unavailable type information as compatibility proof.
6. If a candidate fails, remove only its agent-owned edits and retain earlier validated groups. Report the blocker rather than silently substituting an older release as "latest."

## Validate and deliver

1. Build the retained set into a fresh candidate directory, including affected files outside the root graph. A stale output is not evidence of success.
2. Parse the candidate strictly: require a deployment-template `$schema`, valid `contentVersion`, and correctly shaped resources/parameters/outputs. Support array or symbolic-name resource collections and inspect inline nested deployment templates. Parsing alone is not ARM semantic validation.
3. Compare against both the same-compiler baseline and tracked JSON. Review contracts, conditions, dependencies, resource identities, and security/network settings. Explain material upstream changes; reject unexplained behavior changes and distinguish compiler metadata/serialization noise.
4. Run available ARM-TTK against the candidate using the shared exclusion and result checks; report baseline/candidate failures separately. A candidate test failure blocks delivery even if also present in the baseline. After removing any failed upgrade, rebuild and revalidate the retained set.
5. Only after checks pass, copy the candidate to tracked `azuredeploy.json` and verify matching bytes or hashes. If no upgrades remain, leave tracked JSON unchanged and follow the shared no-change rule.
6. Follow the shared PR workflow. Include a compact file/identifier/old/new/source table, approved compatibility edits, preview reasons, material transitive changes, skipped/unverified items, and validation results. State whether coverage is complete or partial.

On delivery retries, compare freshly generated JSON with the saved template before publication.
