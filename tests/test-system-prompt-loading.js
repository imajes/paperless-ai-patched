/**
 * Test for system prompt loading from markdown file
 * Validates that the prompt is loaded correctly from system-prompt.md
 */

const path = require('path');
const fs = require('fs');

console.log('=== System Prompt Loading Test ===\n');

// Test 1: Verify system-prompt.md file exists
console.log('Test 1: Check system-prompt.md file exists');
const promptPath = path.join(__dirname, '..', 'system-prompt.md');
try {
    fs.accessSync(promptPath, fs.constants.R_OK);
    console.log('  ✓ system-prompt.md file exists and is readable');
} catch (err) {
    console.error('  ✗ system-prompt.md file not found or not readable');
    process.exit(1);
}

// Test 2: Verify file content is not empty
console.log('\nTest 2: Check system-prompt.md has content');
const promptContent = fs.readFileSync(promptPath, 'utf8');
if (promptContent && promptContent.trim().length > 0) {
    console.log(`  ✓ system-prompt.md has ${promptContent.length} characters`);
} else {
    console.error('  ✗ system-prompt.md is empty');
    process.exit(1);
}

// Test 3: Verify prompt contains expected sections
console.log('\nTest 3: Check for expected sections in prompt');
const expectedSections = [
    '# Role',
    '# Inputs',
    '# Output (JSON only)',
    '# Hard output rules',
    '# Language policy',
    '# Exact-match rules',
    '# Field-specific rules'
];

let allSectionsFound = true;
for (const section of expectedSections) {
    if (promptContent.includes(section)) {
        console.log(`  ✓ Found section: ${section}`);
    } else {
        console.error(`  ✗ Missing section: ${section}`);
        allSectionsFound = false;
    }
}

if (!allSectionsFound) {
    process.exit(1);
}

// Test 4: Verify config loads the prompt correctly
console.log('\nTest 4: Check config loads prompt from file');
// Clear require cache to force fresh load
delete require.cache[require.resolve('../config/config')];
const config = require('../config/config');

if (config.systemPrompt && config.systemPrompt.length > 0) {
    console.log(`  ✓ Config loaded system prompt (${config.systemPrompt.length} characters)`);
} else {
    console.error('  ✗ Config did not load system prompt');
    process.exit(1);
}

// Test 5: Verify loaded prompt matches file content
console.log('\nTest 5: Verify loaded prompt matches file');
if (config.systemPrompt.trim() === promptContent.trim()) {
    console.log('  ✓ Loaded prompt matches file content exactly');
} else {
    console.error('  ✗ Loaded prompt does not match file content');
    console.error(`  Expected length: ${promptContent.trim().length}`);
    console.error(`  Actual length: ${config.systemPrompt.trim().length}`);
    process.exit(1);
}

// Test 6: Verify prompt contains key instructions
console.log('\nTest 6: Check for key instructions in loaded prompt');
const keyInstructions = [
    'document metadata extractor',
    'DOCUMENT_TEXT',
    'EXISTING_TAGS',
    'JSON object',
    'YYYY-MM-DD',
    'ISO-639-1'
];

let allInstructionsFound = true;
for (const instruction of keyInstructions) {
    if (config.systemPrompt.includes(instruction)) {
        console.log(`  ✓ Found instruction: "${instruction}"`);
    } else {
        console.error(`  ✗ Missing instruction: "${instruction}"`);
        allInstructionsFound = false;
    }
}

if (!allInstructionsFound) {
    process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log('🎉 ALL SYSTEM PROMPT TESTS PASSED');
console.log('='.repeat(70));
console.log('\nValidation Summary:');
console.log('✓ system-prompt.md file exists and is readable');
console.log('✓ File contains all expected sections');
console.log('✓ Config successfully loads prompt from file');
console.log('✓ Loaded prompt matches file content');
console.log('✓ All key instructions present');
console.log('\n✨ System prompt successfully extracted to markdown file!');
