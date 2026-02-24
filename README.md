# agent-router

Intelligent task routing for multi-agent systems. Route tasks to the right agent based on capabilities, cost, latency, success rates, and current load.

## The Problem

When you have multiple AI agents, how do you decide which one handles a given task? You might have:

- A fast, cheap agent for simple queries
- A powerful, expensive agent for complex reasoning
- Specialized agents for coding, research, or customer support
- Agents with different availability and reliability

Manually routing tasks is tedious and suboptimal. agent-router makes this automatic.

## Features

- **Capability matching**: Route tasks to agents with relevant skills
- **Multiple strategies**: Best-match, lowest-cost, fastest, round-robin, least-loaded, highest-success, or weighted combination
- **Performance tracking**: Learn from success/failure rates and actual latency
- **Load balancing**: Distribute work across agents based on capacity
- **Constraints**: Respect cost and latency limits on tasks
- **Fallback chains**: Automatically retry with alternative agents
- **Analytics**: Track routing decisions and agent performance
- **Framework agnostic**: Works with any agent implementation

## Installation

```bash
npm install agent-router
```

## Quick Start

```typescript
import { AgentRouter, createTask } from 'agent-router';

// Create router
const router = new AgentRouter({
  strategy: 'weighted',
  maxRetries: 2,
});

// Register agents
router.register({
  id: 'fast-agent',
  name: 'Fast Agent',
  capabilities: [
    { name: 'general', confidence: 0.7 },
    { name: 'summarization', confidence: 0.9 },
  ],
  costPerTask: 0.001,
  avgLatencyMs: 1000,
  maxConcurrency: 10,
});

router.register({
  id: 'smart-agent',
  name: 'Smart Agent',
  capabilities: [
    { name: 'general', confidence: 0.95 },
    { name: 'coding', confidence: 0.9 },
    { name: 'reasoning', confidence: 0.95 },
  ],
  costPerTask: 0.05,
  avgLatencyMs: 15000,
  maxConcurrency: 3,
});

// Route a task
const task = createTask('Write a Python function to sort a list');
const decision = router.route(task);

console.log(`Best agent: ${decision.selectedAgent?.name}`);
console.log(`Score: ${decision.score}`);
console.log(`Reasoning:`, decision.reasoning);
```

## Routing Strategies

### best-match

Routes to the agent with the highest capability match for the task.

```typescript
const router = new AgentRouter({ strategy: 'best-match' });
```

### lowest-cost

Routes to the cheapest available agent that can handle the task.

```typescript
const router = new AgentRouter({ strategy: 'lowest-cost' });
```

### fastest

Routes to the agent with the lowest average latency.

```typescript
const router = new AgentRouter({ strategy: 'fastest' });
```

### round-robin

Distributes tasks evenly across all capable agents.

```typescript
const router = new AgentRouter({ strategy: 'round-robin' });
```

### least-loaded

Routes to the agent with the lowest current workload.

```typescript
const router = new AgentRouter({ strategy: 'least-loaded' });
```

### highest-success

Routes to the agent with the best historical success rate.

```typescript
const router = new AgentRouter({ strategy: 'highest-success' });
```

### weighted (default)

Combines all factors with configurable weights:

```typescript
const router = new AgentRouter({
  strategy: 'weighted',
  weights: {
    capabilityMatch: 0.4,  // How well capabilities match
    cost: 0.15,            // Lower cost = higher score
    latency: 0.15,         // Lower latency = higher score  
    successRate: 0.15,     // Historical success rate
    currentLoad: 0.1,      // Current workload
    priority: 0.05,        // Agent priority setting
  },
});
```

## Task Constraints

Specify requirements and preferences for routing:

```typescript
const task = createTask('Complex analysis task', {
  requiredCapabilities: ['reasoning', 'analysis'],  // Must have these
  preferredCapabilities: ['visualization'],          // Nice to have
  maxCost: 0.10,                                     // Budget limit
  maxLatencyMs: 30000,                               // Time limit
  priority: 'high',                                  // Task priority
});

const decision = router.route(task);
```

## Executing Tasks

Route and execute in one call with automatic retries:

```typescript
// Agent with invocation function
router.register({
  id: 'my-agent',
  name: 'My Agent',
  capabilities: [{ name: 'general', confidence: 0.8 }],
  invoke: async (task) => {
    // Your agent logic here
    return { response: 'Task completed' };
  },
});

// Or with HTTP endpoint
router.register({
  id: 'remote-agent',
  name: 'Remote Agent', 
  capabilities: [{ name: 'general', confidence: 0.8 }],
  endpoint: 'https://api.example.com/agent',
});

// Execute task
const result = await router.execute(task);
if (result.success) {
  console.log('Output:', result.output);
  console.log('Latency:', result.latencyMs, 'ms');
} else {
  console.log('Failed:', result.error);
}
```

## Event Hooks

Monitor routing decisions and results:

```typescript
const router = new AgentRouter({}, {
  onTaskRouted: (decision) => {
    console.log(`Routed to ${decision.selectedAgent?.name}`);
  },
  onTaskCompleted: (result) => {
    console.log(`Task ${result.taskId} completed in ${result.latencyMs}ms`);
  },
  onTaskFailed: (result, willRetry) => {
    console.log(`Task failed: ${result.error}, retry: ${willRetry}`);
  },
  onAgentStatusChange: (agent, oldStatus, newStatus) => {
    console.log(`${agent.name}: ${oldStatus} -> ${newStatus}`);
  },
  onNoAgentAvailable: (task) => {
    console.log(`No agent available for task: ${task.content}`);
  },
});
```

## Analytics

Track routing performance:

```typescript
const analytics = router.getAnalytics();

console.log('Total decisions:', analytics.totalDecisions);
console.log('Average score:', analytics.avgScore);
console.log('No agent available:', analytics.noAgentCount);
console.log('Agent usage:', analytics.agentUsage);
// { 'fast-agent': 45, 'smart-agent': 12 }
```

## Agent Management

```typescript
// List all agents
const agents = router.listAgents();

// Get specific agent
const agent = router.getAgent('fast-agent');
console.log('Success rate:', agent?.stats.successRate);
console.log('Current load:', agent?.currentLoad);

// Update agent status
router.setAgentStatus('fast-agent', 'offline');

// Remove agent
router.unregister('fast-agent');
```

## Persistence

Export and import router state:

```typescript
// Export
const state = router.export();
fs.writeFileSync('router-state.json', JSON.stringify(state));

// Import
const savedState = JSON.parse(fs.readFileSync('router-state.json', 'utf-8'));
router.import(savedState);
```

## CLI Usage

Interactive routing simulation:

```bash
# Initialize config
agent-router init

# Add agents
agent-router add '{"id":"code-agent","name":"Code Agent","capabilities":[{"name":"coding","confidence":0.9}]}'

# List agents
agent-router list

# Route a task
agent-router route "Write a sorting algorithm"

# Interactive simulation
agent-router simulate
```

## Configuration

Full router configuration options:

```typescript
interface RouterConfig {
  strategy: 'best-match' | 'lowest-cost' | 'fastest' | 
            'round-robin' | 'least-loaded' | 'highest-success' | 'weighted';
  weights?: RoutingWeights;       // For weighted strategy
  fallbackEnabled?: boolean;      // Try alternatives on failure (default: true)
  maxRetries?: number;            // Retry attempts (default: 2)
  retryDelayMs?: number;          // Delay between retries (default: 1000)
  loadThreshold?: number;         // Consider agent busy above this (default: 0.8)
  minSuccessRate?: number;        // Exclude agents below this (default: 0.5)
  decisionLogSize?: number;       // Keep last N decisions (default: 100)
}
```

## Agent Configuration

```typescript
interface AgentConfig {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  description?: string;           // Optional description
  capabilities: AgentCapability[];// What the agent can do
  endpoint?: string;              // HTTP endpoint for invocation
  invoke?: (task) => Promise<any>;// Direct function invocation
  costPerTask?: number;           // Estimated cost per task
  avgLatencyMs?: number;          // Average response time
  maxConcurrency?: number;        // Max parallel tasks (default: 1)
  priority?: number;              // Higher = preferred when equal
  tags?: string[];                // Arbitrary tags
  metadata?: Record<string, any>; // Custom metadata
}

interface AgentCapability {
  name: string;                   // Capability name
  confidence: number;             // 0-1, how good at this capability
  examples?: string[];            // Example tasks
}
```

## Use Cases

**Cost optimization**: Route simple tasks to cheap agents, complex tasks to powerful ones.

**Latency requirements**: Route time-sensitive tasks to fast agents.

**Specialization**: Route coding tasks to coding agents, research to research agents.

**Load balancing**: Distribute work across agents to avoid bottlenecks.

**Failover**: Automatically retry with backup agents when primary fails.

**A/B testing**: Use round-robin to compare agent performance on similar tasks.

## License

MIT
