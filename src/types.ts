/**
 * Core types for agent-router
 */

export interface AgentCapability {
  name: string;
  confidence: number; // 0-1, how confident the agent is at this capability
  examples?: string[]; // Example tasks this capability handles
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  endpoint?: string; // HTTP endpoint to invoke the agent
  invoke?: (task: Task) => Promise<unknown>; // Direct function invocation
  costPerTask?: number; // Estimated cost per task (any unit)
  avgLatencyMs?: number; // Average response time
  maxConcurrency?: number; // Max parallel tasks
  priority?: number; // Higher = preferred when equal match
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface Agent extends AgentConfig {
  stats: AgentStats;
  currentLoad: number;
  status: 'available' | 'busy' | 'offline' | 'degraded';
}

export interface AgentStats {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalLatencyMs: number;
  lastTaskAt?: Date;
  successRate: number;
  avgActualLatencyMs: number;
}

export interface Task {
  id: string;
  content: string;
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
  maxCost?: number;
  maxLatencyMs?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  latencyMs: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface RoutingDecision {
  task: Task;
  selectedAgent: Agent | null;
  alternativeAgents: Agent[];
  score: number;
  reasoning: string[];
  timestamp: Date;
}

export type RoutingStrategy = 
  | 'best-match'      // Route to agent with highest capability match
  | 'lowest-cost'     // Route to cheapest available agent
  | 'fastest'         // Route to agent with lowest latency
  | 'round-robin'     // Distribute evenly across capable agents
  | 'least-loaded'    // Route to agent with lowest current load
  | 'highest-success' // Route to agent with best success rate
  | 'weighted';       // Combine multiple factors with weights

export interface RoutingWeights {
  capabilityMatch: number;
  cost: number;
  latency: number;
  successRate: number;
  currentLoad: number;
  priority: number;
}

export interface RouterConfig {
  strategy: RoutingStrategy;
  weights?: RoutingWeights;
  fallbackEnabled?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  loadThreshold?: number; // Consider agent "busy" above this load
  minSuccessRate?: number; // Exclude agents below this success rate
  decisionLogSize?: number; // Keep last N decisions for analysis
}

export interface RouterEvents {
  onTaskRouted?: (decision: RoutingDecision) => void;
  onTaskCompleted?: (result: TaskResult) => void;
  onTaskFailed?: (result: TaskResult, willRetry: boolean) => void;
  onAgentStatusChange?: (agent: Agent, oldStatus: Agent['status'], newStatus: Agent['status']) => void;
  onNoAgentAvailable?: (task: Task) => void;
}
