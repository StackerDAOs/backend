import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/helpers.ts';

import { BOOTSTRAPS } from './utils/contract-addresses.ts';

enum MULTISIG_CODES {
  ERR_UNAUTHORIZED = 3600,
  ERR_NOT_SIGNER = 3601,
  ERR_INVALID = 3602,
  ERR_ALREADY_EXECUTED = 3603,
  ERR_PROPOSAL_NOT_FOUND = 3604,
  ERR_PROPOSAL_ALREADY_EXISTS = 3605,
  ERR_PROPOSAL_ALREADY_EXECUTED = 3606,
};

const call = (contract: string, method: string, args: any[], address: string) => {
  return Tx.contractCall(contract, method, args, address)
};

const fetchApi = ({ address }: Account) => ({
  init: (proposal: any) =>
    call('executor-dao', 'init', [types.principal(proposal)], address),
  addSigner: (principal: any) =>
    call('sde-multisig', 'add-signer', [types.principal(principal)], address),
});

Clarinet.test({
  name: '`multisig` - unauthorized add a signer',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addSigner } = fetchApi(accounts.get('deployer')!);
    const newSigner = accounts.get('wallet_1')!;
    const { receipts } = chain.mineBlock([
      addSigner(newSigner.address),
    ]);
    receipts[0].result.expectErr().expectUint(MULTISIG_CODES.ERR_UNAUTHORIZED);
  },
});

Clarinet.test({
  name: '`multisig` - submit an unauthorized proposal',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
    } = fetchApi(accounts.get('deployer')!);
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
    } = fetchApi(accounts.get('deployer')!);
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
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!.address;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
    ]);
    receipts[0].result.expectOk().expectBool(true);

    const { receipts: submissionReceipts } = chain.mineBlock([
      // TODO: Submission code
    ]);
  },
});