/**
 * Quiz Service - Handles quiz generation and parsing from AI responses
 */

/**
 * Parse quiz questions from AI text response
 * Expected format:
 * Question 1: [question text]
 * A) [option]
 * B) [option]
 * C) [option]
 * D) [option]
 * Correct Answer: A
 * Explanation: [explanation]
 *
 * @param {string} aiResponse - The AI-generated quiz text
 * @returns {Array} - Array of question objects
 */
export const parseQuizFromAI = (aiResponse) => {
  const questions = [];

  // Split by "Question" keyword
  const questionBlocks = aiResponse.split(/Question \d+:/i).filter(block => block.trim());

  questionBlocks.forEach((block, index) => {
    try {
      const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length === 0) return;

      // First line is the question
      const question = lines[0].replace(/^[:：]\s*/, '');

      // Find options (A, B, C, D)
      const options = [];
      const optionRegex = /^[A-D][):\.]?\s*(.+)/i;

      lines.forEach(line => {
        const match = line.match(optionRegex);
        if (match) {
          options.push(match[1].trim());
        }
      });

      // Find correct answer
      let correctAnswer = 0;
      const answerLine = lines.find(line => /correct\s*answer/i.test(line));
      if (answerLine) {
        const answerMatch = answerLine.match(/[A-D]/i);
        if (answerMatch) {
          correctAnswer = answerMatch[0].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        }
      }

      // Find explanation
      let explanation = '';
      const explanationIndex = lines.findIndex(line => /explanation/i.test(line));
      if (explanationIndex !== -1 && explanationIndex < lines.length - 1) {
        explanation = lines.slice(explanationIndex + 1).join(' ').replace(/^[:：]\s*/, '');
      }

      // Only add if we have valid question and options
      if (question && options.length >= 4) {
        questions.push({
          id: index + 1,
          question,
          options: options.slice(0, 4), // Take only first 4 options
          correctAnswer,
          explanation: explanation || 'No explanation provided'
        });
      }
    } catch (error) {
      console.error('Error parsing question block:', error, block);
    }
  });

  return questions;
};

/**
 * Generate a quiz prompt for the AI
 * @param {number} numQuestions - Number of questions to generate
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @param {string} pages - Optional page numbers
 * @returns {string} - Formatted prompt for the AI
 */
export const generateQuizPrompt = (numQuestions = 5, difficulty = 'medium', pages = null) => {
  let prompt = `Create ${numQuestions} multiple-choice quiz questions at ${difficulty} difficulty level`;

  if (pages) {
    prompt += ` from pages ${pages}`;
  }

  prompt += `. Format each question EXACTLY as follows:

Question 1: [Your question here]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
Correct Answer: [A, B, C, or D]
Explanation: [Brief explanation]

Please generate all ${numQuestions} questions in this exact format.`;

  return prompt;
};

/**
 * Validate parsed quiz data
 * @param {Array} questions - Array of question objects
 * @returns {boolean} - Whether the quiz is valid
 */
export const validateQuiz = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return false;
  }

  return questions.every(q =>
    q.question &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    typeof q.correctAnswer === 'number' &&
    q.correctAnswer >= 0 &&
    q.correctAnswer < 4
  );
};
