'use client'
import { useEffect, useState } from 'react'

type File = {
  id: string
  name: string
  content: string
}
type Folder = {
  id: string
  name: string
  files: File[]
}
export default function Sidebar({
  onFileClick,
  onDeleteFile,
  onDeleteFolder,
}: {
  onFileClick: (file: File) => void
  onDeleteFile: (fileId: string, fileName: string) => void
  onDeleteFolder: (folderId: string, folderName: string) => void
}) {
  const [folders, setFolders] = useState<Folder[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const userId = localStorage.getItem('voicecode-user')
        const res = await fetch(`/api/fs/folders?userId=${userId}`)
        const data = await res.json()

        if (Array.isArray(data)) {
          setFolders(data)
        } else {
          console.error('⚠️ folders fetch returned non-array:', data)
          setFolders([])
        }
      } catch (err) {
        console.error('❌ folders fetch error:', err)
        setFolders([])
      }
    }

    load()
  }, [])

  const handleDownloadFolder = async (folder: Folder) => {
    try {
      const res = await fetch('/api/fs/download-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })

      if (!res.ok) {
        throw new Error('Failed to download folder.')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${folder.name}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('❌ Failed to download folder')
      console.error(err)
    }
  }
  return (
    <div className="w-64 bg-gray-800 text-white p-4 overflow-auto">
      <h2 className="font-bold mb-4 text-lg">📁 CodeDeck</h2>

      {folders.map((folder) => (
        <div key={folder.id} className="mb-4">
          <div className="flex items-center justify-between font-semibold mb-1">
            <span>📁 {folder.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => handleDownloadFolder(folder)}
                className="text-green-400 text-sm hover:text-green-600"
                title="Download folder"
              >
                ⬇️
              </button>
              <button
                onClick={() => onDeleteFolder(folder.id, folder.name)}
                className="text-red-400 text-sm hover:text-red-600"
                title="Delete folder"
              >
                🗑️
              </button>
            </div>
          </div>
          <ul className="ml-4 mt-1 space-y-1">
            {folder.files.map((file) => (
              <li key={file.id} className="flex items-center justify-between text-sm">
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => onFileClick(file)}
                >
                  📄 {file.name}
                </span>
                <button
                  onClick={() => onDeleteFile(file.id, file.name)}
                  className="text-red-500 text-xs hover:text-red-700 ml-2"
                  title="Delete file"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
