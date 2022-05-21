import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from '../../utils/helpers.ts';

enum MULTISIG_CODES {
  ERR_UNAUTHORIZED = 3600,
  ERR_NOT_SIGNER = 3601,
  ERR_INVALID = 3602,
  ERR_ALREADY_EXECUTED = 3603,
  ERR_PROPOSAL_NOT_FOUND = 3604,
  ERR_PROPOSAL_ALREADY_EXISTS = 3605,
  ERR_PROPOSAL_ALREADY_EXECUTED = 3606,
};

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-multisig', method, args, address)
};

const fetchApi = ({ address }: Account) => ({
  addSigner: (principal: any) => call('add-signer', [types.principal(principal)], address),
});

Clarinet.test({
  name: '`multisig` - should return unauthorized when any caller but the dao attempts to add a signer',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addSigner } = fetchApi(accounts.get('deployer')!);
    const newSigner = accounts.get('wallet_1')!;
    const { receipts } = chain.mineBlock([
      addSigner(newSigner.address),
    ]);
    receipts[0].result.expectErr().expectUint(MULTISIG_CODES.ERR_UNAUTHORIZED);
  },
});