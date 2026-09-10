import { StructuredJD, StructuredResume, FullAnalysisResult } from '../../types/analyzer';

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  enhanceAnalysis(
    jd: StructuredJD,
    resume: StructuredResume,
    baseAnalysis: FullAnalysisResult
  ): Promise<FullAnalysisResult>;
  answerChatQuestion(
    question: string,
    analysisContext: FullAnalysisResult
  ): Promise<string>;
}
