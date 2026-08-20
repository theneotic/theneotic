# Native Profile Workflow Setup

## What This Workflow Does

GitHub profile READMEs cannot run custom CSS or browser JavaScript. This workflow keeps the profile native by updating only a marked **plain Markdown** status block after a commit lands on `theneotic/theneotic`’s `main` branch. It uses the verified `theneotic` noreply identity, not `github-actions[bot]`.

## Exact Contents of `WORKFLOW-COPY-PASTE.md`

```markdown
# Enable Commit Refresh in One File

GitHub profile READMEs cannot run CSS or JavaScript in the browser. This package uses a **native Markdown status block** and an optional workflow that rewrites only that text after each commit to the profile repository’s `main` branch.

## If you can upload hidden folders

Keep the included `.github/workflows/refresh-profile-record.yml` file and upload it with the rest of the package.

## If you cannot upload `.github`

Use GitHub’s web editor instead. In the `theneotic` repository, choose **Add file → Create new file**. Enter this exact filename:

```text
.github/workflows/refresh-profile-record.yml
```

Then open the included workflow file in the extracted package, copy its full contents, paste it into the editor, and commit it to `main`. After that, every commit you make to this profile repository’s `main` branch refreshes the `Live profile record` text block. You can also open **Actions → Refresh Native Profile Record → Run workflow** to refresh it manually.

## Contributor identity

The workflow commits as:

```text
theneotic <157010181+theneotic@users.noreply.github.com>
```

This is the GitHub noreply identity already associated with the user account. The workflow does not use the `github-actions[bot]` author identity. GitHub prevents a push made with the repository token from starting another workflow run, so the refresh cannot loop. [1]

## Scope

This refresh is triggered by commits to **this profile repository only**: `theneotic/theneotic`. It does not observe commits in other repositories. Expanding it to other repositories would require separate cross-repository authorization and is intentionally not included.

## Reference

[1]: https://docs.github.com/actions/using-workflows/triggering-a-workflow
```

> The inner code fences above are shown as literal text because they are part of the copy-paste document. The actual YAML to create is in the next section.

## Exact Workflow File to Create

Create this one file through GitHub’s web editor if hidden folders cannot be uploaded:

```text
.github/workflows/refresh-profile-record.yml
```

Paste this exact YAML:

```yaml
name: Refresh Native Profile Record

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write

jobs:
  refresh-readme:
    runs-on: ubuntu-latest
    steps:
      - name: Check out profile repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Refresh native status block
        run: |
          node <<'NODE'
          const { execFileSync } = require('node:child_process');
          const { readFileSync, writeFileSync } = require('node:fs');

          const output = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
          const escapeMarkdown = (value) => value.replace(/[|\r\n]/g, ' ').trim();
          const commitCount = output(['rev-list', '--count', 'HEAD']);
          const shortHash = output(['rev-parse', '--short', 'HEAD']);
          const subject = escapeMarkdown(output(['log', '-1', '--format=%s']));
          const timestamp = output(['log', '-1', '--format=%cI']);
          const block = [
            '<!-- PROFILE_STATUS:START -->',
            '> **State:** `BUILDING IN PUBLIC`  ',
            '> **Mode:** `NATIVE / LINKED / COMMIT-REFRESHED`  ',
            `> **Profile commits:** \`${commitCount}\`  `,
            `> **Latest change:** [\`${shortHash}\`](https://github.com/theneotic/theneotic/commit/${shortHash}) — ${subject}  `,
            `> **Recorded at:** \`${timestamp}\`  `,
            '> **Refreshed from:** [main](https://github.com/theneotic/theneotic/commits/main)',
            '<!-- PROFILE_STATUS:END -->',
          ].join('\n');
          const file = 'README.md';
          const current = readFileSync(file, 'utf8');
          const marker = /<!-- PROFILE_STATUS:START -->[\s\S]*?<!-- PROFILE_STATUS:END -->/;
          if (!marker.test(current)) throw new Error('Profile status markers are missing from README.md.');
          writeFileSync(file, current.replace(marker, block));
          NODE

      - name: Commit refreshed text only when it changed
        run: |
          git config user.name "theneotic"
          git config user.email "157010181+theneotic@users.noreply.github.com"
          git add README.md
          git diff --cached --quiet || git commit -m "chore: refresh native profile record"
          git push
```

## Manual Test: Confirm the Commit Counter Updates

First, confirm that `README.md` contains both markers exactly once:

```text
<!-- PROFILE_STATUS:START -->
...
<!-- PROFILE_STATUS:END -->
```

Then open the **Actions** tab in `theneotic/theneotic`. Select **Refresh Native Profile Record** from the workflow list. Choose **Run workflow**, leave the branch set to `main`, and confirm the run. When the run finishes, open the latest commit on `main`.

| What to check | Expected outcome |
|---|---|
| Workflow result | A green success status |
| Latest commit | `chore: refresh native profile record`, but authored as `theneotic` |
| README status | A numeric profile-commit count replaces `Awaiting first refresh` |
| Latest change | A short commit hash and latest commit subject are shown |
| Repeat run with no new commit | No new README-refresh commit is added because the content is unchanged |

After the first manual run, any new commit pushed directly to `main` in the **profile repository** triggers the same refresh. GitHub prevents the workflow’s own `GITHUB_TOKEN` push from starting another copy of itself, preventing a loop. [1]

## Can Native Markdown Add a Streak or Recent Activity?

Yes, but the data must be calculated by the workflow and written as text inside another marked section. It cannot update itself in the reader’s browser. Both options below remain no-image and contributor-safe when the workflow commits with the verified `theneotic` noreply identity.

| Option | What appears in the README | Data source | Refresh behavior | Recommendation |
|---|---|---|---|---|
| **Recent activity table** | A native 3–5 row Markdown table showing public push, issue, pull-request, or repository events | GitHub public events API | On a profile-repository commit or manual run | **Best first addition**: accurate, compact, and useful |
| **Public contribution streak** | Current public contribution-day run, longest run in the measured period, and last active day | GitHub GraphQL contribution calendar | On a profile-repository commit or manual run | Good second addition, but requires a larger calculation block and should clearly state “public contributions” |

### Recommended Native Activity Block

```markdown
## Recent public activity

<!-- PROFILE_ACTIVITY:START -->
| When | Event | Repository |
|---|---|---|
| Awaiting first refresh | — | — |
<!-- PROFILE_ACTIVITY:END -->
```

The workflow can fill this table with the five most recent public events for `theneotic`. Each event and repository can be a normal GitHub link. This provides a live-feeling activity module with no external image service.

### Recommended Streak Block

```markdown
## Public contribution tempo

<!-- PROFILE_STREAK:START -->
> **Current public day run:** `Awaiting first refresh`  
> **Longest public day run:** `Awaiting first refresh`  
> **Last active day:** `Awaiting first refresh`
<!-- PROFILE_STREAK:END -->
```

The label must say **public** because private contributions are not inferred by this package. Unlike image-based streak cards, this stays visible as ordinary Markdown and has no visual-widget dependency.

## Recommended Next Step

Add the **recent public activity table first**. It gives the profile real changing content, stays easy to understand, and can reuse the existing workflow. Add the public streak next only if you want a more statistical profile signal.

## Reference

[1]: https://docs.github.com/actions/using-workflows/triggering-a-workflow
