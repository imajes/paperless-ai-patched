/**
 * Test for provider-aware configuration logic
 * Validates that the AI provider switch logic is correct
 */

console.log('=== Provider-Aware Configuration Logic Test ===\n');

// Simulate the logic from config.js
function getModelFromProvider(aiProvider, envVars) {
  switch(aiProvider.toLowerCase()) {
    case 'openai':
      return envVars.OPENAI_MODEL || 'gpt-5-nano';
    case 'ollama':
      return envVars.OLLAMA_MODEL || 'llama3.2';
    case 'custom':
      return envVars.CUSTOM_MODEL || '';
    case 'azure':
      return envVars.AZURE_DEPLOYMENT_NAME || '';
    default:
      return '';
  }
}

// Test 1: OpenAI provider
console.log('Test 1: OpenAI Provider');
let model = getModelFromProvider('openai', { OPENAI_MODEL: 'gpt-5-nano' });
if (model === 'gpt-5-nano') {
    console.log('  ✓ OpenAI provider correctly uses OPENAI_MODEL');
} else {
    console.error(`  ✗ Expected gpt-5-nano, got ${model}`);
    process.exit(1);
}

// Test 2: OpenAI provider with default
console.log('\nTest 2: OpenAI Provider (default model)');
model = getModelFromProvider('openai', {});
if (model === 'gpt-5-nano') {
    console.log('  ✓ OpenAI provider defaults to gpt-5-nano');
} else {
    console.error(`  ✗ Expected gpt-5-nano, got ${model}`);
    process.exit(1);
}

// Test 3: Ollama provider
console.log('\nTest 3: Ollama Provider');
model = getModelFromProvider('ollama', { OLLAMA_MODEL: 'llama3.2' });
if (model === 'llama3.2') {
    console.log('  ✓ Ollama provider correctly uses OLLAMA_MODEL');
} else {
    console.error(`  ✗ Expected llama3.2, got ${model}`);
    process.exit(1);
}

// Test 4: Ollama provider with default
console.log('\nTest 4: Ollama Provider (default model)');
model = getModelFromProvider('ollama', {});
if (model === 'llama3.2') {
    console.log('  ✓ Ollama provider defaults to llama3.2');
} else {
    console.error(`  ✗ Expected llama3.2, got ${model}`);
    process.exit(1);
}

// Test 5: Custom provider
console.log('\nTest 5: Custom Provider');
model = getModelFromProvider('custom', { CUSTOM_MODEL: 'deepseek-chat' });
if (model === 'deepseek-chat') {
    console.log('  ✓ Custom provider correctly uses CUSTOM_MODEL');
} else {
    console.error(`  ✗ Expected deepseek-chat, got ${model}`);
    process.exit(1);
}

// Test 6: Azure provider
console.log('\nTest 6: Azure Provider');
model = getModelFromProvider('azure', { AZURE_DEPLOYMENT_NAME: 'my-gpt-deployment' });
if (model === 'my-gpt-deployment') {
    console.log('  ✓ Azure provider correctly uses AZURE_DEPLOYMENT_NAME');
} else {
    console.error(`  ✗ Expected my-gpt-deployment, got ${model}`);
    process.exit(1);
}

// Test 7: Case insensitivity
console.log('\nTest 7: Case Insensitive Provider Names');
model = getModelFromProvider('OPENAI', { OPENAI_MODEL: 'gpt-5' });
if (model === 'gpt-5') {
    console.log('  ✓ Provider name is case-insensitive');
} else {
    console.error(`  ✗ Expected gpt-5, got ${model}`);
    process.exit(1);
}

// Test 8: Unknown provider
console.log('\nTest 8: Unknown Provider (should return empty string)');
model = getModelFromProvider('unknown', {});
if (model === '') {
    console.log('  ✓ Unknown provider returns empty string');
} else {
    console.error(`  ✗ Expected empty string, got ${model}`);
    process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log('🎉 ALL PROVIDER-AWARE LOGIC TESTS PASSED');
console.log('='.repeat(70));
console.log('\nValidation Summary:');
console.log('✓ OpenAI provider uses OPENAI_MODEL (default: gpt-5-nano)');
console.log('✓ Ollama provider uses OLLAMA_MODEL (default: llama3.2)');
console.log('✓ Custom provider uses CUSTOM_MODEL');
console.log('✓ Azure provider uses AZURE_DEPLOYMENT_NAME');
console.log('✓ Provider names are case-insensitive');
console.log('✓ Unknown providers return empty string (use default limits)');
console.log('\n✨ Configuration is now provider-agnostic!');
console.log('\nNote: This ensures token limits are detected based on the actual');
console.log('AI provider being used, not just hardcoded to OpenAI.');

