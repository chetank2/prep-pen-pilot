# Knowledge Base Implementation

## Overview

The knowledge base feature has been successfully implemented for the prep-pen-pilot application. This feature allows users to upload various file types, process them with AI, and generate study materials like mindmaps and notes.

## Features Implemented

### 1. File Upload System
- **Supported File Types**: PDF, text files (.txt, .md), images (PNG, JPG, GIF), videos (MP4, AVI, MOV), audio files (MP3, WAV, M4A)
- **File Size Limit**: 50MB per file
- **Drag & Drop Interface**: User-friendly file upload with visual feedback
- **Progress Tracking**: Real-time upload progress indication

### 2. Content Categories
Eight predefined categories for organizing content:
1. **Books** - Academic books and textbooks
2. **Study Material** - Study guides and reference materials
3. **Syllabus** - Course syllabi and curricula
4. **Articles** - Research papers and articles
5. **Videos** - Educational videos and lectures
6. **Audio** - Podcasts and audio lectures
7. **Images** - Diagrams, charts, and visual aids
8. **Text Notes** - Personal notes and text documents

### 3. AI-Powered Content Generation
- **Mindmap Generation**: Creates Mermaid syntax mindmaps from uploaded content
- **Study Notes**: Generates structured markdown notes for studying
- **Content Analysis**: Analyzes content for topics, difficulty level, and key terms
- **Summary Generation**: Creates concise summaries of uploaded materials

### 4. File Processing Pipeline
- **Automatic Processing**: Files are processed in the background after upload
- **Status Tracking**: Real-time status updates (pending, processing, completed, failed)
- **Text Extraction**: Extracts text content from various file formats
- **Metadata Storage**: Stores file information and processing results

## Technical Architecture

### Backend (Node.js + TypeScript)
- **Express.js** server with TypeScript
- **OpenAI API** integration for AI-powered features
- **Multer** for file upload handling
- **PDF-Parse** for PDF text extraction
- **In-memory storage** (ready for database migration)

### Frontend (React + TypeScript)
- **React** with TypeScript and Vite
- **Shadcn/ui** components for modern UI
- **React Dropzone** for file upload
- **Mermaid** for mindmap visualization
- **React Markdown** for note rendering

### Key Components

#### Backend Services
- `KnowledgeBaseService.ts` - Core data management
- `FileProcessingService.ts` - File processing and text extraction
- `OpenAIService.ts` - AI integration for content generation

#### Frontend Components
- `KnowledgeBase.tsx` - Main page component
- `FileUploadDialog.tsx` - File upload interface
- `KnowledgeItemCard.tsx` - Individual item display
- `CategorySidebar.tsx` - Category filtering

## API Endpoints

### Categories
- `GET /api/knowledge-base/categories` - Get all categories

### Knowledge Items
- `GET /api/knowledge-base/items?userId=<id>&categoryId=<id>` - Get items
- `POST /api/knowledge-base/upload` - Upload new file
- `GET /api/knowledge-base/items/:id` - Get specific item

### AI Generation
- `POST /api/knowledge-base/items/:id/generate-mindmap` - Generate mindmap
- `POST /api/knowledge-base/items/:id/generate-notes` - Generate study notes
- `GET /api/knowledge-base/items/:id/generated-content` - Get generated content

## Setup Instructions

### Prerequisites
- Node.js 18+
- OpenAI API key

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create `.env` file with:
   ```
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the project root
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Usage

1. **Access the Knowledge Base**: Navigate to `/knowledge-base` in the application
2. **Upload Files**: Click "Add Content" to upload files via drag & drop
3. **Organize Content**: Select appropriate categories for uploaded files
4. **Generate Study Materials**: Use the "Generate Mindmap" and "Generate Notes" buttons
5. **Search and Filter**: Use the search bar and category filters to find content

## File Processing Status

Files go through the following processing stages:
- **Pending**: File uploaded, waiting for processing
- **Processing**: Content is being extracted and analyzed
- **Completed**: File processed successfully, ready for AI generation
- **Failed**: Processing failed, file may need to be re-uploaded

## AI Features

### Mindmap Generation
- Creates hierarchical mindmaps using Mermaid syntax
- Focuses on key concepts and relationships
- Maximum 4 levels deep for clarity
- Customizable subject focus

### Study Notes Generation
- Structured markdown format
- Clear headings and subheadings
- Bullet points and numbered lists
- Summary sections for quick review

## Future Enhancements

1. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
2. **User Authentication**: Add user accounts and permissions
3. **Advanced Search**: Implement semantic search across content
4. **Collaboration**: Share knowledge items between users
5. **Export Features**: Export mindmaps and notes to various formats
6. **Mobile App**: React Native mobile application
7. **Offline Support**: PWA capabilities for offline access

## Troubleshooting

### Common Issues
1. **OpenAI API Errors**: Ensure valid API key is set in environment variables
2. **File Upload Failures**: Check file size (max 50MB) and supported formats
3. **Processing Stuck**: Restart the backend server if processing gets stuck
4. **CORS Issues**: Ensure frontend URL is correctly configured in backend

### Development
- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:5173`
- API documentation available at backend endpoints
- Check browser console for frontend errors
- Check backend logs for server-side issues

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include unit tests for new features
4. Update documentation for API changes
5. Follow the existing code style and patterns

## License

This implementation is part of the prep-pen-pilot project and follows the same licensing terms. 