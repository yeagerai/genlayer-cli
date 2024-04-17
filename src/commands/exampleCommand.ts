import {requestJsonRpc} from "../lib/clients/jsonRpcClient";

export async function exampleCommand() {
  try {
    const response = await requestJsonRpc("methodName", {param1: "value1"});
    console.log("Response:", response);
  } catch (error) {
    console.error("Error:", error);
  }
}
