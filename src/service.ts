import { ethers, Signer } from 'ethers';
import { BaseServiceV2, validators } from '@eth-optimism/common-ts';
import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk';
import { getSigners, getCrossChainMessenger } from './config';

type ActorServiceOptions = {
    amount: string
    recipient: string
    loopIntervalMs: number
}

type ActorServiceState = {
    crossChainMessenger: CrossChainMessenger
    amount: ethers.BigNumber
    wallet: Signer
    recipient: string
}

class ActorService extends BaseServiceV2<ActorServiceOptions, {}, ActorServiceState> {
    constructor(options?: Partial<ActorServiceOptions>) {
        super({
            name: 'chaos-deposit-actor',
            version: "0.0.1",
            loop: true,
            options: options,
            optionsSpec: {
                amount: {
                    validator: validators.str,
                    desc: 'Amount of ETH to deposit.',
                },
                recipient: {
                    validator: validators.str,
                    desc: 'Wallet used to interact with L2.',
                },
                loopIntervalMs: {
                    validator: validators.num,
                    desc: "Loop interval in milliseconds",
                }
            },
            metricsSpec: {},
        })
        this.loopIntervalMs = options.loopIntervalMs
    }

    protected async init(): Promise<void> {
        this.state.crossChainMessenger = getCrossChainMessenger()
        this.state.amount = ethers.utils.parseEther(this.options.amount)

        const [, signer] = getSigners()
        this.state.wallet = signer
        this.state.recipient = this.options.recipient
    }

    protected async main(): Promise<void> {
        await Promise.all([this.doDeposit(), this.doSend()])
    }

    async doDeposit(): Promise<void> {
        const logger = this.logger.child({ component: 'deposit' })
        logger.info("Actor ETH")

        const balance = await this.state.crossChainMessenger.l1Signer.getBalance()
        const teneth = ethers.utils.parseEther("10.0")
        if (balance.lt(teneth)) {
            logger.warn(`L1 wallet is too low. Currently has ${balance} wei`)
            return
        }

        const start = new Date().getUTCSeconds()
        const now = () => { return new Date().getUTCSeconds() }

        const response = await this.state.crossChainMessenger.depositETH(this.state.amount)
        logger.info(`Transaction hash(on L1): ${response.hash} `)
        await response.wait()
        logger.info("Waiting for status to change to RELAYED")
        logger.info(`Time so far ${(now() - start) / 1000} seconds`)
        await this.state.crossChainMessenger.waitForMessageStatus(response.hash,
            MessageStatus.RELAYED)

        logger.info(`depositETH took ${(now() - start) / 1000} seconds\n\n`)
    }

    async doSend(): Promise<void> {
        const logger = this.logger.child({ component: 'send' })
        logger.info("Send ETH on L2")

        const tx = {
            to: this.state.recipient,
            value: this.state.amount,
        }
        const result = await this.state.wallet.sendTransaction(tx)
        const receipt = await result.wait()
        logger.info("Successfully sent ETH")
    }
}


if (require.main === module) {
    const options = {
        amount: "0.001",
        recipient: process.env.SEND_RECIPIENT,
        loopIntervalMs: 120_000,
    }
    const service = new ActorService(options)
    service.run()
}
