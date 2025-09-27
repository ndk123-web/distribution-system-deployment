#!/usr/bin/env node

/**
 * Combined Distributed Traffic Control System
 * 
 * This unified system combines all distributed systems concepts:
 * - Traffic Signal Control (Task 2)
 * - Pedestrian Control (Task 3) 
 * - Mutual Exclusion (Task 5)
 * - Deadlock Detection (Task 6)
 * - Replica Consistency (Task 8)
 * - Load Balancing with ndk-rpc-cluster
 * 
 * Features:
 * ✅ Traffic signals with deterministic sequencing (RED → YELLOW → GREEN)
 * ✅ Pedestrian signal coordination
 * ✅ Mutual exclusion with signal and pedestrian locks
 * ✅ Deadlock detection and demonstration
 * ✅ Replica consistency across 3 server instances
 * ✅ Load balancing and fault tolerance
 * ✅ Manual and automatic modes
 * ✅ Real-time UI with comprehensive monitoring
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SystemManager {
    constructor() {
        this.processes = new Map();
        this.isShuttingDown = false;
    }

    log(service, message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${service}] ${message}`);
    }

    async startService(name, scriptPath, port = null) {
        return new Promise((resolve, reject) => {
            this.log(name, `Starting service...`);
            
            const process = spawn('node', [scriptPath], {
                stdio: ['inherit', 'pipe', 'pipe'],
                cwd: __dirname
            });

            process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    this.log(name, output);
                }
            });

            process.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error) {
                    this.log(name, `ERROR: ${error}`);
                }
            });

            process.on('error', (error) => {
                this.log(name, `Failed to start: ${error.message}`);
                reject(error);
            });

            process.on('exit', (code) => {
                if (!this.isShuttingDown) {
                    this.log(name, `Process exited with code ${code}`);
                }
                this.processes.delete(name);
            });

            // Give process time to start
            setTimeout(() => {
                if (process.pid) {
                    this.processes.set(name, process);
                    this.log(name, `Started successfully (PID: ${process.pid})`);
                    resolve(process);
                } else {
                    reject(new Error(`Failed to start ${name}`));
                }
            }, 2000);
        });
    }

    async startSystem() {
        console.log('\n🚦 Combined Distributed Traffic Control System');
        console.log('='.repeat(50));
        console.log('Features: Traffic Control + Mutual Exclusion + Deadlock + Replicas');
        console.log('');

        try {
            // Start services in order
            console.log('🌐 Starting Global Registry & Middleware...');
            await this.startService('Registry', join(__dirname, 'registry__middle_server.mjs'));
            
            await this.sleep(3000); // Wait for registry to be ready
            
            console.log('⚖️ Starting Load Balancer with Replicas...');
            await this.startService('LoadBalancer', join(__dirname, 'lb.mjs'));
            
            await this.sleep(5000); // Wait for load balancer and replicas

            console.log('\n✅ System Started Successfully!');
            console.log('');
            console.log('🌐 Services Running:');
            console.log('   • Global Registry: http://localhost:3331');
            console.log('   • Middleware Server: http://localhost:4132');
            console.log('   • Load Balancer: http://localhost:3000 (3 replicas)');
            console.log('');
            console.log('🖥️ Open the UI:');
            console.log('   • File: ./index.html');
            console.log('   • Or run: npx serve . -p 8080');
            console.log('');
            console.log('🧪 Test the system:');
            console.log('   • node client.mjs');
            console.log('');
            console.log('⚠️ Press Ctrl+C to shutdown all services');

        } catch (error) {
            console.error('\n❌ Failed to start system:', error.message);
            await this.shutdown();
            process.exit(1);
        }
    }

    async shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log('\n🛑 Shutting down system...');
        
        const shutdownPromises = Array.from(this.processes.entries()).map(([name, process]) => {
            return new Promise((resolve) => {
                this.log(name, 'Shutting down...');
                process.kill('SIGTERM');
                
                setTimeout(() => {
                    if (this.processes.has(name)) {
                        process.kill('SIGKILL');
                    }
                    resolve();
                }, 5000);
            });
        });

        await Promise.all(shutdownPromises);
        console.log('✅ System shutdown complete');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Handle graceful shutdown
const systemManager = new SystemManager();

process.on('SIGINT', async () => {
    console.log('\n\n⚡ Received shutdown signal...');
    await systemManager.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n⚡ Received termination signal...');
    await systemManager.shutdown();
    process.exit(0);
});

// Start the system
systemManager.startSystem().catch(console.error);
