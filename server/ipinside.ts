export const port = 21300;

export default async function handleConnection(ws: WebSocket, event: MessageEvent<any>, req: Request) {
  let data; try { data = JSON.parse(event.data) } catch { data = event.data }

}
