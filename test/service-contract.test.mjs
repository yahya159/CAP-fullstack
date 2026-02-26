import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const buildAndReadMetadata = () => {
  execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
  const metadataPath = join(projectRoot, 'gen', 'srv', 'srv', 'odata', 'v4', 'PerformanceService.xml');
  return readFileSync(metadataPath, 'utf8');
};

test('metadata exposes required bound actions for frontend endpoints', () => {
  const xml = buildAndReadMetadata();

  const boundValidateCount = (xml.match(/<Action Name="validate" IsBound="true"/g) ?? []).length;
  const boundRejectCount = (xml.match(/<Action Name="reject" IsBound="true"/g) ?? []).length;

  assert.ok(boundValidateCount >= 2, 'Expected bound validate actions for Imputations and ImputationPeriods');
  assert.ok(boundRejectCount >= 2, 'Expected bound reject actions for Imputations and ImputationPeriods');
  assert.match(xml, /<Action Name="submit" IsBound="true"/);
  assert.match(xml, /<Action Name="sendToStraTIME" IsBound="true"/);
});

test('metadata does not expose unbound action imports for validate/reject', () => {
  const xml = buildAndReadMetadata();

  assert.doesNotMatch(xml, /<ActionImport Name="validate"/);
  assert.doesNotMatch(xml, /<ActionImport Name="reject"/);
});
