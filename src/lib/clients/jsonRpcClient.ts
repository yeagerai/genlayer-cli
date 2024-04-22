import fetch from "node-fetch";
import {v4 as uuidv4} from "uuid";

import {DEFAULT_JSON_RPC_URL} from "../config/simulator";

export interface JsonRPCParams {
  method: string;
  params: any[];
}

export class JsonRpcClient {
  serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  async request({method, params}: JsonRPCParams): Promise<any | null> {
    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: uuidv4(),
          method,
          params,
        }),
      });

      if (response.ok) {
        return response.json();
      }
    } catch (error: any) {
      throw new Error(`Fetch Error: ${error.message}`);
    }
    return null;
  }
}
export const rpcClient = new JsonRpcClient(DEFAULT_JSON_RPC_URL);
