# PDF Study Assistant - Frontend Setup

This is the React frontend for the PDF Study Assistant application.

## Prerequisites

- Node.js (v16 or higher)
- The FastAPI backend server running on `http://localhost:8000`

## Installation

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Running the Application

### 1. Start the Backend Server (in a separate terminal)

```bash
cd ../server
# Make sure you have Python virtual environment activated
python -m uvicorn server_apps.FastAPI_app:app --reload
```

The backend should be running on `http://localhost:8000`

### 2. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── FileUpload.jsx   # PDF upload with drag-and-drop
│   │   ├── DocumentList.jsx # List of uploaded documents
│   │   └── ChatInterface.jsx # Main chat interface with streaming
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Landing page with upload
│   │   ├── Library.jsx      # Document library page
│   │   └── Study.jsx        # Study/chat page
│   ├── services/            # API and streaming services
│   │   ├── api.js           # REST API calls
│   │   └── streamService.js # SSE streaming handler
│   ├── context/             # Global state management
│   │   └── AppContext.jsx   # App-wide state and actions
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles with Tailwind
├── public/                  # Static assets
├── package.json             # Dependencies
└── vite.config.js          # Vite configuration
```

## Features

### 1. **PDF Upload**
- Drag-and-drop or click to upload PDF files
- File validation (PDF only, max 50MB)
- Automatic processing and redirection to study interface

### 2. **Document Library**
- View all uploaded documents
- Delete documents
- Select a document to start studying

### 3. **Interactive Study Interface**
- Real-time streaming chat responses
- Ask questions about your documents
- Quick action buttons for common tasks:
  - Summarize document
  - Create quiz questions
  - Find main topics

### 4. **AI-Powered Features**
- Semantic search within documents
- Document summarization (brief/medium/detailed)
- Quiz generation with multiple difficulty levels
- Conversation memory for multi-turn interactions

## Technology Stack

- **React 19** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering for AI responses
- **Vite** - Build tool and dev server

## API Configuration

The frontend is configured to connect to the backend at `http://localhost:8000`.

If your backend is running on a different port or domain, update the `API_BASE_URL` in:
- `src/services/api.js`
- `src/services/streamService.js`

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

To preview the production build:

```bash
npm run preview
```

## Troubleshooting

### Backend Connection Issues

If you see connection errors:
1. Verify the backend is running on `http://localhost:8000`
2. Check CORS is enabled in the FastAPI backend (already configured)
3. Check browser console for specific error messages

### Streaming Not Working

If messages don't stream properly:
1. Check browser console for SSE errors
2. Verify the `/chat` endpoint is accessible
3. Make sure no browser extensions are blocking SSE

### Upload Failing

If file uploads fail:
1. Check file size (must be under 50MB)
2. Verify file is a valid PDF
3. Check backend logs for processing errors

## Development Tips

- The dev server has hot module replacement (HMR) - changes appear instantly
- React DevTools browser extension is helpful for debugging
- Check browser console for API errors and logs
- Use the Network tab to monitor API requests and SSE streams

## Next Steps

Consider adding:
- User authentication
- Document sharing
- Highlight and annotation features
- Export chat history
- Mobile app version
- Dark mode
