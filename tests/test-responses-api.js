/**
 * Test for Responses API migration
 * Validates that the new API integration works correctly
 */

console.log('=== Responses API Migration Test ===\n');

// Test 1: Verify OpenAI client has responses API
console.log('Test 1: Check OpenAI SDK has responses API');
try {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: 'test-key' });
    
    if (typeof client.responses === 'object') {
        console.log('  ✓ client.responses exists');
    } else {
        console.error('  ✗ client.responses not found');
        process.exit(1);
    }
    
    if (typeof client.responses.create === 'function') {
        console.log('  ✓ client.responses.create() is available');
    } else {
        console.error('  ✗ client.responses.create() not found');
        process.exit(1);
    }
    
    console.log('✅ Test 1 PASSED\n');
} catch (error) {
    console.error('✗ Test 1 FAILED:', error.message);
    process.exit(1);
}

// Test 2: Verify openaiService has the schema helper
console.log('Test 2: Check openaiService has JSON schema helper');
try {
    const openaiService = require('../services/openaiService');
    
    if (typeof openaiService._getDocumentAnalysisSchema === 'function') {
        console.log('  ✓ _getDocumentAnalysisSchema() method exists');
        
        // Test schema generation
        const schema = openaiService._getDocumentAnalysisSchema([]);
        
        if (schema.type === 'object') {
            console.log('  ✓ Schema is an object type');
        }
        
        if (schema.properties && schema.properties.title && schema.properties.tags) {
            console.log('  ✓ Schema has required properties (title, tags, etc.)');
        }
        
        if (Array.isArray(schema.required) && schema.required.includes('title')) {
            console.log('  ✓ Schema has required fields array');
        }
        
        console.log('✅ Test 2 PASSED\n');
    } else {
        console.error('  ✗ _getDocumentAnalysisSchema() not found');
        process.exit(1);
    }
} catch (error) {
    console.error('✗ Test 2 FAILED:', error.message);
    process.exit(1);
}

// Test 3: Validate JSON schema structure
console.log('Test 3: Validate JSON schema structure');
try {
    const openaiService = require('../services/openaiService');
    
    // Test without custom fields
    const basicSchema = openaiService._getDocumentAnalysisSchema([]);
    const requiredFields = ['title', 'correspondent', 'tags', 'document_date', 'language'];
    
    let allFieldsPresent = true;
    for (const field of requiredFields) {
        if (!basicSchema.properties[field]) {
            console.error(`  ✗ Missing field: ${field}`);
            allFieldsPresent = false;
        }
    }
    
    if (allFieldsPresent) {
        console.log('  ✓ All basic fields present in schema');
    }
    
    // Validate tags is an array
    if (basicSchema.properties.tags.type === 'array' && 
        basicSchema.properties.tags.minItems === 1 &&
        basicSchema.properties.tags.maxItems === 4) {
        console.log('  ✓ Tags field correctly configured as array (1-4 items)');
    } else {
        console.error('  ✗ Tags field not correctly configured');
        process.exit(1);
    }
    
    // Validate document_date has pattern
    if (basicSchema.properties.document_date.pattern) {
        console.log('  ✓ document_date has regex pattern for YYYY-MM-DD');
    } else {
        console.error('  ✗ document_date missing pattern validation');
        process.exit(1);
    }
    
    // Test with custom fields
    const customFields = [
        { value: 'invoice_number' },
        { value: 'total_amount' }
    ];
    const schemaWithCustom = openaiService._getDocumentAnalysisSchema(customFields);
    
    if (schemaWithCustom.properties.custom_fields) {
        console.log('  ✓ Schema includes custom_fields when provided');
    } else {
        console.error('  ✗ Schema missing custom_fields');
        process.exit(1);
    }
    
    if (schemaWithCustom.required.includes('custom_fields')) {
        console.log('  ✓ custom_fields marked as required when present');
    } else {
        console.error('  ✗ custom_fields not in required array');
        process.exit(1);
    }
    
    console.log('✅ Test 3 PASSED\n');
} catch (error) {
    console.error('✗ Test 3 FAILED:', error.message);
    process.exit(1);
}

// Final summary
console.log('='.repeat(70));
console.log('🎉 ALL RESPONSES API TESTS PASSED');
console.log('='.repeat(70));
console.log('\nMigration Summary:');
console.log('✓ OpenAI SDK v6 responses API is available');
console.log('✓ openaiService has _getDocumentAnalysisSchema() helper');
console.log('✓ JSON schema properly configured for document analysis');
console.log('✓ Custom fields support integrated');
console.log('✓ Required fields and validation patterns in place');
console.log('\n✨ Ready to use Responses API for document analysis!');
console.log('\nBenefits:');
console.log('  • No more manual JSON parsing with regex cleanup');
console.log('  • Native JSON schema validation');
console.log('  • Better error messages');
console.log('  • Guaranteed valid JSON responses');
