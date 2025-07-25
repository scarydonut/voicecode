# VoiceCode

VoiceCode is a browser-based, AI-powered code editor that lets you write, edit, and run code using your voice or keyboard. It supports file and folder management, code execution for multiple languages, and integrates with AI models for code generation and explanation.

## Features

- 🎤 **Voice Commands:** Create, edit, delete, and run code files/folders using natural language.
- 📝 **Monaco Editor:** Rich code editing experience with syntax highlighting.
- 📁 **File & Folder Management:** Organize your code in folders, download as ZIP, and manage files easily.
- ⚡ **AI Code Generation:** Generate code snippets or functions using AI (OpenRouter).
- 💡 **Code Explanation:** Get plain-English explanations for selected code.
- ▶️ **Run Code:** Execute code in various languages (JS, Python, C++, Java, etc.) via [Piston API](https://github.com/engineer-man/piston).
- ☁️ **Persistent Storage:** Files and folders are stored in a MongoDB database via Prisma.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (connection string in `.env`)
- API keys for [OpenRouter](https://openrouter.ai/) and [Gemini](https://ai.google.dev/gemini-api/docs/api-key)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/voicecode.git
   cd voicecode
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory with the following:

   ```
   DATABASE_URL=your_mongodb_connection_string
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Generate Prisma client:**
   ```sh
   npx prisma generate
   ```

5. **Run the development server:**
   ```sh
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Start coding by creating files and folders in the editor.
- Use the microphone button to activate voice commands (e.g., "create file app.js", "run index.py", "delete folder utils").
- Run code and view output in the integrated terminal.
- Download folders as ZIP archives.
- Save and load files from persistent storage.

## Technologies Used

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Prisma ORM](https://www.prisma.io/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenRouter AI](https://openrouter.ai/)
- [Piston Code Runner](https://github.com/engineer-man/piston)
- [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)

## Folder Structure

- `src/app` — Next.js app routes and API endpoints
- `src/components` — React UI components
- `src/lib` — Prisma client setup
- `prisma` — Prisma schema and migrations
- `public` — Static assets

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

## License

MIT

---

**Note:** This project is for educational/demo purposes. Use at your own risk.