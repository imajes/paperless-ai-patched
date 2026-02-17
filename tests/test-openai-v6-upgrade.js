/**
 * Test script to verify OpenAI v6.x upgrade and GPT-5 model support
 */

console.log('=== OpenAI v6.x Upgrade Test ===\n');

// Test 1: Verify OpenAI package version
console.log('Test 1: Checking OpenAI package version');
try {
  const packageJson = require('../package.json');
  const openaiVersion = packageJson.dependencies.openai;
  console.log(`✓ OpenAI package version: ${openaiVersion}`);
  
  if (openaiVersion.includes('^6.') || openaiVersion.includes('6.')) {
    console.log('✓ OpenAI v6.x package is installed');
  } else {
    console.error('✗ OpenAI package is not v6.x');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Failed to check package.json:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Verify OpenAI client can be imported
console.log('Test 2: Importing OpenAI client');
try {
  const { OpenAI } = require('openai');
  console.log('✓ OpenAI client imported successfully');
  
  // Check if AzureOpenAI is also available
  const { AzureOpenAI } = require('openai');
  console.log('✓ AzureOpenAI client imported successfully');
} catch (error) {
  console.error('✗ Failed to import OpenAI:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Verify GPT-5 models in serviceUtils
console.log('Test 3: Checking GPT-5 model support in serviceUtils');
try {
  const fs = require('fs');
  const serviceUtilsContent = fs.readFileSync('./services/serviceUtils.js', 'utf8');
  
  const gpt5Models = ['gpt-5', 'gpt-5-nano', 'gpt-5-mini'];
  let allModelsFound = true;
  
  for (const model of gpt5Models) {
    if (serviceUtilsContent.includes(`'${model}'`)) {
      console.log(`✓ Model '${model}' found in serviceUtils.js`);
    } else {
      console.error(`✗ Model '${model}' NOT found in serviceUtils.js`);
      allModelsFound = false;
    }
  }
  
  if (allModelsFound) {
    console.log('✓ All GPT-5 models are present in serviceUtils.js');
  } else {
    console.error('✗ Some GPT-5 models are missing');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Failed to check serviceUtils.js:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 4: Verify default model is gpt-5-nano
console.log('Test 4: Checking default model configuration');
try {
  const fs = require('fs');
  const serviceUtilsContent = fs.readFileSync('./services/serviceUtils.js', 'utf8');
  
  if (serviceUtilsContent.includes('gpt-5-nano') && 
      serviceUtilsContent.match(/\|\|\s*["']gpt-5-nano["']/)) {
    console.log('✓ Default model is set to gpt-5-nano in serviceUtils.js');
  } else {
    console.error('✗ Default model is NOT set to gpt-5-nano');
    process.exit(1);
  }
  
  const envExampleContent = fs.readFileSync('./.env.example', 'utf8');
  if (envExampleContent.includes('OPENAI_MODEL=gpt-5-nano')) {
    console.log('✓ Default model is set to gpt-5-nano in .env.example');
  } else {
    console.error('✗ Default model is NOT set to gpt-5-nano in .env.example');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Failed to check default model:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 5: Verify view files contain GPT-5 models
console.log('Test 5: Checking GPT-5 models in view files');
try {
  const fs = require('fs');
  
  const settingsContent = fs.readFileSync('./views/settings.ejs', 'utf8');
  const setupContent = fs.readFileSync('./views/setup.ejs', 'utf8');
  
  const viewFiles = [
    { name: 'settings.ejs', content: settingsContent },
    { name: 'setup.ejs', content: setupContent }
  ];
  
  let allViewsUpdated = true;
  
  for (const viewFile of viewFiles) {
    if (viewFile.content.includes('gpt-5-nano') &&
        viewFile.content.includes('gpt-5-mini') &&
        viewFile.content.includes('value="gpt-5"')) {
      console.log(`✓ GPT-5 models found in ${viewFile.name}`);
    } else {
      console.error(`✗ GPT-5 models NOT found in ${viewFile.name}`);
      allViewsUpdated = false;
    }
    
    // Check if gpt-4o-mini is marked as legacy
    if (viewFile.content.includes('Legacy') || viewFile.content.includes('legacy')) {
      console.log(`✓ GPT-4o models marked as legacy in ${viewFile.name}`);
    } else {
      console.warn(`⚠ GPT-4o models not marked as legacy in ${viewFile.name}`);
    }
  }
  
  if (!allViewsUpdated) {
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Failed to check view files:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');

console.log('=== All Tests Passed! ===');
console.log('\nSummary:');
console.log('✓ OpenAI package upgraded to v6.x');
console.log('✓ OpenAI client can be imported');
console.log('✓ GPT-5 models added to serviceUtils.js');
console.log('✓ Default model set to gpt-5-nano');
console.log('✓ View files updated with GPT-5 models');
