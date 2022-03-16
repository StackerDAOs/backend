import { 
  Account, 
  Chain, 
  Tx 
} from '../utils/helpers.ts';
import { TEST_PROPOSALS } from '../utils/contract-addresses.ts';

export enum SAFE_CODES {
  ERR_UNAUTHORIZED = 3200,
  ERR_ASSET_NOT_WHITELISTED = 3201,
  ERR_FAILED_TO_TRANSFER_STX = 3202,
  ERR_FAILED_TO_TRANSFER_FT = 3203,
  ERR_FAILED_TO_TRANSFER_NFT = 3204,
}

export class SDE009Safe {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  };

  setWhitelisted(sender: Account, assetContract: string, whitelisted: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde009-safe', 'set-whitelist', [assetContract, whitelisted], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  };
  
  depositStx(sender: Account, amount: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde009-safe', 'deposit-stx', [amount], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }
  
  getBalance(sender: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde009-safe', 'get-balance', [], sender.address),
    ]);
  
    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  isWhitelisted(sender: Account, assetContract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde009-safe', 'is-whitelisted', [assetContract], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

};