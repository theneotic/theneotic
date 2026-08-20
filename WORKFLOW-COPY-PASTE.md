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
