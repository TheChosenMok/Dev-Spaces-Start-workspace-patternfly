import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  MenuToggle,
  PageSection,
  Title,
} from '@patternfly/react-core'
import {
  ArrowLeftIcon,
  CodeBranchIcon,
  CodeIcon,
  CogIcon,
  CubesIcon,
  DesktopIcon,
  WrenchIcon,
  ExternalLinkAltIcon,
  PencilAltIcon,
  PlusCircleIcon,
  PluggedIcon,
  TerminalIcon,
} from '@patternfly/react-icons'
import type { Agent, AgentSettings, AgentToolId, Project, ToolAuth } from './agentSpaceTypes'
import type { ChatMessage as ChatMessageType } from './agentSpaceV2Types'
import { AGENT_TOOLS, DEFAULT_AGENT_SETTINGS, INITIAL_AUTH, MOCK_AGENTS, MOCK_PROJECTS, PROVIDER_MODELS, MOCK_TERMINAL_OUTPUT } from './agentSpaceMockData'
import { MOCK_STREAMING_RESPONSES, MOCK_THINKING, MOCK_TOOL_CALLS } from './agentSpaceV2MockData'
import { AgentSidebar } from './AgentSidebar'
import { AgentDetail } from './AgentDetail'
import { AddProjectModal } from './AddProjectModal'
import { AddAgentModal } from './AddAgentModal'
import { BrandIcon } from './BrandIcons'
import { hasBrandIcon } from './brandIconData'
import { EDITORS } from './EditorDropdown'
import { AgentProviderDropdown } from './AgentProviderDropdown'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { DiffPanel } from './DiffPanel'
import { GitPanel } from './GitPanel'
import { EditorPanel } from './EditorPanel'
import { GlobalSettingsPanel, type SettingsView } from './GlobalSettingsPanel'

const AUTH_STORAGE_KEY = 'agent-space-v2-auth'
let nextProjectId = 200
let nextAgentId = 200
let nextMsgId = 200
let responseIndex = 0

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

export function AgentSpaceV2() {
  // --- Agent/project state (same as v1) ---
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
  const [toolAuth, setToolAuth] = useState<ToolAuth[]>(() => {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (saved) {
      try { return JSON.parse(saved) as ToolAuth[] } catch { /* ignore */ }
    }
    return INITIAL_AUTH
  })
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    () => MOCK_AGENTS[0]?.id ?? null,
  )
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false)
  const [addAgentModalOpen, setAddAgentModalOpen] = useState(false)
  const [addAgentProjectId, setAddAgentProjectId] = useState('')
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView | null>(null)
  const [agentSettingsMap, setAgentSettingsMap] = useState<Record<string, AgentSettings>>(() => {
    const map: Record<string, AgentSettings> = {}
    MOCK_AGENTS.forEach(a => {
      const models = PROVIDER_MODELS[a.tool]
      map[a.id] = { ...DEFAULT_AGENT_SETTINGS, model: models?.[0]?.id ?? DEFAULT_AGENT_SETTINGS.model }
    })
    return map
  })

  // --- Chat state ---
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessageType[]>>({})
  const [isStreaming, setIsStreaming] = useState(false)
  const streamingRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // --- Toolbar state ---
  const [openInOpen, setOpenInOpen] = useState(false)
  type RightPanelView = 'changes' | 'git' | 'editor' | 'terminal'
  const [rightPanelView, setRightPanelView] = useState<RightPanelView | null>(null)
  const toggleRightPanel = useCallback((view: RightPanelView) => {
    setRightPanelView(prev => prev === view ? null : view)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(toolAuth))
  }, [toolAuth])

  useEffect(() => {
    return () => { if (streamingRef.current !== null) clearInterval(streamingRef.current) }
  }, [])

  // Auto-scroll chat
  const currentMessages = useMemo(
    () => selectedAgentId ? (chatMessages[selectedAgentId] ?? []) : [],
    [selectedAgentId, chatMessages],
  )
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80
    if (nearBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  const selectAgent = useCallback((id: string | null) => {
    setSelectedAgentId(id)
    setOpenInOpen(false)
    setRightPanelView(null)
  }, [])

  // --- Derived values ---
  const selectedAgent = useMemo(() => agents.find(a => a.id === selectedAgentId), [agents, selectedAgentId])
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedAgent?.projectId), [projects, selectedAgent])
  const isSelectedAuthenticated = useMemo(() => {
    if (!selectedAgent) return false
    return toolAuth.find(a => a.toolId === selectedAgent.tool)?.authenticated ?? false
  }, [toolAuth, selectedAgent])
  const selectedAgentSettings = useMemo(() => {
    if (!selectedAgentId) return DEFAULT_AGENT_SETTINGS
    return agentSettingsMap[selectedAgentId] ?? DEFAULT_AGENT_SETTINGS
  }, [selectedAgentId, agentSettingsMap])
  const addAgentProjectName = useMemo(() => projects.find(p => p.id === addAgentProjectId)?.name ?? '', [projects, addAgentProjectId])

  // --- Agent/project handlers (same as v1) ---
  const handleAuthenticate = useCallback((toolId: AgentToolId) => {
    setToolAuth(prev => prev.map(a => (a.toolId === toolId ? { ...a, authenticated: true } : a)))
  }, [])

  const handleAddProject = useCallback((name: string, repoUrl: string) => {
    setProjects(prev => [...prev, { id: `proj-${nextProjectId++}`, name, repoUrl }])
  }, [])

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    setAgents(prev => {
      const removed = prev.filter(a => a.projectId === projectId)
      if (removed.some(a => a.id === selectedAgentId)) selectAgent(null)
      return prev.filter(a => a.projectId !== projectId)
    })
  }, [selectedAgentId, selectAgent])

  const createAgent = useCallback((projectId: string, tool: AgentToolId) => {
    const id = `agent-${nextAgentId++}`
    const toolName = AGENT_TOOLS.find(t => t.id === tool)?.name ?? tool
    const summary = AUTO_SUMMARIES[nextAgentId % AUTO_SUMMARIES.length]
    const name = `${toolName} - ${summary}`
    const models = PROVIDER_MODELS[tool]
    setAgentSettingsMap(prev => ({ ...prev, [id]: { ...DEFAULT_AGENT_SETTINGS, model: models?.[0]?.id ?? DEFAULT_AGENT_SETTINGS.model } }))
    setAgents(prev => [...prev, { id, name, tool, status: 'running', projectId, summary, lastActivity: Date.now() }])
    selectAgent(id)
  }, [selectAgent])

  const handleAddAgent = useCallback((projectId: string) => {
    const projectAgents = agents.filter(a => a.projectId === projectId)
    if (projectAgents.length > 0) {
      const mostRecent = projectAgents.reduce((a, b) => (a.lastActivity > b.lastActivity ? a : b))
      createAgent(projectId, mostRecent.tool)
    } else {
      setAddAgentProjectId(projectId)
      setAddAgentModalOpen(true)
    }
  }, [agents, createAgent])

  const handleAddAgentWithTool = useCallback((tool: AgentToolId) => {
    createAgent(addAgentProjectId, tool)
  }, [addAgentProjectId, createAgent])

  const handleRenameProject = useCallback((projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, name: newName } : p)))
  }, [])

  const handleDeleteAgent = useCallback((agentId: string) => {
    if (agentId === selectedAgentId) selectAgent(null)
    setAgents(prev => prev.filter(a => a.id !== agentId))
  }, [selectedAgentId, selectAgent])

  const handleToolChange = useCallback((newTool: AgentToolId) => {
    if (!selectedAgentId) return
    const toolName = AGENT_TOOLS.find(t => t.id === newTool)?.name ?? newTool
    setAgents(prev => prev.map(a => {
      if (a.id !== selectedAgentId) return a
      const parts = a.name.split(' - ')
      const threadName = parts.length > 1 ? parts.slice(1).join(' - ') : a.summary
      return { ...a, tool: newTool, name: `${toolName} - ${threadName}` }
    }))
  }, [selectedAgentId])

  const handleSettingsChange = useCallback((newSettings: AgentSettings) => {
    if (!selectedAgentId) return
    setAgentSettingsMap(prev => ({ ...prev, [selectedAgentId]: newSettings }))
  }, [selectedAgentId])

  // --- Chat handler ---
  const handleSendMessage = useCallback((content: string) => {
    if (isStreaming || !selectedAgentId) return

    const agentId = selectedAgentId
    const userMsg: ChatMessageType = { id: `msg-${nextMsgId++}`, role: 'user', content, timestamp: Date.now() }
    const assistantMsgId = `msg-${nextMsgId++}`
    const idx = responseIndex % MOCK_STREAMING_RESPONSES.length
    const thinking = MOCK_THINKING[idx % MOCK_THINKING.length]
    const toolCalls = MOCK_TOOL_CALLS[idx % MOCK_TOOL_CALLS.length]
    const assistantMsg: ChatMessageType = { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true, thinking, toolCalls }
    const fullResponse = MOCK_STREAMING_RESPONSES[idx]
    responseIndex++

    setChatMessages(prev => ({ ...prev, [agentId]: [...(prev[agentId] ?? []), userMsg, assistantMsg] }))
    setIsStreaming(true)

    let charIndex = 0
    const thinkingDelay = window.setTimeout(() => {
      streamingRef.current = window.setInterval(() => {
        const chunkSize = Math.floor(Math.random() * 8) + 6
        charIndex = Math.min(charIndex + chunkSize, fullResponse.length)
        const partial = fullResponse.slice(0, charIndex)
        const done = charIndex >= fullResponse.length

        setChatMessages(prev => ({
          ...prev,
          [agentId]: (prev[agentId] ?? []).map(m =>
            m.id === assistantMsgId ? { ...m, content: partial, isStreaming: !done } : m
          ),
        }))

        if (done) {
          if (streamingRef.current !== null) clearInterval(streamingRef.current)
          streamingRef.current = null
          setIsStreaming(false)
        }
      }, 20)
    }, 500)

    return () => { clearTimeout(thinkingDelay); if (streamingRef.current !== null) clearInterval(streamingRef.current) }
  }, [isStreaming, selectedAgentId])

  // --- Terminal lines for the terminal panel ---
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const terminalTool = selectedAgent?.tool
  const terminalKey = selectedAgent?.id
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing mock terminal output with component state
    if (!terminalTool) { setTerminalLines([]); return }
    const allLines = MOCK_TERMINAL_OUTPUT[terminalTool]
    setTerminalLines([])
    let index = 0
    const interval = setInterval(() => {
      if (index < allLines.length) { setTerminalLines(prev => [...prev, allLines[index]]); index++ }
      else clearInterval(interval)
    }, 400)
    return () => clearInterval(interval)
  }, [terminalKey, terminalTool])

  return (
    <>
      <style>{`.pf-v6-c-page__main-container { align-self: stretch !important; max-height: 99% !important; }`}</style>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Left sidebar — identical to v1 */}
        <div style={{
          width: 260, minWidth: 260,
          borderRight: '1px solid var(--pf-t--global--border--color--default)',
          display: 'flex', flexDirection: 'column', outline: 'none',
        }}>
          {!activeSettingsView && (
            <>
              <div style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--pf-t--global--border--color--default)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Title headingLevel="h2" size="lg" style={{ margin: 0 }}>Projects</Title>
                <Button variant="plain" size="sm" icon={<PlusCircleIcon />} onClick={() => setAddProjectModalOpen(true)} aria-label="Add project" style={{ padding: 4 }} />
              </div>
              <AgentSidebar
                projects={projects}
                agents={agents}
                selectedAgentId={selectedAgentId}
                onSelectAgent={selectAgent}
                onAddAgent={handleAddAgent}
                onDeleteAgent={handleDeleteAgent}
                onDeleteProject={handleDeleteProject}
                onRenameProject={handleRenameProject}
              />
            </>
          )}
          <div
            style={{
              borderTop: '1px solid var(--pf-t--global--border--color--default)',
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {activeSettingsView && (
              <div style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--pf-t--global--border--color--default)',
                marginBottom: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Title headingLevel="h2" size="lg" style={{ margin: 0 }}>Settings</Title>
                <Button variant="plain" size="sm" icon={<ArrowLeftIcon />} onClick={() => setActiveSettingsView(null)} aria-label="Back" style={{ padding: 4 }} />
              </div>
            )}
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

        {/* Main content area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeSettingsView ? (
            <GlobalSettingsPanel view={activeSettingsView} onBack={() => setActiveSettingsView(null)} />
          ) : isSelectedAuthenticated && selectedAgent ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Toolbar — same as v1 AgentTerminal */}
              <div style={{ containerType: 'inline-size', borderBottom: '1px solid var(--pf-t--global--border--color--default)' }}>
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                flexWrap={{ default: 'nowrap' }}
                style={{ padding: '8px 16px' }}
              >
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    <FlexItem>
                      <AgentProviderDropdown
                        tool={selectedAgent.tool}
                        settings={selectedAgentSettings}
                        onToolChange={handleToolChange}
                        onSettingsChange={handleSettingsChange}
                      />
                    </FlexItem>
                    <FlexItem style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: 14 }}>/</FlexItem>
                    <FlexItem style={{ fontWeight: 600 }}>
                      {(() => {
                        const toolName = AGENT_TOOLS.find(t => t.id === selectedAgent.tool)?.name ?? ''
                        const parts = selectedAgent.name.split(' - ')
                        return parts.length > 1 ? parts.slice(1).join(' - ') : selectedAgent.name.replace(toolName, '').replace(/^[\s-]+/, '') || selectedAgent.name
                      })()}
                    </FlexItem>
                    <FlexItem className="agent-toolbar-v2">
                      <Dropdown isOpen={openInOpen} onSelect={() => setOpenInOpen(false)} onOpenChange={setOpenInOpen} popperProps={{ position: 'left' }}
                        toggle={(toggleRef) => (
                          <MenuToggle ref={toggleRef} onClick={() => setOpenInOpen(o => !o)} isExpanded={openInOpen} icon={<ExternalLinkAltIcon />}>
                            Open in
                          </MenuToggle>
                        )}
                      >
                        <DropdownList>
                          {EDITORS.filter(e => !('isCustom' in e)).map(editor => (
                            <DropdownItem key={editor.id} icon={hasBrandIcon(editor.id) ? <BrandIcon id={editor.id} size={18} /> : <DesktopIcon />}>
                              {editor.label}
                            </DropdownItem>
                          ))}
                        </DropdownList>
                      </Dropdown>
                    </FlexItem>
                  </Flex>
                </FlexItem>

                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                    <style>{`
                      .agent-toolbar-v2 .pf-v6-c-menu-toggle,
                      .agent-toolbar-v2 .pf-v6-c-button {
                        height: 28px !important; max-height: 28px !important; min-height: 28px !important;
                        font-size: 13px; display: inline-flex; align-items: center; box-sizing: border-box;
                        padding-inline: 8px !important; padding-block: 0 !important;
                      }
                      .agent-toolbar-v2 .pf-v6-c-menu-toggle.pf-m-split-button {
                        padding: 0 !important;
                        --pf-v6-c-menu-toggle--PaddingBlockStart: 0;
                        --pf-v6-c-menu-toggle--PaddingBlockEnd: 0;
                        --pf-v6-c-menu-toggle--PaddingInlineStart: 6px;
                        --pf-v6-c-menu-toggle--PaddingInlineEnd: 6px;
                        --pf-v6-c-menu-toggle--m-split-button--pill--child--PaddingInlineEnd--offset: 6px;
                        --pf-v6-c-menu-toggle--m-split-button--pill--child--PaddingInlineStart--offset: 4px;
                        --pf-v6-c-menu-toggle__button--toggle-icon--PaddingInlineStart: 4px;
                        --pf-v6-c-menu-toggle__button--toggle-icon--PaddingInlineEnd: 4px;
                      }
                      .agent-toolbar-v2 .pf-v6-c-menu-toggle.pf-m-split-button > * {
                        align-self: stretch !important;
                        display: inline-flex !important; align-items: center !important;
                        padding-block: 0 !important;
                      }
                      .agent-toolbar-v2 .pf-v6-c-menu-toggle.pf-m-split-button .pf-v6-c-menu-toggle__controls {
                        display: inline-flex; align-items: center; justify-content: center;
                      }
                      .agent-toolbar-v2 .pf-v6-c-menu-toggle.pf-m-split-button .pf-v6-c-menu-toggle__controls .pf-v6-c-menu-toggle__toggle-icon {
                        display: inline-flex; align-items: center; min-width: 12px;
                      }
                      @container (max-width: 1240px) {
                        .toolbar-provider-name { display: none !important; }
                      }
                    `}</style>

                    <FlexItem style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {([
                        { key: 'changes' as const, label: 'Changes', icon: <CodeIcon style={{ fontSize: 12 }} /> },
                        { key: 'git' as const, label: 'Git', icon: <CodeBranchIcon style={{ fontSize: 12 }} /> },
                        { key: 'editor' as const, label: 'Editor', icon: <PencilAltIcon style={{ fontSize: 12 }} /> },
                        { key: 'terminal' as const, label: 'Terminal', icon: <TerminalIcon style={{ fontSize: 12 }} /> },
                      ]).map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => toggleRightPanel(tab.key)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', fontSize: 12, fontWeight: 500,
                            height: 28, border: 'none', cursor: 'pointer', borderRadius: 4,
                            background: rightPanelView === tab.key
                              ? 'var(--pf-t--global--background--color--action--plain--clicked)'
                              : 'transparent',
                            color: rightPanelView === tab.key
                              ? 'var(--pf-t--global--text--color--regular)'
                              : 'var(--pf-t--global--text--color--subtle)',
                          }}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </FlexItem>

                  </Flex>
                </FlexItem>
              </Flex>
              </div>

              {/* Chat area + panels */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {/* Chat messages */}
                  <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                    {currentMessages.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--pf-t--global--text--color--subtle)', fontSize: 14 }}>
                        Send a message to start chatting.
                      </div>
                    ) : (
                      <>
                        {currentMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  <ChatInput onSend={handleSendMessage} isStreaming={isStreaming} />
                </div>

                {/* Right panel with tab views */}
                {rightPanelView !== null && (
                  <div style={{ width: 480, minWidth: 480, minHeight: 0, borderLeft: '1px solid var(--pf-t--global--border--color--default)' }}>
                      {rightPanelView === 'changes' && <DiffPanel />}
                      {rightPanelView === 'git' && <GitPanel />}
                      {rightPanelView === 'editor' && <EditorPanel />}
                      {rightPanelView === 'terminal' && (
                        <div style={{
                          minHeight: '100%', background: '#1e1e1e', color: '#aaaaaa',
                          fontFamily: 'monospace', fontSize: 13, padding: 12,
                        }}>
                          {terminalLines.map((line, i) => <div key={i} style={{ color: '#33cc33' }}>{line}</div>)}
                          <div>$ <span style={{ animation: 'blink 1s step-end infinite' }}>_</span></div>
                          <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          ) : selectedAgent ? (
            <AgentDetail
              agent={selectedAgent}
              project={selectedProject}
              isAuthenticated={isSelectedAuthenticated}
              onAuthenticate={handleAuthenticate}
            />
          ) : (
            <PageSection style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <EmptyState icon={PluggedIcon} titleText="Agent Space v2" headingLevel="h2">
                <EmptyStateBody>
                  Select an agent from the sidebar, or add a new project to get started.
                </EmptyStateBody>
                <EmptyStateFooter>
                  <EmptyStateActions>
                    <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setAddProjectModalOpen(true)}>Add Project</Button>
                  </EmptyStateActions>
                </EmptyStateFooter>
              </EmptyState>
            </PageSection>
          )}
        </div>
      </div>

      <AddProjectModal isOpen={addProjectModalOpen} onClose={() => setAddProjectModalOpen(false)} onSave={handleAddProject} />
      <AddAgentModal isOpen={addAgentModalOpen} projectName={addAgentProjectName} onClose={() => setAddAgentModalOpen(false)} onSave={handleAddAgentWithTool} />
    </>
  )
}
