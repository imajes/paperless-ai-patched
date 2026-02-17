const tiktoken = require('tiktoken');
const fs = require('fs').promises;
const path = require('path');

/**
 * Check if a model supports the temperature parameter
 * GPT-5 models and o3-mini do not support temperature
 * @param {string} model - The model name to check
 * @returns {boolean} - True if the model supports temperature
 */
function supportsTemperature(model) {
    if (!model) return true; // Default to true if no model specified
    
    // Models that do NOT support temperature parameter
    const noTemperatureModels = [
        // GPT-5 family does not support temperature
        'gpt-5', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5-standard',
        'chatgpt-5o-latest', 'gpt-5-audio-preview',
        // O3-mini does not support temperature
        'o3-mini'
    ];
    
    // Check if the model matches any of the no-temperature models
    return !noTemperatureModels.some(noTempModel => model.includes(noTempModel));
}

/**
 * Get token limits for a specific model
 * Returns context window size and max output tokens based on model capabilities
 * @param {string} model - The model name
 * @returns {Object} - Object with contextWindow and maxOutputTokens
 */
function getModelTokenLimits(model) {
    if (!model) {
        // Default to gpt-5-nano limits
        return { contextWindow: 200000, maxOutputTokens: 8192 };
    }
    
    const modelLower = model.toLowerCase();
    
    // GPT-5 family - highest context windows
    if (modelLower.includes('gpt-5-standard') || modelLower === 'gpt-5') {
        return { contextWindow: 1000000, maxOutputTokens: 16384 };
    }
    if (modelLower.includes('gpt-5-nano') || modelLower.includes('gpt-5-mini') || 
        modelLower.includes('chatgpt-5o-latest') || modelLower.includes('gpt-5-audio-preview')) {
        return { contextWindow: 200000, maxOutputTokens: 8192 };
    }
    
    // O3-mini model
    if (modelLower.includes('o3-mini')) {
        return { contextWindow: 200000, maxOutputTokens: 8192 };
    }
    
    // GPT-4.5 family
    if (modelLower.includes('gpt-4.5')) {
        return { contextWindow: 128000, maxOutputTokens: 8192 };
    }
    
    // GPT-4.1 family
    if (modelLower.includes('gpt-4.1')) {
        return { contextWindow: 128000, maxOutputTokens: 8192 };
    }
    
    // Default fallback - conservative limits for unknown/custom models
    return { contextWindow: 200000, maxOutputTokens: 8192 };
}

// Map non-OpenAI models to compatible OpenAI encodings or use estimation
function getCompatibleModel(model) {
    const openaiModels = [
        // GPT-5 family (5o series)
        'gpt-5', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5-standard',
        'chatgpt-5o-latest', 'gpt-5-audio-preview',
        
        // GPT-4.1 family
        'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
        
        // GPT-4.5 family
        'gpt-4.5-preview-2025-02-27', 'gpt-4.5-preview', 'gpt-4.5',
        
        // O3-mini model
        'o3-mini'
    ];
    
    // If it's a known OpenAI model, return as-is
    if (openaiModels.some(openaiModel => model.includes(openaiModel))) {
        return model;
    }
    
    // For all other models (Llama, Claude, etc.), return null to use estimation
    return null;
}

// Estimate tokens for non-OpenAI models using character-based approximation
function estimateTokensForNonOpenAI(text) {
    // Rough approximation: 1 token ≈ 4 characters for most models
    // This is conservative and works reasonably well for Llama models
    return Math.ceil(text.length / 4);
}

// Calculate tokens for a given text
async function calculateTokens(text, model = process.env.OPENAI_MODEL || "gpt-5-nano") {
    try {
        const compatibleModel = getCompatibleModel(model);
        
        if (!compatibleModel) {
            // Non-OpenAI model - use character-based estimation
            console.log(`[DEBUG] Using character-based token estimation for model: ${model}`);
            return estimateTokensForNonOpenAI(text);
        }
        
        // OpenAI model - use tiktoken
        const tokenizer = tiktoken.encoding_for_model(compatibleModel);
        const tokens = tokenizer.encode(text);
        const tokenCount = tokens.length;
        tokenizer.free();
        
        return tokenCount;
        
    } catch (error) {
        console.warn(`[WARNING] Tiktoken failed for model ${model}, falling back to character estimation:`, error.message);
        return estimateTokensForNonOpenAI(text);
    }
}

// Calculate total tokens for a system prompt and additional prompts
async function calculateTotalPromptTokens(systemPrompt, additionalPrompts = [], model = process.env.OPENAI_MODEL || "gpt-5-nano") {
    let totalTokens = 0;

    // Count tokens for system prompt
    totalTokens += await calculateTokens(systemPrompt, model);

    // Count tokens for additional prompts
    for (const prompt of additionalPrompts) {
        if (prompt) { // Only count if prompt exists
            totalTokens += await calculateTokens(prompt, model);
        }
    }

    // Add tokens for message formatting (approximately 4 tokens per message)
    const messageCount = 1 + additionalPrompts.filter(p => p).length; // Count system + valid additional prompts
    totalTokens += messageCount * 4;

    return totalTokens;
}

// Truncate text to fit within token limit
async function truncateToTokenLimit(text, maxTokens, model = process.env.OPENAI_MODEL || "gpt-5-nano") {
    try {
        const compatibleModel = getCompatibleModel(model);
        
        if (!compatibleModel) {
            // Non-OpenAI model - use character-based estimation
            console.log(`[DEBUG] Using character-based truncation for model: ${model}`);
            
            const estimatedTokens = estimateTokensForNonOpenAI(text);
            
            if (estimatedTokens <= maxTokens) {
                return text;
            }
            
            // Truncate based on character estimation (conservative approach)
            const maxChars = maxTokens * 4; // 4 chars per token approximation
            const truncatedText = text.substring(0, maxChars);
            
            // Try to break at a word boundary if possible
            const lastSpaceIndex = truncatedText.lastIndexOf(' ');
            if (lastSpaceIndex > maxChars * 0.8) { // Only if we don't lose too much text
                return truncatedText.substring(0, lastSpaceIndex);
            }
            
            return truncatedText;
        }
        
        // OpenAI model - use tiktoken
        const tokenizer = tiktoken.encoding_for_model(compatibleModel);
        const tokens = tokenizer.encode(text);
      
        if (tokens.length <= maxTokens) {
            tokenizer.free();
            return text;
        }
      
        const truncatedTokens = tokens.slice(0, maxTokens);
        const truncatedText = tokenizer.decode(truncatedTokens);
        tokenizer.free();
        
        // No need for TextDecoder here, tiktoken.decode() returns a string
        return truncatedText;
        
    } catch (error) {
        console.warn(`[WARNING] Token truncation failed for model ${model}, falling back to character estimation:`, error.message);
        
        // Fallback to character-based estimation
        const estimatedTokens = estimateTokensForNonOpenAI(text);
        
        if (estimatedTokens <= maxTokens) {
            return text;
        }
        
        const maxChars = maxTokens * 4;
        const truncatedText = text.substring(0, maxChars);
        
        // Try to break at a word boundary if possible
        const lastSpaceIndex = truncatedText.lastIndexOf(' ');
        if (lastSpaceIndex > maxChars * 0.8) {
            return truncatedText.substring(0, lastSpaceIndex);
        }
        
        return truncatedText;
    }
}

// Write prompt and content to a file with size management
async function writePromptToFile(systemPrompt, truncatedContent, filePath = './logs/prompt.txt', maxSize = 10 * 1024 * 1024) {
    try {
        // Ensure the logs directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Check file size and manage it
        try {
            const stats = await fs.stat(filePath);
            if (stats.size > maxSize) {
                await fs.unlink(filePath); // Delete the file if it exceeds max size
                console.log(`[DEBUG] Cleared log file ${filePath} due to size limit`);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn('[WARNING] Error checking file size:', error);
            }
        }

        // Write the content with timestamp
        const timestamp = new Date().toISOString();
        const content = `\n=== ${timestamp} ===\nSYSTEM PROMPT:\n${systemPrompt}\n\nUSER CONTENT:\n${truncatedContent}\n\n`;
        
        await fs.appendFile(filePath, content);
    } catch (error) {
        console.error('[ERROR] Error writing to file:', error);
    }
}

/**
 * Validates a URL string to prevent Server-Side Request Forgery (SSRF) attacks.
 * 
 * @param {string} urlString - The URL string to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowPrivateIPs - Allow private IP addresses (default: false)
 * @param {string[]} options.allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @returns {{ valid: boolean, url?: URL, error?: string }} Validation result with parsed URL if valid
 */
function validateUrl(urlString, options = {}) {
    const {
        allowPrivateIPs = false,
        allowedProtocols = ['http:', 'https:']
    } = options;

    if (!urlString || typeof urlString !== 'string') {
        return { valid: false, error: 'URL must be a non-empty string' };
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(urlString);
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }

    // Validate protocol
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return { valid: false, error: `Protocol ${parsedUrl.protocol} is not allowed` };
    }

    // Block localhost and loopback addresses (unless explicitly allowed)
    if (!allowPrivateIPs) {
        const hostname = parsedUrl.hostname.toLowerCase();
        
        // Block localhost variations
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            return { valid: false, error: 'Localhost addresses are not allowed' };
        }

        // Block private IP ranges
        const ipPatterns = [
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,        // 10.0.0.0/8
            /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
            /^192\.168\.\d{1,3}\.\d{1,3}$/,           // 192.168.0.0/16
            /^169\.254\.\d{1,3}\.\d{1,3}$/,           // 169.254.0.0/16 (link-local)
            /^0\.0\.0\.0$/,                           // 0.0.0.0
        ];

        for (const pattern of ipPatterns) {
            if (pattern.test(hostname)) {
                return { valid: false, error: 'Private IP addresses are not allowed' };
            }
        }

        // Block IPv6 private/local addresses
        if (hostname.startsWith('[') || hostname.includes(':')) {
            const cleanedHostname = hostname.replace(/^\[|\]$/g, '').toLowerCase();
            // Link-local (fe80::/10)
            if (cleanedHostname.startsWith('fe80:')) {
                return { valid: false, error: 'Private IPv6 addresses are not allowed' };
            }
            // Unique local addresses (fc00::/7 - fc and fd prefixes)
            if (/^f[cd][0-9a-f]{2}:/i.test(cleanedHostname)) {
                return { valid: false, error: 'Private IPv6 addresses are not allowed' };
            }
            // Loopback (::1) and unspecified (::)
            if (cleanedHostname === '::' || cleanedHostname === '::1') {
                return { valid: false, error: 'Private IPv6 addresses are not allowed' };
            }
        }

        // Block cloud metadata endpoints
        const metadataEndpoints = [
            '169.254.169.254', // AWS, GCP, Azure metadata
            'metadata.google.internal',
            'metadata.goog',
        ];
        if (metadataEndpoints.some(endpoint => hostname === endpoint || hostname.endsWith('.' + endpoint))) {
            return { valid: false, error: 'Cloud metadata endpoints are not allowed' };
        }
    }

    return { valid: true, url: parsedUrl };
}

/**
 * Validates an API URL for external service communication.
 * This is a wrapper around validateUrl with settings appropriate for API calls.
 * 
 * @param {string} urlString - The URL string to validate
 * @param {Object} options - Additional options
 * @param {boolean} options.allowPrivateIPs - Allow private IP addresses for internal services (default: false)
 * @returns {{ valid: boolean, url?: URL, error?: string }} Validation result
 */
function validateApiUrl(urlString, options = {}) {
    return validateUrl(urlString, {
        allowPrivateIPs: options.allowPrivateIPs || false,
        allowedProtocols: ['http:', 'https:']
    });
}

/**
 * Validates that a URL belongs to a known/configured base URL.
 * This helps prevent SSRF when processing URLs from API responses.
 * 
 * @param {string} urlToValidate - The URL to validate
 * @param {string} expectedBaseUrl - The expected base URL that should match
 * @returns {{ valid: boolean, relativePath?: string, error?: string }} Validation result
 */
function validateUrlAgainstBase(urlToValidate, expectedBaseUrl) {
    if (!urlToValidate || typeof urlToValidate !== 'string') {
        return { valid: false, error: 'URL must be a non-empty string' };
    }
    if (!expectedBaseUrl || typeof expectedBaseUrl !== 'string') {
        return { valid: false, error: 'Base URL must be a non-empty string' };
    }

    let parsedUrl, parsedBase;
    try {
        parsedUrl = new URL(urlToValidate);
        parsedBase = new URL(expectedBaseUrl);
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }

    // Validate that the host and protocol match the expected base
    if (parsedUrl.origin !== parsedBase.origin) {
        return { valid: false, error: 'URL origin does not match expected base URL' };
    }

    // Extract the relative path (removing the base path if present)
    let relativePath = parsedUrl.pathname;
    if (parsedBase.pathname && parsedBase.pathname !== '/') {
        if (relativePath.startsWith(parsedBase.pathname)) {
            relativePath = relativePath.substring(parsedBase.pathname.length);
        }
    }

    // Ensure path starts with /
    if (!relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
    }

    return { 
        valid: true, 
        relativePath: relativePath + parsedUrl.search 
    };
}

module.exports = {
    calculateTokens,
    calculateTotalPromptTokens,
    truncateToTokenLimit,
    writePromptToFile,
    supportsTemperature,
    getModelTokenLimits,
    validateUrl,
    validateApiUrl,
    validateUrlAgainstBase
};