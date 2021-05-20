import {v4} from "uuid";
import axios from "axios";
import config from "config";

const amoBlockchainNode: any = config.get('amo_blockchain_node')

async function usageQuery(parcel_id: string, recipient: string | undefined) {
  const endpoint = `http://${amoBlockchainNode.host}:${amoBlockchainNode.port}`
  const requestHeaders = {
    headers: {
      "Content-Type": "application/json"
    }
  }
  const requestBody = {
    "jsonrpc": "2.0",
    "id": v4(),
    "method": "abci_query",
    "params": {
      "path": "/usage",
      "data": Buffer.from(JSON.stringify({"recipient": recipient, "target": parcel_id}), 'utf-8').toString('hex')
    }
  }

  try {
    let res = await axios.post(endpoint, requestBody, requestHeaders)
    return Promise.resolve(res)
  } catch (error) {
    Promise.reject( {
      code: 502,
      message: `${error}`
    })
  }
}

export default {
  usageQuery
}