import { ethers } from 'ethers';
import { predeploys } from '@eth-optimism/contracts-bedrock'
import { DEFAULT_L2_CONTRACT_ADDRESSES, CrossChainMessenger, ETHBridgeAdapter, StandardBridgeAdapter } from '@eth-optimism/sdk';

const getSigners = (): [ethers.Wallet, ethers.Wallet] => {
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
    const L1_STANDARD_BRIDGE = "0x60859421Ed85C0B11071230cf61dcEeEf54630Ff"
    return {
        l1: {
            AddressManager: "0x41E2A82Ddf1311D74c898Bb825c8D0eafaea2432",
            L1CrossDomainMessenger: "0xfc428D28D197fFf99A5EbAc6be8B761FEd8718Da",
            L1StandardBridge: L1_STANDARD_BRIDGE,
            StateCommitmentChain: ethers.constants.AddressZero,
            CanonicalTransactionChain: ethers.constants.AddressZero,
            BondManager: ethers.constants.AddressZero,
            OptimismPortal: "0x83ed70E86524C3b71Df475E9BC3d7B13740F2561",
            L2OutputOracle: "0x9DDB48E3A272E784D887F3A45B261e65E9A0baeC",
        },
        l2: DEFAULT_L2_CONTRACT_ADDRESSES,
    }
}

export const getCrossChainMessenger = (): CrossChainMessenger => {
    const L1_STANDARD_BRIDGE = "0x60859421Ed85C0B11071230cf61dcEeEf54630Ff"
    const contractAddrs = getContractAddresses()
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
