interface GenerateRequest {
    prompt: string;
    context?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}
interface GenerateResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
declare class GrokService {
    private config;
    private axiosInstance;
    constructor();
    /**
     * 生成文本内容
     */
    generate(request: GenerateRequest): Promise<GenerateResponse>;
    /**
     * 流式生成文本内容
     */
    generateStream(request: GenerateRequest): AsyncGenerator<string, void, unknown>;
    /**
     * 获取写作建议
     */
    getWritingSuggestion(content: string, type?: 'continue' | 'improve' | 'brainstorm'): Promise<string>;
    /**
     * 生成角色设定
     */
    generateCharacter(description: string): Promise<string>;
    /**
     * 生成世界观设定
     */
    generateWorldBuilding(theme: string): Promise<string>;
    /**
     * 生成对话
     */
    generateDialogue(characters: string[], context: string): Promise<string>;
    /**
     * 检查 API 配置
     */
    isConfigured(): boolean;
    /**
     * 测试 API 连接
     */
    testConnection(): Promise<boolean>;
}
export declare const grokService: GrokService;
export default GrokService;
//# sourceMappingURL=grok.d.ts.map