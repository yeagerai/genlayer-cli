import { writeFileSync, existsSync, readFileSync } from "fs";
import { ethers } from "ethers";
import path from "path";
import { ConfigFileManager } from "../config/ConfigFileManager";

export class KeypairManager extends ConfigFileManager {
  constructor() {
    super();
  }

  getPrivateKey(): string | undefined {
    const keypairPath = this.getConfigByKey("keyPairPath");

    if (!keypairPath || !existsSync(keypairPath)) {
      return ""
    }

    const keypairData = JSON.parse(readFileSync(keypairPath, "utf-8"));

    if (!keypairData.privateKey) {
      return ""
    }

    return keypairData.privateKey;
  }

  createKeypair(outputPath = "./keypair.json", overwrite: boolean = false): void {
    const finalOutputPath = this.getFilePath(outputPath);

    if(existsSync(finalOutputPath) && !overwrite) {
      throw new Error(`The file at ${finalOutputPath} already exists. Use the '--overwrite' option to replace it.`);
    }

    const wallet = ethers.Wallet.createRandom();
    const keypairData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };

    writeFileSync(finalOutputPath, JSON.stringify(keypairData, null, 2));
    this.writeConfig('keyPairPath', finalOutputPath);
  }
} 