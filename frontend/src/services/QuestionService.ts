/**
 * Question Service
 */

import { FlowService } from './FlowService';

export class QuestionService {
  private flowService: FlowService;

  constructor() {
    this.flowService = new FlowService();
  }

  /**
   * Get a specific question
   */
  async getQuestion(questionId: string, lang: string = 'ja') {
    return this.flowService.getQuestion(questionId, lang);
  }
}