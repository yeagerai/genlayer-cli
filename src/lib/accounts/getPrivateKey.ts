import fs from "fs";
import { ConfigFileManager } from "../../lib/config/ConfigFileManager";

export function getPrivateKey(): string {
  const configFileManager: ConfigFileManager = new ConfigFileManager();
  const keypairPath = configFileManager.getConfigByKey("keyPairPath");

  if (!keypairPath || !fs.existsSync(keypairPath)) {
    console.error("Keypair file not found. Please generate or specify a valid keypair path.");
    process.exit(1);
  }

  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));

  if (!keypairData.privateKey) {
    console.error("Invalid keypair file. Private key is missing.");
    process.exit(1);
  }

  return keypairData.privateKey;
}