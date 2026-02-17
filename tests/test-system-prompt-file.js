/**
 * Standalone test for system prompt file
 * Does not require config module - just verifies the file
 */

const path = require('path');
const fs = require('fs');

console.log('=== System Prompt File Validation ===\n');

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
    '# Field-specific rules',
    '## 1) language',
    '## 2) document_date',
    '## 3) document_type',
    '## 4) tags',
    '## 5) correspondent',
    '## 6) title'
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

// Test 4: Verify key instructions are present
console.log('\nTest 4: Check for key instructions in prompt');
const keyInstructions = [
    'document metadata extractor',
    'Paperless-ngx',
    'DOCUMENT_TEXT',
    'EXISTING_TAGS',
    'EXISTING_DOCUMENT_TYPES',
    'EXISTING_CORRESPONDENTS',
    'JSON object',
    'YYYY-MM-DD',
    'ISO-639-1',
    'exact string matches',
    'max 4, min 1'
];

let allInstructionsFound = true;
for (const instruction of keyInstructions) {
    if (promptContent.includes(instruction)) {
        console.log(`  ✓ Found: "${instruction}"`);
    } else {
        console.error(`  ✗ Missing: "${instruction}"`);
        allInstructionsFound = false;
    }
}

if (!allInstructionsFound) {
    process.exit(1);
}

// Test 5: Verify critical rules are present
console.log('\nTest 5: Check for critical rules');
const criticalRules = [
    'Output MUST be valid JSON',
    'Output ONLY the JSON object',
    'Do not invent details',
    'NO addresses',
    'prevents taxonomy drift',
    'prefer an exact match'
];

let allRulesFound = true;
for (const rule of criticalRules) {
    if (promptContent.includes(rule)) {
        console.log(`  ✓ Found rule: "${rule}"`);
    } else {
        console.error(`  ✗ Missing rule: "${rule}"`);
        allRulesFound = false;
    }
}

if (!allRulesFound) {
    process.exit(1);
}

// Test 6: Verify structure (starts with Role, ends with example)
console.log('\nTest 6: Check overall structure');
if (promptContent.trim().startsWith('# Role')) {
    console.log('  ✓ Prompt starts with "# Role"');
} else {
    console.error('  ✗ Prompt does not start with "# Role"');
    process.exit(1);
}

if (promptContent.includes('Now produce the JSON')) {
    console.log('  ✓ Prompt ends with instruction to produce JSON');
} else {
    console.error('  ✗ Prompt missing final instruction');
    process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log('🎉 ALL SYSTEM PROMPT FILE TESTS PASSED');
console.log('='.repeat(70));
console.log('\nValidation Summary:');
console.log(`✓ system-prompt.md file exists (${promptContent.length} characters)`);
console.log('✓ All 13 expected sections present');
console.log('✓ All 11 key instructions present');
console.log('✓ All 6 critical rules present');
console.log('✓ Proper structure (starts with Role, ends with instruction)');
console.log('\n✨ System prompt file is valid and ready to use!');
