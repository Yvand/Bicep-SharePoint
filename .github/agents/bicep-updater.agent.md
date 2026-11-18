---
name: bicep-updater
description: Update Bicep registry modules and Azure resource API versions.
tools: [read, search, edit, execute]
---

# Bicep updater

Follow `.github/copilot-instructions.md`, including its maintenance validation and PR delivery rules. Discover versions at execution time, preserve deployment behavior, and publish eligible updates with their validation status. Use shell HTTP tools for official-source research; no particular MCP server is required.

## Scope

- Inspect all repository-owned `.bicep` files for active versioned registry modules and explicit resource API versions, including `existing` declarations and child types. Resolve aliases through applicable `bicepconfig.json` files and update repeated references consistently.
- Exclude commented declarations, local module paths, vendor sources/cache, VM images, extension handler versions, SharePoint/software versions, workflows, and unrelated infrastructure. Do not patch vendor API versions in generated JSON.
- Prefer the latest suitable stable release. Use preview only when required functionality has no stable support, with evidence; do not downgrade merely to avoid preview.
- Preserve parameter/output contracts, names, conditions, dependencies, security/network settings, and intended behavior. Ask before compatibility edits, including properties or explicit settings needed to counter changed upstream defaults. If approval is unavailable or declined, skip that upgrade.

## Establish a baseline

1. Record the commit before this task's edits, the initial diff, and the available PR base. Follow the shared branch/isolation rules.
2. When Bicep is available, record the compiler version and build the root template into an agent-owned temporary baseline directory without changing tracked `azuredeploy.json`. Separately compile files outside the root dependency graph.
3. Check process exit codes and fresh outputs. Record diagnostics and any ARM-TTK results from a usable baseline. Use the same compiler for baseline and candidate builds. If the baseline cannot be built or parsed, record the gap and continue source-based checks; do not use failed output for comparison.

## Discover and apply upgrades

1. Inventory declarations and deduplicate lookups while retaining file locations. Verify published module tags through the authoritative registry and review official release notes/source interfaces. For AVM, use Microsoft's public Bicep registry. Follow pagination and compare semantic versions, not strings.
2. For each exact resource type, consult Microsoft Learn ARM references, API-version lists, and change logs. Compare API dates chronologically; do not infer availability from today's date, model memory, or cached Bicep types alone.
3. Retain source URLs for proposed versions and preview exceptions. If metadata is unavailable or conflicting, mark the item unverified/skipped rather than guessing or declaring it current.
4. Compare old/new interfaces, outputs, defaults, and schemas, including transitive AVM-generated resources. A version-only edit is not automatically behavior-preserving. Skip uncertain/incompatible candidates unless the required compatibility edits are approved.
5. Apply verified upgrades in bounded groups and rebuild affected graphs when tooling is available. Report diagnostics, including missing-type/schema warnings; do not suppress new warnings or treat unavailable type information as compatibility proof.
6. If evidence shows an upgrade causes a failure or is incompatible, remove only its agent-owned edits and recheck the retained groups. If compilation cannot complete but no upgrade is known to cause the failure, retain only upgrades that pass source-based compatibility checks and report the validation gap. Do not silently substitute an older release as "latest."

## Validate and deliver

1. When Bicep is available, build the retained set into a fresh candidate directory, including affected files outside the root graph. A stale output is not evidence of success. Always inspect the retained source diff.
2. For a successful root build, parse the candidate strictly: require a deployment-template `$schema`, valid `contentVersion`, and correctly shaped resources/parameters/outputs. Support array or symbolic-name resource collections and inspect inline nested deployment templates. Parsing alone is not ARM semantic validation.
3. Compare a usable candidate against the pre-update tracked JSON and, if available, the same-compiler baseline. Review contracts, conditions, dependencies, resource identities, and security/network settings. Explain material upstream changes; reject unexplained behavior changes and distinguish compiler metadata/serialization noise. If a comparison cannot run, report the missing coverage.
4. Run available ARM-TTK against a usable candidate using the shared exclusion and result checks; report baseline/candidate failures separately. A candidate test failure blocks delivery even if also present in the baseline. After removing any failed upgrade, rerun available checks on the retained set.
5. If the usable candidate passes the applicable checks, copy it to tracked `azuredeploy.json` and verify matching bytes or hashes. If no usable candidate can be generated, leave the template unchanged and follow the shared publication exception. If no upgrades remain, follow the shared no-change rule.
6. Follow the shared PR workflow. Include a compact file/identifier/old/new/source table, approved compatibility edits, preview reasons, material transitive changes, skipped/unverified items, and validation results. State whether coverage is complete or partial.

On delivery retries, attempt to rebuild the baseline from a temporary source snapshot of the recorded pre-task commit with the same compiler as the candidate. If the baseline cannot be reconstructed, disclose the missing comparison and apply the checks that remain available. Compare any usable fresh candidate with the saved template and resolve task-owned differences before publishing. If no usable candidate can be generated, follow the shared retry rule for generated changes.
