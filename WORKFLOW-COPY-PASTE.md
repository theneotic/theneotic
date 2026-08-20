# Enable Commit Refresh in One File

GitHub profile READMEs cannot run CSS or JavaScript in the browser. This package uses three **native Markdown** regions: a profile record, a recent-public-activity table, and a public-contribution-tempo block. The optional workflow rewrites only those marked regions after each source commit to the profile repository’s `main` branch.

## If you can upload hidden folders

Keep the included `.github/workflows/refresh-profile-record.yml` file and upload it with the rest of the package.

## If you cannot upload `.github`

Use GitHub’s web editor instead. In the `theneotic` repository, choose **Add file → Create new file**. Enter this exact filename:

```text
.github/workflows/refresh-profile-record.yml
```

Then upload `scripts/refresh_native_profile.mjs` normally, open the included workflow file in the extracted package, copy its full contents, paste it into the editor, and commit it to `main`. After that, every source commit you make to this profile repository’s `main` branch refreshes the three native regions. You can also open **Actions → Refresh Native Profile Record → Run workflow** to refresh them manually.

## Contributor identity

The workflow commits as:

```text
theneotic <157010181+theneotic@users.noreply.github.com>
```

This is the GitHub noreply identity already associated with the user account. The workflow does not use the `github-actions[bot]` author identity. It excludes workflow-generated refresh commits from the source status and recent-activity table, so a manual rerun creates no new commit when no source data changed. GitHub also prevents a push made with the repository token from starting another workflow run. [1]

## Scope

This refresh is triggered by commits to **this profile repository only**: `theneotic/theneotic`. It does not observe commits in other repositories. Expanding it to other repositories would require separate cross-repository authorization and is intentionally not included.

## Reference

[1]: https://docs.github.com/actions/using-workflows/triggering-a-workflow
