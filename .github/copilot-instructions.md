# Repository instructions

## Build and validation

- Build the resource-group template and regenerate its checked-in ARM JSON: `az bicep build --file main.bicep --outfile azuredeploy.json`. Keep `azuredeploy.json` in sync with `main.bicep`.
- The ARM Template Test Toolkit (ARM-TTK) suite runs in `.github/workflows/run-arm-ttk.yml` on pull requests to `master` and by manual dispatch. Locally, with ARM-TTK installed and `ARMTTK_PATH` set, run the full suite with `Import-Module "$env:ARMTTK_PATH/arm-ttk.psd1"; Test-AzTemplate -TemplatePath . -Skip "artifacts-parameter"`.
- To run one ARM-TTK test, use `Import-Module "$env:ARMTTK_PATH/arm-ttk.psd1"; Test-AzTemplate -TemplatePath . -Test <test-name>`.
- There is no separate unit-test or lint command configured. The Bicep build performs compilation and diagnostics; the GitHub workflow runs ARM-TTK.

## Architecture

- `main.bicep` is the resource-group-scope entry point. It defines the SharePoint version and configuration options, computes shared environment/role settings, and orchestrates the network, base virtual machines, optional SharePoint front ends, optional Bastion, and optional Azure Firewall.
- `virtualNetwork.bicep`, `virtualMachine.bicep`, `bastion.bicep`, and `firewall.bicep` are focused modules. They provision resources through pinned Azure Verified Module (AVM) versions where applicable, while `virtualMachine.bicep` also configures the VM run command and DSC extension.
- The virtual machines are the domain controller, SQL Server, and SharePoint main server, plus zero to four optional SharePoint front ends. Their role-specific DSC packages and configuration scripts are downloaded from the `SharePointInfraDsc` release URL configured by `_artifactsLocation`; the DSC implementation is external to this repository.
- `main.bicepparam` is a local deployment example. `azuredeploy.json` is the compiled ARM-template counterpart of `main.bicep` and is used by the Azure Quickstart deployment links and metadata.
- `DeployTemplate.ps1` and `.vscode/tasks.json` provide Azure PowerShell/Azure CLI deployment entry points. The GitHub Action in `action-armttk` wraps ARM-TTK for the CI workflow.

## Repository-specific conventions

- Keep deployment parameters, validation constraints, defaults, environment calculations, and role-specific DSC argument wiring in `main.bicep`; keep reusable resource implementation in its corresponding module.
- When changing a root parameter or SharePoint configuration option, follow it through the derived DSC settings and deployment modules, and update the usage documentation in `README.md` when user-facing behavior changes.
- Keep AVM references explicitly version-pinned in Bicep module declarations.
- Treat `adminPassword`, `otherAccountsPassword`, and artifact access tokens as secrets: preserve secure parameter annotations and pass credentials to DSC through protected settings, not ordinary settings.
- The supported SharePoint configuration levels and feature names are defined by the allowed values in `main.bicep`; preserve these names and the mapping from configuration levels to selected features when changing configuration behavior.

## Maintenance agents

These rules apply to the Bicep and SharePoint update agents.

### Environment and validation

- Read the initial Git status and diff; preserve unrelated files, edits, and staged changes. If task edits cannot be safely separated from existing work, ask or skip affected files when unattended. Research public identifiers and versions through official sources without exposing secrets or uploading repository code.
- Use trusted session context to distinguish a GitHub cloud sandbox, an Actions-managed task, and a local checkout. Use the host's shell/path syntax. Missing `gh` authentication does not identify the environment or prevent research, editing, and local validation.
- Check Azure CLI/Bicep availability. Setup steps prepare Actions sessions, not cloud sandboxes. Install missing build prerequisites from official sources only in a confirmed disposable cloud environment with existing permissions; do not silently install/upgrade tools locally. Report blocked setup without requesting credentials.
- Never deploy, run Azure-side validation/what-if, or require subscription credentials. Local checks do not prove deployment success.
- Require a successful build and freshly generated `azuredeploy.json`; parse it as an ARM template and inspect the source/generated diff. Never manually edit generated JSON. Distinguish baseline diagnostics from new warnings and resolve new issues caused by retained changes without repairing unrelated failures.
- When ARM-TTK is available, run the suite above and inspect results for `Passed -eq $false`; process exit status alone is insufficient. Retained changes with build/JSON/diff/ARM-TTK failures must not be delivered as validated. If ARM-TTK is unavailable, report it as not run locally and identify the existing PR CI check; do not install it or build its Docker image just for maintenance.
- Remove only agent-owned failed edits and revalidate the retained set. Keep recoverable work if blocked; clean up only agent-created temporary artifacts.

### Pull-request delivery

- After validating retained changes, open or update a PR before claiming success. A partial update is acceptable when retained changes pass and skipped items are disclosed. If there are no retained changes, do not rewrite generated JSON, edit release documentation, create empty commits, or open a new PR; leave any host-created draft intact.
- Before creating or updating a maintenance PR, add or refresh a concise entry in `CHANGELOG.md` under `## Unreleased`, using the existing `### Changed` / `- Template` grouping. Describe only retained module/API updates or the verified SharePoint release/KB, consistent with the source and generated template. Include it in the same PR; reuse an accurate matching entry on retries instead of duplicating it, and preserve unrelated entries and published history.
- On delivery retries, verify and reuse saved task work, revalidate it, and resume publication. An unpublished update is not a no-change run; if ownership or intended changes cannot be established, report the ambiguity rather than publishing.
- **Cloud sandbox:** Prefer the host's supported commit/push/PR capabilities. Use an authenticated Git/`gh` workflow only when permitted by that host; do not assume Actions-managed delivery or ban `gh pr create` solely because the session is remote.
- **Actions-managed task:** Stay in the supplied checkout on the assigned branch and use managed commit/push/PR delivery. Do not require shell Git credentials, create a replacement branch/worktree, rewrite remotes, or bypass the managed workflow with direct push/PR commands.
- **Git/`gh` delivery (local or permitted sandbox):** Verify the repository, intended PR base, and push remote; resolve the default branch dynamically if no base is supplied. For a new task without an assigned branch, use a dedicated branch from that base, isolating unrelated work in a worktree when needed; otherwise keep the assigned task branch. Stage only explicit agent-owned paths, commit source, generated JSON, and required documentation together, and push normally, never to the default branch or with force. Preserve unrelated work and never amend or bypass hooks.
- Before creating a PR, check for an existing open PR matching repository/head/base and reuse it. With `gh`, use explicit repository, base, head, title, and body. Never invent credentials or a push destination. Respect host-enforced draft status; do not require a ready PR for success. Never merge or enable auto-merge.
- Verify the PR URL, open state, repository, base/head, and published head commit using host results or available metadata. If publication or verification is unavailable, report incomplete delivery and the exact retained checkout/branch/commit state instead of claiming success. Report CI as pending/not checked unless its result was obtained.
- Keep the PR body concise: changes with authoritative sources, validation/diagnostics, and skipped items with reasons. The final response can link to that detail and give the PR status or delivery blocker; do not duplicate the full report or create a report file by default.
