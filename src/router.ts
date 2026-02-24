import {
  Agent,
  AgentConfig,
  AgentStats,
  Task,
  TaskResult,
  RoutingDecision,
  RouterConfig,
  RouterEvents,
  RoutingWeights,
} from './types';

const DEFAULT_WEIGHTS: RoutingWeights = {
  capabilityMatch: 0.4,
  cost: 0.15,
  latency: 0.15,
  successRate: 0.15,
  currentLoad: 0.1,
  priority: 0.05,
};

const DEFAULT_CONFIG: RouterConfig = {
  strategy: 'weighted',
  weights: DEFAULT_WEIGHTS,
  fallbackEnabled: true,
  maxRetries: 2,
  retryDelayMs: 1000,
  loadThreshold: 0.8,
  minSuccessRate: 0.5,
  decisionLogSize: 100,
};

function createEmptyStats(): AgentStats {
  return {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    totalLatencyMs: 0,
    successRate: 1.0, // Start optimistic
    avgActualLatencyMs: 0,
  };
}

export class AgentRouter {
  private agents: Map<string, Agent> = new Map();
  private config: RouterConfig;
  private events: RouterEvents;
  private decisionLog: RoutingDecision[] = [];
  private roundRobinIndex: number = 0;

  constructor(config: Partial<RouterConfig> = {}, events: RouterEvents = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (config.weights) {
      this.config.weights = { ...DEFAULT_WEIGHTS, ...config.weights };
    }
    this.events = events;
  }

  /**
   * Register an agent with the router
   */
  register(agentConfig: AgentConfig): Agent {
    const agent: Agent = {
      ...agentConfig,
      stats: createEmptyStats(),
      currentLoad: 0,
      status: 'available',
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Remove an agent from the router
   */
  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Get a registered agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all registered agents
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Update an agent's status
   */
  setAgentStatus(agentId: string, status: Agent['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      const oldStatus = agent.status;
      agent.status = status;
      this.events.onAgentStatusChange?.(agent, oldStatus, status);
    }
  }

  /**
   * Route a task to the best available agent
   */
  route(task: Task): RoutingDecision {
    const availableAgents = this.getAvailableAgents(task);
    const reasoning: string[] = [];

    if (availableAgents.length === 0) {
      reasoning.push('No agents available for this task');
      const decision: RoutingDecision = {
        task,
        selectedAgent: null,
        alternativeAgents: [],
        score: 0,
        reasoning,
        timestamp: new Date(),
      };
      this.logDecision(decision);
      this.events.onNoAgentAvailable?.(task);
      return decision;
    }

    // Score and sort agents
    const scoredAgents = availableAgents
      .map(agent => ({
        agent,
        score: this.scoreAgent(agent, task, reasoning),
      }))
      .sort((a, b) => b.score - a.score);

    const selectedAgent = scoredAgents[0].agent;
    const alternativeAgents = scoredAgents.slice(1).map(s => s.agent);

    reasoning.push(`Selected ${selectedAgent.name} (score: ${scoredAgents[0].score.toFixed(3)})`);

    const decision: RoutingDecision = {
      task,
      selectedAgent,
      alternativeAgents,
      score: scoredAgents[0].score,
      reasoning,
      timestamp: new Date(),
    };

    this.logDecision(decision);
    this.events.onTaskRouted?.(decision);
    return decision;
  }

  /**
   * Route and execute a task
   */
  async execute(task: Task): Promise<TaskResult> {
    let attempts = 0;
    const maxAttempts = (this.config.maxRetries ?? 2) + 1;
    let lastError: string | undefined;
    let triedAgentIds = new Set<string>();

    while (attempts < maxAttempts) {
      const decision = this.route(task);
      
      if (!decision.selectedAgent) {
        return {
          taskId: task.id,
          agentId: '',
          success: false,
          error: 'No agent available for task',
          latencyMs: 0,
        };
      }

      const agent = decision.selectedAgent;
      
      // Skip agents we've already tried
      if (triedAgentIds.has(agent.id)) {
        // Try alternatives
        const alternative = decision.alternativeAgents.find(a => !triedAgentIds.has(a.id));
        if (!alternative) {
          break;
        }
        triedAgentIds.add(alternative.id);
        continue;
      }

      triedAgentIds.add(agent.id);
      attempts++;

      try {
        const result = await this.invokeAgent(agent, task);
        this.recordResult(agent, result);
        
        if (result.success) {
          this.events.onTaskCompleted?.(result);
          return result;
        }

        lastError = result.error;
        this.events.onTaskFailed?.(result, attempts < maxAttempts);

        if (this.config.retryDelayMs && attempts < maxAttempts) {
          await this.delay(this.config.retryDelayMs);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        const result: TaskResult = {
          taskId: task.id,
          agentId: agent.id,
          success: false,
          error: lastError,
          latencyMs: 0,
        };
        this.recordResult(agent, result);
        this.events.onTaskFailed?.(result, attempts < maxAttempts);
      }
    }

    return {
      taskId: task.id,
      agentId: '',
      success: false,
      error: lastError ?? 'Task failed after all retries',
      latencyMs: 0,
    };
  }

  /**
   * Get routing analytics
   */
  getAnalytics(): {
    totalDecisions: number;
    avgScore: number;
    noAgentCount: number;
    agentUsage: Record<string, number>;
    recentDecisions: RoutingDecision[];
  } {
    const agentUsage: Record<string, number> = {};
    let totalScore = 0;
    let noAgentCount = 0;

    for (const decision of this.decisionLog) {
      if (decision.selectedAgent) {
        agentUsage[decision.selectedAgent.id] = (agentUsage[decision.selectedAgent.id] ?? 0) + 1;
        totalScore += decision.score;
      } else {
        noAgentCount++;
      }
    }

    return {
      totalDecisions: this.decisionLog.length,
      avgScore: this.decisionLog.length > 0 ? totalScore / (this.decisionLog.length - noAgentCount) : 0,
      noAgentCount,
      agentUsage,
      recentDecisions: this.decisionLog.slice(-10),
    };
  }

  /**
   * Export router state for persistence
   */
  export(): {
    agents: Agent[];
    config: RouterConfig;
    decisionLog: RoutingDecision[];
  } {
    return {
      agents: Array.from(this.agents.values()),
      config: this.config,
      decisionLog: this.decisionLog,
    };
  }

  /**
   * Import router state
   */
  import(state: { agents?: Agent[]; config?: Partial<RouterConfig> }): void {
    if (state.agents) {
      this.agents.clear();
      for (const agent of state.agents) {
        this.agents.set(agent.id, agent);
      }
    }
    if (state.config) {
      this.config = { ...this.config, ...state.config };
    }
  }

  // Private methods

  private getAvailableAgents(task: Task): Agent[] {
    return Array.from(this.agents.values()).filter(agent => {
      // Must be available or degraded
      if (agent.status === 'offline' || agent.status === 'busy') {
        return false;
      }

      // Check load threshold
      if (agent.currentLoad >= (this.config.loadThreshold ?? 0.8)) {
        return false;
      }

      // Check minimum success rate
      if (agent.stats.totalTasks > 5 && agent.stats.successRate < (this.config.minSuccessRate ?? 0.5)) {
        return false;
      }

      // Check required capabilities
      if (task.requiredCapabilities) {
        const agentCapNames = agent.capabilities.map(c => c.name.toLowerCase());
        for (const required of task.requiredCapabilities) {
          if (!agentCapNames.includes(required.toLowerCase())) {
            return false;
          }
        }
      }

      // Check cost constraint
      if (task.maxCost !== undefined && agent.costPerTask !== undefined) {
        if (agent.costPerTask > task.maxCost) {
          return false;
        }
      }

      // Check latency constraint
      if (task.maxLatencyMs !== undefined && agent.avgLatencyMs !== undefined) {
        if (agent.avgLatencyMs > task.maxLatencyMs) {
          return false;
        }
      }

      return true;
    });
  }

  private scoreAgent(agent: Agent, task: Task, reasoning: string[]): number {
    const { strategy, weights } = this.config;

    switch (strategy) {
      case 'best-match':
        return this.scoreCapabilityMatch(agent, task);
      case 'lowest-cost':
        return agent.costPerTask ? 1 / agent.costPerTask : 1;
      case 'fastest':
        return agent.avgLatencyMs ? 1 / agent.avgLatencyMs : 1;
      case 'round-robin':
        return this.roundRobinScore(agent);
      case 'least-loaded':
        return 1 - agent.currentLoad;
      case 'highest-success':
        return agent.stats.successRate;
      case 'weighted':
      default:
        return this.weightedScore(agent, task, weights ?? DEFAULT_WEIGHTS, reasoning);
    }
  }

  private scoreCapabilityMatch(agent: Agent, task: Task): number {
    let score = 0;
    const allRequested = [
      ...(task.requiredCapabilities ?? []),
      ...(task.preferredCapabilities ?? []),
    ];

    if (allRequested.length === 0) {
      // No specific capabilities requested, use average confidence
      const totalConf = agent.capabilities.reduce((sum, c) => sum + c.confidence, 0);
      return agent.capabilities.length > 0 ? totalConf / agent.capabilities.length : 0.5;
    }

    for (const requested of allRequested) {
      const cap = agent.capabilities.find(
        c => c.name.toLowerCase() === requested.toLowerCase()
      );
      if (cap) {
        score += cap.confidence;
      }
    }

    return score / allRequested.length;
  }

  private roundRobinScore(agent: Agent): number {
    const agents = Array.from(this.agents.keys());
    const targetIndex = this.roundRobinIndex % agents.length;
    const agentIndex = agents.indexOf(agent.id);
    this.roundRobinIndex++;
    return agentIndex === targetIndex ? 1 : 0;
  }

  private weightedScore(
    agent: Agent,
    task: Task,
    weights: RoutingWeights,
    reasoning: string[]
  ): number {
    const scores: Record<string, number> = {};

    // Capability match (0-1)
    scores.capabilityMatch = this.scoreCapabilityMatch(agent, task);

    // Cost score (0-1, lower cost = higher score)
    if (agent.costPerTask !== undefined) {
      const maxCost = Math.max(...Array.from(this.agents.values())
        .map(a => a.costPerTask ?? 0)
        .filter(c => c > 0));
      scores.cost = maxCost > 0 ? 1 - (agent.costPerTask / maxCost) : 1;
    } else {
      scores.cost = 0.5;
    }

    // Latency score (0-1, lower latency = higher score)
    if (agent.avgLatencyMs !== undefined) {
      const maxLatency = Math.max(...Array.from(this.agents.values())
        .map(a => a.avgLatencyMs ?? 0)
        .filter(l => l > 0));
      scores.latency = maxLatency > 0 ? 1 - (agent.avgLatencyMs / maxLatency) : 1;
    } else {
      scores.latency = 0.5;
    }

    // Success rate (0-1)
    scores.successRate = agent.stats.successRate;

    // Current load (0-1, lower load = higher score)
    scores.currentLoad = 1 - agent.currentLoad;

    // Priority (normalized)
    const maxPriority = Math.max(...Array.from(this.agents.values())
      .map(a => a.priority ?? 0));
    scores.priority = maxPriority > 0 ? (agent.priority ?? 0) / maxPriority : 0.5;

    // Weighted sum
    const finalScore =
      scores.capabilityMatch * weights.capabilityMatch +
      scores.cost * weights.cost +
      scores.latency * weights.latency +
      scores.successRate * weights.successRate +
      scores.currentLoad * weights.currentLoad +
      scores.priority * weights.priority;

    reasoning.push(
      `${agent.name}: cap=${scores.capabilityMatch.toFixed(2)}, ` +
      `cost=${scores.cost.toFixed(2)}, lat=${scores.latency.toFixed(2)}, ` +
      `success=${scores.successRate.toFixed(2)}, load=${scores.currentLoad.toFixed(2)}`
    );

    return finalScore;
  }

  private async invokeAgent(agent: Agent, task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    // Track load
    agent.currentLoad = Math.min(1, agent.currentLoad + (1 / (agent.maxConcurrency ?? 1)));
    if (agent.currentLoad >= (this.config.loadThreshold ?? 0.8)) {
      agent.status = 'busy';
    }

    try {
      let output: unknown;

      if (agent.invoke) {
        output = await agent.invoke(task);
      } else if (agent.endpoint) {
        const response = await fetch(agent.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        output = await response.json();
      } else {
        throw new Error('Agent has no invocation method configured');
      }

      const latencyMs = Date.now() - startTime;

      return {
        taskId: task.id,
        agentId: agent.id,
        success: true,
        output,
        latencyMs,
        cost: agent.costPerTask,
      };
    } finally {
      // Release load
      agent.currentLoad = Math.max(0, agent.currentLoad - (1 / (agent.maxConcurrency ?? 1)));
      if (agent.currentLoad < (this.config.loadThreshold ?? 0.8) && agent.status === 'busy') {
        agent.status = 'available';
      }
    }
  }

  private recordResult(agent: Agent, result: TaskResult): void {
    agent.stats.totalTasks++;
    agent.stats.lastTaskAt = new Date();

    if (result.success) {
      agent.stats.successfulTasks++;
    } else {
      agent.stats.failedTasks++;
    }

    agent.stats.totalLatencyMs += result.latencyMs;
    agent.stats.successRate = agent.stats.successfulTasks / agent.stats.totalTasks;
    agent.stats.avgActualLatencyMs = agent.stats.totalLatencyMs / agent.stats.totalTasks;
  }

  private logDecision(decision: RoutingDecision): void {
    this.decisionLog.push(decision);
    if (this.decisionLog.length > (this.config.decisionLogSize ?? 100)) {
      this.decisionLog.shift();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
