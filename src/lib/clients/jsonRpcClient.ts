import fetch from "node-fetch";

import {DEFAULT_JSON_RPC_URL} from "../config/simulator";

export async function requestJsonRpc(method: string, body: object) {
  try {
    const response = await fetch(DEFAULT_JSON_RPC_URL, {
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
