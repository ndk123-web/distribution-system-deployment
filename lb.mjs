import ndk_load_balancer from "ndk-rpc-cluster/loadBalancer";

// Combined traffic controller state with replicas, mutual exclusion, and deadlock prevention
const makeTrafficService = () => {
  // Initial status: Road 34 is GREEN, so pedestrian 34 should be RED
  const STATUS = {
    s12: "RED",    // Road 12 signal
    s34: "GREEN",  // Road 34 signal  
    p12: "GREEN",  // Pedestrian 12 (GREEN when road 12 is RED)
    p34: "RED"     // Pedestrian 34 (RED when road 34 is GREEN)
  };

  // Replica consistency - simulate 3 replicas
  const REPLICAS = [
    { ...STATUS },
    { ...STATUS }, 
    { ...STATUS }
  ];

  // Mutual exclusion locks
  let SIGNAL_LOCK = false;
  let PEDESTRIAN_LOCK = false;
  let lockOwner = null;
  
  // Automatic mode toggle
  let AUTO_MODE = true;
  let loopRunning = false;

  // Lock management
  const acquireSignalLock = async (owner = 'unknown') => {
    while (SIGNAL_LOCK) await new Promise(r => setTimeout(r, 50));
    SIGNAL_LOCK = true;
    lockOwner = owner;
    console.log(`${owner} acquired SIGNAL_LOCK`);
  };

  const releaseSignalLock = (owner = 'unknown') => {
    SIGNAL_LOCK = false;
    lockOwner = null;
    console.log(`${owner} released SIGNAL_LOCK`);
  };

  const acquirePedestrianLock = async (owner = 'unknown') => {
    while (PEDESTRIAN_LOCK) await new Promise(r => setTimeout(r, 50));
    PEDESTRIAN_LOCK = true;
    console.log(`${owner} acquired PEDESTRIAN_LOCK`);
  };

  const releasePedestrianLock = (owner = 'unknown') => {
    PEDESTRIAN_LOCK = false;
    console.log(`${owner} released PEDESTRIAN_LOCK`);
  };

  // Update all replicas for consistency
  const updateReplicas = ({ type, road, value }) => {
    console.log(`Updating replicas: ${type} ${road} = ${value}`);
    for (let i = 0; i < REPLICAS.length; i++) {
      REPLICAS[i][road] = value;
    }
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const selectRoad = (road) => (road === 1 || road === 2 ? [1, 2] : [3, 4]);

  // Main signal controller with mutual exclusion
  const signal_controller = async () => {
    if (!AUTO_MODE) return { ...STATUS, auto: AUTO_MODE, lockOwner, replicas: REPLICAS };
    
    await acquireSignalLock('signal_controller');
    
    try {
      const randomRoad = signal_manipulator();
      const [road] = selectRoad(randomRoad);

      if (road === 1) {
        if (STATUS.s12 !== "GREEN") {
          STATUS.s12 = "YELLOW";
          updateReplicas({ type: 'SIGNAL', road: 's12', value: "YELLOW" });
          await sleep(2000);
        }
        
        STATUS.s12 = "GREEN";
        STATUS.s34 = "RED";
        updateReplicas({ type: 'SIGNAL', road: 's12', value: "GREEN" });
        updateReplicas({ type: 'SIGNAL', road: 's34', value: "RED" });
        
        await pedestrian_controller({ road });
      } else {
        if (STATUS.s34 !== "GREEN") {
          STATUS.s34 = "YELLOW";
          updateReplicas({ type: 'SIGNAL', road: 's34', value: "YELLOW" });
          await sleep(2000);
        }
        
        STATUS.s34 = "GREEN";
        STATUS.s12 = "RED";
        updateReplicas({ type: 'SIGNAL', road: 's34', value: "GREEN" });
        updateReplicas({ type: 'SIGNAL', road: 's12', value: "RED" });
        
        await pedestrian_controller({ road });
      }

      return { ...STATUS, roadToGreen: road, auto: AUTO_MODE, lockOwner, replicas: REPLICAS };
    } finally {
      releaseSignalLock('signal_controller');
    }
  };

  // Pedestrian controller with lock coordination
  // TRAFFIC RULE: When road signal is GREEN, pedestrian should be RED (opposite)
  const pedestrian_controller = async ({ road }) => {
    await acquirePedestrianLock('pedestrian_controller');
    
    try {
      if (road === 1 || road === 2) {
        // Road 12 is GREEN, so pedestrian 12 should be RED
        STATUS.p12 = "RED";   // ← Fixed: RED when road is GREEN
        STATUS.p34 = "GREEN"; // ← Other side gets GREEN
        updateReplicas({ type: 'PEDESTRIAN', road: 'p12', value: "RED" });
        updateReplicas({ type: 'PEDESTRIAN', road: 'p34', value: "GREEN" });
      } else {
        // Road 34 is GREEN, so pedestrian 34 should be RED  
        STATUS.p12 = "GREEN"; // ← Other side gets GREEN
        STATUS.p34 = "RED";   // ← Fixed: RED when road is GREEN
        updateReplicas({ type: 'PEDESTRIAN', road: 'p12', value: "GREEN" });
        updateReplicas({ type: 'PEDESTRIAN', road: 'p34', value: "RED" });
      }
      return { ...STATUS, lockOwner };
    } finally {
      releasePedestrianLock('pedestrian_controller');
    }
  };

  // Manual control function
  const manual = async ({ roadToGreen, auto }) => {
    if (typeof auto === 'boolean') {
      AUTO_MODE = auto;
      if (auto && !loopRunning) {
        startAutoLoop();
      }
    }
    
    if (!AUTO_MODE && roadToGreen) {
      await acquireSignalLock('manual');
      
      try {
        const [road] = selectRoad(parseInt(roadToGreen));
        
        if (road === 1) {
          if (STATUS.s12 !== "GREEN") {
            STATUS.s12 = "YELLOW";
            updateReplicas({ type: 'SIGNAL', road: 's12', value: "YELLOW" });
            await sleep(2000);
          }
          STATUS.s12 = "GREEN";
          STATUS.s34 = "RED";
          updateReplicas({ type: 'SIGNAL', road: 's12', value: "GREEN" });
          updateReplicas({ type: 'SIGNAL', road: 's34', value: "RED" });
        } else {
          if (STATUS.s34 !== "GREEN") {
            STATUS.s34 = "YELLOW";
            updateReplicas({ type: 'SIGNAL', road: 's34', value: "YELLOW" });
            await sleep(2000);
          }
          STATUS.s34 = "GREEN";
          STATUS.s12 = "RED";
          updateReplicas({ type: 'SIGNAL', road: 's34', value: "GREEN" });
          updateReplicas({ type: 'SIGNAL', road: 's12', value: "RED" });
        }
        
        await pedestrian_controller({ road });
        return { ...STATUS, roadToGreen: road, auto: AUTO_MODE, lockOwner, replicas: REPLICAS };
      } finally {
        releaseSignalLock('manual');
      }
    }
    
    return { ...STATUS, auto: AUTO_MODE, lockOwner, replicas: REPLICAS };
  };

  // Random signal generator
  const signal_manipulator = () => Math.floor(Math.random() * 4) + 1;

  // Get current status
  const get_status = () => ({ 
    ...STATUS, 
    auto: AUTO_MODE, 
    lockOwner, 
    signalLocked: SIGNAL_LOCK,
    pedestrianLocked: PEDESTRIAN_LOCK,
    replicas: REPLICAS 
  });

  // Deadlock demo function - Educational deadlock scenario
  const trigger_deadlock = async () => {
    console.log("🚨 TRIGGERING DEADLOCK SCENARIO");
    console.log("📖 DEADLOCK EXPLANATION:");
    console.log("   Process1: Gets SIGNAL_LOCK → waits for PEDESTRIAN_LOCK");
    console.log("   Process2: Gets PEDESTRIAN_LOCK → waits for SIGNAL_LOCK");
    console.log("   Result: Both processes wait forever (DEADLOCK!)");
    console.log("");
    
    let deadlockStatus = "ACTIVE";
    
    // Simulate two processes acquiring locks in different order
    const process1 = async () => {
      console.log("🔴 Process1: Trying to get SIGNAL_LOCK...");
      await acquireSignalLock('Process1-DEADLOCK');
      console.log("✅ Process1: Got SIGNAL_LOCK! Now waiting for PEDESTRIAN_LOCK...");
      
      await sleep(1000); // Give time for process2 to get its lock
      
      console.log("⏳ Process1: Waiting for PEDESTRIAN_LOCK... (This will wait forever!)");
      await acquirePedestrianLock('Process1-DEADLOCK');
      console.log("✅ Process1: Got PEDESTRIAN_LOCK! Releasing locks...");
      
      releasePedestrianLock('Process1-DEADLOCK');
      releaseSignalLock('Process1-DEADLOCK');
      deadlockStatus = "RESOLVED";
    };

    const process2 = async () => {
      console.log("🔵 Process2: Trying to get PEDESTRIAN_LOCK...");
      await acquirePedestrianLock('Process2-DEADLOCK');
      console.log("✅ Process2: Got PEDESTRIAN_LOCK! Now waiting for SIGNAL_LOCK...");
      
      await sleep(1000); // Give time for process1 to get its lock
      
      console.log("⏳ Process2: Waiting for SIGNAL_LOCK... (This will wait forever!)");  
      await acquireSignalLock('Process2-DEADLOCK');
      console.log("✅ Process2: Got SIGNAL_LOCK! Releasing locks...");
      
      releaseSignalLock('Process2-DEADLOCK');
      releasePedestrianLock('Process2-DEADLOCK');
      deadlockStatus = "RESOLVED";
    };

    // Start both processes concurrently - this will cause deadlock!
    Promise.all([process1(), process2()]);
    
    // After 5 seconds, show deadlock status
    setTimeout(() => {
      if (deadlockStatus === "ACTIVE") {
        console.log("💀 DEADLOCK CONFIRMED! Both processes are waiting forever.");
        console.log("📚 In real systems, this would require:");
        console.log("   • Deadlock detection algorithms");
        console.log("   • Lock timeouts");
        console.log("   • Process termination");
        console.log("   • Lock ordering (always acquire locks in same order)");
      }
    }, 5000);
    
    return { 
      message: "Deadlock demo started! Check console for detailed explanation.",
      explanation: "Two processes try to acquire locks in opposite order, causing circular wait",
      status: "DEADLOCK_TRIGGERED"
    };
  };

  // Auto loop for continuous operation
  const startAutoLoop = async () => {
    if (loopRunning) return;
    loopRunning = true;
    
    const loop = async () => {
      while (AUTO_MODE) {
        await signal_controller();
        await sleep(8000); // 8 second cycle
      }
      loopRunning = false;
    };
    
    loop();
  };

  // Start auto loop by default
  startAutoLoop();

  return {
    signal_controller,
    pedestrian_controller,
    signal_manipulator,
    manual,
    get_status,
    trigger_deadlock
  };
};

const service = makeTrafficService();

let registerFns = [
  { function_name: "signal_controller", function_block: service.signal_controller },
  { function_name: "pedestrian_controller", function_block: service.pedestrian_controller },
  { function_name: "signal_manipulator", function_block: service.signal_manipulator },
  { function_name: "manual", function_block: service.manual },
  { function_name: "get_status", function_block: service.get_status },
  { function_name: "trigger_deadlock", function_block: service.trigger_deadlock },
];

let config = {
  replicas: 3, // replicas want to create
  port: 3000, // port of load balancer
  register_functions: registerFns, // function to register on replicas
  threshold: 30000, // it means if req reach 30,000 then creates new replica
};

const lb = new ndk_load_balancer(config);
await lb.start(); // start the load balancer server

console.log("🚦 Combined Traffic Control System Started!");
console.log("Features: Traffic Signals, Pedestrian Control, Mutual Exclusion, Deadlock Demo, Replica Consistency");
console.log("Load Balancer running on port 3000 with 3 replicas");
