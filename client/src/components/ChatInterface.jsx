import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, FileText, HelpCircle, Loader2, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { streamChat } from '../services/streamService';
import { parseQuizFromAI, validateQuiz } from '../services/quizService';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Card } from './ui/card';

const ChatInterface = () => {
  const navigate = useNavigate();
  const {
    currentDocument,
    messages,
    checkpointId,
    isStreaming,
    setCheckpointId,
    setIsStreaming,
    addMessage,
    updateLastMessage,
    setQuizData,
  } = useApp();

  const [input, setInput] = useState('');
  const [toolStatus, setToolStatus] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const messagesEndRef = useRef(null);
  const abortStreamRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming || !currentDocument) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
    };

    // Check if this is a quiz generation request
    const isQuizRequest = /create|generate|make|quiz|test|questions/i.test(userMessage.content);
    if (isQuizRequest) {
      setIsGeneratingQuiz(true);
    }

    // Add user message to chat
    addMessage(userMessage);
    setInput('');
    setIsStreaming(true);
    setToolStatus('');

    // Create empty assistant message that will be filled during streaming
    addMessage({
      role: 'assistant',
      content: '',
    });

    let fullResponse = '';

    try {
      // Start streaming
      const cleanup = await streamChat(
        userMessage.content,
        currentDocument.doc_id,
        checkpointId,
        {
          onCheckpoint: (newCheckpointId) => {
            console.log('Received checkpoint:', newCheckpointId);
            setCheckpointId(newCheckpointId);
          },
          onContent: (content) => {
            // Append content to the last message
            updateLastMessage(content);
            fullResponse += content;
            setToolStatus(''); // Clear tool status when content starts
          },
          onToolStart: (action) => {
            console.log('Tool started:', action);
            setToolStatus(action);
          },
          onEnd: () => {
            console.log('Stream ended');
            setIsStreaming(false);
            setToolStatus('');

            // If this was a quiz request, try to parse and navigate to quiz page
            if (isQuizRequest && fullResponse) {
              const parsedQuiz = parseQuizFromAI(fullResponse);
              if (validateQuiz(parsedQuiz)) {
                console.log('Valid quiz detected, navigating to quiz page');
                setQuizData({ questions: parsedQuiz });
                // Wait a moment before navigating so user can see the response
                setTimeout(() => {
                  navigate('/quiz');
                }, 1500);
              } else {
                console.log('Could not parse valid quiz from response');
              }
            }
            setIsGeneratingQuiz(false);
          },
          onError: (error) => {
            console.error('Stream error:', error);
            setIsStreaming(false);
            setToolStatus('');
            setIsGeneratingQuiz(false);
            // Update last message with error
            updateLastMessage(`\n\n**Error:** ${error}`);
          },
        }
      );

      // Store cleanup function
      abortStreamRef.current = cleanup;
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setIsGeneratingQuiz(false);
      updateLastMessage('\n\n**Error:** Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--color-muted))] relative overflow-hidden">
      {/* BIG Background Decoration - 80% OPACITY */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] pointer-events-none animate-float" style={{ opacity: 0.8 }}>
            <img src="/Learning-rafiki.svg" alt="" className="w-full h-full object-contain" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b-2 border-[rgb(var(--color-border))] px-6 py-4 relative z-20">
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Summarize this document')}
            disabled={isStreaming}
            className="border-2 hover:bg-[rgb(var(--color-secondary))]/10 hover:border-[rgb(var(--color-secondary))]"
          >
            <FileText className="w-4 h-4 mr-2" />
            Summarize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Create 5 quiz questions')}
            disabled={isStreaming}
            className="border-2 hover:bg-[rgb(var(--color-primary))]/10 hover:border-[rgb(var(--color-primary))]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('What are the main topics in this document?')}
            disabled={isStreaming}
            className="border-2 hover:bg-[rgb(var(--color-accent))]/10 hover:border-[rgb(var(--color-accent))]"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Main Topics
          </Button>
        </div>
      </div>

      {/* Messages Area with Chat History */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-20">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md relative z-30">
              <h3 className="text-3xl font-bold text-vibrant-primary mb-4 neon-glow">
                Start Learning!
              </h3>
              <p className="text-[rgb(var(--color-muted-foreground))] text-lg leading-relaxed">
                Ask questions about your document, request summaries, or generate quiz questions to test your knowledge.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'user' ? (
                  <Card className="max-w-3xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white border-0 shadow-lg">
                    <div className="px-5 py-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </Card>
                ) : (
                  <Card className="max-w-4xl bg-white border-2 border-[rgb(var(--color-border))] shadow-md">
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[rgb(var(--color-primary))] mb-1">AI Assistant</p>
                          <div className="prose prose-sm max-w-none text-[rgb(var(--color-foreground))]">
                            <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ))}

            {/* Tool Status */}
            {toolStatus && (
              <div className="flex justify-start">
                <Card className="bg-[rgb(var(--color-accent))]/10 border-2 border-[rgb(var(--color-accent))] shadow-md">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[rgb(var(--color-accent))] animate-spin" />
                    <span className="text-sm font-medium text-[rgb(var(--color-accent))]">{toolStatus}</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Quiz Generation Indicator */}
            {isGeneratingQuiz && !toolStatus && (
              <div className="flex justify-start">
                <Card className="bg-gradient-to-br from-[rgb(var(--color-primary))]/10 to-[rgb(var(--color-secondary))]/10 border-2 border-[rgb(var(--color-primary))] shadow-md">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[rgb(var(--color-primary))] animate-pulse" />
                    <span className="text-sm font-medium text-[rgb(var(--color-primary))]">
                      Generating interactive quiz... You'll be redirected automatically!
                    </span>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-[rgb(var(--color-border))] px-6 py-5 relative z-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your document..."
              disabled={isStreaming}
              rows="2"
              className="flex-1 resize-none border-2 border-[rgb(var(--color-border))] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent disabled:bg-[rgb(var(--color-muted))] disabled:cursor-not-allowed text-[rgb(var(--color-foreground))] placeholder:text-[rgb(var(--color-muted-foreground))]"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isStreaming || !input.trim()}
              className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:opacity-90 text-white px-8 self-end shadow-lg disabled:opacity-50"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-3 text-center">
            Press Enter to send • Shift+Enter for new line • Chat history is automatically saved
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
