/**
 * Flow Service - Question flow management
 */

import questionsData from '../../questions.json';

interface Answer {
  question_id: string;
  answer_option: string;
}

export class FlowService {
  private questions: any;

  constructor() {
    this.questions = questionsData.flow;
  }

  /**
   * Get next question based on answers
   */
  getNextQuestion(answers: Answer[], lang: string = 'ja') {
    // If no answers, start with Q0
    if (answers.length === 0) {
      return this.formatQuestion('Q0', lang, 0);
    }

    // Get last answer
    const lastAnswer = answers[answers.length - 1];
    const lastQuestion = this.questions[lastAnswer.question_id];

    // Determine next question ID
    let nextQuestionId: string;

    if (lastQuestion.options) {
      // Find the selected option
      const selectedOption = lastQuestion.options.find(
        (opt: any) => opt.id === lastAnswer.answer_option || opt.id.toLowerCase() === lastAnswer.answer_option.toLowerCase()
      );

      if (selectedOption?.next) {
        nextQuestionId = selectedOption.next;
      } else if (lastQuestion.next) {
        nextQuestionId = lastQuestion.next;
      } else {
        // End of flow
        return this.handleEndOfFlow(answers);
      }
    } else if (lastQuestion.next) {
      nextQuestionId = lastQuestion.next;
    } else {
      return this.handleEndOfFlow(answers);
    }

    // Handle special cases
    if (nextQuestionId === 'CALCULATE_HIGHEST_MOTIVATION') {
      return this.calculateHighestMotivation(answers, lang);
    }

    if (nextQuestionId === 'GENERATE_RESULT') {
      return {
        completed: true,
        message: 'All questions completed. Ready to generate result.'
      };
    }

    // Calculate step count (exclude Q0 from count)
    const stepCount = answers.filter(a => a.question_id !== 'Q0').length;

    // Return next question
    return this.formatQuestion(nextQuestionId, lang, stepCount);
  }

  /**
   * Calculate highest motivation（廃止：新questions.jsonでは不要）
   * 新バージョンではサブタイプ質問がないため、このメソッドは呼ばれない
   */
  private calculateHighestMotivation(answers: Answer[], lang: string) {
    // 新questions.jsonでは使用されないが、互換性のため残す
    console.warn('calculateHighestMotivation is deprecated in v2.0');
    // GENERATE_RESULTに直接進む
    return {
      completed: true,
      message: 'All questions completed. Ready to generate result.'
    };
  }

  /**
   * Format question for response
   */
  private formatQuestion(questionId: string, lang: string, currentStep: number) {
    const question = this.questions[questionId];

    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    // Calculate progress (exclude Q0 from step count)
    // currentStep is the number of answers so far (excluding Q0)
    // This question is step currentStep + 1 (unless it's Q0)
    const totalSteps = this.estimateTotalSteps();
    const adjustedStep = questionId === 'Q0' ? 0 : currentStep + 1;
    const percentage = Math.round((adjustedStep / totalSteps) * 100);

    return {
      question: {
        id: question.id,
        type: question.type,
        text: question.text,
        options: question.options?.map((opt: any) => ({
          id: opt.id,
          text: opt.text
        }))
      },
      progress: {
        current_step: adjustedStep,
        total_steps: totalSteps,
        percentage
      }
    };
  }

  /**
   * Estimate total steps based on new question flow
   */
  private estimateTotalSteps(): number {
    // Q1（性別） + Q2-Q16（15問） = 16問
    // Q0は導入なのでカウントしない
    return 16;
  }

  /**
   * Handle end of flow
   */
  private handleEndOfFlow(answers: Answer[]) {
    return {
      completed: true,
      message: 'All questions completed. Ready to generate result.'
    };
  }

  /**
   * Validate if all required questions are answered
   */
  validateComplete(answers: Answer[]): boolean {
    // Q0はintroduction（回答不要）、Q1-Q16が回答必要 = 16回答
    return answers.length >= 16;
  }

  /**
   * Get question by ID
   */
  getQuestion(questionId: string, lang: string = 'ja') {
    const question = this.questions[questionId];

    if (!question) {
      return null;
    }

    return {
      id: question.id,
      type: question.type,
      text: question.text,
      options: question.options?.map((opt: any) => ({
        id: opt.id,
        text: opt.text
      }))
    };
  }
}