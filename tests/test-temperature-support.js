/**
 * Functional test for temperature parameter support
 * This test validates that the supportsTemperature function works correctly
 * and that API calls are constructed properly for different model types
 */

const { supportsTemperature } = require('../services/serviceUtils');

console.log('=== Temperature Support Functional Test ===\n');

// Test 1: GPT-5 models should NOT support temperature
console.log('Test 1: GPT-5 models should NOT support temperature');
const gpt5Models = ['gpt-5', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5-standard', 'chatgpt-5o-latest', 'gpt-5-audio-preview'];
let allGpt5TestsPassed = true;

for (const model of gpt5Models) {
  const supports = supportsTemperature(model);
  if (supports) {
    console.error(`  ✗ FAIL: ${model} should NOT support temperature, but function returned true`);
    allGpt5TestsPassed = false;
  } else {
    console.log(`  ✓ PASS: ${model} correctly does NOT support temperature`);
  }
}

if (!allGpt5TestsPassed) {
  console.error('\n❌ Test 1 FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ Test 1 PASSED\n');
}

// Test 2: O-series models should NOT support temperature
console.log('Test 2: O-series models should NOT support temperature');
const oSeriesModels = ['o1', 'o1-2024-12-17', 'o1-preview', 'o1-mini', 'o3-mini', 'o3', 'o4-mini'];
let allOSeriesTestsPassed = true;

for (const model of oSeriesModels) {
  const supports = supportsTemperature(model);
  if (supports) {
    console.error(`  ✗ FAIL: ${model} should NOT support temperature, but function returned true`);
    allOSeriesTestsPassed = false;
  } else {
    console.log(`  ✓ PASS: ${model} correctly does NOT support temperature`);
  }
}

if (!allOSeriesTestsPassed) {
  console.error('\n❌ Test 2 FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ Test 2 PASSED\n');
}

// Test 3: GPT-4 and GPT-3.5 models SHOULD support temperature
console.log('Test 3: GPT-4 and GPT-3.5 models SHOULD support temperature');
const legacyModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4.1', 'gpt-4.5'];
let allLegacyTestsPassed = true;

for (const model of legacyModels) {
  const supports = supportsTemperature(model);
  if (!supports) {
    console.error(`  ✗ FAIL: ${model} SHOULD support temperature, but function returned false`);
    allLegacyTestsPassed = false;
  } else {
    console.log(`  ✓ PASS: ${model} correctly supports temperature`);
  }
}

if (!allLegacyTestsPassed) {
  console.error('\n❌ Test 3 FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ Test 3 PASSED\n');
}

// Test 4: Null/undefined model should default to supporting temperature
console.log('Test 4: Null/undefined model should default to supporting temperature');
const nullSupports = supportsTemperature(null);
const undefinedSupports = supportsTemperature(undefined);
const emptySupports = supportsTemperature('');

if (nullSupports && undefinedSupports && emptySupports) {
  console.log('  ✓ PASS: null/undefined/empty models default to supporting temperature');
  console.log('\n✅ Test 4 PASSED\n');
} else {
  console.error(`  ✗ FAIL: Default behavior incorrect. null=${nullSupports}, undefined=${undefinedSupports}, empty=${emptySupports}`);
  console.error('\n❌ Test 4 FAILED\n');
  process.exit(1);
}

// Test 5: Test API call object construction simulation
console.log('Test 5: API call object construction simulation');
const testApiCall = (model, expectedHasTemp) => {
  const apiCallParams = {
    model: model,
    messages: [{ role: 'user', content: 'test' }],
    ...(supportsTemperature(model) && { temperature: 0.3 })
  };
  
  const hasTemperature = 'temperature' in apiCallParams;
  if (hasTemperature === expectedHasTemp) {
    console.log(`  ✓ PASS: ${model} - temperature ${expectedHasTemp ? 'included' : 'excluded'} correctly`);
    return true;
  } else {
    console.error(`  ✗ FAIL: ${model} - temperature should be ${expectedHasTemp ? 'included' : 'excluded'}, but was ${hasTemperature ? 'included' : 'excluded'}`);
    return false;
  }
};

let apiConstructionTestsPassed = true;
apiConstructionTestsPassed &= testApiCall('gpt-5-nano', false);
apiConstructionTestsPassed &= testApiCall('gpt-5-mini', false);
apiConstructionTestsPassed &= testApiCall('o3-mini', false);
apiConstructionTestsPassed &= testApiCall('gpt-4-turbo', true);
apiConstructionTestsPassed &= testApiCall('gpt-3.5-turbo', true);

if (!apiConstructionTestsPassed) {
  console.error('\n❌ Test 5 FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ Test 5 PASSED\n');
}

// Final summary
console.log('='.repeat(70));
console.log('🎉 ALL TESTS PASSED');
console.log('='.repeat(70));
console.log('\nSummary:');
console.log('✓ GPT-5 models correctly exclude temperature parameter');
console.log('✓ O-series models correctly exclude temperature parameter');
console.log('✓ Legacy GPT-4/3.5 models correctly include temperature parameter');
console.log('✓ Default behavior handles null/undefined correctly');
console.log('✓ API call construction works as expected');
console.log('\nThe temperature support logic is functioning correctly!');
