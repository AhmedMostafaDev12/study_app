import { useNavigate } from 'react-router-dom';
import { Plus, Library as LibraryIcon } from 'lucide-react';
import DocumentList from '../components/DocumentList';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';

const Library = () => {
  const navigate = useNavigate();
  const { selectDocument } = useApp();

  const handleDocumentSelect = (doc) => {
    selectDocument(doc);
    navigate('/study');
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] relative">
      {/* Header Section with Shiny Image */}
      <div className="bg-gradient-to-br from-[rgb(var(--color-primary))]/10 to-[rgb(var(--color-secondary))]/10 border-b-2 border-[rgb(var(--color-border))] relative overflow-hidden">
        {/* Header Image Decoration - 80% OPACITY */}
        <div className="absolute top-0 right-0 w-64 h-64 transform translate-x-12 -translate-y-12" style={{ opacity: 0.8 }}>
          <img src="/Book lover-pana.svg" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-2xl flex items-center justify-center shadow-lg pulse-glow">
                <LibraryIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[rgb(var(--color-foreground))]">Document Library</h1>
                <p className="text-[rgb(var(--color-muted-foreground))] mt-2 text-lg">
                  Select a document to start studying
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:opacity-90 text-white shadow-lg px-6 py-6 text-base energetic-gradient"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload New
            </Button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <DocumentList onDocumentSelect={handleDocumentSelect} />
      </div>

      {/* BIG Background Decoration - Well Aligned - 80% OPACITY */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none animate-float" style={{ opacity: 0.8 }}>
        <img src="/Book lover-amico.svg" alt="" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

export default Library;
