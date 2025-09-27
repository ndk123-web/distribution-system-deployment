import { Client } from "ndk-rpc-cluster/client";

const client = new Client();

// Test all the traffic control functions
console.log("🚦 Testing Combined Traffic Control System...\n");

// Test 1: Get current status
console.log("1️⃣ Getting current status:");
const status = await client.request({
  method: "get_status",
  params: {},
  key: "TrafficControlSystem",
});
console.log("Status:", status);
console.log();

// Test 2: Manual control
console.log("2️⃣ Setting manual mode and switching to road 12:");
const manualResult = await client.request({
  method: "manual", 
  params: { auto: false, roadToGreen: "1" },
  key: "TrafficControlSystem",
});
console.log("Manual Result:", manualResult);
console.log();

// Test 3: Signal controller (automatic)
console.log("3️⃣ Running signal controller (automatic mode):");
const autoResult = await client.request({
  method: "manual",
  params: { auto: true },
  key: "TrafficControlSystem", 
});
console.log("Auto Result:", autoResult);
console.log();

// Test 4: Pedestrian controller
console.log("4️⃣ Testing pedestrian controller:");
const pedResult = await client.request({
  method: "pedestrian_controller",
  params: { road: 3 },
  key: "TrafficControlSystem",
});
console.log("Pedestrian Result:", pedResult);
console.log();

// Test 5: Trigger deadlock demo
console.log("5️⃣ Triggering deadlock scenario:");
const deadlockResult = await client.request({
  method: "trigger_deadlock",
  params: {},
  key: "TrafficControlSystem", 
});
console.log("Deadlock Result:", deadlockResult);
console.log();

console.log("✅ All tests completed!");