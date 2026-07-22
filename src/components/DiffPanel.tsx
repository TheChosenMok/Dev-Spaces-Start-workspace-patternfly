import { useState } from 'react'
import { CodeBranchIcon } from '@patternfly/react-icons'

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'hunk'
  content: string
  oldLineNum?: number
  newLineNum?: number
}

interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

const MOCK_DIFF_FILES: DiffFile[] = [
  {
    path: 'src/services/auth.ts',
    additions: 12,
    deletions: 5,
    lines: [
      { type: 'hunk', content: '@@ -15,9 +15,16 @@ import { verifyToken } from "./utils/token"' },
      { type: 'context', content: 'export async function authenticate(req: Request) {', oldLineNum: 15, newLineNum: 15 },
      { type: 'context', content: '  const token = req.headers.authorization?.split(" ")[1]', oldLineNum: 16, newLineNum: 16 },
      { type: 'remove', content: '  if (!token) return null', oldLineNum: 17 },
      { type: 'remove', content: '  const decoded = jwt.verify(token, SECRET)', oldLineNum: 18 },
      { type: 'remove', content: '  return decoded', oldLineNum: 19 },
      { type: 'add', content: '  if (!token) {', newLineNum: 17 },
      { type: 'add', content: '    throw new AuthenticationError("No token provided")', newLineNum: 18 },
      { type: 'add', content: '  }', newLineNum: 19 },
      { type: 'add', content: '', newLineNum: 20 },
      { type: 'add', content: '  try {', newLineNum: 21 },
      { type: 'add', content: '    const decoded = jwt.verify(token, process.env.JWT_SECRET!)', newLineNum: 22 },
      { type: 'add', content: '    if (typeof decoded === "string") {', newLineNum: 23 },
      { type: 'add', content: '      throw new AuthenticationError("Invalid token format")', newLineNum: 24 },
      { type: 'add', content: '    }', newLineNum: 25 },
      { type: 'add', content: '    return decoded as TokenPayload', newLineNum: 26 },
      { type: 'add', content: '  } catch (err) {', newLineNum: 27 },
      { type: 'add', content: '    throw new AuthenticationError("Token verification failed")', newLineNum: 28 },
      { type: 'add', content: '  }', newLineNum: 29 },
      { type: 'context', content: '}', oldLineNum: 20, newLineNum: 30 },
      { type: 'context', content: '', oldLineNum: 21, newLineNum: 31 },
      { type: 'remove', content: 'export function isAdmin(user: User) {', oldLineNum: 22 },
      { type: 'remove', content: '  return user.role === "admin"', oldLineNum: 23 },
      { type: 'add', content: 'export function isAdmin(user: TokenPayload): boolean {', newLineNum: 32 },
      { type: 'add', content: '  return user.roles.includes("admin")', newLineNum: 33 },
      { type: 'context', content: '}', oldLineNum: 24, newLineNum: 34 },
    ],
  },
  {
    path: 'src/middleware/rateLimiter.ts',
    additions: 8,
    deletions: 0,
    lines: [
      { type: 'hunk', content: '@@ -0,0 +1,8 @@' },
      { type: 'add', content: 'import { RateLimiter } from "../utils/rate-limit"', newLineNum: 1 },
      { type: 'add', content: '', newLineNum: 2 },
      { type: 'add', content: 'const limiter = new RateLimiter({', newLineNum: 3 },
      { type: 'add', content: '  windowMs: 15 * 60 * 1000,', newLineNum: 4 },
      { type: 'add', content: '  max: 100,', newLineNum: 5 },
      { type: 'add', content: '})', newLineNum: 6 },
      { type: 'add', content: '', newLineNum: 7 },
      { type: 'add', content: 'export default limiter', newLineNum: 8 },
    ],
  },
  {
    path: 'src/config/database.ts',
    additions: 2,
    deletions: 2,
    lines: [
      { type: 'hunk', content: '@@ -8,6 +8,6 @@ const pool = new Pool({' },
      { type: 'context', content: '  host: process.env.DB_HOST,', oldLineNum: 8, newLineNum: 8 },
      { type: 'context', content: '  port: parseInt(process.env.DB_PORT || "5432"),', oldLineNum: 9, newLineNum: 9 },
      { type: 'remove', content: '  max: 10,', oldLineNum: 10 },
      { type: 'remove', content: '  idleTimeoutMillis: 30000,', oldLineNum: 11 },
      { type: 'add', content: '  max: 20,', newLineNum: 10 },
      { type: 'add', content: '  idleTimeoutMillis: 60000,', newLineNum: 11 },
      { type: 'context', content: '})', oldLineNum: 12, newLineNum: 12 },
      { type: 'context', content: '', oldLineNum: 13, newLineNum: 13 },
    ],
  },
]

const DIFF_STYLES = `
  .diff-panel-root {
    --diff-add-bg: #dafbe1;
    --diff-add-gutter: #ccffd8;
    --diff-add-text: #116329;
    --diff-remove-bg: #ffebe9;
    --diff-remove-gutter: #ffd7d5;
    --diff-remove-text: #82071e;
    --diff-hunk-bg: #ddf4ff;
    --diff-hunk-text: #0969da;
    --diff-border: #d1d9e0;
    --diff-gutter-text: #6e7781;
    --diff-line-hover: #f6f8fa;
  }

  .diff-file-block {
    border: 1px solid var(--diff-border);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .diff-file-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #f6f8fa;
    border-bottom: 1px solid var(--diff-border);
    font-size: 13px;
    cursor: pointer;
    user-select: none;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .diff-file-header:hover {
    background: #eef1f4;
  }
  .diff-file-header.collapsed {
    border-bottom: none;
  }

  .diff-file-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: #57606a;
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }
  .diff-file-chevron.open {
    transform: rotate(90deg);
  }

  .diff-file-path {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: #1f2328;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .diff-file-stats {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .diff-stat-block {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
  .diff-stat-block.add { background: #2da44e; }
  .diff-stat-block.remove { background: #cf222e; }
  .diff-stat-block.neutral { background: #d1d9e0; }

  .diff-table {
    width: 100%;
    border-collapse: collapse;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 20px;
    table-layout: fixed;
  }

  .diff-line-context:hover td {
    background: var(--diff-line-hover) !important;
  }

  .diff-gutter {
    color: var(--diff-gutter-text);
    text-align: right;
    padding: 0 10px;
    user-select: none;
    vertical-align: top;
    width: 44px;
    min-width: 44px;
    font-size: 12px;
    cursor: pointer;
  }
  .diff-gutter:hover {
    color: #0969da;
  }

  .diff-gutter-border {
    border-right: 1px solid var(--diff-border);
  }

  .diff-gutter-add { background: var(--diff-add-gutter); }
  .diff-gutter-remove { background: var(--diff-remove-gutter); }

  .diff-content {
    padding: 0 16px;
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .diff-content-add {
    background: var(--diff-add-bg);
    color: var(--diff-add-text);
  }
  .diff-content-remove {
    background: var(--diff-remove-bg);
    color: var(--diff-remove-text);
  }

  .diff-prefix {
    user-select: none;
    display: inline-block;
    width: 12px;
  }

  .diff-hunk-row td {
    background: var(--diff-hunk-bg);
    color: var(--diff-hunk-text);
    padding: 6px 16px;
    font-size: 12px;
    font-style: italic;
    border-top: 1px solid var(--diff-border);
    border-bottom: 1px solid var(--diff-border);
  }

  .diff-summary-bar {
    padding: 14px 16px;
    border-bottom: 1px solid var(--diff-border);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 2;
  }

  .diff-summary-count {
    font-weight: 600;
    color: #1f2328;
  }

  .diff-summary-additions { color: #1a7f37; font-weight: 600; font-size: 12px; }
  .diff-summary-deletions { color: #cf222e; font-weight: 600; font-size: 12px; }
`

function DiffFileBlock({ file }: { file: DiffFile }) {
  const [collapsed, setCollapsed] = useState(false)

  const total = file.additions + file.deletions
  const blocks = 5
  const addBlocks = total > 0 ? Math.round((file.additions / total) * blocks) : 0
  const removeBlocks = total > 0 ? blocks - addBlocks : 0
  const neutralBlocks = total === 0 ? blocks : 0

  return (
    <div className="diff-file-block">
      <div
        className={`diff-file-header${collapsed ? ' collapsed' : ''}`}
        onClick={() => setCollapsed(prev => !prev)}
      >
        <span className={`diff-file-chevron${collapsed ? '' : ' open'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M4.7 2.3a.5.5 0 0 1 .7 0l3.3 3.3a.5.5 0 0 1 0 .7L5.4 9.7a.5.5 0 0 1-.7-.7L7.8 6 4.7 3a.5.5 0 0 1 0-.7z" />
          </svg>
        </span>
        <span className="diff-file-path">{file.path}</span>
        <span className="diff-file-stats">
          {file.additions > 0 && <span style={{ color: '#1a7f37', fontWeight: 600, fontSize: 12, marginRight: 4 }}>+{file.additions}</span>}
          {file.deletions > 0 && <span style={{ color: '#cf222e', fontWeight: 600, fontSize: 12, marginRight: 6 }}>-{file.deletions}</span>}
          {Array.from({ length: addBlocks }, (_, j) => <span key={`a${j}`} className="diff-stat-block add" />)}
          {Array.from({ length: removeBlocks }, (_, j) => <span key={`r${j}`} className="diff-stat-block remove" />)}
          {Array.from({ length: neutralBlocks }, (_, j) => <span key={`n${j}`} className="diff-stat-block neutral" />)}
        </span>
      </div>

      {!collapsed && (
        <table className="diff-table">
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: 44 }} />
            <col />
          </colgroup>
          <tbody>
            {file.lines.map((line, i) => {
              if (line.type === 'hunk') {
                return (
                  <tr key={i} className="diff-hunk-row">
                    <td colSpan={3}>{line.content}</td>
                  </tr>
                )
              }

              const gutterClass = line.type === 'add' ? ' diff-gutter-add' : line.type === 'remove' ? ' diff-gutter-remove' : ''
              const contentClass = line.type === 'add' ? ' diff-content-add' : line.type === 'remove' ? ' diff-content-remove' : ''
              const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '

              return (
                <tr key={i} className={line.type === 'context' ? 'diff-line-context' : ''}>
                  <td className={`diff-gutter${gutterClass}`}>{line.oldLineNum ?? ''}</td>
                  <td className={`diff-gutter diff-gutter-border${gutterClass}`}>{line.newLineNum ?? ''}</td>
                  <td className={`diff-content${contentClass}`}>
                    <span className="diff-prefix">{prefix}</span>{line.content}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function DiffPanel() {
  const totalAdditions = MOCK_DIFF_FILES.reduce((sum, f) => sum + f.additions, 0)
  const totalDeletions = MOCK_DIFF_FILES.reduce((sum, f) => sum + f.deletions, 0)

  return (
    <div className="diff-panel-root" style={{ background: '#fff', height: '100%', overflowY: 'auto' }}>
      <style>{DIFF_STYLES}</style>

      <div className="diff-summary-bar">
        <CodeBranchIcon style={{ color: '#57606a', fontSize: 14 }} />
        <span className="diff-summary-count">
          {MOCK_DIFF_FILES.length} file{MOCK_DIFF_FILES.length !== 1 ? 's' : ''} changed
        </span>
        <span className="diff-summary-additions">+{totalAdditions}</span>
        <span className="diff-summary-deletions">-{totalDeletions}</span>
      </div>

      <div style={{ padding: 16 }}>
        {MOCK_DIFF_FILES.map((file, i) => (
          <DiffFileBlock key={i} file={file} />
        ))}
      </div>
    </div>
  )
}
