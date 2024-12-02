import { writeFileSync } from "fs";
import { ethers } from "ethers";
import { ConfigFileManager } from "../../lib/config/ConfigFileManager";

export interface CreateKeypairOptions {
  output: string;
}

export class KeypairCreator {
  private filePathManager: ConfigFileManager;

  constructor() {
    this.filePathManager = new ConfigFileManager();
  }

  createKeypairAction(options: CreateKeypairOptions) {
    try {
      const wallet = ethers.Wallet.createRandom();
      const keypairData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };

      const outputPath = this.filePathManager.getFilePath(options.output);
      writeFileSync(outputPath, JSON.stringify(keypairData, null, 2));

      this.filePathManager.writeConfig('keyPairPath', outputPath);
      console.log(`Keypair successfully created and saved to: ${outputPath}`);
    } catch (error) {
      console.error("Failed to generate keypair:", error);
      process.exit(1);
    }
  }
}