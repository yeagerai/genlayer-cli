import fetch from "node-fetch";

const JSON_RPC_URL = process.env.JSON_RPC_URL || "";

export async function requestJsonRpc(method: string, body: object) {
  try {
    const response = await fetch(JSON_RPC_URL, {
      method,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return response.json();
    }
  } catch (error: any) {
    throw new Error(`Fetch Error: ${error.message}`);
  }
  return null;
}
