import assert from 'node:assert/strict';
import test from 'node:test';
import { utilityEntryExperimentSource as dataSectionSource } from './support/utility-entry-experiment-harness.js';

test('utility entry explicit save button requests saved popup for touched saves only', () => {
  assert.match(dataSectionSource, /function showUtilityEntryExperimentSavedPopup\(options = \{\}\)/);
  assert.match(dataSectionSource, /options\.showSavedPopup !== true/);
  assert.match(dataSectionSource, /showUtilityEntryExperimentSavedPopup\(options\)/);
  assert.match(dataSectionSource, /if \(!result\.touchedCount\) \{[\s\S]+return true;\s+\}/);
  assert.match(
    dataSectionSource,
    /saveUtilityEntryExperiment\(\s+host,\s+saveButton\.dataset\.utilityEntryExperimentPeriod \|\| 'daily',\s+\{ showSavedPopup: true \}\s+\)/
  );
});
