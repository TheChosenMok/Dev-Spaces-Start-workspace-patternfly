import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@patternfly/react-core'
import {
  ArchiveIcon,
  AngleDownIcon,
  AngleRightIcon,
  PlusCircleIcon,
} from '@patternfly/react-icons'
import type { Agent, Project } from './agentSpaceTypes'

interface ContextMenuState {
  projectId: string
  x: number
  y: number
}

interface AgentSidebarProps {
  projects: Project[]
  agents: Agent[]
  selectedAgentId: string | null
  onSelectAgent: (agentId: string) => void
  onAddAgent: (projectId: string) => void
  onDeleteAgent: (agentId: string) => void
  onDeleteProject: (projectId: string) => void
  onRenameProject: (projectId: string, newName: string) => void
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const INITIAL_VISIBLE = 4

export function AgentSidebar({
  projects,
  agents,
  selectedAgentId,
  onSelectAgent,
  onAddAgent,
  onDeleteAgent,
  onDeleteProject,
  onRenameProject,
}: AgentSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    document.addEventListener('click', close)
    document.addEventListener('contextmenu', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('contextmenu', close)
    }
  }, [contextMenu])

  useEffect(() => {
    if (renamingProjectId) renameInputRef.current?.focus()
  }, [renamingProjectId])

  const commitRename = (projectId: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) onRenameProject(projectId, trimmed)
    setRenamingProjectId(null)
  }

  const agentsByProject = useMemo(() => {
    const map = new Map<string, Agent[]>()
    for (const agent of agents) {
      const list = map.get(agent.projectId) ?? []
      list.push(agent)
      map.set(agent.projectId, list)
    }
    for (const [key, list] of map) {
      map.set(key, list.sort((a, b) => b.lastActivity - a.lastActivity))
    }
    return map
  }, [agents])

  return (
    <div style={{ flex: 1, overflowY: 'auto', outline: 'none' }}>
      <style>{`
        .agent-sidebar-item { position: relative; }
        .agent-sidebar-archive { visibility: hidden; }
        .agent-sidebar-time { visibility: visible; }
        .agent-sidebar-item:hover .agent-sidebar-archive { visibility: visible; }
        .agent-sidebar-item:hover .agent-sidebar-time { visibility: hidden; }
        .agent-sidebar-item:hover { background: var(--pf-t--global--background--color--action--plain--hover); }
      `}</style>
      {projects.length === 0 ? (
        <div style={{ padding: 16, color: 'var(--pf-t--global--text--color--regular)', opacity: 0.6, textAlign: 'center' }}>
          No projects yet
        </div>
      ) : (
        projects.map((project) => {
          const projectAgents = agentsByProject.get(project.id) ?? []
          const isCollapsed = collapsed[project.id] ?? false
          const isExpanded = expanded[project.id] ?? false
          const visibleAgents = isExpanded ? projectAgents : projectAgents.slice(0, INITIAL_VISIBLE)
          const hasMore = projectAgents.length > INITIAL_VISIBLE

          return (
            <div key={project.id}>
              <div
                className="agent-sidebar-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => setCollapsed((prev) => ({ ...prev, [project.id]: !isCollapsed }))}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setContextMenu({ projectId: project.id, x: e.clientX, y: e.clientY })
                }}
              >
                {isCollapsed ? (
                  <AngleRightIcon style={{ fontSize: 12, flexShrink: 0 }} />
                ) : (
                  <AngleDownIcon style={{ fontSize: 12, flexShrink: 0 }} />
                )}
                {renamingProjectId === project.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(project.id)
                      if (e.key === 'Escape') setRenamingProjectId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      fontWeight: 600,
                      fontSize: 13,
                      background: 'var(--pf-t--global--background--color--action--plain--hover)',
                      border: '1px solid var(--pf-t--global--border--color--clicked)',
                      borderRadius: 4,
                      padding: '1px 4px',
                      color: 'inherit',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontWeight: 600,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {project.name}
                  </span>
                )}
                <Button
                  variant="plain"
                  size="sm"
                  icon={<PlusCircleIcon />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddAgent(project.id)
                  }}
                  aria-label={`Add agent to ${project.name}`}
                  style={{ padding: 2 }}
                />
              </div>

              {!isCollapsed && (
                <div>
                  {visibleAgents.map((agent) => {
                    return (
                    <div
                      key={agent.id}
                      className="agent-sidebar-item"
                      onClick={() => onSelectAgent(agent.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px 6px 24px',
                        cursor: 'pointer',
                        background:
                          agent.id === selectedAgentId
                            ? 'var(--pf-t--global--background--color--action--plain--clicked)'
                            : undefined,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--pf-t--global--text--color--regular)',
                        }}
                      >
                        {agent.summary}
                      </span>
                      <span style={{ position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', width: 50 }}>
                        <span
                          className="agent-sidebar-time"
                          style={{
                            fontSize: 11,
                            color: 'var(--pf-t--global--text--color--regular)',
                            whiteSpace: 'nowrap',
                            opacity: 0.6,
                          }}
                        >
                          {timeAgo(agent.lastActivity)}
                        </span>
                        <Button
                          variant="plain"
                          size="sm"
                          icon={<ArchiveIcon style={{ fontSize: 12 }} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteAgent(agent.id)
                          }}
                          aria-label={`Archive ${agent.name}`}
                          className="agent-sidebar-archive"
                          style={{ padding: 2, position: 'absolute', right: 0 }}
                        />
                      </span>
                    </div>
                    )
                  })}
                  {hasMore && !isExpanded && (
                    <div
                      style={{
                        padding: '4px 8px 8px 24px',
                        fontSize: 12,
                        color: 'var(--pf-t--global--text--color--regular)', opacity: 0.6,
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpanded((prev) => ({ ...prev, [project.id]: true }))}
                    >
                      Show more
                    </div>
                  )}
                  {hasMore && isExpanded && (
                    <div
                      style={{
                        padding: '4px 8px 8px 24px',
                        fontSize: 12,
                        color: 'var(--pf-t--global--text--color--regular)', opacity: 0.6,
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpanded((prev) => ({ ...prev, [project.id]: false }))}
                    >
                      Show less
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            background: 'var(--pf-t--global--background--color--primary--default)',
            border: '1px solid var(--pf-t--global--border--color--default)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            padding: '4px 0',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '6px 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
            className="agent-sidebar-item"
            onClick={() => {
              const proj = projects.find((p) => p.id === contextMenu.projectId)
              setRenameValue(proj?.name ?? '')
              setRenamingProjectId(contextMenu.projectId)
              setContextMenu(null)
            }}
          >
            Rename project
          </div>
          <div
            style={{
              padding: '6px 12px',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--pf-t--global--color--status--danger--default)',
            }}
            className="agent-sidebar-item"
            onClick={() => {
              onDeleteProject(contextMenu.projectId)
              setContextMenu(null)
            }}
          >
            Remove project
          </div>
        </div>
      )}
    </div>
  )
}
