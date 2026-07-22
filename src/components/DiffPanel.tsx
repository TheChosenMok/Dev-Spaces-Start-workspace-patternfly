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
  .diff-panel {
    --diff-mono: "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    --diff-bg: var(--pf-t--global--background--color--primary--default);
    --diff-border: var(--pf-t--global--border--color--default);
    --diff-text: var(--pf-t--global--text--color--regular);
    --diff-text-muted: var(--pf-t--global--text--color--subtle);
    --diff-surface: var(--pf-t--global--background--color--secondary--default);
    --diff-hover: var(--pf-t--global--background--color--action--plain--hover);

    --diff-add-line: rgba(52, 211, 89, 0.12);
    --diff-add-gutter: rgba(52, 211, 89, 0.22);
    --diff-add-text: #56d364;
    --diff-remove-line: rgba(255, 85, 85, 0.12);
    --diff-remove-gutter: rgba(255, 85, 85, 0.22);
    --diff-remove-text: #ff6b6b;
    --diff-hunk-bg: rgba(56, 139, 253, 0.08);
    --diff-hunk-text: rgba(56, 139, 253, 0.8);
  }

  :root:not(.pf-v6-theme-dark) .diff-panel {
    --diff-add-line: rgba(34, 170, 50, 0.18);
    --diff-add-gutter: rgba(34, 170, 50, 0.30);
    --diff-add-text: #116b29;
    --diff-remove-line: rgba(225, 45, 45, 0.16);
    --diff-remove-gutter: rgba(225, 45, 45, 0.28);
    --diff-remove-text: #c42b2b;
    --diff-hunk-bg: rgba(56, 139, 253, 0.06);
    --diff-hunk-text: rgba(56, 139, 253, 0.7);
  }

  .diff-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--diff-border);
    font-size: 12px;
    color: var(--diff-text-muted);
    position: sticky;
    top: 0;
    background: var(--diff-bg);
    z-index: 3;
  }

  .diff-summary-count {
    font-weight: 600;
    color: var(--diff-text);
    font-size: 13px;
  }

  .diff-stat-pill {
    font-family: var(--diff-mono);
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 10px;
  }
  .diff-stat-pill.add {
    color: var(--diff-add-text);
    background: var(--diff-add-gutter);
  }
  .diff-stat-pill.remove {
    color: var(--diff-remove-text);
    background: var(--diff-remove-gutter);
  }

  .diff-file {
    border-bottom: 1px solid var(--diff-border);
  }
  .diff-file:last-child {
    border-bottom: none;
  }

  .diff-file-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    position: sticky;
    top: 38px;
    z-index: 2;
    background: var(--diff-bg);
    border-bottom: 1px solid var(--diff-border);
    transition: background 0.1s;
  }
  .diff-file-header:hover {
    background: var(--diff-surface);
  }
  .diff-file-header.collapsed {
    border-bottom: none;
  }

  .diff-chevron {
    display: inline-flex;
    align-items: center;
    color: var(--diff-text-muted);
    font-size: 12px;
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }
  .diff-chevron.open {
    transform: rotate(90deg);
  }

  .diff-file-path {
    font-family: var(--diff-mono);
    font-size: 12px;
    font-weight: 500;
    color: var(--diff-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .diff-file-stats {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    font-family: var(--diff-mono);
    font-size: 11px;
    font-weight: 600;
  }

  .diff-lines {
    font-family: var(--diff-mono);
    font-size: 12px;
    line-height: 20px;
    overflow-x: auto;
  }

  .diff-line {
    display: flex;
    min-width: fit-content;
  }
  .diff-line:hover .diff-gutter,
  .diff-line.ctx:hover {
    background: var(--diff-hover);
  }

  .diff-gutter {
    width: 40px;
    min-width: 40px;
    text-align: right;
    padding: 0 8px;
    color: var(--diff-text-muted);
    opacity: 0.5;
    user-select: none;
    font-size: 11px;
    flex-shrink: 0;
  }
  .diff-gutter-divider {
    border-right: 1px solid var(--diff-border);
  }

  .diff-line.add .diff-gutter { background: var(--diff-add-gutter); opacity: 0.7; }
  .diff-line.remove .diff-gutter { background: var(--diff-remove-gutter); opacity: 0.7; }

  .diff-code {
    padding: 0 16px;
    white-space: pre;
    flex: 1;
  }

  .diff-line.add .diff-code {
    background: var(--diff-add-line);
    color: var(--diff-text);
  }
  .diff-line.remove .diff-code {
    background: var(--diff-remove-line);
    color: var(--diff-text);
  }

  .diff-prefix {
    display: inline-block;
    width: 14px;
    user-select: none;
    color: var(--diff-text-muted);
  }
  .diff-line.add .diff-prefix { color: var(--diff-add-text); }
  .diff-line.remove .diff-prefix { color: var(--diff-remove-text); }

  .diff-hunk {
    padding: 6px 16px 6px 96px;
    color: var(--diff-hunk-text);
    background: var(--diff-hunk-bg);
    font-size: 11px;
    font-family: var(--diff-mono);
    user-select: none;
  }
`

function DiffFileBlock({ file }: { file: DiffFile }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="diff-file">
      <div
        className={`diff-file-header${collapsed ? ' collapsed' : ''}`}
        onClick={() => setCollapsed(prev => !prev)}
      >
        <span className={`diff-chevron${collapsed ? '' : ' open'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M4.7 2.3a.5.5 0 0 1 .7 0l3.3 3.3a.5.5 0 0 1 0 .7L5.4 9.7a.5.5 0 0 1-.7-.7L7.8 6 4.7 3a.5.5 0 0 1 0-.7z" />
          </svg>
        </span>
        <span className="diff-file-path">{file.path}</span>
        <span className="diff-file-stats">
          {file.additions > 0 && <span className="diff-stat-pill add">+{file.additions}</span>}
          {file.deletions > 0 && <span className="diff-stat-pill remove">-{file.deletions}</span>}
        </span>
      </div>

      {!collapsed && (
        <div className="diff-lines">
          {file.lines.map((line, i) => {
            if (line.type === 'hunk') {
              return <div key={i} className="diff-hunk">{line.content}</div>
            }

            const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '
            const cls = line.type === 'context' ? 'ctx' : line.type

            return (
              <div key={i} className={`diff-line ${cls}`}>
                <span className="diff-gutter">{line.oldLineNum ?? ''}</span>
                <span className="diff-gutter diff-gutter-divider">{line.newLineNum ?? ''}</span>
                <span className="diff-code">
                  <span className="diff-prefix">{prefix}</span>{line.content}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function DiffPanel() {
  const totalAdditions = MOCK_DIFF_FILES.reduce((sum, f) => sum + f.additions, 0)
  const totalDeletions = MOCK_DIFF_FILES.reduce((sum, f) => sum + f.deletions, 0)

  return (
    <div className="diff-panel" style={{ height: '100%', overflowY: 'auto', background: 'var(--diff-bg)' }}>
      <style>{DIFF_STYLES}</style>

      <div className="diff-summary">
        <CodeBranchIcon style={{ color: 'var(--diff-text-muted)', fontSize: 14 }} />
        <span className="diff-summary-count">
          {MOCK_DIFF_FILES.length} file{MOCK_DIFF_FILES.length !== 1 ? 's' : ''} changed
        </span>
        <span className="diff-stat-pill add">+{totalAdditions}</span>
        <span className="diff-stat-pill remove">-{totalDeletions}</span>
      </div>

      {MOCK_DIFF_FILES.map((file, i) => (
        <DiffFileBlock key={i} file={file} />
      ))}
    </div>
  )
}
