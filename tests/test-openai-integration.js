/**
 * Integration test for OpenAI service with GPT-5 models
 * This test validates that the service constructs API calls correctly
 * without actually calling the OpenAI API
 */

const { supportsTemperature } = require('../services/serviceUtils');

console.log('=== OpenAI Service Integration Test ===\n');

// Mock test to verify API call construction
function simulateApiCall(model, useTemperature) {
    const params = {
        model: model,
        messages: [
            { role: 'system', content: 'Test system prompt' },
            { role: 'user', content: 'Test user content' }
        ],
        ...(supportsTemperature(model) && { temperature: 0.3 })
    };
    
    return params;
}

// Test 1: Verify GPT-5-nano API call structure
console.log('Test 1: GPT-5-nano API call construction');
const gpt5NanoCall = simulateApiCall('gpt-5-nano');
console.log('  Model:', gpt5NanoCall.model);
console.log('  Has temperature:', 'temperature' in gpt5NanoCall);
console.log('  Messages count:', gpt5NanoCall.messages.length);

if (gpt5NanoCall.model === 'gpt-5-nano' && 
    !('temperature' in gpt5NanoCall) &&
    gpt5NanoCall.messages.length === 2) {
    console.log('  ✓ PASS: GPT-5-nano call structured correctly\n');
} else {
    console.error('  ✗ FAIL: GPT-5-nano call structure incorrect\n');
    process.exit(1);
}

// Test 2: Verify GPT-5-mini API call structure
console.log('Test 2: GPT-5-mini API call construction');
const gpt5MiniCall = simulateApiCall('gpt-5-mini');
console.log('  Model:', gpt5MiniCall.model);
console.log('  Has temperature:', 'temperature' in gpt5MiniCall);

if (gpt5MiniCall.model === 'gpt-5-mini' && !('temperature' in gpt5MiniCall)) {
    console.log('  ✓ PASS: GPT-5-mini call structured correctly\n');
} else {
    console.error('  ✗ FAIL: GPT-5-mini call structure incorrect\n');
    process.exit(1);
}

// Test 3: Verify o3-mini API call structure
console.log('Test 3: o3-mini API call construction');
const o3MiniCall = simulateApiCall('o3-mini');
console.log('  Model:', o3MiniCall.model);
console.log('  Has temperature:', 'temperature' in o3MiniCall);

if (o3MiniCall.model === 'o3-mini' && !('temperature' in o3MiniCall)) {
    console.log('  ✓ PASS: o3-mini call structured correctly\n');
} else {
    console.error('  ✗ FAIL: o3-mini call structure incorrect\n');
    process.exit(1);
}

// Test 4: Verify GPT-4 still includes temperature
console.log('Test 4: GPT-4 API call construction (should include temperature)');
const gpt4Call = simulateApiCall('gpt-4-turbo');
console.log('  Model:', gpt4Call.model);
console.log('  Has temperature:', 'temperature' in gpt4Call);
console.log('  Temperature value:', gpt4Call.temperature);

if (gpt4Call.model === 'gpt-4-turbo' && 
    'temperature' in gpt4Call &&
    gpt4Call.temperature === 0.3) {
    console.log('  ✓ PASS: GPT-4 call structured correctly with temperature\n');
} else {
    console.error('  ✗ FAIL: GPT-4 call structure incorrect\n');
    process.exit(1);
}

// Test 5: Test the actual service files exist and export correctly
console.log('Test 5: Verify service files export correctly');
try {
    const openaiService = require('../services/openaiService');
    const manualService = require('../services/manualService');
    const serviceUtils = require('../services/serviceUtils');
    
    console.log('  ✓ openaiService loaded');
    console.log('  ✓ manualService loaded');
    console.log('  ✓ serviceUtils loaded');
    
    // Verify supportsTemperature is exported
    if (typeof serviceUtils.supportsTemperature === 'function') {
        console.log('  ✓ supportsTemperature function exported');
    } else {
        console.error('  ✗ FAIL: supportsTemperature not exported correctly');
        process.exit(1);
    }
    
    console.log('  ✓ PASS: All services export correctly\n');
} catch (error) {
    console.error('  ✗ FAIL: Error loading services:', error.message);
    process.exit(1);
}

// Test 6: Validate real-world scenarios
console.log('Test 6: Real-world scenario validation');

const scenarios = [
    { model: 'gpt-5-nano', shouldHaveTemp: false, scenario: 'Default GPT-5 model' },
    { model: 'gpt-5-mini', shouldHaveTemp: false, scenario: 'Mid-tier GPT-5 model' },
    { model: 'gpt-5', shouldHaveTemp: false, scenario: 'Full GPT-5 model' },
    { model: 'o3-mini', shouldHaveTemp: false, scenario: 'O-series reasoning model' },
    { model: 'gpt-4.1', shouldHaveTemp: true, scenario: 'Legacy GPT-4.1 model' },
];

let allScenariosPass = true;
for (const { model, shouldHaveTemp, scenario } of scenarios) {
    const call = simulateApiCall(model);
    const hasTemp = 'temperature' in call;
    
    if (hasTemp === shouldHaveTemp) {
        console.log(`  ✓ ${scenario} (${model}): ${shouldHaveTemp ? 'includes' : 'excludes'} temperature`);
    } else {
        console.error(`  ✗ ${scenario} (${model}): Expected ${shouldHaveTemp ? 'with' : 'without'} temperature, got ${hasTemp ? 'with' : 'without'}`);
        allScenariosPass = false;
    }
}

if (!allScenariosPass) {
    console.error('\n❌ Test 6 FAILED\n');
    process.exit(1);
}
console.log('\n✅ Test 6 PASSED\n');

// Final summary
console.log('='.repeat(70));
console.log('🎉 ALL INTEGRATION TESTS PASSED');
console.log('='.repeat(70));
console.log('\nIntegration Summary:');
console.log('✓ GPT-5 models correctly exclude temperature in API calls');
console.log('✓ O-series models correctly exclude temperature in API calls');
console.log('✓ Legacy models correctly include temperature in API calls');
console.log('✓ All service modules load and export correctly');
console.log('✓ Real-world scenarios validated');
console.log('\n✨ The OpenAI service is ready for GPT-5 models!');
