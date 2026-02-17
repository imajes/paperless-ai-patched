/**
 * Test for model-specific token limits
 * Validates that getModelTokenLimits returns correct context windows and output limits
 */

const { getModelTokenLimits } = require('../services/serviceUtils');

console.log('=== Model Token Limits Test ===\n');

// Test data: model name -> expected limits
const testCases = [
    // GPT-5 family
    { model: 'gpt-5', expected: { contextWindow: 1000000, maxOutputTokens: 16384 } },
    { model: 'gpt-5-standard', expected: { contextWindow: 1000000, maxOutputTokens: 16384 } },
    { model: 'gpt-5-nano', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'gpt-5-mini', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'chatgpt-5o-latest', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    
    // O-series models
    { model: 'o1', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'o1-2024-12-17', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'o1-preview', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'o1-mini', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'o3-mini', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    { model: 'o3', expected: { contextWindow: 200000, maxOutputTokens: 8192 } },
    
    // GPT-4.5 family
    { model: 'gpt-4.5', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'gpt-4.5-preview', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    
    // GPT-4.1 family
    { model: 'gpt-4.1', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    { model: 'gpt-4.1-mini', expected: { contextWindow: 128000, maxOutputTokens: 8192 } },
    
    // GPT-4 Turbo
    { model: 'gpt-4-turbo', expected: { contextWindow: 128000, maxOutputTokens: 4096 } },
    { model: 'gpt-4-turbo-preview', expected: { contextWindow: 128000, maxOutputTokens: 4096 } },
    { model: 'gpt-4-1106-preview', expected: { contextWindow: 128000, maxOutputTokens: 4096 } },
    
    // GPT-4 32k
    { model: 'gpt-4-32k', expected: { contextWindow: 32768, maxOutputTokens: 4096 } },
    
    // Base GPT-4
    { model: 'gpt-4', expected: { contextWindow: 8192, maxOutputTokens: 4096 } },
    
    // GPT-3.5
    { model: 'gpt-3.5-turbo', expected: { contextWindow: 16385, maxOutputTokens: 4096 } },
    { model: 'gpt-3.5-turbo-16k', expected: { contextWindow: 16385, maxOutputTokens: 4096 } },
    
    // Default/unknown model
    { model: 'unknown-model', expected: { contextWindow: 128000, maxOutputTokens: 4096 } },
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

// Additional validation test - ensure GPT-5 models have significantly higher limits
console.log('\n' + '='.repeat(70));
console.log('Validation: GPT-5 models should have higher limits than GPT-4');

const gpt5Limits = getModelTokenLimits('gpt-5-nano');
const gpt4Limits = getModelTokenLimits('gpt-4-turbo');

if (gpt5Limits.contextWindow > gpt4Limits.contextWindow) {
    console.log(`✓ GPT-5 Nano context (${gpt5Limits.contextWindow.toLocaleString()}) > GPT-4 Turbo (${gpt4Limits.contextWindow.toLocaleString()})`);
} else {
    console.error(`✗ GPT-5 Nano context should be higher than GPT-4 Turbo`);
    process.exit(1);
}

const gpt5StandardLimits = getModelTokenLimits('gpt-5');
if (gpt5StandardLimits.contextWindow === 1000000) {
    console.log(`✓ GPT-5 has 1M context window (${gpt5StandardLimits.contextWindow.toLocaleString()})`);
} else {
    console.error(`✗ GPT-5 should have 1M context window`);
    process.exit(1);
}

console.log('\n🎉 All validation checks passed!');
console.log('\nToken limit system is working correctly for all supported models.');
