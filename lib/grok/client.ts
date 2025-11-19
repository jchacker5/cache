import OpenAI from 'openai'

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GrokResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  finish_reason: string
}

export class GrokClient {
  private static instance: GrokClient
  private rateLimitDelay = 1000 // 1 second between requests
  private lastRequestTime = 0

  static getInstance(): GrokClient {
    if (!GrokClient.instance) {
      GrokClient.instance = new GrokClient()
    }
    return GrokClient.instance
  }

  async chat(
    messages: GrokMessage[],
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
      reasoningFormat?: 'parsed' | 'raw' | 'hidden'
    } = {}
  ): Promise<GrokResponse> {
    try {
      // Rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await new Promise(resolve =>
          setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
        )
      }
      this.lastRequestTime = Date.now()

      const response = await grok.chat.completions.create({
        model: options.model || 'grok-2-1212',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
        reasoning_format: options.reasoningFormat || 'parsed',
      })

      const choice = response.choices[0]
      if (!choice) {
        throw new Error('No response from Grok API')
      }

      return {
        content: choice.message.content || '',
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        finish_reason: choice.finish_reason || 'stop',
      }
    } catch (error) {
      console.error('Grok API error:', error)

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your Grok API configuration.')
        }
        if (error.message.includes('429')) {
          throw new Error('Too many requests. Please wait and try again.')
        }
      }

      throw new Error('Failed to communicate with AI assistant. Please try again.')
    }
  }

  // Convenience method for simple text queries
  async query(
    prompt: string,
    context?: string,
    options?: Partial<Parameters<GrokClient['chat']>[1]>
  ): Promise<string> {
    const messages: GrokMessage[] = []

    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${context}\n\nYou are a helpful financial assistant for a spending management app called Cache. Provide concise, accurate responses.`,
      })
    } else {
      messages.push({
        role: 'system',
        content: 'You are a helpful financial assistant for a spending management app called Cache. Provide concise, accurate responses.',
      })
    }

    messages.push({
      role: 'user',
      content: prompt,
    })

    const response = await this.chat(messages, options)
    return response.content
  }

  // Method for structured responses (JSON mode)
  async queryStructured<T>(
    prompt: string,
    schema: any,
    context?: string
  ): Promise<T> {
    const structuredPrompt = `${prompt}\n\nRespond with valid JSON matching this schema: ${JSON.stringify(schema, null, 2)}`

    const response = await this.query(structuredPrompt, context, {
      temperature: 0.1, // Lower temperature for more consistent structured responses
    })

    try {
      return JSON.parse(response) as T
    } catch (error) {
      console.error('Failed to parse structured response:', response)
      throw new Error('AI returned invalid response format')
    }
  }
}

export const grokClient = GrokClient.getInstance()
