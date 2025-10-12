import { createContext, useContext, useState, useEffect } from 'react';
import { getDocuments } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Document management
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Conversation management
  const [messages, setMessages] = useState([]);
  const [checkpointId, setCheckpointId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Quiz management
  const [quizData, setQuizData] = useState(null);
  const [quizGenerating, setQuizGenerating] = useState(false);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-save conversation to localStorage when messages or checkpoint changes
  useEffect(() => {
    if (currentDocument && messages.length > 0) {
      const conversationData = {
        messages,
        checkpointId,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        `conversation_${currentDocument.doc_id}`,
        JSON.stringify(conversationData)
      );
    }
  }, [messages, checkpointId, currentDocument]);

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const selectDocument = (doc) => {
    setCurrentDocument(doc);

    // Load saved conversation from localStorage
    const savedConversation = localStorage.getItem(`conversation_${doc.doc_id}`);
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation);
        setMessages(parsed.messages || []);
        setCheckpointId(parsed.checkpointId || null);
      } catch (error) {
        console.error('Error loading conversation:', error);
        setMessages([]);
        setCheckpointId(null);
      }
    } else {
      // No saved conversation, start fresh
      setMessages([]);
      setCheckpointId(null);
    }
  };

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateLastMessage = (content) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + content,
        };
      }
      return newMessages;
    });
  };

  const startNewConversation = () => {
    setMessages([]);
    setCheckpointId(null);
  };

  const value = {
    // Document state
    documents,
    currentDocument,
    loadingDocuments,

    // Document actions
    fetchDocuments,
    selectDocument,

    // Conversation state
    messages,
    checkpointId,
    isStreaming,

    // Conversation actions
    setCheckpointId,
    setIsStreaming,
    addMessage,
    updateLastMessage,
    startNewConversation,

    // Quiz state
    quizData,
    quizGenerating,

    // Quiz actions
    setQuizData,
    setQuizGenerating,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
