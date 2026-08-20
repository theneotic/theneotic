# Native Profile Upload Guide

This package replaces the visual-card profile with a **native GitHub Markdown profile**. It uses no local images, external image widgets, custom CSS, or browser JavaScript. Every visible destination is a standard GitHub or documentation link. The refresh workflow updates three ordinary Markdown regions: the profile record, five recent public events, and public contribution tempo.

## Upload the native profile

Create or open the public repository named **`theneotic`**, which exactly matches the GitHub username. Extract the archive, then upload the root-level files and commit them to `main` under the `theneotic` account. GitHub will show `README.md` on the profile page.

## Enable the text refresh

The `Live profile record` can refresh after every commit to this profile repository. If your file picker lets you upload hidden folders, include `.github/workflows/refresh-profile-record.yml`. If it does not, follow **`WORKFLOW-COPY-PASTE.md`** and create that one file directly in GitHub’s web editor.

The workflow does not run browser JavaScript. It uses GitHub’s runner to update only the marked status, activity, and tempo regions in `README.md`, then commits a change only when the resulting Markdown differs. It uses the verified `theneotic` noreply identity, preventing the Actions bot identity from being used as the commit author.

## What the workflow updates

| Field | Source |
|---|---|
| Profile source commits | Current `main` history excluding workflow-generated refresh commits |
| Latest source change | Most recent non-refresh profile-repository commit subject and short hash |
| Recent public activity | Five recent public GitHub events for `theneotic` |
| Public contribution tempo | Current and longest public active-day runs within the previous 365 days |

> The workflow is scoped to commits on the profile repository’s `main` branch. It will not track unrelated repositories without additional authorization.

## Customize safely

Edit prose and links in `README.md` freely, but keep the `PROFILE_STATUS:START` and `PROFILE_STATUS:END` markers intact if you want automatic status refreshes. The workflow modifies only the content between those markers.
