import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/deps.ts';
import { BOOTSTRAPS, EXTENSIONS, EXECUTOR_DAO_CODES } from './utils/common.ts';
import { fetchApi } from './utils/api/executor-dao.ts';

Clarinet.test({
  name: '`executor-dao` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, isExtension } = fetchApi(accounts.get('deployer')!);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MULTISIG_DAO),
      isExtension(EXTENSIONS.VAULT),
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
      init(BOOTSTRAPS.MULTISIG_DAO),
      init(BOOTSTRAPS.MULTISIG_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);
  },
});
