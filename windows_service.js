const { Service } = require("node-windows");

const svc = new Service({
  name: "MySelfBot",
  description: "UwUU",
  script: "C:\\Users\\akarc\\Desktop\\SelfBot-Ultra-Status\\index.js", // Uygulamanızın yolu
});

svc.on("install", () => {
  svc.start();
});
svc.install();
