import { useEffect, useState } from 'react'
import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleAction,
  Tooltip,
} from '@patternfly/react-core'
import {
  CloudUploadAltIcon,
  CodeBranchIcon,
  CodeIcon,
  DesktopIcon,
  ExternalLinkAltIcon,
  GithubIcon,
  TerminalIcon,
} from '@patternfly/react-icons'
import type { Agent, AgentSettings, AgentToolId } from './agentSpaceTypes'
import { AGENT_TOOLS, MOCK_TERMINAL_OUTPUT } from './agentSpaceMockData'
import { BrandIcon } from './BrandIcons'
import { hasBrandIcon } from './brandIconData'
import { EDITORS } from './EditorDropdown'
import { AgentProviderDropdown } from './AgentProviderDropdown'
import { DiffPanel } from './DiffPanel'

interface AgentTerminalProps {
  agent: Agent
  settings: AgentSettings
  onToolChange: (tool: AgentToolId) => void
  onSettingsChange: (settings: AgentSettings) => void
}

export function AgentTerminal({ agent, settings, onToolChange, onSettingsChange }: AgentTerminalProps) {
  const [lines, setLines] = useState<string[]>([])
  const allLines = MOCK_TERMINAL_OUTPUT[agent.tool]

  const [openInOpen, setOpenInOpen] = useState(false)
  const [commitOpen, setCommitOpen] = useState(false)
  const [terminalPanelOpen, setTerminalPanelOpen] = useState(false)
  const [diffPanelOpen, setDiffPanelOpen] = useState(false)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < allLines.length) {
        setLines((prev) => [...prev, allLines[index]])
        index++
      } else {
        clearInterval(interval)
      }
    }, 400)
    return () => clearInterval(interval)
  }, [agent.id, allLines])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ containerType: 'inline-size', borderBottom: '1px solid var(--pf-t--global--border--color--default)' }}>
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        flexWrap={{ default: 'nowrap' }}
        style={{
          padding: '8px 16px',
        }}
      >
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <AgentProviderDropdown
                tool={agent.tool}
                settings={settings}
                onToolChange={onToolChange}
                onSettingsChange={onSettingsChange}
              />
            </FlexItem>
            <FlexItem style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: 14 }}>/</FlexItem>
            <FlexItem style={{ fontWeight: 600 }}>
              {(() => {
                const toolName = AGENT_TOOLS.find((t) => t.id === agent.tool)?.name ?? ''
                const parts = agent.name.split(' - ')
                return parts.length > 1 ? parts.slice(1).join(' - ') : agent.name.replace(toolName, '').replace(/^[\s-]+/, '') || agent.name
              })()}
            </FlexItem>
          </Flex>
        </FlexItem>

        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <style>{`
              .agent-toolbar .pf-v6-c-menu-toggle,
              .agent-toolbar .pf-v6-c-button {
                height: 36px !important;
                max-height: 36px !important;
                min-height: 36px !important;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                box-sizing: border-box;
              }
              .agent-toolbar .pf-v6-c-menu-toggle.pf-m-split-button {
                padding: 0 !important;
              }
              .agent-toolbar .pf-v6-c-menu-toggle.pf-m-split-button .pf-v6-c-menu-toggle__button {
                height: 100% !important;
                display: inline-flex;
                align-items: center;
                padding-block: 0 !important;
                padding-inline: 8px !important;
              }
              .agent-toolbar .pf-v6-c-menu-toggle.pf-m-split-button .pf-v6-c-menu-toggle__controls {
                height: 100% !important;
                padding-inline: 4px;
                padding-block: 0 !important;
                display: inline-flex;
                align-items: center;
                justify-content: center;
              }
            `}</style>
            {/* Open in */}
            <FlexItem className="agent-toolbar">
              <Dropdown
                isOpen={openInOpen}
                onSelect={() => setOpenInOpen(false)}
                onOpenChange={setOpenInOpen}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setOpenInOpen((o) => !o)}
                    isExpanded={openInOpen}
                    icon={<ExternalLinkAltIcon />}
                  >
                    Open in
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {EDITORS.filter((e) => !('isCustom' in e)).map((editor) => (
                    <DropdownItem
                      key={editor.id}
                      icon={
                        hasBrandIcon(editor.id)
                          ? <BrandIcon id={editor.id} size={18} />
                          : <DesktopIcon />
                      }
                    >
                      {editor.label}
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </FlexItem>

            {/* Terminal toggle */}
            <FlexItem className="agent-toolbar">
              <Tooltip content={terminalPanelOpen ? 'Hide terminal' : 'Show terminal'}>
                <Button
                  variant="control"
                  icon={<TerminalIcon />}
                  aria-label="Toggle terminal panel"
                  onClick={() => setTerminalPanelOpen((prev) => !prev)}
                  style={{
                    width: 36,
                    justifyContent: 'center',
                    ...(terminalPanelOpen
                      ? { background: 'var(--pf-t--global--background--color--action--plain--clicked)' }
                      : {}),
                  }}
                />
              </Tooltip>
            </FlexItem>

            {/* Diff toggle */}
            <FlexItem className="agent-toolbar">
              <Tooltip content={diffPanelOpen ? 'Hide diff' : 'Show diff'}>
                <Button
                  variant="control"
                  icon={<CodeIcon />}
                  aria-label="Toggle diff panel"
                  onClick={() => setDiffPanelOpen((prev) => !prev)}
                  style={{
                    width: 36,
                    justifyContent: 'center',
                    ...(diffPanelOpen
                      ? { background: 'var(--pf-t--global--background--color--action--plain--clicked)' }
                      : {}),
                  }}
                />
              </Tooltip>
            </FlexItem>

            {/* Commit & push split dropdown */}
            <FlexItem className="agent-toolbar">
              <Dropdown
                isOpen={commitOpen}
                onSelect={() => setCommitOpen(false)}
                onOpenChange={setCommitOpen}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    isExpanded={commitOpen}
                    onClick={() => setCommitOpen((o) => !o)}
                    variant="primary"
                    splitButtonItems={[
                      <MenuToggleAction key="commit-push-action">
                        <CloudUploadAltIcon style={{ marginRight: 6 }} />
                        Commit &amp; push
                      </MenuToggleAction>,
                    ]}
                  />
                )}
              >
                <DropdownList>
                  <DropdownItem key="commit" icon={<CodeBranchIcon />}>
                    Commit
                  </DropdownItem>
                  <DropdownItem key="push" icon={<CloudUploadAltIcon />}>
                    Push
                  </DropdownItem>
                  <Divider key="separator" />
                  <DropdownItem key="create-pr" icon={<GithubIcon />}>
                    Create PR
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </FlexItem>

          </Flex>
        </FlexItem>
      </Flex>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              flex: 1,
              background: '#1e1e1e',
              color: '#33cc33',
              fontFamily: 'monospace',
              fontSize: 14,
              padding: 16,
              overflowY: 'auto',
              minHeight: 450,
            }}
          >
            {lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {lines.length >= allLines.length && (
              <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
            )}
            <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
          </div>

          {terminalPanelOpen && (
            <div
              style={{
                height: 600,
                borderTop: '2px solid var(--pf-t--global--border--color--default)',
                background: '#1e1e1e',
                color: '#aaaaaa',
                fontFamily: 'monospace',
                fontSize: 13,
                padding: 12,
                overflowY: 'auto',
              }}
            >
              <div style={{ color: '#888', marginBottom: 8 }}>Terminal</div>
              <div>$ _</div>
            </div>
          )}
        </div>

        {diffPanelOpen && (
          <div style={{ width: 480, minWidth: 480, borderLeft: '1px solid var(--pf-t--global--border--color--default)' }}>
            <DiffPanel />
          </div>
        )}
      </div>
    </div>
  )
}
