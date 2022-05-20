import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/helpers.ts';
import { EXTENSIONS, PROPOSALS } from './utils/contract-addresses.ts';

enum EXECUTOR_DAO_CODES {
  ERR_UNAUTHORIZED = 1000,
  ERR_ALREADY_EXECUTED = 1001,
  ERR_INVALID_EXTENSION = 1002,
}

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('executor-dao', method, args, address)
};

const fetchApi = ({ address }: Account) => ({
  init: (proposal: any) => call('init', [types.principal(proposal)], address),
  isExtension: (extension: any) => call('is-extension', [types.principal(extension)], address),
  setExtension: (extension: any, enabled: any) => call('set-extension', [types.principal(extension), types.bool(enabled)], address),
  execute: (proposal: any) => call('execute', [types.principal(proposal)], address),
  executedAt: (proposal: any) => call('executed-at', [types.principal(proposal)], address),
});

Clarinet.test({
  name: '`executor-dao` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, isExtension } = fetchApi(accounts.get('deployer')!);
    const { receipts } = chain.mineBlock([
      init(PROPOSALS.sdp000Bootstrap),
      isExtension(EXTENSIONS.sde009Safe),
    ])
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectBool(true);
  },
});

Clarinet.test({
  name: '`executor-dao` - should return unauthorized when trying to call init twice',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init } = fetchApi(accounts.get('deployer')!);
    const { receipts } = chain.mineBlock([
      init(PROPOSALS.sdp000Bootstrap),
      init(PROPOSALS.sdp000Bootstrap),
    ])
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);
  },
});
