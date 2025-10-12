import axios from 'axios';

// Base URL for the FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload a PDF file to the server
 * @param {File} file - The PDF file to upload
 * @returns {Promise} - Response with doc_id and processing status
 */
export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/upload_pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get list of all uploaded documents
 * @returns {Promise} - List of documents with doc_id and filename
 */
export const getDocuments = async () => {
  const response = await apiClient.get('/documents');
  return response.data;
};

/**
 * Delete a document by its ID
 * @param {string} docId - The document ID to delete
 * @returns {Promise} - Deletion status
 */
export const deleteDocument = async (docId) => {
  const response = await apiClient.delete(`/documents/${docId}`);
  return response.data;
};

/**
 * Health check endpoint
 * @returns {Promise} - Health status
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
