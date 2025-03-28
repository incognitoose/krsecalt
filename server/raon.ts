export const port = 34581;

export default async function handleConnection(ws: WebSocket, event: MessageEvent<any>, req: Request) {
  let data; try { data = JSON.parse(event.data) } catch { data = event.data }
  if (typeof data !== "object") {
    console.debug(`Raon (${req.url}): 데이터가 JSON이 아닙니다:`, data);
    // TODO: JSON이 아닌 데이터 처리 구현 필요
    return;
  }


  console.debug(`${data.origin}이라고 주장하는 웹사이트가 Raon에 접속했어요`);
  // req.url.endsWith("/raon/touchenex/Call")
  if (data.init === "get_versions") {
    const response: Record<string, any> = {
      get_versions: true,
      status: true,
    };

    if (data.tabid) response.tabid = data.tabid;
    // TODO/FIXME: 하드코딩 하지 말기!!
    response.daemon = "1.0.2.14";
    response.ex = "1.0.1.1547";
    response.m = [{ name: data.m, version: "1, 0, 0, 88" }];

    if (data.m != "nxkey") {
      console.warn("Raon: m is not nxkey");
      console.warn(`GitHub 이슈에 제출바람: Raon 모듈 ${data.m}이 구현되지 않음`);
    }
    ws.send(JSON.stringify(response));
  } else {
    console.log(`Unhandled data for Raon:`, data);
  }
}
