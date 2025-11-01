// Use environment variable for production, fallback to Railway deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pdf-study-assistant-production.up.railway.app';

/**
 * Stream chat responses from the backend using Server-Sent Events (SSE)
 * @param {string} message - The user's message
 * @param {string} docId - The document ID to query
 * @param {string|null} checkpointId - Checkpoint ID for conversation continuity (null for new conversation)
 * @param {Object} callbacks - Callback functions for different event types
 * @param {Function} callbacks.onCheckpoint - Called when checkpoint ID is received
 * @param {Function} callbacks.onContent - Called when content token is received
 * @param {Function} callbacks.onToolStart - Called when tool execution starts
 * @param {Function} callbacks.onEnd - Called when streaming ends
 * @param {Function} callbacks.onError - Called when an error occurs
 * @returns {Function} - Cleanup function to abort the stream
 */
export const streamChat = async (message, docId, checkpointId, callbacks) => {
  const {
    onCheckpoint = () => {},
    onContent = () => {},
    onToolStart = () => {},
    onEnd = () => {},
    onError = () => {},
  } = callbacks;

  // Create AbortController for cleanup
  const abortController = new AbortController();

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        doc_id: docId,
        checkpoint_id: checkpointId,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });

      // Split by newlines to handle multiple events in one chunk
      const lines = chunk.split('\n');

      for (const line of lines) {
        // SSE format: "data: {json}"
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6); // Remove "data: " prefix
            const data = JSON.parse(jsonStr);

            // Handle different event types
            switch (data.type) {
              case 'checkpoint':
                onCheckpoint(data.checkpoint_id);
                break;

              case 'content':
                onContent(data.content);
                break;

              case 'tool_start':
                onToolStart(data.action);
                break;

              case 'end':
                onEnd();
                break;

              case 'error':
                onError(data.message);
                break;

              default:
                console.warn('Unknown event type:', data.type);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, line);
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream aborted');
    } else {
      console.error('Stream error:', error);
      onError(error.message);
    }
  }

  // Return cleanup function
  return () => {
    abortController.abort();
  };
};
