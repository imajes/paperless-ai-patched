const {
  calculateTokens,
  calculateTotalPromptTokens,
  truncateToTokenLimit,
  writePromptToFile,
  supportsTemperature
} = require('./serviceUtils');
const OpenAI = require('openai');
const config = require('../config/config');
const paperlessService = require('./paperlessService');
const fs = require('fs').promises;
const path = require('path');
const { model } = require('./ollamaService');
const RestrictionPromptService = require('./restrictionPromptService');

class OpenAIService {
  constructor() {
    this.client = null;
  }

  initialize() {
    if (!this.client && config.aiProvider === 'ollama') {
      this.client = new OpenAI({
        baseURL: config.ollama.apiUrl + '/v1',
        apiKey: 'ollama'
      });
    } else if (!this.client && config.aiProvider === 'custom') {
      this.client = new OpenAI({
        baseURL: config.custom.apiUrl,
        apiKey: config.custom.apiKey
      });
    } else if (!this.client && config.aiProvider === 'openai') {
      if (!this.client && config.openai.apiKey) {
        this.client = new OpenAI({
          apiKey: config.openai.apiKey
        });
      }
    }
  }

  /**
   * Generate JSON schema for document analysis response
   * This schema enforces structure for the Responses API
   * @param {Array} customFields - Custom fields configuration
   * @returns {Object} - JSON schema object
   */
  _getDocumentAnalysisSchema(customFields = []) {
    const schema = {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Concise, meaningful title for the document'
        },
        correspondent: {
          type: 'string',
          description: 'Sender or institution (shortest form of company name)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 4,
          description: 'Relevant thematic tags (1-4 tags)'
        },
        document_type: {
          type: 'string',
          description: 'Type of document (e.g., Invoice, Contract, Receipt)'
        },
        document_date: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Document date in YYYY-MM-DD format'
        },
        language: {
          type: 'string',
          minLength: 2,
          maxLength: 3,
          description: 'Document language code (e.g., en, de, es)'
        }
      },
      required: ['title', 'correspondent', 'tags', 'document_date', 'language'],
      additionalProperties: false
    };

    // Add custom_fields if any are defined
    if (customFields && customFields.length > 0) {
      schema.properties.custom_fields = {
        type: 'object',
        description: 'Custom field values extracted from document',
        additionalProperties: true
      };
      schema.required.push('custom_fields');
    }

    return schema;
  }

  async analyzeDocument(content, existingTags = [], existingCorrespondentList = [], existingDocumentTypesList = [], id, customPrompt = null, options = {}) {
    const cachePath = path.join('./public/images', `${id}.png`);
    try {
      this.initialize();
      const now = new Date();
      const timestamp = now.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      // Handle thumbnail caching
      try {
        await fs.access(cachePath);
        console.log('[DEBUG] Thumbnail already cached');
      } catch (err) {
        console.log('Thumbnail not cached, fetching from Paperless');

        const thumbnailData = await paperlessService.getThumbnailImage(id);

        if (!thumbnailData) {
          console.warn('Thumbnail nicht gefunden');
        }

        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        await fs.writeFile(cachePath, thumbnailData);
      }

      // Format existing tags
      let existingTagsList = existingTags.join(', ');

      // Get external API data if available and validate it
      let externalApiData = options.externalApiData || null;
      let validatedExternalApiData = null;

      if (externalApiData) {
        try {
          validatedExternalApiData = await this._validateAndTruncateExternalApiData(externalApiData);
          console.log('[DEBUG] External API data validated and included');
        } catch (error) {
          console.warn('[WARNING] External API data validation failed:', error.message);
          validatedExternalApiData = null;
        }
      }

      let systemPrompt = '';
      let promptTags = '';
      const model = process.env.OPENAI_MODEL;

      // Parse CUSTOM_FIELDS from environment variable
      let customFieldsObj;
      try {
        customFieldsObj = JSON.parse(process.env.CUSTOM_FIELDS);
      } catch (error) {
        console.error('Failed to parse CUSTOM_FIELDS:', error);
        customFieldsObj = { custom_fields: [] };
      }

      // Generate custom fields template for the prompt
      const customFieldsTemplate = {};

      customFieldsObj.custom_fields.forEach((field, index) => {
        customFieldsTemplate[index] = {
          field_name: field.value,
          value: "Fill in the value based on your analysis"
        };
      });

      // Convert template to string for replacement and wrap in custom_fields
      const customFieldsStr = '"custom_fields": ' + JSON.stringify(customFieldsTemplate, null, 2)
        .split('\n')
        .map(line => '    ' + line)  // Add proper indentation
        .join('\n');

      // Get system prompt and model
      if (config.useExistingData === 'yes' && config.restrictToExistingTags === 'no' && config.restrictToExistingCorrespondents === 'no') {
        systemPrompt = `
        Pre-existing tags: ${existingTagsList}\n\n
        Pre-existing correspondents: ${existingCorrespondentList}\n\n
        Pre-existing document types: ${existingDocumentTypesList.join(', ')}\n\n
        ` + process.env.SYSTEM_PROMPT + '\n\n' + config.mustHavePrompt.replace('%CUSTOMFIELDS%', customFieldsStr);
        promptTags = '';
      } else {
        config.mustHavePrompt = config.mustHavePrompt.replace('%CUSTOMFIELDS%', customFieldsStr);
        systemPrompt = process.env.SYSTEM_PROMPT + '\n\n' + config.mustHavePrompt;
        promptTags = '';
      }

      // Process placeholder replacements in system prompt
      systemPrompt = RestrictionPromptService.processRestrictionsInPrompt(
        systemPrompt,
        existingTags,
        existingCorrespondentList,
        config
      );

      // Include validated external API data if available
      if (validatedExternalApiData) {
        systemPrompt += `\n\nAdditional context from external API:\n${validatedExternalApiData}`;
      }

      if (process.env.USE_PROMPT_TAGS === 'yes') {
        promptTags = process.env.PROMPT_TAGS;
        systemPrompt = `
        Take these tags and try to match one or more to the document content.\n\n
        ` + config.specialPromptPreDefinedTags;
      }

      if (customPrompt) {
        console.log('[DEBUG] Replace system prompt with custom prompt via WebHook');
        systemPrompt = customPrompt + '\n\n' + config.mustHavePrompt;
      }

      // Calculate tokens AFTER all prompt modifications are complete
      const totalPromptTokens = await calculateTotalPromptTokens(
        systemPrompt,
        process.env.USE_PROMPT_TAGS === 'yes' ? [promptTags] : [],
        model
      );

      const maxTokens = Number(config.tokenLimit);
      const reservedTokens = totalPromptTokens + Number(config.responseTokens);
      const availableTokens = maxTokens - reservedTokens;

      // Validate that we have positive available tokens
      if (availableTokens <= 0) {
        console.warn(`[WARNING] No available tokens for content. Reserved: ${reservedTokens}, Max: ${maxTokens}`);
        throw new Error('Token limit exceeded: prompt too large for available token limit');
      }

      console.log(`[DEBUG] Token calculation - Prompt: ${totalPromptTokens}, Reserved: ${reservedTokens}, Available: ${availableTokens}`);
      console.log(`[DEBUG] Use existing data: ${config.useExistingData}, Restrictions applied based on useExistingData setting`);
      console.log(`[DEBUG] External API data: ${validatedExternalApiData ? 'included' : 'none'}`);

      const truncatedContent = await truncateToTokenLimit(content, availableTokens, model);

      await writePromptToFile(systemPrompt, truncatedContent);

      // Use Responses API for better JSON schema validation
      const response = await this.client.responses.create({
        model: model,
        instructions: systemPrompt,  // System instructions (replaces system message)
        input: truncatedContent,      // User input (replaces user message)
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'document_analysis',
            strict: true,
            schema: this._getDocumentAnalysisSchema(customFieldsObj.custom_fields)
          }
        },
        ...(supportsTemperature(model) && { temperature: 0.3 }),
      });

      // Check for API errors
      if (response.error) {
        console.error('[ERROR] API returned error:', response.error);
        throw new Error(`API error: ${response.error.message || 'Unknown error'}`);
      }

      // Check if response is incomplete
      if (response.incomplete_details) {
        console.warn('[WARNING] Response incomplete:', response.incomplete_details);
      }

      console.log(`[DEBUG] [${timestamp}] OpenAI request sent`);
      console.log(`[DEBUG] [${timestamp}] Total tokens: ${response.usage.total_tokens}`);

      const usage = response.usage;
      const mappedUsage = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      };

      // With Responses API, we get parsed output directly - no manual parsing needed!
      const parsedResponse = response.output_parsed;
      
      // Fallback: if output_parsed is null, try to parse output_text
      if (!parsedResponse) {
        console.warn('[WARNING] output_parsed is null, falling back to output_text');
        try {
          let jsonContent = response.output_text || '';
          // Clean up any markdown code blocks (shouldn't be needed with Responses API)
          jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          const fallbackResponse = JSON.parse(jsonContent);
          
          // Log response for debugging
          fs.appendFile('./logs/response.txt', jsonContent, (err) => {
            if (err) console.error('Failed to write response log:', err);
          });
          
          return {
            document: fallbackResponse,
            metrics: mappedUsage,
            truncated: truncatedContent.length < content.length
          };
        } catch (error) {
          console.error('Failed to parse JSON response:', error);
          // Check if the response indicates insufficient content
          const outputText = response.output_text || '';
          if (outputText.toLowerCase().includes("i'm sorry") ||
              outputText.toLowerCase().includes("i cannot") ||
              outputText.toLowerCase().includes("insufficient")) {
            console.warn(`Document ${id} has insufficient content for analysis`);
            return {
              document: {
                tags: [],
                correspondent: "Unknown",
                title: `Document ${id}`,
                document_date: new Date().toISOString().split('T')[0],
                document_type: "Document",
                language: "und"
              },
              metrics: mappedUsage,
              truncated: false,
              error: 'Insufficient content for AI analysis'
            };
          }
          throw new Error('Invalid JSON response from API');
        }
      }

      // Log successful parsed response
      fs.appendFile('./logs/response.txt', JSON.stringify(parsedResponse, null, 2), (err) => {
        if (err) console.error('Failed to write response log:', err);
      });

      // Validate response structure (schema should enforce this, but double-check)
      if (!parsedResponse || !Array.isArray(parsedResponse.tags) || typeof parsedResponse.correspondent !== 'string') {
        throw new Error('Invalid response structure: missing tags array or correspondent string');
      }

      return {
        document: parsedResponse,
        metrics: mappedUsage,
        truncated: truncatedContent.length < content.length
      };
    } catch (error) {
      console.error('Failed to analyze document:', error);
      return {
        document: { tags: [], correspondent: null },
        metrics: null,
        error: error.message
      };
    }
  }

  /**
   * Validate and truncate external API data to prevent token overflow
   * @param {any} apiData - The external API data to validate
   * @param {number} maxTokens - Maximum tokens allowed for external data (default: 500)
   * @returns {string} - Validated and potentially truncated data string
   */
  async _validateAndTruncateExternalApiData(apiData, maxTokens = 500) {
    if (!apiData) {
      return null;
    }

    const dataString = typeof apiData === 'object'
      ? JSON.stringify(apiData, null, 2)
      : String(apiData);

    // Calculate tokens for the data
    const dataTokens = await calculateTokens(dataString, process.env.OPENAI_MODEL);

    if (dataTokens > maxTokens) {
      console.warn(`[WARNING] External API data (${dataTokens} tokens) exceeds limit (${maxTokens}), truncating`);
      return await truncateToTokenLimit(dataString, maxTokens, process.env.OPENAI_MODEL);
    }

    console.log(`[DEBUG] External API data validated: ${dataTokens} tokens`);
    return dataString;
  }

  async analyzePlayground(content, prompt) {
    const musthavePrompt = `
    Return the result EXCLUSIVELY as a JSON object. The Tags and Title MUST be in the language that is used in the document.:  
        {
          "title": "xxxxx",
          "correspondent": "xxxxxxxx",
          "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
          "document_date": "YYYY-MM-DD",
          "language": "en/de/es/..."
        }`;

    try {
      this.initialize();
      const now = new Date();
      const timestamp = now.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

      if (!this.client) {
        throw new Error('OpenAI client not initialized - missing API key');
      }

      // Calculate total prompt tokens including musthavePrompt
      const totalPromptTokens = await calculateTotalPromptTokens(
        prompt + musthavePrompt // Combined system prompt
      );

      // Calculate available tokens
      const maxTokens = Number(config.tokenLimit);
      const reservedTokens = totalPromptTokens + Number(config.responseTokens); // Reserve for response
      const availableTokens = maxTokens - reservedTokens;

      // Truncate content if necessary
      const truncatedContent = await truncateToTokenLimit(content, availableTokens);
      const model = process.env.OPENAI_MODEL;
      
      // Use Responses API for better JSON validation
      const response = await this.client.responses.create({
        model: model,
        instructions: prompt + musthavePrompt,
        input: truncatedContent,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'playground_analysis',
            strict: true,
            schema: this._getDocumentAnalysisSchema([]) // No custom fields in playground
          }
        },
        ...(supportsTemperature(model) && { temperature: 0.3 }),
      });

      // Check for API errors
      if (response.error) {
        console.error('[ERROR] API returned error:', response.error);
        throw new Error(`API error: ${response.error.message || 'Unknown error'}`);
      }

      // Log token usage
      console.log(`[DEBUG] [${timestamp}] OpenAI request sent`);
      console.log(`[DEBUG] [${timestamp}] Total tokens: ${response.usage.total_tokens}`);

      const usage = response.usage;
      const mappedUsage = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      };

      // With Responses API, use output_parsed directly
      const parsedResponse = response.output_parsed;
      
      // Fallback if output_parsed is null
      if (!parsedResponse) {
        console.warn('[WARNING] output_parsed is null, falling back to output_text');
        try {
          let jsonContent = response.output_text || '';
          jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const fallbackResponse = JSON.parse(jsonContent);
          return {
            document: fallbackResponse,
            metrics: mappedUsage,
            truncated: truncatedContent.length < content.length
          };
        } catch (error) {
          console.error('Failed to parse JSON response:', error);
          const outputText = response.output_text || '';
          if (outputText.toLowerCase().includes("i'm sorry") ||
              outputText.toLowerCase().includes("i cannot") ||
              outputText.toLowerCase().includes("insufficient")) {
            console.warn('Document has insufficient content for analysis');
            return {
              document: {
                tags: [],
                correspondent: "Unknown",
                title: "Document",
                document_date: new Date().toISOString().split('T')[0],
                document_type: "Document",
                language: "und"
              },
              metrics: mappedUsage,
              truncated: false,
              error: 'Insufficient content for AI analysis'
            };
          }
          throw new Error('Invalid JSON response from API');
        }
      }

      // Validate response structure (schema enforces this, but double-check)
      if (!parsedResponse || !Array.isArray(parsedResponse.tags) || typeof parsedResponse.correspondent !== 'string') {
        throw new Error('Invalid response structure: missing tags array or correspondent string');
      }

      return {
        document: parsedResponse,
        metrics: mappedUsage,
        truncated: truncatedContent.length < content.length
      };
    } catch (error) {
      console.error('Failed to analyze document:', error);
      return {
        document: { tags: [], correspondent: null },
        metrics: null,
        error: error.message
      };
    }
  }

  /**
   * Generate text based on a prompt
   * @param {string} prompt - The prompt to generate text from
   * @returns {Promise<string>} - The generated text
   */
  async generateText(prompt) {
    try {
      this.initialize();

      if (!this.client) {
        throw new Error('OpenAI client not initialized - missing API key');
      }

      const model = process.env.OPENAI_MODEL || config.openai.model;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        ...(supportsTemperature(model) && { temperature: 0.7 }),
      });

      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating text with OpenAI:', error);
      throw error;
    }
  }

  async checkStatus() {
    // send test request to OpenAI API and respond with 'ok' or 'error'
    try {
      this.initialize();

      if (!this.client) {
        throw new Error('OpenAI client not initialized - missing API key');
      }
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: "Test"
          }
        ],
        ...(supportsTemperature(process.env.OPENAI_MODEL) && { temperature: 0.7 }),
      });
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }
      return { status: 'ok', model: process.env.OPENAI_MODEL };
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = new OpenAIService();
