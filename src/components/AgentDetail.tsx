import {
  Alert,
  Button,
} from '@patternfly/react-core'
import type { Agent, AgentToolId, Project } from './agentSpaceTypes'
import { AGENT_TOOLS } from './agentSpaceMockData'

interface AgentDetailProps {
  agent: Agent
  project: Project | undefined
  isAuthenticated: boolean
  onAuthenticate: (toolId: AgentToolId) => void
}

export function AgentDetail({
  agent,
  project,
  isAuthenticated,
  onAuthenticate,
}: AgentDetailProps) {
  const toolName = AGENT_TOOLS.find((t) => t.id === agent.tool)?.name ?? agent.tool

  return (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{agent.summary}</span>
        <span style={{ fontSize: 13, opacity: 0.6 }}>
          {toolName} &middot; {project?.name ?? 'Unknown'}
        </span>
      </div>

      {!isAuthenticated && (
        <Alert
          variant="warning"
          isInline
          isPlain
          title={`Authenticate with ${toolName} to get started.`}
          actionLinks={
            <Button variant="link" isInline onClick={() => onAuthenticate(agent.tool)}>
              Authenticate now
            </Button>
          }
        />
      )}
    </div>
  )
}
