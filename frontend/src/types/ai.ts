export interface ReviewIssue {
  id: string;
  type: 'typo' | 'grammar' | 'logic' | 'style';
  severity: 'low' | 'medium' | 'high';
  position?: { startLine: number; endLine: number };
  originalText?: string;
  suggestion: string;
  explanation: string;
}

export interface ReviewReport {
  overallScore: number;
  overallComment: string;
  issues: ReviewIssue[];
}
