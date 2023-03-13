import { ethers } from 'ethers';
import { BaseServiceV2, validators } from '@eth-optimism/common-ts';
import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk';
import { sleep } from '@eth-optimism/core-utils'
import { getCrossChainMessenger } from './config';

type DepositServiceState = {
    crossChainMessenger: CrossChainMessenger
    amount: ethers.BigNumber
}

type DepositServiceOptions = {
    amount: string
}

export class DepositService extends BaseServiceV2<DepositServiceOptions, {}, DepositServiceState> {
    constructor(options?: Partial<DepositServiceOptions>) {
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
            },
            metricsSpec: {},
        })
        this.loopIntervalMs = 120_000
    }

    protected async init(): Promise<void> {
        this.state.crossChainMessenger = getCrossChainMessenger()
        this.state.amount = ethers.utils.parseEther(this.options.amount)
    }

    protected async main(): Promise<void> {
        const logger = this.logger.child({ component: 'DepositActor' })
        logger.info("Deposit ETH")

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
}
