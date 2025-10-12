import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ChatInterface from '../components/ChatInterface';
import { Button } from '../components/ui/button';

const Study = () => {
  const navigate = useNavigate();
  const { currentDocument, startNewConversation } = useApp();

  // Redirect to library if no document is selected
  if (!currentDocument) {
    navigate('/library');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[rgb(var(--color-background))]">
      {/* Top Navigation */}
      <div className="bg-white border-b-2 border-[rgb(var(--color-border))] shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/library')}
              className="text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Library
            </Button>
            <div className="h-8 w-px bg-[rgb(var(--color-border))]"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {currentDocument?.filename || 'Study Assistant'}
                </h2>
                <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                  Ask questions, get summaries, or create quizzes
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={startNewConversation}
            variant="outline"
            className="border-2 hover:bg-[rgb(var(--color-primary))]/5 hover:border-[rgb(var(--color-primary))]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Study;
