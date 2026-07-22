import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Button,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { CogIcon, CubesIcon, PlusCircleIcon, PluggedIcon, WrenchIcon } from '@patternfly/react-icons'
import type { Agent, AgentSettings, AgentToolId, Project, ToolAuth } from './agentSpaceTypes'
import { AGENT_TOOLS, DEFAULT_AGENT_SETTINGS, INITIAL_AUTH, MOCK_AGENTS, MOCK_PROJECTS, PROVIDER_MODELS } from './agentSpaceMockData'
import { AgentAuthPanel } from './AgentAuthPanel'
import { AgentSidebar } from './AgentSidebar'
import { AgentDetail } from './AgentDetail'
import { AgentTerminal } from './AgentTerminal'
import { AddProjectModal } from './AddProjectModal'
import { AddAgentModal } from './AddAgentModal'
import { GlobalSettingsPanel, type SettingsView } from './GlobalSettingsPanel'

const AUTH_STORAGE_KEY = 'agent-space-auth'
let nextProjectId = 100
let nextAgentId = 100

const AUTO_SUMMARIES = [
  'New coding session',
  'Working on changes',
  'Investigating issue',
  'Implementing feature',
  'Code review session',
  'Debugging session',
  'Refactoring code',
  'Writing tests',
]

export function AgentSpace() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
  const [toolAuth, setToolAuth] = useState<ToolAuth[]>(() => {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved) as ToolAuth[]
      } catch {
        /* ignore */
      }
    }
    return INITIAL_AUTH
  })

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    () => MOCK_AGENTS[0]?.id ?? null,
  )
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false)
  const [addAgentModalOpen, setAddAgentModalOpen] = useState(false)
  const [addAgentProjectId, setAddAgentProjectId] = useState<string>('')
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView | null>(null)
  const [agentSettingsMap, setAgentSettingsMap] = useState<Record<string, AgentSettings>>(() => {
    const map: Record<string, AgentSettings> = {}
    MOCK_AGENTS.forEach((a) => {
      const models = PROVIDER_MODELS[a.tool]
      map[a.id] = { ...DEFAULT_AGENT_SETTINGS, model: models?.[0]?.id ?? DEFAULT_AGENT_SETTINGS.model }
    })
    return map
  })

  useEffect(() => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(toolAuth))
  }, [toolAuth])

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId],
  )

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedAgent?.projectId),
    [projects, selectedAgent],
  )

  const isSelectedAuthenticated = useMemo(() => {
    if (!selectedAgent) return false
    return toolAuth.find((a) => a.toolId === selectedAgent.tool)?.authenticated ?? false
  }, [toolAuth, selectedAgent])

  const handleAuthenticate = useCallback(
    (toolId: AgentToolId) => {
      setToolAuth((prev) =>
        prev.map((a) => (a.toolId === toolId ? { ...a, authenticated: true } : a)),
      )
    },
    [],
  )

  const handleAddProject = useCallback((name: string, repoUrl: string) => {
    const id = `proj-${nextProjectId++}`
    setProjects((prev) => [...prev, { id, name, repoUrl }])
  }, [])

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      setAgents((prev) => {
        const removed = prev.filter((a) => a.projectId === projectId)
        if (removed.some((a) => a.id === selectedAgentId)) setSelectedAgentId(null)
        return prev.filter((a) => a.projectId !== projectId)
      })
    },
    [selectedAgentId],
  )

  const createAgent = useCallback(
    (projectId: string, tool: AgentToolId) => {
      const id = `agent-${nextAgentId++}`
      const toolName = AGENT_TOOLS.find((t) => t.id === tool)?.name ?? tool
      const summary = AUTO_SUMMARIES[nextAgentId % AUTO_SUMMARIES.length]
      const name = `${toolName} - ${summary}`
      const models = PROVIDER_MODELS[tool]
      setAgentSettingsMap((prev) => ({
        ...prev,
        [id]: { ...DEFAULT_AGENT_SETTINGS, model: models?.[0]?.id ?? DEFAULT_AGENT_SETTINGS.model },
      }))
      setAgents((prev) => [...prev, { id, name, tool, status: 'running', projectId, summary, lastActivity: Date.now() }])
      setSelectedAgentId(id)
    },
    [],
  )

  const handleAddAgent = useCallback(
    (projectId: string) => {
      const projectAgents = agents.filter((a) => a.projectId === projectId)
      if (projectAgents.length > 0) {
        const mostRecent = projectAgents.reduce((a, b) => (a.lastActivity > b.lastActivity ? a : b))
        createAgent(projectId, mostRecent.tool)
      } else {
        setAddAgentProjectId(projectId)
        setAddAgentModalOpen(true)
      }
    },
    [agents, createAgent],
  )

  const handleAddAgentWithTool = useCallback(
    (tool: AgentToolId) => {
      createAgent(addAgentProjectId, tool)
    },
    [addAgentProjectId, createAgent],
  )

  const handleRenameProject = useCallback(
    (projectId: string, newName: string) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p)),
      )
    },
    [],
  )

  const handleDeleteAgent = useCallback(
    (agentId: string) => {
      if (agentId === selectedAgentId) setSelectedAgentId(null)
      setAgents((prev) => prev.filter((a) => a.id !== agentId))
    },
    [selectedAgentId],
  )

  const handleToolChange = useCallback(
    (newTool: AgentToolId) => {
      if (!selectedAgentId) return
      const toolName = AGENT_TOOLS.find((t) => t.id === newTool)?.name ?? newTool
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id !== selectedAgentId) return a
          const parts = a.name.split(' - ')
          const threadName = parts.length > 1 ? parts.slice(1).join(' - ') : a.summary
          return { ...a, tool: newTool, name: `${toolName} - ${threadName}` }
        }),
      )
    },
    [selectedAgentId],
  )

  const handleSettingsChange = useCallback(
    (newSettings: AgentSettings) => {
      if (!selectedAgentId) return
      setAgentSettingsMap((prev) => ({ ...prev, [selectedAgentId]: newSettings }))
    },
    [selectedAgentId],
  )

  const selectedAgentSettings = useMemo(() => {
    if (!selectedAgentId) return DEFAULT_AGENT_SETTINGS
    return agentSettingsMap[selectedAgentId] ?? DEFAULT_AGENT_SETTINGS
  }, [selectedAgentId, agentSettingsMap])

  const addAgentProjectName = useMemo(
    () => projects.find((p) => p.id === addAgentProjectId)?.name ?? '',
    [projects, addAgentProjectId],
  )

  return (
    <>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: 260,
            minWidth: 260,
            borderRight: '1px solid var(--pf-t--global--border--color--default)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--pf-t--global--border--color--default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Title headingLevel="h2" size="lg" style={{ margin: 0 }}>Projects</Title>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Button
                variant="plain"
                size="sm"
                icon={<PlusCircleIcon />}
                onClick={() => setAddProjectModalOpen(true)}
                aria-label="Add project"
                style={{ padding: 4 }}
              />
              <AgentAuthPanel toolAuth={toolAuth} onAuthenticate={handleAuthenticate} />
            </span>
          </div>
          <AgentSidebar
            projects={projects}
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            onAddAgent={handleAddAgent}
            onDeleteAgent={handleDeleteAgent}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
          />
          <div
            style={{
              borderTop: '1px solid var(--pf-t--global--border--color--default)',
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {([
              { key: 'providers' as const, label: 'Providers', icon: <CubesIcon /> },
              { key: 'mcps' as const, label: 'MCPs', icon: <PluggedIcon /> },
              { key: 'skills' as const, label: 'Skills', icon: <WrenchIcon /> },
              { key: 'settings' as const, label: 'Settings', icon: <CogIcon /> },
            ]).map(item => (
              <Button
                key={item.key}
                variant="plain"
                icon={item.icon}
                onClick={() => setActiveSettingsView(item.key)}
                style={{
                  fontSize: 13,
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: 0,
                  background: activeSettingsView === item.key
                    ? 'var(--pf-t--global--background--color--action--plain--clicked)'
                    : undefined,
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
          {activeSettingsView ? (
            <GlobalSettingsPanel view={activeSettingsView} />
          ) : isSelectedAuthenticated && selectedAgent ? (
            <AgentTerminal
              agent={selectedAgent}
              settings={selectedAgentSettings}
              onToolChange={handleToolChange}
              onSettingsChange={handleSettingsChange}
            />
          ) : selectedAgent ? (
            <AgentDetail
              agent={selectedAgent}
              project={selectedProject}
              isAuthenticated={isSelectedAuthenticated}
              onAuthenticate={handleAuthenticate}
            />
          ) : (
            <PageSection
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <EmptyState icon={PluggedIcon} titleText="Agent Space" headingLevel="h2">
                <EmptyStateBody>
                  Select an agent from the sidebar, or add a new project to get started.
                </EmptyStateBody>
                <EmptyStateFooter>
                  <EmptyStateActions>
                    <Button
                      variant="primary"
                      icon={<PlusCircleIcon />}
                      onClick={() => setAddProjectModalOpen(true)}
                    >
                      Add Project
                    </Button>
                  </EmptyStateActions>
                </EmptyStateFooter>
              </EmptyState>
            </PageSection>
          )}
          </div>
        </div>
      </div>

      <AddProjectModal
        isOpen={addProjectModalOpen}
        onClose={() => setAddProjectModalOpen(false)}
        onSave={handleAddProject}
      />
      <AddAgentModal
        isOpen={addAgentModalOpen}
        projectName={addAgentProjectName}
        onClose={() => setAddAgentModalOpen(false)}
        onSave={handleAddAgentWithTool}
      />
    </>
  )
}
