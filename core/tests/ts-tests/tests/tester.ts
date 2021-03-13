import * as ethers from 'ethers';
import * as zksync from 'zksync';
import * as fs from 'fs';
import * as path from 'path';
import { composeTransactionWithValue } from './web3'
import { finalize, sendTransaction } from '../../../../sdk/zksync.js/src/web3'

const franklin_abi = require('../../../../contracts/build/ZkSync.json').abi;
type Network = 'localhost' | 'rinkeby' | 'ropsten';

const testConfigPath = path.join(process.env.ZKSYNC_HOME as string, `etc/test_config/constant`);
const ethTestConfig = JSON.parse(fs.readFileSync(`${testConfigPath}/eth.json`, { encoding: 'utf-8' }));
const networkHost = process.env.OPERATOR_HOST as Network

export class Tester {
    public contract: ethers.Contract;
    public runningFee: ethers.BigNumber;
    constructor(
        public network: Network,
        public ethProvider: ethers.providers.Provider,
        public syncProvider: zksync.Provider,
        public ethWallet: ethers.Wallet,
        public syncWallet: zksync.Wallet
    ) {
        this.contract = new ethers.Contract(syncProvider.contractAddress.mainContract, franklin_abi, ethWallet);
        this.runningFee = ethers.BigNumber.from(0);
    }

    // prettier-ignore
    static async init() {
        const ethProvider = new ethers.providers.JsonRpcProvider(process.env.WEB3_URL)
        if (networkHost == 'localhost') {
            ethProvider.pollingInterval = 100;
        }
        const syncProvider = await await zksync.Provider.newHttpProvider(`http://${networkHost}:3030`);
        const ethWallet = ethers.Wallet.fromMnemonic(
            ethTestConfig.test_mnemonic as string,
            "m/44'/60'/0'/0/0"
        ).connect(ethProvider);
        const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);
        return new Tester(networkHost, ethProvider, syncProvider, ethWallet, syncWallet);
    }

    async disconnect() {
        await this.syncProvider.disconnect();
    }

    async fundedWallet() {
        const gwei = ethers.BigNumber.from(1000000000)
        const ether = gwei.mul(100000000)
        const unit = ethers.BigNumber.from(10)
        const newWallet = ethers.Wallet.createRandom().connect(this.ethProvider);
        const syncWallet = await zksync.Wallet.fromEthSigner(newWallet, this.syncProvider);
        const tx = await composeTransactionWithValue('0x', newWallet.address, ether.mul(unit));
        await sendTransaction("eth_sendRawTransaction", [tx.rawTransaction]) as any
        await finalize();
        return syncWallet;
    }

    async emptyWallet() {
        let ethWallet = ethers.Wallet.createRandom().connect(this.ethProvider);
        return await zksync.Wallet.fromEthSigner(ethWallet, this.syncProvider);
    }

    async operatorBalance(token: zksync.types.TokenLike) {
        const operatorAddress = process.env.OPERATOR_FEE_ETH_ADDRESS as string;
        const accountState = await this.syncProvider.getState(operatorAddress);
        const tokenSymbol = this.syncProvider.tokenSet.resolveTokenSymbol(token);
        const balance = accountState.committed.balances[tokenSymbol] || '0';
        return ethers.BigNumber.from(balance);
    }
}
