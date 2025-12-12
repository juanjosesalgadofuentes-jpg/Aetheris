# 
Architecture Design - Atlas-like System

## Overview
This system allows users to interact with the content of their current browser tab via a chat interface. It consists of a Chrome Extension (Manifest V3) and a Node.js Backend powered by an LLM.

## Components

### 1. Chrome Extension (Client)
- **Manifest V3**: Uses `side_panel` for the UI to allow persistent chat while browsing.
- **Content Script**: Injected into the active tab.
  - Responsibilities: Extract page title, URL, and main body text.
  - On demand: Extract tables or specific DOM elements.
- **Side Panel (UI)**:
  - Built with: HTML/CSS/JS (React optional but preferred for state management).
  - Responsibilities: Display chat history, accept user input, send requests to backend.
- **Background Service Worker**:
  - Orchestrates opening the side panel.
  - Handles context menu events (optional).

### 2. Backend (Server)
- **Runtime**: Python 3.10+.
- **Framework**: FastAPI.
- **Key Libraries**:
  - `fastapi`, `uvicorn`: Web server.
  - `pydantic`: Data validation.
  - `openai`: LLM interaction.
  - `pandas`, `matplotlib` (Future): Data analysis and plotting.
- **API Endpoints**:
  - `POST /api/chat`:
    - **Input**: `{ url, title, content, query, history }`
    - **Output**: `{ response }`
- **LLM Integration**:
  - Logic:
    - Receive page content.
    - Truncate/Chunk content if it exceeds token limits.
    - Construct system prompt with context.
    - Stream or return response.

## Vision: Autonomous Agent (Future Phases)
The system is designed to evolve from a passive "Chat with Page" tool to an active **Browser Agent**:
1.  **Search**: Capability to perform Google searches to supplement 
page context.
2.  **Actions**: Integration with Gmail API (OAuth2) to read/send emails.
3.  **Analysis**: Generating data visualizations and reports using Python's data stack.

## Data Flow
1. User opens Extension Side Panel.
2. Extension requests "Get Page Context" from Content Script.
3. Content Script scrapes `document.body.innerText` (cleaned) and metadata.
4. User types a question.
5. Extension sends `POST /api/chat` to Backend with `{ content, query }`.
6. Backend processes request -> calls LLM -> returns answer.
7. Extension displays answer.

## Security & Configuration

- **CORS**: Backend must allow requests from the Extension ID.
python --version
node -v
node -v`
