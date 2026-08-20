# Contribution Trace Setup

The profile README references two generated SVG files on the `output` branch. The local workflow at `.github/workflows/generate-contribution-snake.yml` creates these files after it is committed and run.

## First Run

Commit and push this package to `sub2` only after reviewing it. Then open the repository’s **Actions** tab, choose **Generate Contribution Snake**, and select **Run workflow**. When it succeeds, GitHub creates or refreshes the `output` branch containing these assets:

| Theme | Generated asset |
|---|---|
| Dark | `github-contribution-grid-snake-dark.svg` |
| Light | `github-contribution-grid-snake-light.svg` |

The README automatically selects the matching asset using GitHub’s dark or light preference syntax. The workflow also runs once each day and after a push to `sub2`.

## Contributor Identity

The publish action explicitly sets both the author and committer to:

```text
theneotic <157010181+theneotic@users.noreply.github.com>
```

The output-branch commits therefore do not use the default `github-actions[bot]` author identity. The generated SVGs stay separate from `sub2`, while the README reads them as a decorative contribution signature.
