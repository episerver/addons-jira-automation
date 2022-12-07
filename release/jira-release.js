const core = require('@actions/core');
const JiraClient = require('jira-client');
const semver = require('semver');
const { findJiraChanges } = require('../releasenotes/jira-releasenotes');

const releaseName = (projectKey, component, version, package) => {
  const release = [package ?? projectKey];
  if (component) {
    release.push(`(${component})`);
  }

  const cleanVersion = semver.clean(version);
  if (cleanVersion === null) {
    throw new Error(`'${version}' is not a semantic version`);
  }

  release.push(cleanVersion);
  return release.join(' ');
};

const getOrCreateRelease = async (client, { key, id }, name) => {
  const releases = await client.getVersions(key);
  const existingRelease = releases.find((release) => release.name === name);
  if (existingRelease) {
    core.info(
      `JIRA Release '${name}' already exists and is ${existingRelease.released ? 'released' : 'unreleased'}`,
    );
    return existingRelease;
  }
  core.info(`Create new JIRA release '${name}'`);
  return client.createVersion({
    name,
    description: 'Created by GitHub Actions.',
    projectId: id,
  });
};

const createUpdate = ({ id }, pkgVer) => ({
  update: {
    fixVersions: [
      { add: { id } },
    ],
    customfield_10018: [{ set: pkgVer }]
  },
});

const createJiraRelease = async ({
  protocol,
  host,
  projectKey,
  component,
  version,
  package,
  versionSuffix
}) => {
  const client = new JiraClient({
    protocol,
    host,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD,
    apiVersion: '2',
    strictSSL: protocol === 'https',
  });

  const name = releaseName(projectKey, component, version, package);

  const project = await client.getProject(projectKey);

  if (component && !project.components.find((list) => list.name === component)) {
    throw new Error(`'${component}' is not a valid JIRA component in project '${projectKey}'`);
  }

  const release = await getOrCreateRelease(client, project, name);

  const changes = await findJiraChanges(projectKey);
  const requests = [];
  // Object.keys(changes).forEach((issueKey) => {
  //   requests.push(
  //     client.updateIssue(issueKey, createUpdate(release)).then(() => {
  //       core.info(`Issue ${issueKey} was updated with fix version`);
  //     }),
  //   );
  // });

  Object.keys(changes).forEach((issueKey) => {
    const change = changes[issueKey];
    requests.push(client.getIssue(issueKey,`customfield_10018, parent, summary, fixVersions, resolution, status`)
      .then((issue) => {
        //ignore sub tasks/issues, ignore issues have fixVersions
        //core.info(JSON.stringify(issue));
        if((issue.fields.parent === null || issue.fields.parent === undefined)
          && issue.fields.fixVersions.length === 0){
            //core.info(JSON.stringify(issue));
            const update = createUpdate(release, `${package}.${version}${versionSuffix}`);
            return client.updateIssue(issueKey, update).then(() => {
              core.info(`Issue ${issueKey} was updated with a release note`);
            });
        }
        // if (issue.fields[releaseNoteFieldId] === null) {
        //   const update = createUpdate(change, releaseNoteFieldId);
        //   return client.updateIssue(issueKey, update).then(() => {
        //     core.info(`Issue ${issueKey} was updated with a release note`);
        //   });
        // }
        // core.info(`Skip issue ${issueKey}. It already has a release note`);
        return null;
      }));
  });

  await Promise.all(requests);

  if (!release.released) {
    core.info(`Release version ${name}`);
    await client.updateVersion({
      id: release.id,
      projectId: release.projectId,
      //releaseDate: new Date().toISOString().split('T')[0],
      released: false,
    }).then(() => {
      core.info(`Version ${name} is now created to release`);
    }).catch((err) => {
      core.error(`Failed to release version ${name}. It must be manually released in JIRA. Reason: ${err.message}`);
      return null;
    });
  } else {
    core.warning(`Version ${name} was already released in JIRA`);
  }

  // Return the release name
  return name;
};

module.exports = {
  createJiraRelease,
};
