import GlobalRegister from "ndk-rpc-cluster/registry";

const global = new GlobalRegister({
  createMiddleware: true, // it must true , it will create middle server
});

let keys = {
  TrafficControlSystem: {
    host: "distribution-system-deployment.onrender.com", // load balancer host
    port: 3000, // load balancer port
    protocol: "https", // http or https
    portRequired: false, // port is required for http protocol
  },
};  

global.registerKeys(keys);
await global.start(); // start the global registry + middle server
// Registry runs on port 3331, Middleware on port 4132

console.log("🌐 Global Registry & Middleware Server Started!");
console.log("Registry: localhost:3331");
console.log("Middleware: localhost:4132");
console.log("Service Key: TrafficControlSystem -> localhost:3000");