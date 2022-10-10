# jira-automation

Gets the version number of a release branch such as release/1.2.3, then create JIRA release and update JIRA release note

This action should only be run on release branches. Here is a suggested usage with a check:

```yaml
name: Create Jira Release

on:
  create:
    branches:
      - 'release/*'
env:
  JIRA_USERNAME: ${{ secrets.JIRA_USERNAME }}
  JIRA_PASSWORD: ${{ secrets.JIRA_PASSWORD }}
jobs:
  jira-release:
    runs-on: windows-latest
    name: Get release version & create JIRA release
    steps:
      - name: Checkout repository
        uses: actions/checkout@v1

      - name: Get release version
        uses: hungoptimizely/jira-automation/releaseversion@v1
        id: branchVersion

      - name: Create JIRA release
        uses: hungoptimizely/jira-automation/release@v1
        with:
          jira-project: <Project key, e.g.: GA, AFORM,...>
          jira-package: <Package name, e.g.: EPiServer.GoogleAnalytics, EPiServer.Forms,...>
          jira-host: jira.sso.episerver.net
          version: ${{ steps.branchVersion.outputs.manifestSafeVersionString }}
```
# Result:
E.g.: 
EPiServer.GoogleAnalytics 3.0.0
EPiServer.Forms 5.0.0
