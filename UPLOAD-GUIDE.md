# Native Profile Upload Guide

This package replaces the visual-card profile with a **native GitHub Markdown profile**. It uses no local images, external image widgets, custom CSS, or browser JavaScript. Every visible destination is a standard GitHub or documentation link, and the live profile record is ordinary Markdown updated by an optional commit-triggered workflow.

## Upload the native profile

Create or open the public repository named **`theneotic`**, which exactly matches the GitHub username. Extract the archive, then upload the root-level files and commit them to `main` under the `theneotic` account. GitHub will show `README.md` on the profile page.

## Enable the text refresh

The `Live profile record` can refresh after every commit to this profile repository. If your file picker lets you upload hidden folders, include `.github/workflows/refresh-profile-record.yml`. If it does not, follow **`WORKFLOW-COPY-PASTE.md`** and create that one file directly in GitHub’s web editor.

The workflow does not run browser JavaScript. It uses GitHub’s runner to update only the marked status block in `README.md`, then commits that text change using the verified `theneotic` noreply identity. This prevents the Actions bot identity from being used as the commit author.

## What the workflow updates

| Field | Source |
|---|---|
| Profile commit count | Current `main` history of `theneotic/theneotic` |
| Latest change | Latest profile-repository commit subject and short hash |
| Recorded time | Commit timestamp from the current `main` head |

> The workflow is scoped to commits on the profile repository’s `main` branch. It will not track unrelated repositories without additional authorization.

## Customize safely

Edit prose and links in `README.md` freely, but keep the `PROFILE_STATUS:START` and `PROFILE_STATUS:END` markers intact if you want automatic status refreshes. The workflow modifies only the content between those markers.
