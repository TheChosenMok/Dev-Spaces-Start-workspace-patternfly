import { useState } from 'react'
import { Button, Checkbox, TextArea } from '@patternfly/react-core'
import { CloudUploadAltIcon, CodeBranchIcon, GithubIcon } from '@patternfly/react-icons'

interface ChangedFile {
  path: string
  status: 'modified' | 'added' | 'deleted'
  additions: number
  deletions: number
}

const MOCK_CHANGED_FILES: ChangedFile[] = [
  { path: 'src/services/auth.ts', status: 'modified', additions: 12, deletions: 5 },
  { path: 'src/middleware/rateLimiter.ts', status: 'added', additions: 8, deletions: 0 },
  { path: 'src/config/database.ts', status: 'modified', additions: 2, deletions: 2 },
]

const STATUS_COLORS: Record<string, string> = {
  modified: '#d29922',
  added: '#1a7f37',
  deleted: '#cf222e',
}

const STATUS_LABELS: Record<string, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
}

export function GitPanel() {
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(() => new Set())
  const [commitMessage, setCommitMessage] = useState('')

  const toggleFile = (path: string) => {
    setStagedFiles(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const stageAll = () => setStagedFiles(new Set(MOCK_CHANGED_FILES.map(f => f.path)))
  const unstageAll = () => setStagedFiles(new Set())

  const allStaged = MOCK_CHANGED_FILES.every(f => stagedFiles.has(f.path))

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      {/* Branch info */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--pf-t--global--border--color--default)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: 'var(--pf-t--global--text--color--subtle)',
      }}>
        <CodeBranchIcon style={{ fontSize: 14 }} />
        <span style={{ fontWeight: 600, color: 'var(--pf-t--global--text--color--regular)' }}>feature/auth-refactor</span>
      </div>

      {/* Changed files */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--pf-t--global--text--color--subtle)', letterSpacing: '0.5px' }}>
            Changes ({MOCK_CHANGED_FILES.length})
          </span>
          <Button variant="link" size="sm" onClick={allStaged ? unstageAll : stageAll} style={{ fontSize: 12, padding: 0 }}>
            {allStaged ? 'Unstage all' : 'Stage all'}
          </Button>
        </div>

        {MOCK_CHANGED_FILES.map(file => (
          <div
            key={file.path}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 4px', borderRadius: 4, cursor: 'pointer',
              fontSize: 13,
            }}
            onClick={() => toggleFile(file.path)}
          >
            <Checkbox
              id={`stage-${file.path}`}
              isChecked={stagedFiles.has(file.path)}
              onChange={() => toggleFile(file.path)}
              style={{ '--pf-v6-c-check__input--Height': '14px', '--pf-v6-c-check__input--Width': '14px' } as React.CSSProperties}
            />
            <span style={{
              width: 16, height: 16, borderRadius: 3,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, flexShrink: 0,
              color: STATUS_COLORS[file.status],
              border: `1px solid ${STATUS_COLORS[file.status]}`,
            }}>
              {STATUS_LABELS[file.status]}
            </span>
            <span style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {file.path}
            </span>
            <span style={{ fontSize: 11, color: '#1a7f37', flexShrink: 0 }}>+{file.additions}</span>
            {file.deletions > 0 && <span style={{ fontSize: 11, color: '#cf222e', flexShrink: 0 }}>-{file.deletions}</span>}
          </div>
        ))}
      </div>

      {/* Staged summary */}
      {stagedFiles.size > 0 && (
        <div style={{
          padding: '8px 16px',
          fontSize: 12, color: 'var(--pf-t--global--text--color--subtle)',
          borderTop: '1px solid var(--pf-t--global--border--color--default)',
        }}>
          {stagedFiles.size} of {MOCK_CHANGED_FILES.length} file{stagedFiles.size !== 1 ? 's' : ''} staged
        </div>
      )}

      {/* Commit message */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--pf-t--global--border--color--default)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--pf-t--global--text--color--subtle)', letterSpacing: '0.5px', marginBottom: 8 }}>
          Commit message
        </div>
        <TextArea
          value={commitMessage}
          onChange={(_e, val) => setCommitMessage(val)}
          placeholder="Describe your changes..."
          rows={3}
          style={{ fontSize: 13, resize: 'vertical' }}
          aria-label="Commit message"
        />
      </div>

      {/* Actions */}
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button
          variant="primary"
          isBlock
          icon={<CodeBranchIcon />}
          isDisabled={stagedFiles.size === 0 || !commitMessage.trim()}
          style={{ fontSize: 13 }}
        >
          Commit
        </Button>
        <Button
          variant="secondary"
          isBlock
          icon={<CloudUploadAltIcon />}
          style={{ fontSize: 13 }}
        >
          Push
        </Button>
        <div style={{ borderTop: '1px solid var(--pf-t--global--border--color--default)', paddingTop: 8, marginTop: 4 }}>
          <Button
            variant="link"
            isBlock
            icon={<GithubIcon />}
            style={{ fontSize: 13, justifyContent: 'center' }}
          >
            Create pull request
          </Button>
        </div>
      </div>
    </div>
  )
}
