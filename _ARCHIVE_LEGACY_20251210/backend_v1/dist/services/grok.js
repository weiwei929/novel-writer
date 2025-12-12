import axios from 'axios';
class GrokService {
    constructor() {
        this.config = {
            apiKey: process.env.GROK_API_KEY || '',
            baseURL: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
            model: process.env.GROK_MODEL || 'grok-beta'
        };
        this.axiosInstance = axios.create({
            baseURL: this.config.baseURL,
            timeout: 60000,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * 生成文本内容
     */
    async generate(request) {
        try {
            const messages = [];
            // 添加系统提示
            if (request.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: request.systemPrompt
                });
            }
            // 添加上下文
            if (request.context) {
                messages.push({
                    role: 'user',
                    content: `上下文信息：\n${request.context}`
                });
            }
            // 添加用户提示
            messages.push({
                role: 'user',
                content: request.prompt
            });
            const response = await this.axiosInstance.post('/chat/completions', {
                model: this.config.model,
                messages,
                max_tokens: request.maxTokens || 2000,
                temperature: request.temperature || 0.7,
                stream: false
            });
            const choice = response.data.choices?.[0];
            if (!choice) {
                throw new Error('No response from Grok API');
            }
            return {
                content: choice.message.content,
                usage: {
                    promptTokens: response.data.usage?.prompt_tokens || 0,
                    completionTokens: response.data.usage?.completion_tokens || 0,
                    totalTokens: response.data.usage?.total_tokens || 0
                }
            };
        }
        catch (error) {
            console.error('Grok API error:', error);
            throw new Error(`AI生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 流式生成文本内容
     */
    async *generateStream(request) {
        try {
            const messages = [];
            if (request.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: request.systemPrompt
                });
            }
            if (request.context) {
                messages.push({
                    role: 'user',
                    content: `上下文信息：\n${request.context}`
                });
            }
            messages.push({
                role: 'user',
                content: request.prompt
            });
            const response = await this.axiosInstance.post('/chat/completions', {
                model: this.config.model,
                messages,
                max_tokens: request.maxTokens || 2000,
                temperature: request.temperature || 0.7,
                stream: true
            }, {
                responseType: 'stream'
            });
            const stream = response.data;
            let buffer = '';
            for await (const chunk of stream) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        }
                        catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Grok streaming error:', error);
            throw new Error(`AI流式生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 获取写作建议
     */
    async getWritingSuggestion(content, type = 'continue') {
        const systemPrompts = {
            continue: '你是一位专业的小说创作助手。根据用户提供的内容，帮助续写后续情节。保持风格一致，情节合理，人物性格连贯。',
            improve: '你是一位专业的文学编辑。分析用户提供的内容，提出具体的改进建议，包括情节、人物刻画、语言表达等方面。',
            brainstorm: '你是一位创意写作导师。根据用户提供的内容，提供创意灵感和情节发展方向的建议。'
        };
        const prompts = {
            continue: `请根据以下内容续写接下来的情节：\n\n${content}`,
            improve: `请分析以下内容并提出改进建议：\n\n${content}`,
            brainstorm: `基于以下内容，请提供一些创意发展方向：\n\n${content}`
        };
        const response = await this.generate({
            prompt: prompts[type],
            systemPrompt: systemPrompts[type],
            maxTokens: 1500,
            temperature: 0.8
        });
        return response.content;
    }
    /**
     * 生成角色设定
     */
    async generateCharacter(description) {
        const systemPrompt = '你是一位专业的小说角色设计师。根据用户的简单描述，创建详细的角色设定，包括外貌、性格、背景、能力等。';
        const response = await this.generate({
            prompt: `请为以下角色创建详细设定：${description}`,
            systemPrompt,
            maxTokens: 1000,
            temperature: 0.7
        });
        return response.content;
    }
    /**
     * 生成世界观设定
     */
    async generateWorldBuilding(theme) {
        const systemPrompt = '你是一位专业的世界观构建师。根据用户提供的主题，创建丰富的世界观设定，包括地理、历史、文化、政治制度等。';
        const response = await this.generate({
            prompt: `请为以下主题创建世界观设定：${theme}`,
            systemPrompt,
            maxTokens: 1500,
            temperature: 0.7
        });
        return response.content;
    }
    /**
     * 生成对话
     */
    async generateDialogue(characters, context) {
        const systemPrompt = '你是一位专业的对话写作专家。根据角色设定和场景上下文，创作自然流畅的对话，体现每个角色的个性特点。';
        const response = await this.generate({
            prompt: `角色：${characters.join('、')}\n场景上下文：${context}\n\n请创作一段对话：`,
            systemPrompt,
            maxTokens: 1000,
            temperature: 0.8
        });
        return response.content;
    }
    /**
     * 检查 API 配置
     */
    isConfigured() {
        return !!this.config.apiKey;
    }
    /**
     * 测试 API 连接
     */
    async testConnection() {
        try {
            const response = await this.generate({
                prompt: '测试连接，请回复"连接成功"',
                maxTokens: 10
            });
            return response.content.includes('连接成功') || response.content.length > 0;
        }
        catch (error) {
            console.error('Grok connection test failed:', error);
            return false;
        }
    }
}
export const grokService = new GrokService();
export default GrokService;
//# sourceMappingURL=grok.js.map