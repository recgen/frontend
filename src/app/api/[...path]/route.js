const BACKEND = process.env.API_URL || "http://localhost:8000";

async function proxy(req) {
  const url = new URL(req.url);
  const target = url.pathname.replace(/^\/api/, "") + url.search;

  const headers = new Headers();

  // Пробрасываем куку
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.arrayBuffer();

  const backendRes = await fetch(`${BACKEND}${target}`, {
    method: req.method,
    headers,
    body,
  });

  const resBody = await backendRes.arrayBuffer();
  const response = new Response(resBody, { status: backendRes.status });

  const resCT = backendRes.headers.get("content-type");
  if (resCT) response.headers.set("content-type", resCT);

  // Пробрасываем Set-Cookie обратно в браузер
  if (backendRes.headers.getSetCookie) {
    for (const sc of backendRes.headers.getSetCookie()) {
      response.headers.append("set-cookie", sc);
    }
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
