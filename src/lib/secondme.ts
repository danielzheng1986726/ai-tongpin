import { getValidAccessToken } from "./auth";

const API_BASE = process.env.SECONDME_API_BASE_URL!;

/** 解析 SSE 流，收集完整文本内容和 sessionId */
async function collectSSE(
  response: Response
): Promise<{ content: string; sessionId?: string }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let content = "";
  let sessionId: string | undefined;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        if (parsed.sessionId) {
          sessionId = parsed.sessionId;
        }
        if (parsed.choices?.[0]?.delta?.content) {
          content += parsed.choices[0].delta.content;
        }
      } catch {
        // 非 JSON 行，跳过
      }
    }
  }

  return { content, sessionId };
}

/** 与某用户的 SecondMe AI 聊天（流式），返回完整回复 */
export async function chatWithSecondMe(
  userId: string,
  message: string,
  options?: { sessionId?: string; systemPrompt?: string }
): Promise<{ content: string; sessionId?: string }> {
  const token = await getValidAccessToken(userId);

  const body: Record<string, string> = { message };
  if (options?.sessionId) body.sessionId = options.sessionId;
  if (options?.systemPrompt) body.systemPrompt = options.systemPrompt;

  const res = await fetch(`${API_BASE}/api/secondme/chat/stream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat API failed: ${res.status} ${text}`);
  }

  return collectSSE(res);
}

/** 调用 Act API，获取结构化 JSON 输出 */
export async function actWithSecondMe(
  userId: string,
  message: string,
  actionControl: string
): Promise<string> {
  const token = await getValidAccessToken(userId);

  const res = await fetch(`${API_BASE}/api/secondme/act/stream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, actionControl }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Act API failed: ${res.status} ${text}`);
  }

  const { content } = await collectSSE(res);
  return content;
}

/** 获取用户的兴趣标签 */
export async function fetchUserShades(
  userId: string
): Promise<unknown[]> {
  const token = await getValidAccessToken(userId);

  const res = await fetch(`${API_BASE}/api/secondme/user/shades`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];

  const result = await res.json();
  if (result.code === 0 && result.data?.shades) {
    return result.data.shades;
  }
  return [];
}
