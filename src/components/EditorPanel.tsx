import { useState } from 'react'
import { FolderIcon, FolderOpenIcon, FileCodeIcon } from '@patternfly/react-icons'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

const MOCK_FILE_TREE: FileNode[] = [
  {
    name: 'src', path: 'src', type: 'folder', children: [
      {
        name: 'services', path: 'src/services', type: 'folder', children: [
          { name: 'auth.ts', path: 'src/services/auth.ts', type: 'file' },
        ],
      },
      {
        name: 'middleware', path: 'src/middleware', type: 'folder', children: [
          { name: 'rateLimiter.ts', path: 'src/middleware/rateLimiter.ts', type: 'file' },
        ],
      },
      {
        name: 'config', path: 'src/config', type: 'folder', children: [
          { name: 'database.ts', path: 'src/config/database.ts', type: 'file' },
        ],
      },
    ],
  },
  { name: 'package.json', path: 'package.json', type: 'file' },
  { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file' },
]

const MOCK_FILE_CONTENTS: Record<string, string> = {
  'src/services/auth.ts': `import jwt from "jsonwebtoken"
import { AuthenticationError } from "../errors"
import type { TokenPayload } from "../types"

export async function authenticate(req: Request) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    throw new AuthenticationError("No token provided")
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    if (typeof decoded === "string") {
      throw new AuthenticationError("Invalid token format")
    }
    return decoded as TokenPayload
  } catch (err) {
    throw new AuthenticationError("Token verification failed")
  }
}

export function isAdmin(user: TokenPayload): boolean {
  return user.roles.includes("admin")
}`,
  'src/middleware/rateLimiter.ts': `import { RateLimiter } from "../utils/rate-limit"

const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

export default limiter`,
  'src/config/database.ts': `import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  max: 20,
  idleTimeoutMillis: 60000,
})

export default pool`,
  'package.json': `{
  "name": "api-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "outDir": "dist"
  }
}`,
}

function FileTreeItem({ node, depth, selectedFile, expandedFolders, onSelectFile, onToggleFolder }: {
  node: FileNode
  depth: number
  selectedFile: string
  expandedFolders: Set<string>
  onSelectFile: (path: string) => void
  onToggleFolder: (path: string) => void
}) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = node.path === selectedFile

  return (
    <>
      <div
        onClick={() => isFolder ? onToggleFolder(node.path) : onSelectFile(node.path)}
        className="editor-tree-item"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px', paddingLeft: 12 + depth * 16,
          cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
          borderRadius: 4, margin: '0 4px',
          background: isSelected ? 'var(--pf-t--global--background--color--action--plain--clicked)' : undefined,
          color: isSelected ? 'var(--pf-t--global--text--color--regular)' : 'var(--pf-t--global--text--color--subtle)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: 'background 0.1s',
        }}
      >
        {isFolder
          ? (isExpanded
            ? <FolderOpenIcon style={{ fontSize: 14, color: '#dcb67a', flexShrink: 0 }} />
            : <FolderIcon style={{ fontSize: 14, color: '#dcb67a', flexShrink: 0 }} />)
          : <FileCodeIcon style={{ fontSize: 14, color: '#519aba', flexShrink: 0 }} />
        }
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isSelected ? 500 : 400 }}>{node.name}</span>
        {isFolder && (
          <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.4, flexShrink: 0 }}>
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
      </div>
      {isFolder && isExpanded && node.children?.map(child => (
        <FileTreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          expandedFolders={expandedFolders}
          onSelectFile={onSelectFile}
          onToggleFolder={onToggleFolder}
        />
      ))}
    </>
  )
}

export function EditorPanel() {
  const [selectedFile, setSelectedFile] = useState('src/services/auth.ts')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(['src', 'src/services', 'src/middleware', 'src/config']))

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const content = MOCK_FILE_CONTENTS[selectedFile] ?? ''
  const lines = content.split('\n')
  const fileName = selectedFile.split('/').pop() ?? ''

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <style>{`
        .editor-tree-item:hover {
          background: var(--pf-t--global--background--color--secondary--hover, rgba(0,0,0,0.04)) !important;
        }
      `}</style>

      {/* File tree */}
      <div style={{
        width: 170, minWidth: 170,
        borderRight: '1px solid var(--pf-t--global--border--color--default)',
        overflowY: 'auto', overflowX: 'hidden',
        padding: '8px 0',
        background: 'var(--pf-t--global--background--color--secondary--default)',
      }}>
        <div style={{
          padding: '4px 16px 10px', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.6px',
          color: 'var(--pf-t--global--text--color--subtle)',
        }}>
          Explorer
        </div>
        {MOCK_FILE_TREE.map(node => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            selectedFile={selectedFile}
            expandedFolders={expandedFolders}
            onSelectFile={setSelectedFile}
            onToggleFolder={toggleFolder}
          />
        ))}
      </div>

      {/* Code display */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {/* File tab */}
        <div style={{
          padding: '0 14px', height: 36,
          borderBottom: '1px solid var(--pf-t--global--border--color--default)',
          fontSize: 12, color: 'var(--pf-t--global--text--color--regular)',
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--pf-t--global--background--color--secondary--default)',
        }}>
          <FileCodeIcon style={{ fontSize: 13, color: '#519aba' }} />
          <span style={{ fontWeight: 500 }}>{fileName}</span>
          <span style={{ fontSize: 11, color: 'var(--pf-t--global--text--color--subtle)', marginLeft: 4 }}>
            {selectedFile.replace(`/${fileName}`, '').replace(fileName, '')}
          </span>
        </div>

        {/* Code lines */}
        <table style={{
          borderCollapse: 'collapse', width: '100%',
          fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 12, lineHeight: '22px',
        }}>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td style={{
                  textAlign: 'right', padding: '0 14px 0 12px',
                  color: 'var(--pf-t--global--text--color--subtle)', userSelect: 'none',
                  width: 44, minWidth: 44, fontSize: 11, opacity: 0.6,
                }}>
                  {i + 1}
                </td>
                <td style={{ padding: '0 16px', whiteSpace: 'pre' }}>{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
