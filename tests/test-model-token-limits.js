/**
 * Test for model-specific token limits
 * Validates that getModelTokenLimits returns correct context windows and output limits
 */

const { getModelTokenLimits } = require('../services/serviceUtils');

console.log('=== Model Token Limits Test ===\n');

// Test data: model name -> expected limits
const testCases = [
    // GPT-5 family (current generation)
    { model: 'gpt-5', expected: { contextWindow: 1000000, maxOutputTokens: 16384 } },
    { model: 'gpt-5-standard', expected: { contextWindow: 1000000, maxOutputTokens: 16384 } },
    { model: 'gpt-5-nano', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'gpt-5-mini', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'chatgpt-5o-latest', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'gpt-5-audio-preview', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    
    // O3-mini (current reasoning model)
    { model: 'o3-mini', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    
    // GPT-4.5 family (current)
    { model: 'gpt-4.5', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'gpt-4.5-preview', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'gpt-4.5-preview-2025-02-27', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    
    // GPT-4.1 family (current)
    { model: 'gpt-4.1', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'gpt-4.1-mini', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'gpt-4.1-nano', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    
    // Default/unknown model
    { model: 'unknown-model', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'custom-llama-model', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: null, expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: '', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
];

let passedTests = 0;
let failedTests = 0;

console.log('Testing model token limits...\n');

for (const { model, expected } of testCases) {
    const result = getModelTokenLimits(model);
    const displayModel = model || '(null/empty)';
    
    if (result.contextWindow === expected.contextWindow && 
        result.maxOutputTokens === expected.maxOutputTokens) {
        console.log(`✓ PASS: ${displayModel}`);
        console.log(`  Context: ${result.contextWindow.toLocaleString()}, Output: ${result.maxOutputTokens.toLocaleString()}`);
        passedTests++;
    } else {
        console.error(`✗ FAIL: ${displayModel}`);
        console.error(`  Expected: Context ${expected.contextWindow.toLocaleString()}, Output ${expected.maxOutputTokens.toLocaleString()}`);
        console.error(`  Got:      Context ${result.contextWindow.toLocaleString()}, Output ${result.maxOutputTokens.toLocaleString()}`);
        failedTests++;
    }
}

console.log('\n' + '='.repeat(70));
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests > 0) {
    console.error('\n❌ SOME TESTS FAILED');
    process.exit(1);
} else {
    console.log('\n✅ ALL TESTS PASSED');
}

// Additional validation test - ensure GPT-5 models have the highest limits
console.log('\n' + '='.repeat(70));
console.log('Validation: GPT-5 models should have higher limits');

const gpt5Limits = getModelTokenLimits('gpt-5');
const gpt5NanoLimits = getModelTokenLimits('gpt-5-nano');
const gpt45Limits = getModelTokenLimits('gpt-4.5');

if (gpt5Limits.contextWindow === 1000000) {
    console.log(`✓ GPT-5 has 1M context window (${gpt5Limits.contextWindow.toLocaleString()})`);
} else {
    console.error(`✗ GPT-5 should have 1M context window`);
    process.exit(1);
}

if (gpt5NanoLimits.contextWindow === 200000) {
    console.log(`✓ GPT-5 Nano has 200K context window (${gpt5NanoLimits.contextWindow.toLocaleString()})`);
} else {
    console.error(`✗ GPT-5 Nano should have 200K context window`);
    process.exit(1);
}

if (gpt5Limits.contextWindow > gpt45Limits.contextWindow) {
    console.log(`✓ GPT-5 context (${gpt5Limits.contextWindow.toLocaleString()}) > GPT-4.5 (${gpt45Limits.contextWindow.toLocaleString()})`);
} else {
    console.error(`✗ GPT-5 context should be higher than GPT-4.5`);
    process.exit(1);
}

console.log('\n🎉 All validation checks passed!');
console.log('\nToken limit system is working correctly for all current models.');
console.log('Note: Deprecated models (GPT-4, GPT-3.5, o1, o4) are no longer supported.');

