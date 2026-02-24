import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { AgentRouter } from './router';
import { AgentConfig, Task } from './types';

describe('AgentRouter', () => {
  const createTestAgent = (id: string, capabilities: string[], cost?: number): AgentConfig => ({
    id,
    name: `Test Agent ${id}`,
    capabilities: capabilities.map(c => ({ name: c, confidence: 0.8 })),
    costPerTask: cost ?? 0.01,
    avgLatencyMs: 1000,
  });

  const createTestTask = (content: string, required?: string[]): Task => ({
    id: `task-${Date.now()}`,
    content,
    requiredCapabilities: required,
    createdAt: new Date(),
  });

  it('should register and list agents', () => {
    const router = new AgentRouter();
    router.register(createTestAgent('a1', ['coding']));
    router.register(createTestAgent('a2', ['writing']));

    const agents = router.listAgents();
    assert.strictEqual(agents.length, 2);
    assert.strictEqual(agents[0].id, 'a1');
    assert.strictEqual(agents[1].id, 'a2');
  });

  it('should unregister agents', () => {
    const router = new AgentRouter();
    router.register(createTestAgent('a1', ['coding']));
    
    assert.strictEqual(router.listAgents().length, 1);
    router.unregister('a1');
    assert.strictEqual(router.listAgents().length, 0);
  });

  it('should route to best capability match', () => {
    const router = new AgentRouter({ strategy: 'best-match' });
    router.register(createTestAgent('coder', ['coding', 'debugging']));
    router.register(createTestAgent('writer', ['writing', 'editing']));

    const task = createTestTask('Write some code', ['coding']);
    const decision = router.route(task);

    assert.strictEqual(decision.selectedAgent?.id, 'coder');
  });

  it('should return null when no agent matches required capabilities', () => {
    const router = new AgentRouter();
    router.register(createTestAgent('coder', ['coding']));

    const task = createTestTask('Write a poem', ['poetry']);
    const decision = router.route(task);

    assert.strictEqual(decision.selectedAgent, null);
  });

  it('should route to lowest cost agent', () => {
    const router = new AgentRouter({ strategy: 'lowest-cost' });
    router.register(createTestAgent('expensive', ['general'], 0.10));
    router.register(createTestAgent('cheap', ['general'], 0.01));

    const task = createTestTask('Do something');
    const decision = router.route(task);

    assert.strictEqual(decision.selectedAgent?.id, 'cheap');
  });

  it('should respect maxCost constraint', () => {
    const router = new AgentRouter();
    router.register(createTestAgent('expensive', ['coding'], 0.50));
    router.register(createTestAgent('cheap', ['coding'], 0.05));

    const task: Task = {
      ...createTestTask('Code task', ['coding']),
      maxCost: 0.10,
    };
    const decision = router.route(task);

    assert.strictEqual(decision.selectedAgent?.id, 'cheap');
  });

  it('should use round-robin strategy', () => {
    const router = new AgentRouter({ strategy: 'round-robin' });
    router.register(createTestAgent('a1', ['general']));
    router.register(createTestAgent('a2', ['general']));

    // With only one capable agent per task, round-robin rotates through
    const decisions = [
      router.route(createTestTask('task 1')),
      router.route(createTestTask('task 2')),
    ];

    // Both tasks should be routed to an agent
    const ids = decisions.map(d => d.selectedAgent?.id);
    assert.ok(ids[0] !== undefined);
    assert.ok(ids[1] !== undefined);
  });

  it('should track routing analytics', () => {
    const router = new AgentRouter();
    router.register(createTestAgent('a1', ['general']));

    router.route(createTestTask('task 1'));
    router.route(createTestTask('task 2'));
    router.route(createTestTask('task 3'));

    const analytics = router.getAnalytics();
    assert.strictEqual(analytics.totalDecisions, 3);
    assert.strictEqual(analytics.agentUsage['a1'], 3);
  });

  it('should provide alternative agents in decision', () => {
    const router = new AgentRouter();
    router.register(createTestAgent('a1', ['general']));
    router.register(createTestAgent('a2', ['general']));
    router.register(createTestAgent('a3', ['general']));

    const decision = router.route(createTestTask('task'));

    assert.ok(decision.selectedAgent);
    assert.strictEqual(decision.alternativeAgents.length, 2);
  });

  it('should export and import state', () => {
    const router1 = new AgentRouter();
    router1.register(createTestAgent('a1', ['coding']));
    router1.route(createTestTask('task'));

    const state = router1.export();

    const router2 = new AgentRouter();
    router2.import({ agents: state.agents });

    assert.strictEqual(router2.listAgents().length, 1);
    assert.strictEqual(router2.getAgent('a1')?.name, 'Test Agent a1');
  });

  it('should update agent status', () => {
    const router = new AgentRouter();
    const agent = router.register(createTestAgent('a1', ['general']));

    assert.strictEqual(agent.status, 'available');
    
    router.setAgentStatus('a1', 'offline');
    assert.strictEqual(router.getAgent('a1')?.status, 'offline');

    // Offline agents should not be routed to
    const decision = router.route(createTestTask('task'));
    assert.strictEqual(decision.selectedAgent, null);
  });

  it('should call event hooks', () => {
    let routedCount = 0;
    let noAgentCount = 0;

    const router = new AgentRouter({}, {
      onTaskRouted: () => { routedCount++; },
      onNoAgentAvailable: () => { noAgentCount++; },
    });

    router.register(createTestAgent('a1', ['coding']));
    
    router.route(createTestTask('code task', ['coding'])); // Should route
    router.route(createTestTask('poem task', ['poetry'])); // No agent

    assert.strictEqual(routedCount, 1);
    assert.strictEqual(noAgentCount, 1);
  });

  it('should include reasoning in decision', () => {
    const router = new AgentRouter({ strategy: 'weighted' });
    router.register(createTestAgent('a1', ['general']));
    router.register(createTestAgent('a2', ['general']));

    const decision = router.route(createTestTask('task'));

    assert.ok(decision.reasoning.length > 0);
    assert.ok(decision.reasoning.some(r => r.includes('a1') || r.includes('a2')));
  });
});

describe('AgentRouter execution', () => {
  it('should execute task with invoke function', async () => {
    const router = new AgentRouter();
    router.register({
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: [{ name: 'general', confidence: 0.9 }],
      invoke: async (task) => ({ result: `Processed: ${task.content}` }),
    });

    const task: Task = {
      id: 'task-1',
      content: 'Test task',
      createdAt: new Date(),
    };

    const result = await router.execute(task);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agentId, 'test-agent');
    assert.ok(result.latencyMs >= 0);
    assert.deepStrictEqual(result.output, { result: 'Processed: Test task' });
  });

  it('should try alternative agents on failure', async () => {
    let agent1Attempts = 0;
    let agent2Attempts = 0;
    
    const router = new AgentRouter({ maxRetries: 2 });
    
    router.register({
      id: 'failing-agent',
      name: 'Failing Agent',
      capabilities: [{ name: 'general', confidence: 0.95 }], // Higher confidence, will be tried first
      invoke: async () => {
        agent1Attempts++;
        throw new Error('Always fails');
      },
    });

    router.register({
      id: 'working-agent',
      name: 'Working Agent',
      capabilities: [{ name: 'general', confidence: 0.8 }],
      invoke: async () => {
        agent2Attempts++;
        return { result: 'success' };
      },
    });

    const task: Task = {
      id: 'task-1',
      content: 'Test task',
      createdAt: new Date(),
    };

    const result = await router.execute(task);

    // First agent should be tried and fail
    assert.strictEqual(agent1Attempts, 1);
    // Second agent should succeed
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agentId, 'working-agent');
  });
});
