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
   * 
   * ⚠️ 元数据 = 宪法
   * 这些设定必须在所有 AI 请求中包含，并且必须严格遵守。
   * AI 生成的任何内容都不得违反这些设定。
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
    
    // 构建上下文，明确标注元数据的"宪法"地位
    let context = `=== 核心元数据 (TIER A - 宪法级约束) ===\n`;
    context += `⚠️ 以下设定必须严格遵守，不得偏离！\n\n`;
    
    context += `【书名】: ${project.title}\n`;
    context += `【作者】: ${project.author || '未知'}\n\n`;
    
    // 项目梗概（核心冲突、主题、走向）
    if (meta.synopsis) {
      context += `【项目梗概】:\n${meta.synopsis}\n\n`;
    } else {
      context += `【项目梗概】: ⚠️ 未设置（建议先完善元数据）\n`;
      if (project.description) {
        context += `  简介: ${project.description}\n\n`;
      } else {
        context += `\n`;
      }
    }
    
    // 人物设定
    if (meta.characters) {
      context += `【人物设定】:\n${meta.characters}\n\n`;
    } else if (project.characters.length > 0) {
      // 回退：使用 Character 表数据
      context += `【人物设定】: (从人物库读取)\n`;
      project.characters.slice(0, 10).forEach(char => {
        const desc = char.description || (char.profile ? JSON.stringify(char.profile).slice(0, 100) : '无描述');
        context += `- ${char.name} (${char.role || '角色'}): ${desc}\n`;
      });
      context += `\n`;
    } else {
      context += `【人物设定】: ⚠️ 未设置\n\n`;
    }
    
    // 世界观/设定
    if (meta.settings || meta.worldview) {
      context += `【世界观/设定】:\n${meta.settings || meta.worldview}\n\n`;
    } else {
      context += `【世界观/设定】: ⚠️ 未设置\n\n`;
    }
    
    // 时间线（可选）
    if (meta.timeline) {
      context += `【时间线】:\n${meta.timeline}\n\n`;
    }
    
    // 关系网（可选）
    if (meta.relationships) {
      context += `【关系网】:\n${meta.relationships}\n\n`;
    }
    
    // 情节结构（可选）
    if (meta.plotStructure) {
      context += `【情节结构】:\n${meta.plotStructure}\n\n`;
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

    // 2. 章节元数据
    const chapterMeta = (chapter.metadata as any) || {};
    
    // 3. Get Previous Chapter Summary (Context Continuity)
    const prevChapter = await prisma.chapter.findFirst({
        where: {
            projectId: chapter.projectId,
            order: { lt: chapter.order }
        },
        orderBy: { order: 'desc' },
        select: { summary: true, title: true }
    });

    let context = tierA;
    context += `\n=== 章节元数据 (TIER B - 执行级约束) ===\n`;
    context += `【当前章节】: 第${chapter.order}章 - ${chapter.title}\n\n`;
    
    // 章节梗概（必填）
    if (chapterMeta.synopsis) {
      context += `【章节梗概】:\n${chapterMeta.synopsis}\n\n`;
    } else if (chapter.summary) {
      context += `【章节梗概】: ${chapter.summary}\n\n`;
    } else {
      context += `【章节梗概】: ⚠️ 未设置（建议先完善章节元数据）\n\n`;
    }
    
    // 涉及人物
    if (chapterMeta.characters) {
      context += `【涉及人物】:\n${chapterMeta.characters}\n\n`;
    }
    
    // 时间设定
    if (chapterMeta.timeSetting) {
      context += `【时间设定】: ${chapterMeta.timeSetting}\n\n`;
    }
    
    // 场景设定
    if (chapterMeta.sceneSettings) {
      context += `【场景设定】:\n${chapterMeta.sceneSettings}\n\n`;
    }
    
    // 前情提要
    if (prevChapter) {
        context += `【前情提要】: (${prevChapter.title}) ${prevChapter.summary || '暂无'}\n\n`;
    }

    context += `=== 当前正文 (截取末尾) ===\n`;
    
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
