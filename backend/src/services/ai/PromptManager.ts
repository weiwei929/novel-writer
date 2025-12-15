import { contextManager } from './ContextManager';

export class PromptManager {
  
  /**
   * Construct a System Prompt for Free Chat (Ideation)
   * Uses Tier A context.
   */
  async getChatSystemPrompt(projectId: string): Promise<string> {
    const tierA = await contextManager.buildProjectContext(projectId);
    
    return `
You are a creative writing partner. 
Your goal is to help the author brainstorm, develop ideas, and solve plot holes.
You must adhere to the Project Metadata provided below.

${tierA}

CONSTRAINTS:
1. Be concise. Conversational responses should be under 500 words unless asked otherwise.
2. Do NOT write the story for the author unless explicitly asked used "Write" command.
3. Be Socratic. Ask guiding questions to help the author refine their ideas.
4. Output Format: Markdown.
`.trim();
  }

  /**
   * Construct a System Prompt for Writing Assistance (Continue/Improve)
   * Uses Tier B context.
   */
  async getWritingSystemPrompt(chapterId: string, currentContent: string, type: 'continue' | 'improve' | 'brainstorm'): Promise<string> {
    const context = await contextManager.buildChapterContext(chapterId, currentContent);

    let roleInstruction = '';
    if (type === 'continue') {
        roleInstruction = 'You are a co-writer. Continue the story naturally from the provided text. Match the tone and style. Output ONLY the continuation (max 300 words).';
    } else if (type === 'improve') {
        roleInstruction = 'You are an editor. Improve the provided text for clarity, flow, and "Show, Don\'t Tell". Highlight changes.';
    } else if (type === 'brainstorm') {
        roleInstruction = 'You are a muse. Based on the current cursor position, suggest 3 different directions the scene could go.';
    }

    return `
${roleInstruction}

${context}

CONSTRAINTS:
1. Strict adherence to character voices and world rules.
2. For 'continue', do not repeat the last sentence. Start exactly where the text ends.
3. Keep it grounded. Avoid melodramatic clichés unless the genre calls for it.
`.trim();
  }

  /**
   * Construct a System Prompt for Character Generation
   * Uses Tier A context (to ensure consistency with existing world).
   */
  async getCharacterGenerationPrompt(projectId: string): Promise<string> {
     // Even for generating a new character, we need to know the world they live in.
     const tierA = await contextManager.buildProjectContext(projectId);
     
     return `
You are a character designer. 
Generate a JSON profile for a new character based on the user's description.
Ensure the character fits into the existing world:

${tierA}

Output strictly valid JSON obeying the schema provided by the user (or default schema).
`.trim();
  }
  /**
   * Construct a System Prompt for Global Review (Tier C)
   * Aims to check for consistency, pacing, and plot holes across the entire book.
   */
  async getReviewSystemPrompt(projectId: string): Promise<string> {
      const globalContext = await contextManager.buildGlobalContext(projectId);

      return `
You are a Senior Editor and Literary Critic.
Your task is to review the provided novel outline/chapters and identify critical issues.

${globalContext}

=== OUTPUT FORMAT ===
Please provide a structured report in Markdown:

## 1. 逻辑一致性 (Logical Consistency)
*   [ ] Identifying any contradictions in world rules or character behaviors (OOC).
*   [ ] Check for unclosed plot threads (Plot Holes).

## 2. 节奏与结构 (Pacing & Structure)
*   [ ] Analyze the pacing of the story based on chapter summaries.
*   [ ] Identify sections that are too slow or too rushed.

## 3. 改进建议 (Recommendations)
*   [ ] Provide actionable advice to improve the story.

CONSTRAINTS:
1. Be objective and critical. Do not just praise.
2. Focus on "Big Picture" issues, not grammar (unless it affects clarity).
3. Use the provided Chapter Summaries to infer the story flow.
      `.trim();
  }
  /**
   * Construct a System Prompt for Chapter Review (Tier B)
   * Focuses on the current text's style, flow, and immediate logic.
   */
  async getChapterReviewSystemPrompt(chapterId: string, currentContent: string): Promise<string> {
      const chapterContext = await contextManager.buildChapterContext(chapterId, currentContent);

      return `
You are a Writing Coach and Editor.
Your task is to review the CURRENT CHAPTER content provided below.

${chapterContext}

=== OUTPUT FORMAT ===
Please provide a concise review in Markdown:

## 1. 亮点 (Highlights)
*   [ ] What works well in this chapter?

## 2. 改进空间 (Areas for Improvement)
*   [ ] Pacing issues within the scene.
*   [ ] Dialogue naturalness.
*   [ ] "Show, Don't Tell" opportunities.

## 3. 修改建议 (Actionable Tips)
*   [ ] Specific suggestions for the next revision.

CONSTRAINTS:
1. Focus ONLY on the provided text. Do not make assumptions about other chapters.
2. Be encouraging but constructive.
      `.trim();
  }
}

export const promptManager = new PromptManager();
