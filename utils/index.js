const core = require('@actions/core');
const changes = require('./conventionalchanges');

/**
 * Run an async action and catch any exception.
 * @param action the action to run
 * @returns {Promise<void>}
 */
const run = async (action) => {
  try {
    await action();
  } catch (err) {
    core.setFailed(err.message);
  }
};

const checkEnv = (variables) => {
    variables.every((name) => {
      if (!process.env[name]) {
        throw new Error(`Missing env var: ${name}`);
      }
      return true;
    });
  };
  
  module.exports = {...changes,checkEnv,run};