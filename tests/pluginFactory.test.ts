// pluginNetworkSimulation.test.ts
import { createPlugin, Plugin, Transaction } from '../src/pluginFactory';

describe('Plugin Network Simulation', () => {
  it('should simulate multiple plugins interacting', async () => {
    const numPlugins: number = 5;
    const plugins: Plugin[] = [];

    // Create multiple plugin instances with an initial balance
    for (let i = 0; i < numPlugins; i++) {
      const plugin = createPlugin(`plugin-${i}`);
      plugin.balance = 1000;  // Set an initial balance sufficient for transactions
      plugins.push(plugin);
    }

    // Define the transaction
    const transaction: Transaction = { from: 'plugin-0', to: 'plugin-1', amount: 100 };

    // Send transaction from the first plugin
    const sendResult: boolean = plugins[0].sendTransaction(transaction);
    expect(sendResult).toBe(true);

    // Simulate broadcasting the transaction to all other plugins
    plugins.forEach((plugin, index) => {
      if (index !== 0) {  // Assuming the sender does not need to receive their own transaction
        plugin.receiveTransaction(transaction);
      }
    });

    // Assert conditions that should be true after the transaction
    expect(plugins[1].getBalance()).toEqual(1100); // Updated balance after receiving 100
    expect(plugins[0].getBalance()).toEqual(900); // Updated balance after sending 100

    // Check that other plugins did not incorrectly alter their balances
    plugins.slice(2).forEach(plugin => {
      expect(plugin.getBalance()).toEqual(1000); // Assuming no unintended balance changes
    });
  });
});
