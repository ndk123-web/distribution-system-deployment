# Combined Distributed Traffic Control System

This unified system combines all distributed systems concepts from Tasks 1-8 using the ndk-rpc-cluster library.

## 🎯 Features

### Core Distributed Systems Concepts
- **Traffic Signal Control** (Task 2): Deterministic signal sequencing (RED → YELLOW → GREEN)
- **Pedestrian Control** (Task 3): Coordinated pedestrian signal management
- **Mutual Exclusion** (Task 5): Signal and pedestrian locks to prevent race conditions
- **Deadlock Detection** (Task 6): Dual-lock scenario demonstration
- **Replica Consistency** (Task 8): 3-replica system with state synchronization
- **Load Balancing**: Automatic failover and load distribution

### System Architecture
```
UI (Web Interface)
    ↓ HTTP Requests
Middleware Server (Port 4132)
    ↓ Service Discovery
Global Registry (Port 3331)
    ↓ Load Balancing
Load Balancer (Port 3000)
    ↓ Distributes Load
3 Traffic Control Replicas
```

## 🚀 Quick Start

### 1. Start the System
```bash
node app.mjs
```

This will start:
- Global Registry (port 3331)
- Middleware Server (port 4132) 
- Load Balancer with 3 replicas (port 3000)

### 2. Open the UI
Open `index.html` in your browser or use a local server:
```bash
npx serve . -p 8080
```

### 3. Test via Command Line
```bash
node client.mjs
```

## 🎮 UI Features

### Traffic Control Panel
- **Automatic Mode**: Continuous signal cycling (8-second intervals)
- **Manual Mode**: Select which road group turns GREEN
- **Real-time Signal Display**: Visual traffic lights with colors
- **Pedestrian Coordination**: Automatic pedestrian signal updates

### System Monitoring
- **Lock Status**: Shows which process owns signal/pedestrian locks
- **Replica Consistency**: Live view of all 3 replica states
- **System Logs**: Real-time operation logging
- **Deadlock Demo**: Button to trigger deadlock scenario

## 🔧 RPC Functions

All functions are load-balanced across 3 replicas:

### Core Traffic Control
- `signal_controller()`: Main automatic signal control with mutual exclusion
- `pedestrian_controller({ road })`: Update pedestrian signals for given road
- `signal_manipulator()`: Generate random road selection (1-4)

### Manual Control
- `manual({ auto, roadToGreen })`: Switch between auto/manual mode and control signals
- `get_status()`: Get current system state, locks, and replica status

### Deadlock Demo
- `trigger_deadlock()`: Demonstrate deadlock scenario with dual locks

## 🔒 Mutual Exclusion

The system uses two locks:
- **SIGNAL_LOCK**: Controls traffic signal changes
- **PEDESTRIAN_LOCK**: Controls pedestrian signal changes

Proper lock ordering prevents deadlocks in normal operation, but the deadlock demo shows what happens with improper ordering.

## 🔄 Replica Consistency

All state changes are synchronized across 3 replicas:
- Traffic signal states (s12, s34)
- Pedestrian signal states (p12, p34)
- Mode settings (auto/manual)
- Lock ownership information

## 🚨 Deadlock Demonstration

The `trigger_deadlock` function demonstrates a classic deadlock scenario:
1. Process 1: Acquires SIGNAL_LOCK → tries to acquire PEDESTRIAN_LOCK
2. Process 2: Acquires PEDESTRIAN_LOCK → tries to acquire SIGNAL_LOCK
3. Result: Both processes wait indefinitely

## 📊 Load Balancing

The ndk-rpc-cluster library provides:
- **3 Replica Servers**: Automatic distribution of requests
- **Health Monitoring**: Failed replicas are bypassed
- **Consistent State**: All replicas maintain synchronized state
- **Auto-scaling**: New replicas created under high load (30,000+ requests)

## 🛠️ Technical Stack

- **Backend**: Node.js with ndk-rpc-cluster library
- **Frontend**: Pure HTML/CSS/JavaScript with real-time updates
- **Architecture**: Microservices with load balancing and service discovery
- **Communication**: HTTP JSON-RPC over middleware layer

## 🎛️ Configuration

The system is pre-configured but can be customized:
- **Replica Count**: Change `replicas: 3` in `lb.mjs`
- **Timing**: Modify signal timing intervals in the service logic
- **Ports**: Update port configurations in respective files
- **UI Refresh Rate**: Adjust `setInterval(refreshStatus, 2000)` in index.html

## 🧪 Testing Scenarios

1. **Normal Operation**: Watch automatic signal cycling
2. **Manual Control**: Switch to manual mode and control signals
3. **Lock Contention**: Multiple rapid requests show lock behavior  
4. **Deadlock**: Use deadlock button to see system behavior
5. **Replica Sync**: Watch all replicas maintain consistent state
6. **Load Balancing**: High request volume distributes across replicas

## 🔍 Monitoring

The UI provides comprehensive monitoring:
- Real-time signal states with visual indicators
- Lock ownership and status
- Replica consistency verification  
- System operation logs
- Performance metrics

This system demonstrates all key distributed systems concepts in a unified, interactive application using your ndk-rpc-cluster library!
