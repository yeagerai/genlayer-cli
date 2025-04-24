import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";
import { BaseAction } from "../../lib/actions/BaseAction";

export interface CallOptions {
  args: any[];
}

export class CallAction extends BaseAction{
  private _genlayerClient: GenLayerClient<typeof simulator> | null = null;

  constructor() {
    super();
  }

  private async getClient(): Promise<GenLayerClient<typeof simulator>> {
    if (!this._genlayerClient) {
      this._genlayerClient = createClient({
        chain: simulator,
        endpoint: process.env.VITE_JSON_RPC_SERVER_URL,
        account: createAccount(await this.getPrivateKey() as any),
      });
    }
    return this._genlayerClient;
  }

  async call({
               contractAddress,
               method,
               args,
             }: {
    contractAddress: string;
    method: string;
    args: any[];
  }): Promise<void> {
    const client = await this.getClient();
    this.startSpinner(`Calling method ${method} on contract at ${contractAddress}...`);

    const contractSchema = await client.getContractSchema(contractAddress);

    if(!contractSchema.methods.hasOwnProperty(method)){
      this.failSpinner(`method ${method} not found.`);
      return
    }

    const readonly = contractSchema.methods[method as any].readonly;

    if (readonly) {
      await this.executeRead(contractAddress, method, args);
      return
    }

    await this.executeWrite(contractAddress, method, args);
  }

  private async executeRead(contractAddress: string, method: string, args: any[]): Promise<void> {
    try {
      const client = await this.getClient();
      const result = await client.readContract({
        address: contractAddress as any,
        functionName: method,
        args,
      });
      this.succeedSpinner("Read operation successfully executed", result);
    } catch (error) {
      this.failSpinner("Error during read operation", error);
    }
  }

  private async executeWrite(contractAddress: string, method: string, args: any[]): Promise<void> {
    try {
      const client = await this.getClient();
      const hash = await client.writeContract({
        address: contractAddress as any,
        functionName: method,
        args,
        value: 0n,
      });
      const result = await client.waitForTransactionReceipt({
        hash,
        retries: 15,
        interval: 2000,
      });
      this.log("Write transaction hash:", hash);
      this.succeedSpinner("Write operation successfully executed", result);
    } catch (error) {
      this.failSpinner("Error during write operation", error);
    }
  }
}
