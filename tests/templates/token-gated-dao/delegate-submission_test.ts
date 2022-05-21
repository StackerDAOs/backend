import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from '../../utils/helpers.ts';
import {
  BOOTSTRAPS,
  EXTENSIONS,
  GOVERNANCE,
  PROPOSALS,
} from '../../utils/contract-addresses.ts';

enum DELEGATE_GOVERNANCE_CODES {
  ERR_UNAUTHORIZED = 2400,
  ERR_NOT_TOKEN_OWNER = 2401,
  ERR_NOT_ENOUGH_TOKENS = 2403,
  ERR_INVALID_WEIGHT = 2404,
  ERR_MUST_REVOKE_CURRENT_DELEGATION = 2405,
  ERR_NO_DELEGATION_TO_REVOKE = 2406,
};

enum DELEGATE_SUBMISSION_CODES {
  ERR_UNAUTHORIZED = 2600,
  ERR_NOT_GOVERNANCE_TOKEN = 2601,
  ERR_INSUFFICIENT_WEIGHT = 2602,
  ERR_UNKNOWN_PARAMETER = 2603,
  ERR_PROPOSAL_MINIMUM_START_DELAY = 2604,
  ERR_PROPOSAL_MAXIMUM_START_DELAY = 2605,
};

const call = (contract: string, method: string, args: any[], address: string) => {
  return Tx.contractCall(contract, method, args, address)
};

const fetchApi = ({ address }: Account) => ({
  init: (proposal: any) =>
    call('executor-dao', 'init', [types.principal(proposal)], address),
  delegate: (delegatee: any, delegator: any) =>
    call(
      'sde-governance-token-with-delegation', 'delegate-votes',
      [types.principal(delegatee), types.principal(delegator)],
      address
    ),
  getVotingWeight: (delegatee: any) => call('sde-governance-token-with-delegation', 'get-voting-weight', [types.principal(delegatee)], address),
  propose: (proposal: any, startBlock: any, governanceContract: any) => 
    call(
      'sde-proposal-submission-with-delegation', 
      'propose', 
      [
        types.principal(proposal),
        types.uint(startBlock),
        types.principal(governanceContract),
      ],
      address
    ),
  vote: (vote: any, proposal: any, governanceContract: any) =>
    call(
      'sde-proposal-voting-with-delegation',
      'vote',
      [
        types.bool(vote),
        types.principal(proposal),
        types.principal(governanceContract),
      ],
      address,
    ),
});

Clarinet.test({
  name: '`delegate voting` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init } = fetchApi(accounts.get('deployer')!);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    assertEquals(receipts[0].events.length, 9);
  },
});

Clarinet.test({
  name: '`delegate voting` - submit a proposal with invalid start block height',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, propose } = fetchApi(accounts.get('deployer')!);
    const invalidStartHeight = 144;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, invalidStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);

    receipts[1].result.expectErr().expectUint(DELEGATE_SUBMISSION_CODES.ERR_PROPOSAL_MINIMUM_START_DELAY);
  },
});

Clarinet.test({
  name: '`delegate voting` - submit a proposal with insufficient voting weight',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, propose } = fetchApi(accounts.get('deployer')!);
    const validStartHeight = 150;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);

    receipts[1].result.expectErr().expectUint(DELEGATE_SUBMISSION_CODES.ERR_INSUFFICIENT_WEIGHT);
  },
});

Clarinet.test({
  name: '`delegate voting` - submit a successful proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate, getVotingWeight } = fetchApi(accounts.get('deployer')!);
    const { propose } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 150;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      getVotingWeight(delegatee),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectUint(2500);
    receipts[3].result.expectOk().expectBool(true);
  },
});