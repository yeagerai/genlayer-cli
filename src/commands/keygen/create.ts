import { writeFileSync, existsSync } from "fs";
import { ethers } from "ethers";
import { BaseAction } from "../../lib/actions/BaseAction";

export interface CreateKeypairOptions {
  output: string;
  overwrite: boolean;
}

export class KeypairCreator extends BaseAction{

  constructor() {
    super()
  }

  createKeypairAction(options: CreateKeypairOptions) {
    try {
      this.startSpinner(`Creating keypair...`);
      const outputPath = this.getFilePath(options.output);

      if(existsSync(outputPath) && !options.overwrite) {
        this.failSpinner(
          `The file at ${outputPath} already exists. Use the '--overwrite' option to replace it.`
        );
        return;
      }

      const wallet = ethers.Wallet.createRandom();
      const keypairData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };

      writeFileSync(outputPath, JSON.stringify(keypairData, null, 2));

      this.writeConfig('keyPairPath', outputPath);
      this.succeedSpinner(`Keypair successfully created and saved to: ${outputPath}`);
    } catch (error) {
      this.failSpinner("Failed to generate keypair:", error);
    }
  }
}