import { useState } from 'react'
import {
  Button,
  EmptyState,
  EmptyStateBody,
  Label,
  Switch,
  TextInput,
  Title,
} from '@patternfly/react-core'
import {
  CogIcon,
  PluggedIcon,
  SearchIcon,
} from '@patternfly/react-icons'
import type { McpServer, Skill } from './globalSettingsMockData'
import {
  MOCK_MCP_CATALOG,
  MOCK_SKILLS_CATALOG,
  SKILL_CATEGORY_LABELS,
} from './globalSettingsMockData'
import { AGENT_TOOLS, PROVIDER_MODELS } from './agentSpaceMockData'
import { BrandIcon } from './BrandIcons'

export type SettingsView = 'providers' | 'mcps' | 'skills' | 'settings'

const STATUS_COLORS: Record<McpServer['status'], 'green' | 'grey' | 'red'> = {
  connected: 'green',
  disconnected: 'grey',
  error: 'red',
}

const CATEGORY_COLORS: Record<Skill['category'], 'blue' | 'purple' | 'orange' | 'teal' | 'grey'> = {
  code: 'blue',
  research: 'purple',
  testing: 'orange',
  devops: 'teal',
  general: 'grey',
}

const VIEW_TITLES: Record<SettingsView, string> = {
  providers: 'Providers',
  mcps: 'MCP Servers',
  skills: 'Skills',
  settings: 'Settings',
}

interface GlobalSettingsPanelProps {
  view: SettingsView
}

const INITIAL_PROVIDER_STATUS: Record<string, boolean> = {
  'openshift-ai': true,
  'opencode': true,
  'claude-code': false,
  'codex': false,
}

export function GlobalSettingsPanel({ view }: GlobalSettingsPanelProps) {
  const [mcpServers, setMcpServers] = useState<McpServer[]>(MOCK_MCP_CATALOG)
  const [skills, setSkills] = useState<Skill[]>(MOCK_SKILLS_CATALOG)
  const [providerConnected, setProviderConnected] = useState<Record<string, boolean>>(INITIAL_PROVIDER_STATUS)
  const [mcpFilter, setMcpFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')

  const toggleMcp = (id: string) => {
    setMcpServers(prev =>
      prev.map(s => {
        if (s.id !== id) return s
        const enabled = !s.enabled
        return { ...s, enabled, status: enabled ? 'connected' as const : 'disconnected' as const }
      }),
    )
  }

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  const filteredMcps = mcpServers.filter(s =>
    s.name.toLowerCase().includes(mcpFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(mcpFilter.toLowerCase()),
  )

  const filteredSkills = skills.filter(s =>
    s.name.toLowerCase().includes(skillFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(skillFilter.toLowerCase()),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--pf-t--global--border--color--default)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Title headingLevel="h2" size="lg" style={{ margin: 0 }}>{VIEW_TITLES[view]}</Title>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {view === 'providers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 640 }}>
            {AGENT_TOOLS.map(tool => {
              const models = PROVIDER_MODELS[tool.id] ?? []
              const connected = providerConnected[tool.id] ?? false
              return (
                <div
                  key={tool.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--pf-t--global--background--color--secondary--default)',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ paddingTop: 2 }}>
                    <BrandIcon id={tool.id} size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{tool.name}</span>
                      <Label color={connected ? 'green' : 'grey'} isCompact>
                        {connected ? 'connected' : 'disconnected'}
                      </Label>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{tool.description}</div>
                    {models.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {models.map(m => (
                          <Label key={m.id} isCompact color="blue">{m.name}</Label>
                        ))}
                      </div>
                    )}
                  </div>
                  <Switch
                    isChecked={connected}
                    onChange={() => setProviderConnected(prev => ({ ...prev, [tool.id]: !prev[tool.id] }))}
                    aria-label={`Toggle ${tool.name}`}
                  />
                </div>
              )
            })}
          </div>
        )}

        {view === 'mcps' && (
          <>
            <div style={{ marginBottom: 16, maxWidth: 480 }}>
              <TextInput
                placeholder="Filter MCP servers..."
                value={mcpFilter}
                onChange={(_e, val) => setMcpFilter(val)}
                aria-label="Filter MCPs"
                customIcon={<SearchIcon />}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 640 }}>
              {filteredMcps.map(server => (
                <div
                  key={server.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--pf-t--global--background--color--secondary--default)',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{server.name}</span>
                      <Label color={STATUS_COLORS[server.status]} isCompact>
                        {server.status}
                      </Label>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        {server.tools} tools
                      </span>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{server.description}</div>
                    <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4, fontFamily: 'monospace' }}>
                      {server.endpoint}
                    </div>
                  </div>
                  <Switch
                    isChecked={server.enabled}
                    onChange={() => toggleMcp(server.id)}
                    aria-label={`Toggle ${server.name}`}
                  />
                </div>
              ))}

              {filteredMcps.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>
                  No MCP servers match your filter
                </div>
              )}
            </div>

            <Button variant="link" icon={<PluggedIcon />} style={{ marginTop: 8 }}>
              Add MCP server
            </Button>
          </>
        )}

        {view === 'skills' && (
          <>
            <div style={{ marginBottom: 16, maxWidth: 480 }}>
              <TextInput
                placeholder="Filter skills..."
                value={skillFilter}
                onChange={(_e, val) => setSkillFilter(val)}
                aria-label="Filter skills"
                customIcon={<SearchIcon />}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 640 }}>
              {filteredSkills.map(skill => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--pf-t--global--background--color--secondary--default)',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{skill.name}</span>
                      <Label color={CATEGORY_COLORS[skill.category]} isCompact>
                        {SKILL_CATEGORY_LABELS[skill.category]}
                      </Label>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{skill.description}</div>
                  </div>
                  <Switch
                    isChecked={skill.enabled}
                    onChange={() => toggleSkill(skill.id)}
                    aria-label={`Toggle ${skill.name}`}
                  />
                </div>
              ))}

              {filteredSkills.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>
                  No skills match your filter
                </div>
              )}
            </div>
          </>
        )}

        {view === 'settings' && (
          <EmptyState icon={CogIcon} titleText="Settings" headingLevel="h3">
            <EmptyStateBody>
              Global settings will be available here in a future update.
              These settings will affect all agent spaces and workspaces.
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>
    </div>
  )
}
