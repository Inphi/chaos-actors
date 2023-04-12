# Usage

To run the deposit and send actors on a local optimism devnet:
```bash
yarn build

env SDK_ADDRESSES=$PATH_TO_MONOREPO/.devnet/sdk-addresses.json\
    L1_RPC_URL=http://localhost:8545\
    L2_RPC_URL=http://localhost:9545\
    PORT=9090\
    PRIVATE_KEY=5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a\
    AMOUNT=10\
    SEND_RECIPIENT=0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
    node ./dist/src/service.js
```
