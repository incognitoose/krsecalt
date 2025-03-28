export const port = [55920, 55921, 55922];

export default async function handleConnection(ws: WebSocket, event: MessageEvent<any>, req: Request) {
  let data; try { data = JSON.parse(event.data) } catch { data = event.data }

}
