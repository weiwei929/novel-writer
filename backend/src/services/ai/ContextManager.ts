import { prisma } from '../../utils/db';

export interface TierAContext {
  projectTitle: string;
  author: string;
  description: string;
  metadata: any;
  characters: any[];
  worldview: string;
}

export interface TierBContext extends TierAContext {
  chapterTitle: string;
  chapterSummary: string;
  previousChapterSummary: string;
  currentContent: string;
}

export class ContextManager {
  
  /**
   * Build Tier A Context (Core Project Metadata)
   * Must be included in ALL AI requests to ensure consistency.
   */
  async buildProjectContext(projectId: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: {
          select: { name: true, role: true, description: true, profile: true }
        }
      }
    });

    if (!project) throw new Error(`Project ${projectId} not found`);

    const meta = (project.metadata as any) || {};
    const worldview = meta.worldview || '暂无世界观设定';
    const logline = meta.logline || project.description || '暂无核心梗概';
    const mainCharacters = project.characters || [];

    let context = `--- 核心元数据 (TIER A) ---\n`;
    context += `【书名】: ${project.title}\n`;
    context += `【作者】: ${project.author || '未知'}\n`;
    context += `【核心梗概】: ${logline}\n`;
    context += `【世界观】: ${worldview}\n`;
    
    if (mainCharacters.length > 0) {
      context += `\n【核心人物表】:\n`;
      // Limit to top 10 characters to save tokens, prioritized by role if possible
      // For now, just take first 10
      mainCharacters.slice(0, 10).forEach(char => {
        const desc = char.description || (char.profile ? JSON.stringify(char.profile).slice(0, 100) : '无描述');
        context += `- ${char.name} (${char.role || '角色'}): ${desc}\n`;
      });
    } else {
        context += `\n【核心人物表】: 暂无人物设定\n`;
    }

    return context;
  }

  /**
   * Build Tier B Context (Working Context)
   * For writing assistance. Includes Tier A + Current Chapter Context.
   * Optimizes for token usage by truncating very long content.
   */
  async buildChapterContext(chapterId: string, currentContent: string): Promise<string> {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        project: true
      }
    });

    if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

    // 1. Get Tier A Context
    const tierA = await this.buildProjectContext(chapter.projectId);

    // 2. Get Previous Chapter Summary (Context Continuity)
    const prevChapter = await prisma.chapter.findFirst({
        where: {
            projectId: chapter.projectId,
            order: { lt: chapter.order }
        },
        orderBy: { order: 'desc' },
        select: { summary: true, title: true }
    });

    let context = tierA;
    context += `\n--- 章节作业环境 (TIER B) ---\n`;
    context += `【当前章节】: 第${chapter.order}章 - ${chapter.title}\n`;
    context += `【章节目标/摘要】: ${chapter.summary || '暂无摘要'}\n`;
    
    if (prevChapter) {
        context += `【前情提要】: (第${prevChapter.title}) ${prevChapter.summary || '暂无'}\n`;
    }

    context += `\n--- 当前正文 (截取末尾) ---\n`;
    
    // Simple Token Management Strategy:
    // Limit context window to approx 8000 chars (~4000 tokens) to leave room for generation
    const MAX_CONTEXT_CHARS = 8000;
    
    let contentToInject = currentContent;
    if (currentContent.length > MAX_CONTEXT_CHARS) {
        // Find a safe break point (newline) approx MAX_CONTEXT_CHARS ago
        const sliceIndex = currentContent.length - MAX_CONTEXT_CHARS;
        const safeIndex = currentContent.indexOf('\n', sliceIndex);
        
        contentToInject = '...(前文已省略)...\n' + currentContent.slice(safeIndex > -1 ? safeIndex : sliceIndex);
    }
    
    context += contentToInject;

    return context;
  }

  /**
   * Build Tier C Context (Global Review)
   * Placeholder for future "Full Book Review" features.
   * This would likely be expensive and should be triggered explicitly.
   */
  async buildGlobalContext(projectId: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          select: { title: true, order: true, summary: true, content: true }
        }
      }
    });

    if (!project) throw new Error(`Project ${projectId} not found`);

    // 1. Get Tier A Context
    const tierA = await this.buildProjectContext(projectId);

    let context = tierA;
    context += `\n--- 全局审阅层 (TIER C) ---\n`;
    context += `【任务目标】: 基于以下全书章节摘要，检查逻辑连贯性、人物一致性和剧情节奏。\n`;
    context += `\n=== 章节列表 ===\n`;

    const MAX_GLOBAL_CHARS = 50000; // Large buffer for summaries
    let currentLength = context.length;

    for (const chapter of project.chapters) {
      // Fallback: Use content slice if summary is missing
      let summary = chapter.summary;
      if (!summary || summary.trim().length === 0) {
          summary = chapter.content.slice(0, 300) + '... (自动摘要: 取自正文前300字)';
      }

      const chapterEntry = `\n[第${chapter.order}章 ${chapter.title}]\n摘要: ${summary}\n`;
      
      if (currentLength + chapterEntry.length > MAX_GLOBAL_CHARS) {
          context += `\n...(后续章节因超出长度限制已省略)...`;
          break;
      }

      context += chapterEntry;
      currentLength += chapterEntry.length;
    }

    return context;
  }
}

export const contextManager = new ContextManager();
