/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Craft project-specific configuration
 */
export interface CraftProjectConfig {
  github: GithubGlobalConfig;
  targets?: TargetConfig[];
  preReleaseCommand?: string;
  changelog?: string;
  changelogPolicy?: ChangelogPolicy;
}
/**
 * Global (non-target!) GitHub configuration for the project
 */
export interface GithubGlobalConfig {
  owner: string;
  repo: string;
}
/**
 * Generic target configuration
 */
export interface TargetConfig {
  name?: string;
  includeFiles?: string;
  excludeFiles?: string;
  [k: string]: any;
}

/**
 * Different policies for changelog management
 */
export const enum ChangelogPolicy {
  Simple = 'simple',
  None = 'none',
}