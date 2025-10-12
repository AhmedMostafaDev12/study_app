import { useState } from 'react';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import { deleteDocument } from '../services/api';
import { useApp } from '../context/AppContext';
import { Card } from './ui/card';

const DocumentList = ({ onDocumentSelect }) => {
  const { documents, fetchDocuments, loadingDocuments } = useApp();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (docId, e) => {
    e.stopPropagation(); // Prevent document selection when clicking delete

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      await fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  if (loadingDocuments) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--color-primary))] animate-spin" />
          <p className="text-[rgb(var(--color-muted-foreground))]">Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-32 h-32 mx-auto mb-6 opacity-40">
            <img src="/Book lover-pana.svg" alt="" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-2xl font-semibold text-[rgb(var(--color-foreground))] mb-3">No documents yet</h3>
          <p className="text-[rgb(var(--color-muted-foreground))] text-lg">
            Get started by uploading your first PDF document to begin your learning journey.
          </p>
        </div>
      </div>
    );
  }

  const cardBackgrounds = [
    '/Learning-pana.svg',
    '/Book lover-pana.svg',
    '/Online learning-pana.svg',
    '/Exams-bro.svg',
    '/Learning-rafiki.svg',
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc, index) => (
        <Card
          key={doc.doc_id}
          onClick={() => onDocumentSelect(doc)}
          className="group relative overflow-hidden bg-white border-2 border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:shadow-2xl transition-all duration-300 cursor-pointer"
        >
          {/* Background Image */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-10 -translate-y-10">
            <img
              src={cardBackgrounds[index % cardBackgrounds.length]}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          {/* Content */}
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-[rgb(var(--color-foreground))] truncate mb-1 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                    {doc.filename || `Document ${doc.doc_id.substring(0, 8)}`}
                  </p>
                  <p className="text-sm text-[rgb(var(--color-muted-foreground))] truncate">
                    ID: {doc.doc_id.substring(0, 8)}...
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleDelete(doc.doc_id, e)}
                disabled={deletingId === doc.doc_id}
                className="ml-2 p-2 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-destructive))] hover:bg-[rgb(var(--color-destructive))]/10 transition-all rounded-lg flex-shrink-0"
              >
                {deletingId === doc.doc_id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[rgb(var(--color-primary))]/10 to-[rgb(var(--color-secondary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20">
                Ready to study
              </span>
              <span className="text-xs text-[rgb(var(--color-muted-foreground))] font-medium group-hover:text-[rgb(var(--color-primary))] transition-colors">
                Click to open →
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DocumentList;
