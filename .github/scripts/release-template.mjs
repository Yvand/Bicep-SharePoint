import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const readText = path => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function releaseNotes(tag, changelogPath) {
  const match = /^v((?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))$/.exec(tag);
  if (!match || match[0] !== tag) throw new Error('Expected a stable tag in vX.Y.Z format.');

  const version = match[1];
  const heading = new RegExp(`^${version.replaceAll('.', '\\.')}(?: - [0-9]{4}-[0-9]{2}-[0-9]{2})?$`);
  const sections = readText(changelogPath).split(/^## /m).slice(1);
  const matches = sections.filter(section => heading.test(section.split('\n', 1)[0]));
  if (matches.length !== 1) throw new Error(`Expected exactly one changelog section for ${version}.`);

  const notes = matches[0].slice(matches[0].indexOf('\n') + 1).trim();
  if (!matches[0].includes('\n') || !notes) throw new Error(`Changelog notes for ${version} are empty.`);
  return { version, notes };
}

function validate(changelogPath, generatedPath, trackedPath) {
  const json = readText(generatedPath);
  const template = JSON.parse(json);
  if (!isObject(template) ||
      typeof template.$schema !== 'string' ||
      !/^https:\/\/schema\.management\.azure\.com\/schemas\/[^/]+\/deploymentTemplate\.json#$/.test(template.$schema) ||
      typeof template.contentVersion !== 'string' ||
      !/^[0-9]+(?:\.[0-9]+){3}$/.test(template.contentVersion) ||
      !(Array.isArray(template.resources) || isObject(template.resources)) ||
      Object.keys(template.resources).length === 0) {
    throw new Error('Generated file is not a valid ARM template structure.');
  }
  if (typeof template.metadata?.version !== 'string') {
    throw new Error('Generated template metadata.version must be a SemVer string.');
  }
  const tag = `v${template.metadata.version}`;
  releaseNotes(tag, changelogPath);
  if (json !== readText(trackedPath)) {
    throw new Error('Tracked azuredeploy.json is stale. Regenerate it with the release compiler.');
  }
  console.log(`${tag} ${sha256(generatedPath)}`);
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'validate') {
    validate(...args);
  } else if (command === 'notes') {
    console.log(releaseNotes(...args).notes);
  } else if (command === 'verify') {
    const [path, expected] = args;
    if (!expected || sha256(path) !== expected) throw new Error('ARM artifact SHA-256 verification failed.');
  } else {
    throw new Error(`Unknown release command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
