import { DepositService } from './deposit';

if (require.main === module) {
    const service = new DepositService({
        amount: '0.001',
    })
    service.run()
}
