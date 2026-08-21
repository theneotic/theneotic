# Weekly Profile Record Setup

The workflow refreshes only the `PROFILE_RECORD` marker region in `README.md`. It reads public GitHub account and repository data, then updates the **Signal ledger** with repository count, total public stars, followers/following, leading repository language, account-established date, and refresh time.

It uses the `theneotic <157010181+theneotic@users.noreply.github.com>` commit identity, so weekly record commits remain attributed to **theneotic**, not a bot.

## Important branch requirement

GitHub runs scheduled workflows only from the repository’s **default branch**. The current default branch is `main`, while the Glyph Ledger profile work is on `sub2`.

The included workflow intentionally checks out `sub2` and pushes its bounded README update back to `sub2`. For the Monday 05:17 UTC weekly schedule to activate, copy or merge only `.github/workflows/refresh-weekly-profile-record.yml` into `main`. This does **not** require moving the Glyph Ledger README itself to `main`.

## First-run checklist

1. Commit and push the local `sub2` files when ready.
2. Put the workflow file on `main` so GitHub can schedule it.
3. In the Actions page, run **Refresh Weekly Profile Record** once manually.
4. Confirm that the resulting `chore: refresh weekly profile record` commit is on `sub2` and that only the `PROFILE_RECORD` marker region changed.

The workflow makes no commit when the generated record is unchanged. The weekly timestamp normally changes, so a weekly refresh commit is expected.
