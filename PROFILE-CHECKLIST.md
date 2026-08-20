# Native Profile Checklist

Before uploading, confirm the following.

| Check | Expected result |
|---|---|
| Repository name | `theneotic`, exactly matching the GitHub username |
| Visibility | Public |
| Profile source | `README.md` is present at the repository root |
| Image use | No `img` tags, visual assets, or remote card images appear in `README.md` |
| Navigation | Every listed project, instrument, and profile action opens a real destination |
| Native interaction | The `FIELD NOTES / OPEN CONTROL PANEL` disclosure expands on GitHub |
| Status markers | `PROFILE_STATUS`, `PROFILE_ACTIVITY`, and `PROFILE_STREAK` marker pairs are each present exactly once |
| Commit refresh | `.github/workflows/refresh-profile-record.yml` is uploaded or manually created from `WORKFLOW-COPY-PASTE.md` |
| Contributor policy | The workflow uses the `theneotic` noreply identity, not `github-actions[bot]`, and a manual rerun with unchanged data creates no new commit |
| Public copy | All README wording has been reviewed for accuracy |
