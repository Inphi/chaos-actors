import { ethers } from 'ethers';
import { predeploys } from '@eth-optimism/contracts-bedrock'
import { CONTRACT_ADDRESSES, DEFAULT_L2_CONTRACT_ADDRESSES, CrossChainMessenger, ETHBridgeAdapter, StandardBridgeAdapter, L2ChainID } from '@eth-optimism/sdk';
import fs from 'fs';

export const getSigners = (): [ethers.Wallet, ethers.Wallet] => {
    if (process.env.PRIVATE_KEY === undefined) {
        throw new Error("missing PRIVATE_KEY env")
    }
    if (process.env.L1_RPC_URL === undefined) {
        throw new Error("missing L1_RPC_URL env")
    }
    const l1Url = process.env.L1_RPC_URL
    let l2Url = "http://localhost:8545"
    if (process.env.L2_RPC_URL !== undefined) {
        l2Url = process.env.L2_RPC_URL
    }

    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
    const privateKey = process.env.PRIVATE_KEY;
    const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)
    return [l1Wallet, l2Wallet]
}

const getContractAddresses = () => {
    const config = process.env.SDK_ADDRESSES
    if (config === undefined) {
        throw new Error("missing SDK_ADDRESSES env")
    }
    const data = fs.readFileSync(config, 'utf-8')
    const sdk_addresses = JSON.parse(data)
    return {
        l1: sdk_addresses,
        l2: DEFAULT_L2_CONTRACT_ADDRESSES,
    }
}

export const getCrossChainMessenger = (): CrossChainMessenger => {
    const contractAddrs = getContractAddresses()
    const L1_STANDARD_BRIDGE = contractAddrs.l1.L1StandardBridge
    const [l1Signer, l2Signer] = getSigners()
    return new CrossChainMessenger({
        l1ChainId: 5,
        l2ChainId: 888,
        l1SignerOrProvider: l1Signer,
        l2SignerOrProvider: l2Signer,
        bedrock: true,
        bridges: {
            Standard: {
                Adapter: StandardBridgeAdapter,
                l1Bridge: L1_STANDARD_BRIDGE,
                l2Bridge: predeploys.L2StandardBridge,
            },
            ETH: {
                Adapter: ETHBridgeAdapter,
                l1Bridge: L1_STANDARD_BRIDGE,
                l2Bridge: predeploys.L2StandardBridge,
            },
        },
        contracts: contractAddrs,
    })
}
