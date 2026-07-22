import { useState } from 'react'
import { Button, TextArea, Tooltip } from '@patternfly/react-core'
import {
  AngleDownIcon,
  AngleRightIcon,
  CodeBranchIcon,
  CloudUploadAltIcon,
  GithubIcon,
  PlusIcon,
  MinusIcon,

  SyncAltIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UndoIcon,
} from '@patternfly/react-icons'

interface ChangedFile {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'renamed'
  additions: number
  deletions: number
}

interface Commit {
  hash: string
  message: string
  author: string
  time: string
}

const MOCK_FILES: ChangedFile[] = [
  { path: 'src/services/auth.ts', status: 'modified', additions: 12, deletions: 5 },
  { path: 'src/middleware/rateLimiter.ts', status: 'added', additions: 8, deletions: 0 },
  { path: 'src/config/database.ts', status: 'modified', additions: 2, deletions: 2 },
  { path: 'src/utils/deprecated.ts', status: 'deleted', additions: 0, deletions: 34 },
]

const MOCK_COMMITS: Commit[] = [
  { hash: 'a3f1c2d', message: 'Fix authentication token refresh', author: 'mokhtar', time: '2h ago' },
  { hash: 'b7e4a19', message: 'Add rate limiter middleware', author: 'mokhtar', time: '5h ago' },
  { hash: 'c9d2f38', message: 'Update database connection config', author: 'mokhtar', time: '1d ago' },
]

const MOCK_AHEAD: number = 2
const MOCK_BEHIND = 0

const STATUS_COLORS: Record<string, string> = {
  modified: '#d29922',
  added: '#1a7f37',
  deleted: '#cf222e',
  renamed: '#1f6feb',
}

const STATUS_LABELS: Record<string, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
}

const MONO_FONT = '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

function fileName(path: string): string {
  return path.split('/').pop() || path
}

function fileDir(path: string): string {
  const parts = path.split('/')
  return parts.length > 1 ? parts.slice(0, -1).join('/') : ''
}

function SectionHeader({
  label,
  count,
  expanded,
  onToggle,
  actions,
}: {
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
  actions?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px 6px 8px',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--pf-t--global--text--color--subtle)',
      }}
      onClick={onToggle}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--pf-t--global--background--color--secondary--default)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {expanded ? <AngleDownIcon style={{ fontSize: 12 }} /> : <AngleRightIcon style={{ fontSize: 12 }} />}
        <span>{label}</span>
        <span style={{
          marginLeft: 4,
          fontSize: 10,
          fontWeight: 600,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--pf-t--global--background--color--secondary--default)',
          color: 'var(--pf-t--global--text--color--subtle)',
        }}>
          {count}
        </span>
      </div>
      {actions && (
        <div
          style={{ display: 'flex', gap: 2 }}
          onClick={e => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  )
}

function FileRow({
  file,
  actions,
}: {
  file: ChangedFile
  actions: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const dir = fileDir(file.path)
  const name = fileName(file.path)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px 4px 28px',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: MONO_FONT,
        transition: 'background 0.1s',
        background: hovered ? 'var(--pf-t--global--background--color--secondary--default)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: MONO_FONT,
        color: STATUS_COLORS[file.status],
      }}>
        {STATUS_LABELS[file.status]}
      </span>
      <span style={{
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'var(--pf-t--global--text--color--regular)',
      }}>
        {name}
        {dir && (
          <span style={{
            marginLeft: 6,
            fontSize: 11,
            color: 'var(--pf-t--global--text--color--subtle)',
            fontFamily: MONO_FONT,
          }}>
            {dir}
          </span>
        )}
      </span>
      <span style={{
        display: 'flex',
        gap: 4,
        flexShrink: 0,
        fontSize: 11,
        marginRight: 4,
      }}>
        {file.additions > 0 && <span style={{ color: '#1a7f37' }}>+{file.additions}</span>}
        {file.deletions > 0 && <span style={{ color: '#cf222e' }}>-{file.deletions}</span>}
      </span>
      <div
        style={{
          display: 'flex',
          gap: 2,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.1s',
        }}
      >
        {actions}
      </div>
    </div>
  )
}

function IconButton({
  icon,
  tooltip,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  tooltip: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <Tooltip content={tooltip}>
      <button
        onClick={e => {
          e.stopPropagation()
          onClick()
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 3,
          borderRadius: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: danger
            ? 'var(--pf-t--global--color--status--danger--default)'
            : 'var(--pf-t--global--text--color--subtle)',
          fontSize: 13,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--pf-t--global--background--color--action--plain--hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {icon}
      </button>
    </Tooltip>
  )
}

export function GitPanel() {
  const [stagedPaths, setStagedPaths] = useState<Set<string>>(() => new Set())
  const [commitMessage, setCommitMessage] = useState('')
  const [stagedExpanded, setStagedExpanded] = useState(true)
  const [changesExpanded, setChangesExpanded] = useState(true)
  const [commitsExpanded, setCommitsExpanded] = useState(false)

  const stagedFiles = MOCK_FILES.filter(f => stagedPaths.has(f.path))
  const unstagedFiles = MOCK_FILES.filter(f => !stagedPaths.has(f.path))

  const stageFile = (path: string) => {
    setStagedPaths(prev => new Set(prev).add(path))
  }

  const unstageFile = (path: string) => {
    setStagedPaths(prev => {
      const next = new Set(prev)
      next.delete(path)
      return next
    })
  }

  const stageAll = () => setStagedPaths(new Set(MOCK_FILES.map(f => f.path)))
  const unstageAll = () => setStagedPaths(new Set())

  const canCommit = stagedFiles.length > 0 && commitMessage.trim().length > 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Branch header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--pf-t--global--border--color--default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <CodeBranchIcon style={{ fontSize: 13, color: 'var(--pf-t--global--text--color--subtle)', flexShrink: 0 }} />
          <span style={{
            fontFamily: MONO_FONT,
            fontWeight: 500,
            fontSize: 12,
            color: 'var(--pf-t--global--text--color--regular)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            feature/auth-refactor
          </span>
          {(MOCK_AHEAD > 0 || MOCK_BEHIND > 0) && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--pf-t--global--text--color--subtle)',
              flexShrink: 0,
            }}>
              {MOCK_AHEAD > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpIcon style={{ fontSize: 10 }} />{MOCK_AHEAD}
                </span>
              )}
              {MOCK_BEHIND > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <ArrowDownIcon style={{ fontSize: 10 }} />{MOCK_BEHIND}
                </span>
              )}
            </span>
          )}
        </div>
        <Tooltip content="Sync (pull & push)">
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--pf-t--global--text--color--subtle)',
              fontSize: 14,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--pf-t--global--background--color--action--plain--hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <SyncAltIcon />
          </button>
        </Tooltip>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Staged changes section */}
        {stagedFiles.length > 0 && (
          <div>
            <SectionHeader
              label="Staged Changes"
              count={stagedFiles.length}
              expanded={stagedExpanded}
              onToggle={() => setStagedExpanded(v => !v)}
              actions={
                <IconButton
                  icon={<MinusIcon style={{ fontSize: 12 }} />}
                  tooltip="Unstage all"
                  onClick={unstageAll}
                />
              }
            />
            {stagedExpanded && (
              <div style={{ paddingBottom: 4 }}>
                {stagedFiles.map(file => (
                  <FileRow
                    key={file.path}
                    file={file}
                    actions={
                      <IconButton
                        icon={<MinusIcon style={{ fontSize: 12 }} />}
                        tooltip="Unstage"
                        onClick={() => unstageFile(file.path)}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unstaged changes section */}
        {unstagedFiles.length > 0 && (
          <div>
            <SectionHeader
              label="Changes"
              count={unstagedFiles.length}
              expanded={changesExpanded}
              onToggle={() => setChangesExpanded(v => !v)}
              actions={
                <>
                  <IconButton
                    icon={<UndoIcon style={{ fontSize: 12 }} />}
                    tooltip="Discard all changes"
                    onClick={() => {}}
                    danger
                  />
                  <IconButton
                    icon={<PlusIcon style={{ fontSize: 12 }} />}
                    tooltip="Stage all"
                    onClick={stageAll}
                  />
                </>
              }
            />
            {changesExpanded && (
              <div style={{ paddingBottom: 4 }}>
                {unstagedFiles.map(file => (
                  <FileRow
                    key={file.path}
                    file={file}
                    actions={
                      <>
                        <IconButton
                          icon={<UndoIcon style={{ fontSize: 12 }} />}
                          tooltip="Discard changes"
                          onClick={() => {}}
                          danger
                        />
                        <IconButton
                          icon={<PlusIcon style={{ fontSize: 12 }} />}
                          tooltip="Stage"
                          onClick={() => stageFile(file.path)}
                        />
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {MOCK_FILES.length === 0 && (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--pf-t--global--text--color--subtle)',
          }}>
            No changes detected
          </div>
        )}

        {/* Commit area */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--pf-t--global--border--color--default)',
        }}>
          <style>{`.git-commit-input.pf-v6-c-form-control { --pf-v6-c-form-control--BorderColor: var(--pf-t--global--border--color--default); --pf-v6-c-form-control--hover--BorderColor: var(--pf-t--global--border--color--default); box-shadow: none; }`}</style>
          <TextArea
            className="git-commit-input"
            value={commitMessage}
            onChange={(_e, val) => setCommitMessage(val)}
            placeholder="Message (press Ctrl+Enter to commit)"
            rows={3}
            style={{
              fontSize: 12,
              resize: 'vertical',
              fontFamily: MONO_FONT,
            }}
            aria-label="Commit message"
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Button
              variant="primary"
              isBlock
              isDisabled={!canCommit}
              style={{ fontSize: 12 }}
            >
              Commit
            </Button>
            <Tooltip content="Commit staged changes and push">
              <Button
                variant="secondary"
                isDisabled={!canCommit}
                style={{ fontSize: 12, flexShrink: 0 }}
                icon={<CloudUploadAltIcon />}
              >
                Commit & Push
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Push / PR actions */}
        {MOCK_AHEAD > 0 && (
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--pf-t--global--border--color--default)',
            display: 'flex',
            gap: 6,
          }}>
            <Button
              variant="secondary"
              isBlock
              icon={<CloudUploadAltIcon />}
              style={{ fontSize: 12 }}
            >
              Push {MOCK_AHEAD} commit{MOCK_AHEAD !== 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Recent commits */}
        <div>
          <SectionHeader
            label="Commits"
            count={MOCK_COMMITS.length}
            expanded={commitsExpanded}
            onToggle={() => setCommitsExpanded(v => !v)}
          />
          {commitsExpanded && (
            <div style={{ paddingBottom: 4 }}>
              {MOCK_COMMITS.map(commit => (
                <div
                  key={commit.hash}
                  style={{
                    padding: '5px 12px 5px 28px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--pf-t--global--background--color--secondary--default)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    fontFamily: MONO_FONT,
                    fontSize: 11,
                    color: 'var(--pf-t--global--text--color--subtle)',
                    flexShrink: 0,
                  }}>
                    {commit.hash.slice(0, 7)}
                  </span>
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--pf-t--global--text--color--regular)',
                  }}>
                    {commit.message}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: 'var(--pf-t--global--text--color--subtle)',
                    flexShrink: 0,
                  }}>
                    {commit.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create PR */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--pf-t--global--border--color--default)',
        }}>
          <Button
            variant="link"
            isBlock
            icon={<GithubIcon />}
            style={{ fontSize: 12, justifyContent: 'center' }}
          >
            Create pull request
          </Button>
        </div>
      </div>
    </div>
  )
}
