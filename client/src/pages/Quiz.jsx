import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const Quiz = () => {
  const navigate = useNavigate();
  const { currentDocument, quizData } = useApp();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  // Redirect if no document is selected or no quiz data
  if (!currentDocument) {
    navigate('/library');
    return null;
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-background))] flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white border-2 border-[rgb(var(--color-border))] shadow-2xl p-8 text-center card-shine">
          <div className="w-32 h-32 mx-auto mb-4">
            <img src="/Exams-bro.svg" alt="" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-vibrant-primary mb-4">No Quiz Available</h2>
          <p className="text-[rgb(var(--color-muted-foreground))] mb-6">
            Please generate a quiz first by asking the AI to create quiz questions in the study page.
          </p>
          <Button
            onClick={() => navigate('/study')}
            className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:opacity-90 text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Study
          </Button>
        </Card>
      </div>
    );
  }

  const handleAnswerSelect = (index) => {
    if (showResult) return; // Prevent changing answer after submission
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === quizData.questions[currentQuestion].correctAnswer;
    const newAnswers = [...answers, { questionId: currentQuestion, selectedAnswer, isCorrect }];
    setAnswers(newAnswers);
    setShowResult(true);

    // Auto-advance to next question after 2 seconds
    setTimeout(() => {
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizComplete(true);
      }
    }, 2000);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setQuizComplete(false);
  };

  const calculateScore = () => {
    const correct = answers.filter((a) => a.isCorrect).length;
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  if (quizComplete) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-[rgb(var(--color-background))] flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full bg-white border-2 border-[rgb(var(--color-border))] shadow-2xl overflow-hidden card-shine">
          {/* Background Decoration - 80% OPACITY */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ opacity: 0.8 }}>
            <img src="/Exams-bro.svg" alt="" className="w-full h-full object-contain" />
          </div>

          <div className="relative p-12 text-center">
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
              score.percentage >= 70
                ? 'bg-gradient-to-br from-green-400 to-green-600'
                : score.percentage >= 50
                ? 'bg-gradient-to-br from-[rgb(var(--color-secondary))] to-[rgb(var(--color-accent))]'
                : 'bg-gradient-to-br from-[rgb(var(--color-destructive))] to-red-400'
            }`}>
              <span className="text-5xl font-bold text-white">{score.percentage}%</span>
            </div>

            <h2 className="text-4xl font-bold text-[rgb(var(--color-foreground))] mb-4">
              {score.percentage >= 70 ? 'Excellent!' : score.percentage >= 50 ? 'Good Job!' : 'Keep Practicing!'}
            </h2>
            <p className="text-xl text-[rgb(var(--color-muted-foreground))] mb-8">
              You got <span className="font-bold text-[rgb(var(--color-primary))]">{score.correct}</span> out of{' '}
              <span className="font-bold text-[rgb(var(--color-primary))]">{score.total}</span> questions correct
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleRestart}
                className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:opacity-90 text-white px-8 py-6 text-base"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/study')}
                className="border-2 px-8 py-6 text-base"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Study
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[rgb(var(--color-primary))]/10 to-[rgb(var(--color-secondary))]/10 border-b-2 border-[rgb(var(--color-border))]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/study')}
                className="text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Study
              </Button>
              <div className="h-8 w-px bg-[rgb(var(--color-border))]"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">Interactive Quiz</h1>
                  <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                    {currentDocument?.filename || 'Test Your Knowledge'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[rgb(var(--color-muted-foreground))]">Question</p>
              <p className="text-2xl font-bold text-[rgb(var(--color-primary))]">
                {currentQuestion + 1} / {quizData.questions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-3 bg-[rgb(var(--color-muted))] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] transition-all duration-500"
                style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card className="bg-white border-2 border-[rgb(var(--color-border))] shadow-2xl overflow-hidden card-shine energetic-card">
            {/* Background Image - 80% OPACITY */}
            <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{ opacity: 0.8 }}>
              <img src="/Learning-pana.svg" alt="" className="w-full h-full object-contain" />
            </div>

            <div className="relative p-8">
              {/* Question */}
              <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))] mb-8">
                {question.question}
              </h2>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = index === question.correctAnswer;
                  const showCorrect = showResult && isCorrectOption;
                  const showIncorrect = showResult && isSelected && !isCorrect;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 ${
                        showCorrect
                          ? 'bg-green-50 border-green-500 cursor-default'
                          : showIncorrect
                          ? 'bg-red-50 border-red-500 cursor-default'
                          : isSelected
                          ? 'bg-gradient-to-br from-[rgb(var(--color-primary))]/10 to-[rgb(var(--color-secondary))]/10 border-[rgb(var(--color-primary))]'
                          : 'bg-white border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                              showCorrect
                                ? 'bg-green-500 text-white'
                                : showIncorrect
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white'
                                : 'bg-[rgb(var(--color-muted))] text-[rgb(var(--color-muted-foreground))]'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-lg font-medium text-[rgb(var(--color-foreground))]">{option}</span>
                        </div>
                        {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                        {showIncorrect && <XCircle className="w-6 h-6 text-red-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!showResult && (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:opacity-90 text-white py-6 text-lg font-semibold disabled:opacity-50"
                >
                  Submit Answer
                </Button>
              )}

              {/* Result Message */}
              {showResult && (
                <div
                  className={`p-6 rounded-xl text-center ${
                    isCorrect
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-red-50 border-2 border-red-500'
                  }`}
                >
                  <p className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-2">
                    {isCorrect
                      ? 'Great job! Moving to the next question...'
                      : `The correct answer is: ${question.options[question.correctAnswer]}`}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Background Decoration - 80% OPACITY AND BIGGER */}
      
    </div>
  );
};

export default Quiz;
