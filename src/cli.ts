#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { AgentRouter } from './router';
import { AgentConfig, Task, RouterConfig } from './types';

const CONFIG_FILE = '.agent-router.json';

interface CliConfig {
  agents: AgentConfig[];
  routerConfig: Partial<RouterConfig>;
}

function loadConfig(): CliConfig | null {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE);
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  }
  return null;
}

function saveConfig(config: CliConfig): void {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function printHelp(): void {
  console.log(`
agent-router - Intelligent task routing for multi-agent systems

Commands:
  init                    Create a new configuration file
  add <agent-json>        Add an agent from JSON
  remove <agent-id>       Remove an agent
  list                    List all registered agents
  route <task-content>    Route a task to the best agent
  simulate                Run an interactive simulation
  stats                   Show routing statistics
  help                    Show this help message

Config file: ${CONFIG_FILE}

Example agent JSON:
  {
    "id": "code-agent",
    "name": "Code Agent",
    "capabilities": [
      {"name": "coding", "confidence": 0.9},
      {"name": "debugging", "confidence": 0.8}
    ],
    "costPerTask": 0.02,
    "avgLatencyMs": 5000
  }
`);
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function runSimulation(router: AgentRouter): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise(resolve => rl.question(prompt, resolve));
  };

  console.log('\nAgent Router Simulation');
  console.log('========================');
  console.log('Enter task descriptions to route them. Type "quit" to exit.\n');

  const agents = router.listAgents();
  if (agents.length === 0) {
    console.log('No agents registered. Add some first with "agent-router add"');
    rl.close();
    return;
  }

  console.log('Available agents:');
  for (const agent of agents) {
    const caps = agent.capabilities.map(c => c.name).join(', ');
    console.log(`  - ${agent.name} (${agent.id}): ${caps}`);
  }
  console.log();

  while (true) {
    const input = await question('Task> ');
    const trimmed = input.trim();

    if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
      break;
    }

    if (trimmed.toLowerCase() === 'stats') {
      const analytics = router.getAnalytics();
      console.log('\nRouting Statistics:');
      console.log(`  Total decisions: ${analytics.totalDecisions}`);
      console.log(`  Average score: ${analytics.avgScore.toFixed(3)}`);
      console.log(`  No agent available: ${analytics.noAgentCount}`);
      console.log('  Agent usage:');
      for (const [agentId, count] of Object.entries(analytics.agentUsage)) {
        console.log(`    ${agentId}: ${count} tasks`);
      }
      console.log();
      continue;
    }

    if (trimmed.toLowerCase() === 'agents') {
      for (const agent of router.listAgents()) {
        console.log(`\n  ${agent.name} (${agent.id}):`);
        console.log(`    Status: ${agent.status}`);
        console.log(`    Load: ${(agent.currentLoad * 100).toFixed(1)}%`);
        console.log(`    Success rate: ${(agent.stats.successRate * 100).toFixed(1)}%`);
        console.log(`    Total tasks: ${agent.stats.totalTasks}`);
      }
      console.log();
      continue;
    }

    if (!trimmed) continue;

    // Parse optional capabilities from task
    // Format: "task content [cap1,cap2]"
    let content = trimmed;
    let requiredCapabilities: string[] | undefined;
    const capMatch = trimmed.match(/\[([^\]]+)\]$/);
    if (capMatch) {
      content = trimmed.slice(0, capMatch.index).trim();
      requiredCapabilities = capMatch[1].split(',').map(c => c.trim());
    }

    const task: Task = {
      id: generateId(),
      content,
      requiredCapabilities,
      createdAt: new Date(),
    };

    console.log(`\nRouting task: "${content}"`);
    if (requiredCapabilities) {
      console.log(`Required capabilities: ${requiredCapabilities.join(', ')}`);
    }

    const decision = router.route(task);

    console.log('\nDecision:');
    if (decision.selectedAgent) {
      console.log(`  Selected: ${decision.selectedAgent.name} (${decision.selectedAgent.id})`);
      console.log(`  Score: ${decision.score.toFixed(3)}`);
      if (decision.alternativeAgents.length > 0) {
        const alts = decision.alternativeAgents.map(a => a.name).join(', ');
        console.log(`  Alternatives: ${alts}`);
      }
    } else {
      console.log('  No suitable agent found');
    }
    console.log('\nReasoning:');
    for (const reason of decision.reasoning) {
      console.log(`  - ${reason}`);
    }
    console.log();
  }

  rl.close();
  console.log('\nGoodbye!');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'init') {
    const existingConfig = loadConfig();
    if (existingConfig) {
      console.log(`Config file already exists: ${CONFIG_FILE}`);
      return;
    }

    const defaultConfig: CliConfig = {
      agents: [
        {
          id: 'example-agent',
          name: 'Example Agent',
          description: 'An example agent for demonstration',
          capabilities: [
            { name: 'general', confidence: 0.7 },
          ],
          costPerTask: 0.01,
          avgLatencyMs: 2000,
        },
      ],
      routerConfig: {
        strategy: 'weighted',
        maxRetries: 2,
      },
    };

    saveConfig(defaultConfig);
    console.log(`Created ${CONFIG_FILE} with example configuration`);
    console.log('Edit this file to add your agents, then run "agent-router simulate"');
    return;
  }

  // Load existing config
  const config = loadConfig();

  if (command === 'add') {
    const agentJson = args.slice(1).join(' ');
    if (!agentJson) {
      console.error('Usage: agent-router add <agent-json>');
      process.exit(1);
    }

    try {
      const agent: AgentConfig = JSON.parse(agentJson);
      if (!agent.id || !agent.name || !agent.capabilities) {
        console.error('Agent must have id, name, and capabilities');
        process.exit(1);
      }

      const cfg = config ?? { agents: [], routerConfig: {} };
      
      // Check for duplicate
      if (cfg.agents.find(a => a.id === agent.id)) {
        console.error(`Agent with id "${agent.id}" already exists`);
        process.exit(1);
      }

      cfg.agents.push(agent);
      saveConfig(cfg);
      console.log(`Added agent: ${agent.name} (${agent.id})`);
    } catch (err) {
      console.error('Invalid JSON:', err);
      process.exit(1);
    }
    return;
  }

  if (command === 'remove') {
    const agentId = args[1];
    if (!agentId) {
      console.error('Usage: agent-router remove <agent-id>');
      process.exit(1);
    }

    if (!config) {
      console.error('No config file found. Run "agent-router init" first.');
      process.exit(1);
    }

    const idx = config.agents.findIndex(a => a.id === agentId);
    if (idx === -1) {
      console.error(`Agent "${agentId}" not found`);
      process.exit(1);
    }

    const removed = config.agents.splice(idx, 1)[0];
    saveConfig(config);
    console.log(`Removed agent: ${removed.name} (${removed.id})`);
    return;
  }

  if (command === 'list') {
    if (!config || config.agents.length === 0) {
      console.log('No agents registered');
      return;
    }

    console.log('\nRegistered Agents:');
    console.log('==================\n');

    for (const agent of config.agents) {
      console.log(`${agent.name} (${agent.id})`);
      if (agent.description) {
        console.log(`  ${agent.description}`);
      }
      console.log('  Capabilities:');
      for (const cap of agent.capabilities) {
        console.log(`    - ${cap.name}: ${(cap.confidence * 100).toFixed(0)}% confidence`);
      }
      if (agent.costPerTask !== undefined) {
        console.log(`  Cost: $${agent.costPerTask.toFixed(4)}/task`);
      }
      if (agent.avgLatencyMs !== undefined) {
        console.log(`  Avg latency: ${agent.avgLatencyMs}ms`);
      }
      console.log();
    }
    return;
  }

  if (command === 'route') {
    const content = args.slice(1).join(' ');
    if (!content) {
      console.error('Usage: agent-router route <task-content>');
      process.exit(1);
    }

    if (!config) {
      console.error('No config file found. Run "agent-router init" first.');
      process.exit(1);
    }

    const router = new AgentRouter(config.routerConfig);
    for (const agent of config.agents) {
      router.register(agent);
    }

    const task: Task = {
      id: generateId(),
      content,
      createdAt: new Date(),
    };

    const decision = router.route(task);

    if (decision.selectedAgent) {
      console.log(`\nBest agent: ${decision.selectedAgent.name}`);
      console.log(`Score: ${decision.score.toFixed(3)}`);
      console.log('\nReasoning:');
      for (const reason of decision.reasoning) {
        console.log(`  ${reason}`);
      }
    } else {
      console.log('\nNo suitable agent found');
      console.log('Reasoning:', decision.reasoning.join(', '));
    }
    return;
  }

  if (command === 'simulate') {
    if (!config) {
      console.error('No config file found. Run "agent-router init" first.');
      process.exit(1);
    }

    const router = new AgentRouter(config.routerConfig, {
      onTaskRouted: (decision) => {
        // Handled in simulation loop
      },
    });

    for (const agent of config.agents) {
      router.register(agent);
    }

    await runSimulation(router);
    return;
  }

  if (command === 'stats') {
    console.log('Stats are available during simulation mode');
    console.log('Run "agent-router simulate" and type "stats" to see routing statistics');
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
