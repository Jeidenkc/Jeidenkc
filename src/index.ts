/**
 * agent-router - Intelligent task routing for multi-agent systems
 * 
 * Route tasks to the right agent based on capabilities, cost, latency,
 * success rates, and load. Supports multiple routing strategies and
 * weighted scoring.
 */

export { AgentRouter } from './router';

export type {
  Agent,
  AgentCapability,
  AgentConfig,
  AgentStats,
  Task,
  TaskResult,
  RoutingDecision,
  RoutingStrategy,
  RoutingWeights,
  RouterConfig,
  RouterEvents,
} from './types';

// Convenience function to create a simple router
export function createRouter(
  agents: import('./types').AgentConfig[],
  config?: Partial<import('./types').RouterConfig>
): import('./router').AgentRouter {
  const router = new (require('./router').AgentRouter)(config);
  for (const agent of agents) {
    router.register(agent);
  }
  return router;
}

// Convenience function to create a task
export function createTask(
  content: string,
  options?: Partial<import('./types').Task>
): import('./types').Task {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    createdAt: new Date(),
    ...options,
  };
}
