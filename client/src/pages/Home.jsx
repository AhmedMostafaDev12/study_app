import { useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, ClipboardCheck, ArrowRight, BookOpen } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

const Home = () => {
  const navigate = useNavigate();
  const { fetchDocuments, selectDocument } = useApp();

  const handleUploadSuccess = async (result) => {
    console.log('Upload successful:', result);

    // Refresh document list
    await fetchDocuments();

    // Navigate to library or directly to study
    const doc = {
      doc_id: result.doc_id,
      filename: result.filename,
    };

    selectDocument(doc);
    navigate('/study');
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      {/* Hero Section with Large Image on Right */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content with more left margin */}
            <div className="flex flex-col justify-center space-y-10 lg:pl-32">
              {/* Header */}
              <div>
                <div className="flex items-center mb-6">
                  <BookOpen className="w-16 h-16 text-[rgb(var(--color-primary))] pulse-glow" />
                </div>
                <h1 className="text-6xl font-bold text-[rgb(var(--color-foreground))] mb-6 leading-tight">
                  PDF Study Assistant
                </h1>
                <p className="text-xl text-[rgb(var(--color-muted-foreground))] leading-relaxed">
                  Transform your learning experience with AI-powered document analysis, smart summaries, and interactive quizzes
                </p>
              </div>

              {/* Upload Section - Better Aligned */}
              <div className="max-w-xl">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>

            {/* Right Side - BIG IMAGE with FULL OPACITY */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-2xl animate-float">
                <img
                  src="/Learning-rafiki.svg"
                  alt="Learning Illustration"
                  className="w-full h-auto object-contain"
                  style={{ opacity: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[rgb(var(--color-muted))] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[rgb(var(--color-foreground))] mb-12">
            Powerful Learning Tools
          </h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Q&A Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden relative border-2 hover:border-[rgb(var(--color-primary))] card-shine energetic-card">
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8" style={{ opacity: 0.8 }}>
                <img src="/Online learning-pana.svg" alt="" className="w-full h-full object-contain" />
              </div>
              <CardHeader className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Interactive Q&A</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Ask questions about your documents and get instant, accurate answers with precise page references and context
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Summaries Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden relative border-2 hover:border-[rgb(var(--color-primary))] card-shine energetic-card">
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8" style={{ opacity: 0.8 }}>
                <img src="/Book lover-pana.svg" alt="" className="w-full h-full object-contain" />
              </div>
              <CardHeader className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-[rgb(var(--color-secondary))] to-[rgb(var(--color-primary))] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Smart Summaries</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Generate concise, comprehensive summaries of entire documents or specific pages in seconds with AI precision
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quiz Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden relative border-2 hover:border-[rgb(var(--color-primary))] card-shine energetic-card">
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8" style={{ opacity: 0.8 }}>
                <img src="/Exams-bro.svg" alt="" className="w-full h-full object-contain" />
              </div>
              <CardHeader className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Quiz Generation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Create custom quizzes with multiple difficulty levels to test and reinforce your understanding of the material
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA to Library */}
          <div className="text-center mt-16">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/library')}
              className="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]/80 text-lg"
            >
              View your document library
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
