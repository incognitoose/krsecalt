// deno run --allow-net=127.0.0.1 --allow-read server.ts
const options = {
  hostname: "127.0.0.1", // 일단 로컬 연결만 허용 (0.0.0.0은 너무 관대함)
  cert: await Deno.readTextFile("cert.pem"),
  key: await Deno.readTextFile("key.pem"),
};

const handlers: Record<number, ((ws: WebSocket, event: MessageEvent<any>, req: Request) => Promise<void>)[]> = {};

for await (const entry of Deno.readDir("./server")) {
  if (entry.isFile && entry.name.endsWith(".ts")) {
    const module = await import(`./server/${entry.name}`);
    if (module.default && typeof module.default === "function" && module.port) {
      const ports: number[] = typeof module.port === "number" ? [module.port] : module.port;
      for (const port of ports) {
        if (!handlers[port]) handlers[port] = [];
        handlers[port].push(module.default);
      }
    }
  }
}

const ports = Object.keys(handlers).map((port) => parseInt(port, 10));
console.log(ports)
for (const port of ports) {
  Deno.serve({ port, ...options }, async (req: Request) => {
    // 유저 토글 가능한 방화벽 만들기: 일단 여기서 로컬 연결만 허용하던지 해야할듯? (=과연 hostname: 127.0.0.1로 충분할까?)
    try {
      if (req.headers.get("upgrade") === "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(req);
        console.log(`Upgrading ${req.url}`);
        await handleConnection(socket, port, req);
        return response;
      }
      console.debug(`HTTP Request: ${req.url}\n${await req.text()}`);
      return new Response("{}", { status: 500 });
    } catch (error) {
      console.error(`Error handling request for port ${port}:`, error);
      return new Response("{}", { status: 500 });
    }
  });
}

async function handleConnection(ws: WebSocket, port: number, req: Request) {
  console.log(`WebSocket connection established on ${port}`);

  ws.onmessage = async (event) => {
    try {
      console.debug(`${port}:`, event.data);

      if (handlers[port]) {
        await Promise.all(handlers[port].map(async (handler) => {
          console.debug(`ws:${port}`, handler);
          await handler(ws, event, req);
        }));
      } else {
        console.warn(`No handler found for port: ${port}`);
      }
    } catch (error) {
      console.error(`Error processing message on port ${port}:`, error);
    }
  };

  ws.onerror = (error) => {
    console.error(`WebSocket error on port ${port}:`, error);
  };
}
