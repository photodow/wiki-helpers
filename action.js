const core = require('@actions/core');
const github = require('@actions/github');
const WikiHelpers = require('./lib');
console.log('asdf');
try {
  WikiHelpers.build({
      rootPath: core.getInput('rootPath'),
      resetOnly: core.getInput('resetOnly'),
      templatePath: core.getInput('templatePath'),
      depsTitleHook: core.getInput('depsTitleHook'),
      buildPath: core.getInput('buildPath')
  });

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}