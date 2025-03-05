import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";
import { getPrivateKey } from "../../lib/accounts/getPrivateKey";
import { BaseAction } from "../../lib/actions/BaseAction";

export interface CallOptions {
  args: any[];
}

export class CallAction extends BaseAction{
  private genlayerClient: GenLayerClient<typeof simulator>;

  constructor() {
    super();
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
             }: {
    contractAddress: string;
    method: string;
    args: any[];
  }): Promise<void> {
    this.startSpinner(`Calling method ${method} on contract at ${contractAddress}...`);

    const contractSchema = await this.genlayerClient.getContractSchema(contractAddress);

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
      const result = await this.genlayerClient.readContract({
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
      this.log("Write transaction hash:", hash);
      this.succeedSpinner("Write operation successfully executed", result);
    } catch (error) {
      this.failSpinner("Error during write operation", error);
    }
  }
}
