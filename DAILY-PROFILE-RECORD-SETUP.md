# Daily Profile Record and Visitor Heatmap Setup

The workflow refreshes only the `PROFILE_RECORD` marker region in `README.md`. It reads public GitHub account and repository data, then updates the **Signal ledger** with repository count, total public stars, followers/following, leading repository language, account-established date, and refresh time.

It also captures the current total from the existing visitor counter once per day. The workflow writes its own visitor history to `data/visitor-activity.json` and renders `assets/visitor-activity-heatmap.svg`. The heatmap has no retroactive visitor history: it begins with the first successful daily sample after activation and labels unobserved days honestly.

It uses the `theneotic <157010181+theneotic@users.noreply.github.com>` commit identity, so record commits remain attributed to **theneotic**, not a bot.

## Branch Execution

GitHub runs scheduled workflows from the repository’s default branch (`main`).
The workflow operates on `main` and pushes its bounded README updates, visitor history, and heatmap output back to `main`.

## Verification Checklist

1. Verify that `.github/workflows/refresh-daily-profile-record.yml` targets `main`.
2. In the GitHub Actions tab, trigger **Refresh Daily Profile Record** manually via `workflow_dispatch`.
3. Confirm that the resulting `chore: refresh daily profile record` commit cleanly updates only the `PROFILE_RECORD` marker region, `data/visitor-activity.json`, and `assets/visitor-activity-heatmap.svg`.

The workflow skips committing if the generated record is unchanged.
