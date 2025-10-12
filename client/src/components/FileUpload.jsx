import { useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { uploadPDF } from '../services/api';
import { Card } from './ui/card';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const result = await uploadPDF(file);
      console.log('Upload successful:', result);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <input
          type="file"
          id="file-upload"
          accept=".pdf"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />

        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-72 border-3 border-dashed rounded-2xl cursor-pointer transition-all bg-white shadow-lg hover:shadow-xl
            ${dragActive ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5 scale-[1.02]' : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]'}
            ${uploading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-6 pb-6">
            {uploading ? (
              <>
                <Loader2 className="w-16 h-16 mb-6 text-[rgb(var(--color-primary))] animate-spin" />
                <p className="text-base font-medium text-[rgb(var(--color-foreground))]">Uploading and processing PDF...</p>
                <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-2">This may take a moment</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mb-6 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-2xl flex items-center justify-center shadow-lg">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <p className="mb-2 text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  <span className="text-[rgb(var(--color-primary))]">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-[rgb(var(--color-muted-foreground))]">PDF files only (Max 50MB)</p>
                <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-4">
                  Your document will be analyzed instantly
                </p>
              </>
            )}
          </div>
        </label>
      </form>

      {error && (
        <Card className="mt-4 p-4 bg-[rgb(var(--color-destructive))]/10 border-2 border-[rgb(var(--color-destructive))] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[rgb(var(--color-destructive))] rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-[rgb(var(--color-destructive))]">{error}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
