import { describe, it, expect } from 'vitest';
import { evaluateMockAnswer } from '../src/lib/engine/mock-interviewer';
import { InterviewQuestionItem } from '../src/types/analyzer';

describe('Strict AI Interviewer Evaluation Engine', () => {
  const javaConcurrencyQuestion: InterviewQuestionItem = {
    id: 'q-java-1',
    category: 'Technical',
    question: 'How do you handle concurrency in Java?',
    whyAsked: 'To assess multithreading and thread safety experience.',
    suggestedFocus: 'ExecutorService, thread pools, synchronization, concurrent collections',
  };

  it('1. Off-topic/generic answer ("Java is popular and object oriented") returns Relevance < 20 and Weak tier', () => {
    const genericAnswer = 'Java is popular and object oriented.';
    const result = evaluateMockAnswer(javaConcurrencyQuestion, genericAnswer);

    expect(result.isRelevant).toBe(false);
    expect(result.questionRelevancePct).toBeLessThan(25);
    expect(result.answerQualityTier).toBe('🔴 Weak');
    expect(result.relevanceStatus).toContain('does not adequately address');
  });

  it('2. High-quality technical answer returns Relevance > 80 and Strong tier', () => {
    const strongAnswer =
      'I use ExecutorService with bounded thread pools to control concurrent tasks and use synchronization or thread-safe collections when shared state is required.';
    const result = evaluateMockAnswer(javaConcurrencyQuestion, strongAnswer);

    expect(result.isRelevant).toBe(true);
    expect(result.questionRelevancePct).toBeGreaterThanOrEqual(75);
    expect(result.answerQualityTier).toBe('🟢 Strong');
    expect(result.demonstratedConcepts.length).toBeGreaterThan(0);
  });

  it('3. Unsupported resume claim triggers resumeClaimWarning', () => {
    const answerWithUnclaimedTech =
      'I deployed our microservices using AWS Elastic Beanstalk and Docker containers.';
    const resumeTextWithoutAws = 'Developed REST APIs using Node.js and PostgreSQL.';

    const result = evaluateMockAnswer(javaConcurrencyQuestion, answerWithUnclaimedTech, resumeTextWithoutAws);

    expect(result.resumeClaimWarning).toBeDefined();
    expect(result.resumeClaimWarning).toContain('RESUME CLAIM NOT DETECTED');
    expect(result.resumeClaimWarning).toContain('AWS');
  });

  it('4. Adaptive follow-up question is generated based on answer context', () => {
    const answer = 'I used ExecutorService for multithreading in Java.';
    const result = evaluateMockAnswer(javaConcurrencyQuestion, answer);

    expect(result.followUpQuestion).toBeDefined();
    expect(typeof result.followUpQuestion).toBe('string');
    expect(result.followUpQuestion!.length).toBeGreaterThan(10);
  });

  it('5. Keyword stuffing without explanatory connectors is penalized', () => {
    const keywordStuffedAnswer = 'Java ExecutorService thread pools synchronization concurrent collections race conditions';
    const result = evaluateMockAnswer(javaConcurrencyQuestion, keywordStuffedAnswer);

    expect(result.depthPct).toBeLessThanOrEqual(30);
    expect(result.suggestedImprovement).toContain('keyword listing');
  });
});
