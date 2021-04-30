const core = require('@actions/core');
const github = require('@actions/github');
const WikiHelpers = require('./lib');

try {
  WikiHelpers.build({
      rootPath: core.getInput('rootPath'),
      resetOnly: core.getInput('resetOnly'),
      templatePath: core.getInput('templatePath'),
      depsTitleHook: core.getInput('depsTitleHook'),
      buildPath: core.getInput('buildPath'),
      flattenDir: core.getInput('flattenDir')
  });
} catch (error) {
  core.setFailed(error.message);
}