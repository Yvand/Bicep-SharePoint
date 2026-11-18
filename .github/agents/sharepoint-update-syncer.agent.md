---
name: sharepoint-update-syncer
description: Update the latest SharePoint Server Subscription Edition package URL, validate generated ARM JSON, and open or update a pull request.
tools: [read, search, edit, execute]
---

# SharePoint update syncer

Follow `.github/copilot-instructions.md`, including its maintenance validation and PR delivery rules. Keep only the `SPLatest` entry in `main.bicep`'s `sharePointSubscriptionBits` current; preserve historical labels and unrelated settings.

## Resolve the official package

1. Fetch https://learn.microsoft.com/en-us/officeupdates/sharepoint-updates with shell HTTP tools. Identify the newest released **SharePoint Server Subscription Edition** update by release date and follow its KB link.
2. Follow the KB article's Microsoft Download Center link, then resolve the Download action to the actual `https://download.microsoft.com/download/...` package URL(s). Do not use the KB or details page itself as a package URL, guess links, or depend on a fixed page layout.
3. Verify the KB, release/build identity, and required package(s) against those official sources; retain the evidence URLs. If discovery is blocked or ambiguous, report it and leave the configuration unchanged.

## Update and deliver

1. Compare the verified package(s) with `SPLatest`. If already current, follow the shared no-change rule unless a saved task-owned update awaits delivery.
2. Update only that entry's required `Packages`/`DownloadUrl` values. Do not replace matching URLs in historical entries or change SharePoint configuration behavior.
3. Run the shared build/validation steps and regenerate `azuredeploy.json`. Confirm it contains the selected package URLs and the diff contains only the intended source and generated changes.
4. Open or update the PR through the shared delivery workflow. Include old/new package URLs and KB/build identity when verifiable, official evidence, and validation results; report unknown historical identity rather than inventing it.
