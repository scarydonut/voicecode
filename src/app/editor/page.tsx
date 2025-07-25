'use client'
import Editor from '@monaco-editor/react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  FaJs, FaReact, FaCss3Alt, FaHtml5, FaPython, FaMarkdown, FaFileCode, FaFile,
  FaJava, FaPhp, FaSwift, FaFilePdf, FaMicrochip, FaFileWord, FaFileAlt, FaTerminal, FaPlus, FaTrash, FaTimes
} from 'react-icons/fa'
import {
  SiTypescript, SiJson, SiC, SiCplusplus, SiRuby, SiGo, SiKotlin, SiDart,
  SiYaml, SiDocker, SiVuedotjs, SiPerl, SiRust, SiScala, SiHaskell, SiElixir, SiErlang, SiClojure, SiJulia, SiR, SiMysql
} from 'react-icons/si'

const defaultFiles: Record<string, string> = {
}
type FileEntry =
  | string
  | {
    id: string
    content: string
  }
export default function EditorPage() {
  const [files, setFiles] = useState<Record<string, FileEntry>>(defaultFiles)
  const [activeFile, setActiveFile] = useState('index.js')
  const [newFileName, setNewFileName] = useState('')
  const [terminalOutput, setTerminalOutput] = useState('')
  const [copiedText, setCopiedText] = useState('')
  const [userInput, setUserInput] = useState('')
  const [sidebarVersion, setSidebarVersion] = useState(0)
  const reloadSidebar = () => setSidebarVersion((v) => v + 1)
  const monacoRef = useRef<any>(null)
  const editorRef = useRef<any>(null)
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  if (typeof window !== 'undefined' && !browserSupportsSpeechRecognition) {
    return <span>Your browser doesn’t support voice recognition</span>
  }
  useEffect(() => {
    const existing = localStorage.getItem('voicecode-user')
    if (!existing) {
      const id = crypto.randomUUID()
      localStorage.setItem('voicecode-user', id)
    }
  }, [])

  useEffect(() => {
    if (!transcript.trim()) return

    const delay = setTimeout(() => {
      const processCommand = async () => {
        console.log('🎙️ Final Transcript received:', transcript)

        try {
          const res = await fetch('/api/parse-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcript }),
          })

          const data = await res.json()
          console.log('📦 Returned command:', data)

          const { action, filename, content } = data

          if (action === 'createFile' && filename) {
            if (!files[filename]) {
              setFiles((prev) => ({ ...prev, [filename]: '' }))
              setActiveFile(filename)
            }
          }

          if (action === 'copyLine' && typeof data.line === 'number') {
            const editor = editorRef.current
            if (!editor) return

            const model = editor.getModel()
            const text = model.getLineContent(data.line)
            setCopiedText(text)
            alert(`📋 Copied line ${data.line}: "${text}"`)
          }

          if (action === 'pasteAt' && typeof data.line === 'number' && copiedText) {
            const editor = editorRef.current
            const monaco = monacoRef.current
            if (!editor || !monaco) return
            const model = editor.getModel()
            const line = data.line
            const lineText = model.getLineContent(line)

            const range = new monaco.Range(
              line,
              1,
              line,
              lineText.length + 1
            )
            editor.executeEdits('', [
              {
                range,
                text: copiedText,
                forceMoveMarkers: true,
              },
            ])

            editor.focus()
          }

          if (action === 'renameFile' && data.oldName && data.newName) {
            if (files[data.oldName]) {
              setFiles((prev) => {
                const updated = { ...prev }
                updated[data.newName] = updated[data.oldName]
                delete updated[data.oldName]
                return updated
              })

              if (activeFile === data.oldName) {
                setActiveFile(data.newName)
              }
            } else {
              alert(`❌ File "${data.oldName}" not found.`)
            }
          }

          if (action === 'commentBlock') {
            const editor = editorRef.current
            if (!editor) return

            editor.trigger('voice', 'editor.action.commentLine', null)
            editor.focus()
          }
          if (action === 'uncommentBlock') {
            const editor = editorRef.current
            if (!editor) return

            editor.trigger('voice', 'editor.action.removeCommentLine', null)
            editor.focus()
          }
          if (action === 'replaceText' && data.target && data.replacement) {
            const editor = editorRef.current
            if (!editor) return

            const model = editor.getModel()
            const target = data.target
            const replacement = data.replacement
            const regex = new RegExp(`\\b${target}\\b`, 'g')
            const newContent = model.getValue().replace(regex, replacement)

            model.setValue(newContent)
            editor.focus()
          }

          if (action === 'moveCursor' && filename && typeof data.line === 'number') {
            const editor = editorRef.current
            if (editor) {
              editor.revealLineInCenter(data.line)
              editor.setPosition({ lineNumber: data.line, column: 1 })
              editor.focus()
            }
          }
          if (action === 'runFile' && filename && files[filename]) {
            setActiveFile(filename)
            handleRunCode()
          }
          if (action === 'clearFile' && activeFile) {
            setFiles((prev) => ({ ...prev, [activeFile]: '' }))
          }
          if (action === 'write' && activeFile && content) {
            setFiles((prev) => ({
              ...prev,
              [activeFile]: (prev[activeFile] || '') + '\n' + content,
            }))
          }
          if (action === 'explain') {
            let codeToExplain = '';
            if (editorRef.current) {
              const selected = editorRef.current.getModel().getValueInRange(
                editorRef.current.getSelection()
              );
              if (selected.trim()) {
                codeToExplain = selected;
              }
            }
            if (!codeToExplain && data.line) {
              const file = filename || activeFile;
              if (file && files[file]) {
                const currentFile = files[file]

                const lines =
                  typeof currentFile === 'object'
                    ? currentFile.content.split('\n')
                    : currentFile.split('\n')

                codeToExplain = lines[data.line - 1] || '';
              }
            }

            if (!codeToExplain) {
              alert('❌ No code selected or valid line to explain.');
              return;
            }

            try {
              const explainRes = await fetch('/api/explain-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToExplain }),
              });

              const explainData = await explainRes.json();
              alert(`📘 Explanation: ${explainData.explanation}`);
            } catch (err) {
              console.error('Failed to fetch explanation:', err);
              alert('❌ Could not get explanation.');
            }
          }
          if (action === 'deleteLine') {
            const editor = editorRef.current
            if (!editor) return
            const model = editor.getModel()

            const start = data.startLine || data.line
            const end = data.endLine || data.line

            if (typeof start !== 'number' || typeof end !== 'number') {
              alert('❌ Invalid line number(s).')
              return
            }

            const lastLine = model.getLineCount()
            if (start < 1 || end > lastLine || start > end) {
              alert('❌ Line range is out of bounds.')
              return
            }

            const range = {
              startLineNumber: start,
              startColumn: 1,
              endLineNumber: end,
              endColumn: model.getLineContent(end).length + 1,
            }

            editor.executeEdits('', [{
              range,
              text: '',
              forceMoveMarkers: true,
            }])

            editor.focus()
          }
          if (action === 'createFile' && data.filename && data.folder) {
            try {
              const folderRes = await fetch(`/api/fs/folders?userId=${localStorage.getItem('voicecode-user')}`)
              const folders = await folderRes.json()
              const folder = folders.find((f: any) =>
                f.name.toLowerCase() === data.folder.toLowerCase()
              )
              if (!folder) {
                alert(`❌ Folder "${data.folder}" not found`)
                return
              }

              const fileRes = await fetch('/api/fs/create-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: data.filename,
                  folderId: folder.id,
                  content: '',
                  userId: localStorage.getItem('voicecode-user'),
                }),
              })

              const file = await fileRes.json()
              if (file.error) throw new Error(file.error)

              setFiles((prev) => ({
                ...prev,
                [file.name]: { content: file.content, id: file.id },
              }))
              setActiveFile(file.name)
              reloadSidebar()
              alert(`✅ File "${data.filename}" created in folder "${data.folder}"`)
            } catch (err) {
              console.error(err)
            }
          }
          if (action === 'deleteFile' && data.filename) {
            const filename = data.filename.trim().toLowerCase()
            const localFile = Object.keys(files).find(
              (key) => key.toLowerCase() === filename
            )

            if (localFile) {
              const fileObj = files[localFile]
              if (typeof fileObj === 'string') {
                setFiles((prev) => {
                  const updated = { ...prev }
                  delete updated[localFile]
                  return updated
                })
                setActiveFile('')
                alert(`🗑️ Deleted local file: ${localFile}`)
                return
              }
              if (typeof fileObj === 'object' && fileObj.id) {
                const res = await fetch('/api/fs/delete-file', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: fileObj.id,
                    userId: localStorage.getItem('voicecode-user'),
                  }),
                })

                const result = await res.json()
                if (result.success) {
                  alert(`✅ Deleted file: ${localFile}`)
                  setFiles((prev) => {
                    const updated = { ...prev }
                    delete updated[localFile]
                    return updated
                  })
                  setActiveFile('')
                  reloadSidebar()
                } else {
                  alert(`❌ Failed to delete file: ${result.error}`)
                }
                return
              }
            }
            try {
              const folderRes = await fetch(`/api/fs/folders?userId=${localStorage.getItem('voicecode-user')}`)
              const folders = await folderRes.json()

              let foundFile = null
              for (const folder of folders) {
                foundFile = folder.files.find((file: any) =>
                  file.name.toLowerCase() === filename
                )
                if (foundFile) break
              }

              if (!foundFile) {
                alert(`❌ File "${data.filename}" not found`)
                return
              }

              const res = await fetch('/api/fs/delete-file', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: foundFile.id,
                  userId: localStorage.getItem('voicecode-user'),
                }),
              })

              const result = await res.json()
              if (result.success) {
                alert(`✅ Deleted file: ${data.filename}`)
                setFiles((prev) => {
                  const updated = { ...prev }
                  delete updated[data.filename]
                  return updated
                })
                reloadSidebar()
              } else {
                alert(`❌ Could not delete file: ${result.error}`)
              }
            } catch (err) {
              console.error('❌ Voice file deletion failed:', err)
              alert('❌ Voice file deletion failed')
            }
          }

          if (action === 'deleteFolder' && data.folder) {
            try {
              const folderRes = await fetch(`/api/fs/folders?userId=${localStorage.getItem('voicecode-user')}`)
              const folders = await folderRes.json()
              const folder = folders.find((f: any) =>
                f.name.toLowerCase() === data.folder.toLowerCase()
              )

              if (!folder) {
                alert(`❌ Folder "${data.folder}" not found`)
                return
              }

              const res = await fetch('/api/fs/delete-folder', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: folder.id,
                  userId: localStorage.getItem('voicecode-user'),
                }),
              })

              const result = await res.json()
              if (result.success) {
                alert(`✅ Deleted folder: ${data.folder}`)
                reloadSidebar()
              } else {
                alert(`❌ Could not delete folder: ${result.error}`)
              }
            } catch (err) {
              console.error('❌ Voice folder deletion failed:', err)
              alert('❌ Voice folder deletion failed')
            }
          }

          if (action === 'createFolder' && data.folder) {
            try {
              const res = await fetch('/api/fs/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: data.folder,
                  userId: localStorage.getItem('voicecode-user'),
                }),
              })

              const result = await res.json()
              if (result.error) {
                alert(`❌ Failed to create folder: ${result.error}`)
              } else {
                alert(`✅ Folder "${data.folder}" created`)
                reloadSidebar()
              }
            } catch (err) {
              console.error('❌ Error creating folder:', err)
            }
          }

          if (data.action === 'none' || !data.action) {
            console.log('⛏️ No structured command. Trying code generation...')
            try {
              const genRes = await fetch('/api/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: transcript }),
              })

              const genData = await genRes.json()
              if (genData.code) {
                const editor = editorRef.current
                if (!editor) return

                const position = editor.getPosition()
                const range = new monacoRef.current.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                )

                editor.executeEdits('', [
                  {
                    range,
                    text: '\n' + genData.code.trim() + '\n',
                    forceMoveMarkers: true,
                  },
                ])
                editor.focus()
                alert('✨ Code generated and inserted.')
              }
            } catch (e) {
              console.error('❌ Code generation failed:', e)
            }
          }

          if (action === 'saveFile') {
            if (filename && files[filename]) {
              setActiveFile(filename) 
              handleSaveFile()
            } else {
              alert('Please specify a valid filename to save.')
            }
          }

          resetTranscript()
        } catch (err) {
          console.error('❌ Failed to process voice command:', err)
        }
      }

      processCommand()
    }, 1000)

    return () => clearTimeout(delay)
  }, [transcript])

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return

    setFiles((prev) => {
      const current = prev[activeFile]

      if (typeof current === 'object') {
        return {
          ...prev,
          [activeFile]: { ...current, content: value }
        }
      } else {
        return {
          ...prev,
          [activeFile]: value
        }
      }
    })
  }
  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:')
    const userId = localStorage.getItem('voicecode-user')
    if (!name) return

    try {
      const res = await fetch('/api/fs/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      alert('✅ Folder created')
      reloadSidebar()
    } catch (err) {
      alert('❌ Failed to create folder')
      console.error(err)
    }
  }
  const handleCreateFileInFolder = async () => {
    const folderName = prompt('Enter folder name to add file into:')
    const filename = prompt('Enter new filename (e.g., app.js):')

    if (!folderName || !filename) return

    try {
      const folderRes = await fetch(`/api/fs/folders?userId=${localStorage.getItem('voicecode-user')}`)
      const folders = await folderRes.json()
      const folder = folders.find((f: any) => f.name.toLowerCase() === folderName.toLowerCase())
      if (!folder) return alert('❌ Folder not found for this user.')
      const fileRes = await fetch('/api/fs/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: filename,
          content: '',
          folderId: folder.id,
          userId: localStorage.getItem('voicecode-user'),
        }),
      })
      const file = await fileRes.json()
      if (file.error) throw new Error(file.error)

      setFiles((prev) => ({
        ...prev,
        [file.name]: { content: file.content, id: file.id },
      }))
      setActiveFile(file.name)
      reloadSidebar()
    } catch (err) {
      alert('❌ Failed to create file in folder')
      console.error(err)
    }
  }

  const handleDeleteFile = async (fileId: string, filename: string) => {
    const confirmDelete = confirm(`Are you sure you want to delete "${filename}"?`)
    if (!confirmDelete) return

    try {
      const res = await fetch('/api/fs/delete-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fileId,
          userId: localStorage.getItem('voicecode-user'),
        }),
      })

      const result = await res.json()
      if (result.success) {
        alert(`✅ File "${filename}" deleted`)
        setFiles((prev) => {
          const updated = { ...prev }
          delete updated[filename]
          return updated
        })
        if (activeFile === filename) {
          const remaining = Object.keys(files).filter(f => f !== filename)
          setActiveFile(remaining[0] || '')
        }
        reloadSidebar()
      } else {
        alert(`❌ Failed to delete file: ${result.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('❌ Failed to delete file')
    }
  }

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const confirmDelete = confirm(`Delete folder "${folderName}" and all files inside it?`)
    if (!confirmDelete) return

    try {
      const res = await fetch('/api/fs/delete-folder', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: folderId,
          userId: localStorage.getItem('voicecode-user'),
        }),

      })

      const result = await res.json()
      if (result.success) {
        alert(`✅ Folder "${folderName}" deleted`)
        reloadSidebar()
      } else {
        alert(`❌ Failed to delete folder: ${result.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('❌ Failed to delete folder')
    }
  }
  const handleNewFile = () => {
    const trimmed = newFileName.trim()
    if (!trimmed || files[trimmed]) return
    setFiles({ ...files, [trimmed]: '' })
    setActiveFile(trimmed)
    setNewFileName('')
  }
  const getIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'js': return <FaJs className="text-yellow-400" />
      case 'ts': return <SiTypescript className="text-blue-400" />
      case 'tsx': return <FaReact className="text-cyan-400" />
      case 'jsx': return <FaReact className="text-blue-300" />
      case 'vue': return <SiVuedotjs className="text-green-500" />
      case 'html': return <FaHtml5 className="text-orange-500" />
      case 'css': return <FaCss3Alt className="text-blue-500" />
      case 'json': return <SiJson className="text-green-500" />
      case 'yaml':
      case 'yml': return <SiYaml className="text-yellow-300" />
      case 'py': return <FaPython className="text-yellow-300" />
      case 'php': return <FaPhp className="text-violet-500" />
      case 'rb': return <SiRuby className="text-red-400" />
      case 'go': return <SiGo className="text-cyan-500" />
      case 'java': return <FaJava className="text-red-500" />
      case 'swift': return <FaSwift className="text-orange-400" />
      case 'kt':
      case 'kts': return <SiKotlin className="text-purple-400" />
      case 'dart': return <SiDart className="text-sky-400" />
      case 'c': return <SiC className="text-blue-500" />
      case 'cpp':
      case 'cc':
      case 'c++':
      case 'cxx': return <SiCplusplus className="text-indigo-400" />
      case 'rs': return <SiRust className="text-orange-600" />
      case 'pl': return <SiPerl className="text-pink-600" />
      case 'r': return <SiR className="text-blue-500" />
      case 'scala': return <SiScala className="text-red-600" />
      case 'hs': return <SiHaskell className="text-purple-600" />
      case 'ex':
      case 'exs': return <SiElixir className="text-purple-400" />
      case 'erl': return <SiErlang className="text-red-600" />
      case 'lisp':
      case 'scm': return <FaFileCode className="text-green-300" />
      case 'clj':
      case 'cljs': return <SiClojure className="text-green-600" />
      case 'asm':
      case 's': return <FaMicrochip className="text-gray-500" />
      case 'jl': return <SiJulia className="text-violet-500" />
      case 'f':
      case 'f90': return <FaFileCode className="text-pink-400" />
      case 'vb': return <FaFileCode className="text-blue-400" />
      case 'sql': return <SiMysql className="text-blue-600" />
      case 'md': return <FaMarkdown className="text-white" />
      case 'txt': return <FaFileAlt className="text-gray-400" />
      case 'xml': return <FaFileCode className="text-orange-300" />
      case 'pdf': return <FaFilePdf className="text-red-600" />
      case 'doc':
      case 'docx': return <FaFileWord className="text-blue-600" />
      case 'env':
      case 'env.local':
      case 'env.development':
      case 'env.production':
        return <FaTerminal className="text-green-400" />
      case 'sh':
      case 'bash':
      case 'zshrc':
      case 'bashrc':
      case 'bash_profile':
        return <FaTerminal className="text-gray-300" />
      case 'dockerfile':
      case 'docker': return <SiDocker className="text-blue-400" />
      case 'gitignore': return <FaFileCode className="text-gray-500" />
      default: return <FaFile className="text-gray-400" />
    }
  }
  const closeTab = (filename: string) => {
    const updated = { ...files }
    delete updated[filename]
    setFiles(updated)
    const remaining = Object.keys(updated)
    if (activeFile === filename) {
      setActiveFile(remaining[0] || '')
    }
  }

  const deleteCurrentFile = () => {
    if (!activeFile) return
    const confirmDelete = confirm(`Are you sure you want to delete "${activeFile}"?`)
    if (!confirmDelete) return
    const current = files[activeFile]
    if (typeof current === 'object' && current.id) {
      handleDeleteFile(current.id, activeFile)
    } else {
      const updated = { ...files }
      delete updated[activeFile]
      setFiles(updated)

      const remaining = Object.keys(updated)
      setActiveFile(remaining[0] || '')
    }
  }

  const handleOpenFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker()
      const file = await handle.getFile()
      const content = await file.text()

      setFiles((prev) => ({
        ...prev,
        [file.name]: content,
      }))
      setActiveFile(file.name)
      // @ts-ignore
      window.currentFileHandle = handle
    } catch (error) {
      console.error('File open cancelled or failed:', error)
    }
  }
  const handleSaveFile = async () => {
    const current = files[activeFile]

    try {
      if (typeof current === 'object' && 'id' in current) {
        const res = await fetch('/api/fs/save-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: current.id,
            content: current.content,
            userId: localStorage.getItem('voicecode-user'),
          }),
        })

        const data = await res.json()

        if (data.error) {
          alert(`❌ DB Save failed: ${data.error}`)
        } else {
          alert(`✅ Saved to database: ${activeFile}`)
          setFiles((prev) => {
            const currentFile = prev[activeFile]

            if (typeof currentFile === 'object' && currentFile !== null) {
              return {
                ...prev,
                [activeFile]: {
                  ...currentFile,
                  content: current.content,
                },
              }
            }
            return prev
          })
        }
      } else if (typeof current === 'string') {
        // @ts-ignore
        const handle = window.currentFileHandle

        if (!handle) {
          alert('⚠️ This file was created in the UI and has no file handle. It can’t be saved to disk.')
          return
        }
        const writable = await handle.createWritable()
        await writable.write(current)
        await writable.close()
        alert(`✅ File Saved: ${activeFile}`)
      }
    } catch (error) {
      console.error('❌ Save failed:', error)
      alert('❌ Save failed.')
    }
  }

  const handleRunCode = async () => {
    const extToLang: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      cpp: 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      c: 'c',
      java: 'java',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      rs: 'rust',
      kt: 'kotlin',
      kts: 'kotlin',
      dart: 'dart',
      hs: 'haskell',
      ex: 'elixir',
      exs: 'elixir',
      clj: 'clojure',
      cljs: 'clojure',
      asm: 'asm',
      s: 'asm',
      r: 'r',
      jl: 'julia',
      pl: 'perl',
      scala: 'scala',
      f: 'fsharp',
      f90: 'fsharp',
      vb: 'fsharp',
      bash: 'bash',
      sh: 'bash',
      bashrc: 'bash',
      zshrc: 'bash',
      sql: 'mysql',
    }

    const ext = activeFile.split('.').pop() || ''
    const lang = extToLang[ext]

    if (!lang) {
      alert('Unsupported file type for execution')
      return
    }

    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: files[activeFile],
          language: lang,
          filename: activeFile,
          input: userInput,
        }),
      })
      const result = await res.json()
      let output =
        result.run?.stdout ||
        result.run?.output ||
        result.run?.stderr ||
        result.output ||
        result.stderr ||
        '⚠️ No output returned'
      let cleanedOutput = output.trim()
      cleanedOutput = cleanedOutput.replace(/(?:Enter|Write|Give|Input|Type)[^\n:]*:?\s*/gi, '').trim()
      if (!cleanedOutput) {
        cleanedOutput = output.trim()
      }
      setTerminalOutput(cleanedOutput || '✅ Code ran but returned no output.')
    } catch (error) {
      console.error('Execution failed:', error)
      setTerminalOutput('❌ Failed to execute code')
    }
  }

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'py': return 'python'
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'c++': return 'cpp'
      case 'c': return 'c'
      case 'java': return 'java'
      case 'html': return 'html'
      case 'css': return 'css'
      case 'json': return 'json'
      case 'md': return 'markdown'
      case 'yaml':
      case 'yml': return 'yaml'
      case 'sh': return 'shell'
      case 'xml': return 'xml'
      case 'php': return 'php'
      default: return 'plaintext'
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        key={sidebarVersion}
        onFileClick={async (file) => {
          try {
            const res = await fetch('/api/fs/get-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: file.id,
                userId: localStorage.getItem('voicecode-user'),
              }),
            })
            const freshFile = await res.json()
            setFiles((prev) => ({
              ...prev,
              [freshFile.name]: {
                content: freshFile.content,
                id: freshFile.id,
              },
            }))
            setActiveFile(freshFile.name)
          } catch (err) {
            alert('❌ Failed to open latest file version.')
            console.error(err)
          }
        }}
        onDeleteFile={handleDeleteFile}
        onDeleteFolder={handleDeleteFolder}
      />
      <main className="flex-1 flex flex-col p-4 bg-black text-white">
        <div className="mb-4 space-y-3">
          <div className="flex items-center space-x-2">
            <input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewFile()}
              placeholder="Enter filename (e.g., app.js)"
              className="bg-gray-800 px-3 py-2 rounded text-white w-64"/>
            <button
              onClick={handleCreateFolder}
              className="flex items-center bg-teal-600 px-4 py-2 rounded hover:bg-teal-700">
              📁 Add Folder
            </button>
            <button
              onClick={handleCreateFileInFolder}
              className="flex items-center bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700">
              📄 Add File to Folder
            </button>
            <button
              onClick={handleNewFile}
              className="flex items-center bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
              <FaPlus className="mr-2" />
              Add File
            </button>
            {activeFile && (
              <button
                onClick={deleteCurrentFile}
                className="flex items-center bg-red-600 px-4 py-2 rounded hover:bg-red-700" >
                <FaTrash className="mr-2" />
                Delete "{activeFile}"
              </button>
            )}
            <button
              onClick={handleOpenFile}
              className="bg-gray-700 px-3 py-2 rounded hover:bg-gray-600">
              📂 Open File
            </button>
            <button
              onClick={handleSaveFile}
              className="bg-green-600 px-3 py-2 rounded hover:bg-green-700">
              💾 Save File
            </button>
            <button
              onClick={handleRunCode}
              className="bg-yellow-500 px-3 py-2 rounded hover:bg-yellow-600">
              ▶️ Run Code
            </button>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Standard Input (if needed):</label>
            <textarea
              className="w-full bg-gray-800 text-white p-2 rounded"
              rows={4}
              placeholder="Enter inputs (each input on a new line)..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (listening) {
                  SpeechRecognition.stopListening();
                } else {
                  resetTranscript();
                  SpeechRecognition.startListening({
                    continuous: true,
                    language: 'en-US',
                  });
                }
              }}
              className={`px-4 py-2 rounded ${listening ? 'bg-red-600' : 'bg-purple-600'} hover:opacity-90`}
            >
              🎤 {listening ? 'Stop' : 'Start'} Voice
            </button>
            <div className="text-sm text-gray-400">
              <strong>Transcript:</strong> {transcript}
            </div>
          </div>
        </div>

        <div className="flex space-x-2 border-b border-gray-700 pb-2 mb-2">
          {Object.keys(files).map((filename) => (
            <div
              key={filename}
              className={`flex items-center space-x-2 px-4 py-1 rounded cursor-pointer ${activeFile === filename ? 'bg-gray-800 border-b-2 border-blue-500' : 'bg-gray-900'
                }`}
              onClick={() => setActiveFile(filename)}
            >
              {getIcon(filename)}
              <span className="text-sm">{filename}</span>
              <FaTimes
                className="ml-1 text-sm text-gray-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(filename)
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="75vh"
              theme="vs-dark"
              language={getLanguageFromExtension(activeFile)}
              value={
                typeof files[activeFile] === 'object'
                  ? files[activeFile]?.content || ''
                  : files[activeFile] || ''
              }
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                handleEditorDidMount(editor);
                monacoRef.current = monaco;
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No file open. Create a new file to get started.
            </div>
          )}
        </div>
        {terminalOutput && (
          <div className="bg-gray-900 mt-4 p-4 rounded-lg max-h-60 overflow-auto text-sm font-mono">
            <div className="text-green-400 mb-2">Terminal Output:</div>
            <pre className="whitespace-pre-wrap text-white">{terminalOutput}</pre>
          </div>
        )}
      </main>
    </div>
  )
}

