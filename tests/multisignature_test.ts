import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/deps.ts';
import { BOOTSTRAPS, EXTENSIONS, MULTISIG_CODES } from './utils/common.ts';
import { fetchApi as executorApi } from './utils/api/executor-dao.ts';
import { fetchApi as multisigApi } from './utils/api/multisignature.ts';

Clarinet.test({
  name: '`multisig` - add a signer',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addSigner } = multisigApi(accounts.get('deployer')!);
    const newSigner = accounts.get('wallet_1')!;
    const { receipts } = chain.mineBlock([
      addSigner(newSigner.address),
    ]);
    receipts[0].result.expectErr().expectUint(MULTISIG_CODES.ERR_UNAUTHORIZED);

    // TODO: add proposal to add signer
    const { receipts: proposalReceipts } = chain.mineBlock([
      // propose(PROPOSALS.ADD_SIGNER, [newSigner.address]),
    ]);
  },
});

Clarinet.test({
  name: '`multisig` - submit an unauthorized proposal',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
    } = executorApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!.address;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
    ]);
    receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: '`multisig` - vote on an unauthorized proposal',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
    } = executorApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!.address;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
    ]);
    receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: '`multisig` - execute an unauthorized proposal',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
      isExtension,
    } = executorApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!.address;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
    ]);
    receipts[0].result.expectOk().expectBool(true);

    const { receipts: submissionReceipts } = chain.mineBlock([
      isExtension(EXTENSIONS.MULTISIG),
    ]);

    console.log(submissionReceipts);
  },
});