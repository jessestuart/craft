import { join } from 'path';
// tslint:disable-next-line:no-submodule-imports
import * as simpleGit from 'simple-git/promise';
import { Argv } from 'yargs';

import { getConfiguration } from '../config';
import logger from '../logger';
import { getDefaultBranch, getGithubClient } from '../utils/github_api';
import { spawnProcess } from '../utils/system';
import { isValidVersion } from '../utils/version';

export const command = ['release [part]', 'r'];
export const description = '🚢 Prepare a new release';

export const builder = (yargs: Argv) =>
  yargs
    .positional('part', {
      alias: 'p',
      choices: ['major', 'minor', 'patch'],
      default: 'patch',
      description: 'The part of the version to increase',
      type: 'string',
    })
    .option('new-version', {
      description: 'The new version to release',
      type: 'string',
    })
    .option('push-release-branch', {
      default: true,
      description: 'Push the release branch',
      type: 'boolean',
    });

/** Command line options. */
interface ReleaseOptions {
  part: string;
  newVersion?: string;
  pushReleaseBranch: boolean;
}

/** Default path to bump-version script, relative to project root */
const DEFAULT_BUMP_VERSION_PATH = join('scripts', 'bump-version.sh');

export const handler = async (argv: ReleaseOptions) => {
  try {
    logger.debug('Argv: ', JSON.stringify(argv));

    // Get repo configuration
    const config = getConfiguration() || {};
    const githubConfig = config.github;
    const githubClient = getGithubClient();

    const defaultBranch = await getDefaultBranch(
      githubClient,
      githubConfig.owner,
      githubConfig.repo
    );
    logger.debug(`Default branch for the repo:`, defaultBranch);

    // Check that we are on master
    const workingDir = process.cwd();
    const git = simpleGit(workingDir).silent(true);
    logger.debug(`Working directory:`, workingDir);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository!');
    }
    const repoStatus = await git.status();

    // TODO check what's here when we are in detached state
    const currentBranch = repoStatus.current;
    if (defaultBranch !== currentBranch) {
      throw new Error(
        `Please switch to your default branch (${defaultBranch}) first`
      );
    }
    if (
      repoStatus.conflicted.length ||
      repoStatus.created.length ||
      repoStatus.deleted.length ||
      repoStatus.modified.length ||
      repoStatus.renamed.length ||
      repoStatus.staged.length
    ) {
      logger.debug(JSON.stringify(repoStatus));
      throw new Error(
        'Your repository is in a dirty state. ' +
          'Please stash or commit the pending changes.'
      );
    }

    // TODO Bump the version
    const newVersion = argv.newVersion;
    if (!newVersion) {
      throw new Error('Not implemented: specify the new version');
    }

    if (!isValidVersion(newVersion)) {
      throw new Error(`Invalid version specified: ${newVersion}`);
    }

    // Create a new release branch. Throw an error if it already exists
    const branchName = `release/${newVersion}`;

    let branchHead;
    try {
      branchHead = await git.revparse([branchName]);
    } catch (e) {
      if (!e.message.match(/unknown revision/)) {
        throw e;
      }
      branchHead = '';
    }
    if (branchHead) {
      throw new Error(`Branch already exists: ${branchName}`);
    }

    await git.checkoutLocalBranch(branchName);
    logger.info(`Created a new release branch: ${branchName}`);

    // Run bump version script
    // TODO check that the script exists
    logger.info('Running a script for bumping versions...');
    await spawnProcess('bash', [DEFAULT_BUMP_VERSION_PATH]);

    if (argv.pushReleaseBranch) {
      logger.info('Pushing the release branch...');
      // TODO check remote somehow
      await git.push('origin', branchName, { '--set-upstream': true });
    } else {
      logger.info('Not pushing the release branch.');
    }
    logger.info('Done.');
  } catch (e) {
    logger.error(e);
  }
};