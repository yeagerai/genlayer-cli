import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";
import { getPrivateKey } from "../../lib/accounts/getPrivateKey";

export interface CallOptions {
  args: any[];
  type: "read" | "write";
}

export class CallAction {
  private genlayerClient: GenLayerClient<typeof simulator>;

  constructor() {
    this.genlayerClient = createClient({
      chain: simulator,
      endpoint: process.env.VITE_JSON_RPC_SERVER_URL,
      account: createAccount(getPrivateKey() as any),
    });
  }

  async call({
               contractAddress,
               method,
               args,
               type,
             }: {
    contractAddress: string;
    method: string;
    args: any[];
    type: "read" | "write";
  }): Promise<void> {
    console.log(`Calling ${type} method ${method} on contract at ${contractAddress}...`);

    try {
      if (type === "read") {
        await this.executeRead(contractAddress, method, args);
      } else if (type === "write") {
        await this.executeWrite(contractAddress, method, args);
      } else {
        throw new Error(`Invalid call type: ${type}. Use "read" or "write".`);
      }
    } catch (error) {
      console.error("Error calling contract method:", error);
      throw error;
    }
  }

  private async executeRead(contractAddress: string, method: string, args: any[]): Promise<void> {
    try {
      const result = await this.genlayerClient.readContract({
        address: contractAddress as any,
        functionName: method,
        args,
      });
      console.log("Read result:", result);
    } catch (error) {
      console.error("Error during read operation:", error);
      throw error;
    }
  }

  private async executeWrite(contractAddress: string, method: string, args: any[]): Promise<void> {
    try {
      const hash = await this.genlayerClient.writeContract({
        address: contractAddress as any,
        functionName: method,
        args,
        value: 0n,
      });
      const result = await this.genlayerClient.waitForTransactionReceipt({
        hash,
        retries: 15,
        interval: 2000,
      });
      console.log("Write transaction hash:", hash);
      console.log("Result:", result);
    } catch (error) {
      console.error("Error during write operation:", error);
      throw error;
    }
  }
}
