# Repository instructions

## Build and validation

- Build the resource-group template and regenerate its checked-in ARM JSON: `az bicep build --file main.bicep --outfile azuredeploy.json`. Keep `azuredeploy.json` in sync with `main.bicep`.
- Locally, with the ARM Template Test Toolkit (ARM-TTK) installed and `ARMTTK_PATH` set, run the full suite with `Import-Module "$env:ARMTTK_PATH/arm-ttk.psd1"; Test-AzTemplate -TemplatePath . -Skip "artifacts-parameter"`.
- To run one ARM-TTK test, use `Import-Module "$env:ARMTTK_PATH/arm-ttk.psd1"; Test-AzTemplate -TemplatePath . -Test <test-name>`.
- The Bicep build performs compilation and diagnostics. The release workflow builds and validates on manual dispatch and publishes only on a new release tag push; ARM-TTK is not a CI or release gate.

## Architecture

- `main.bicep` is the resource-group-scope entry point. It defines the SharePoint version and configuration options, computes shared environment/role settings, and orchestrates the network, base virtual machines, optional SharePoint front ends, optional Bastion, and optional Azure Firewall.
- `virtualNetwork.bicep`, `virtualMachine.bicep`, `bastion.bicep`, and `firewall.bicep` are focused modules. They provision resources through pinned Azure Verified Module (AVM) versions where applicable, while `virtualMachine.bicep` also configures the VM run command and DSC extension.
- The virtual machines are the domain controller, SQL Server, and SharePoint main server, plus zero to four optional SharePoint front ends. Their role-specific DSC packages and configuration scripts are downloaded from the `SharePointInfraDsc` release URL configured by `_artifactsLocation`; the DSC implementation is external to this repository.
- `main.bicepparam` is a local deployment example. `azuredeploy.json` is the compiled ARM-template counterpart of `main.bicep` and is used by the Azure Quickstart deployment links and metadata.
- `DeployTemplate.ps1` and `.vscode/tasks.json` provide Azure PowerShell/Azure CLI deployment entry points.

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
- Attempt local Bicep validation when tooling is available. Build to a fresh temporary output, parse it as an ARM template, inspect the source and generated diffs, and update `azuredeploy.json` from the checked output. Never manually edit generated JSON or include stale, partial, or invalid build output. Always review the source diff and resolve issues known to be caused by retained changes without repairing unrelated failures.
- Missing tooling or a build that cannot produce a usable template does not by itself block opening or updating a maintenance PR for otherwise eligible source changes. If no usable root template can be generated, leave the tracked template unchanged from before the maintenance update. Do not retain changes with known incompatibilities or present skipped or failed checks as passed.
- When ARM-TTK and a usable fresh candidate are available, run the suite above against the candidate and inspect results for `Passed -eq $false`; process exit status alone is insufficient. If ARM-TTK cannot run, report why; do not install it just for maintenance. Results against the unchanged tracked template do not validate updated Bicep source.
- Remove only agent-owned failed edits and revalidate the retained set. Keep recoverable work if blocked; clean up only agent-created temporary artifacts.

### Pull-request delivery

- After completing required source checks and attempting available build checks, open or update a PR for eligible retained changes, even with the build limitations described above. A partial update is acceptable when skipped items are disclosed. This exception is for PR publication only; it does not change CI or merge requirements. If there are no retained changes, do not rewrite generated JSON, edit release documentation, create empty commits, or open a new PR; leave any host-created draft intact.
- Before creating or updating a maintenance PR, add or refresh a concise entry in `CHANGELOG.md` under `## Unreleased`, using the existing `### Changed` / `- Template` grouping. Describe only retained module/API updates or the verified SharePoint release/KB, consistent with the source and any regenerated template included in the PR. Include it in the same PR; reuse an accurate matching entry on retries instead of duplicating it, and preserve unrelated entries and published history.
- On delivery retries, verify and reuse saved task work, repeat available validation, and apply the same publication rules. If no usable root template can be generated, exclude any saved task-owned template changes from the PR without disturbing unrelated edits. An unpublished update is not a no-change run; if ownership or intended changes cannot be established, report the ambiguity rather than publishing.
- **Cloud sandbox:** Prefer the host's supported commit/push/PR capabilities. Use an authenticated Git/`gh` workflow only when permitted by that host; do not assume Actions-managed delivery or ban `gh pr create` solely because the session is remote.
- **Actions-managed task:** Stay in the supplied checkout on the assigned branch and use managed commit/push/PR delivery. Do not require shell Git credentials, create a replacement branch/worktree, rewrite remotes, or bypass the managed workflow with direct push/PR commands.
- **Git/`gh` delivery (local or permitted sandbox):** Verify the repository, PR base, and push remote; resolve the default branch dynamically if no base is supplied. Keep the assigned task branch or create one from the verified base. Before staging, require an empty index or use an isolated index or worktree; never unstage someone else's work.
- For Git/`gh` commits, stage only task-owned edits and commit source and required documentation together with regenerated JSON when usable output is available. Verify the commit and full PR diff against the intended base before pushing; preserve existing PR work and exclude unrelated changes. Never amend, bypass hooks, force-push, or push to the default branch.
- Before creating a PR, check for an existing open PR matching repository/head/base and reuse it. With `gh`, use explicit repository, base, head, title, and body. Never invent credentials or a push destination. Respect host-enforced draft status; do not require a ready PR for success. Never merge or enable auto-merge.
- Verify the PR URL, open state, repository, base/head, and published head commit using host results or available metadata. If publication or verification is unavailable, report incomplete delivery and the exact retained checkout/branch/commit state instead of claiming success. Report CI as pending/not checked unless its result was obtained.
- Keep the PR body concise: changes with authoritative sources, validation/diagnostics, and skipped items with reasons. Disclose skipped or failed build-dependent checks, why any generated template was left unchanged, and that it may be out of sync with the updated source. The final response can link to that detail and give the PR status or delivery blocker; do not duplicate the full report or create a report file by default.
