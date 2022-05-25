import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from '../utils/helpers.ts';
import {
  BOOTSTRAPS,
  EXTENSIONS,
  GOVERNANCE,
  PROPOSALS,
} from '../utils/contract-addresses.ts';

enum DELEGATE_GOVERNANCE_CODES {
  ERR_UNAUTHORIZED = 2400,
  ERR_NOT_TOKEN_OWNER = 2401,
  ERR_NOT_ENOUGH_TOKENS = 2403,
  ERR_INVALID_WEIGHT = 2404,
  ERR_MUST_REVOKE_CURRENT_DELEGATION = 2405,
  ERR_NO_DELEGATION_TO_REVOKE = 2406,
};

enum DELEGATE_VOTING_CODES {
  ERR_UNAUTHORIZED = 2500,
  ERR_NOT_GOVERNANCE_TOKEN = 2501,
  ERR_PROPOSAL_ALREADY_EXECUTED = 2502,
  ERR_PROPOSAL_ALREADY_EXISTS = 2503,
  ERR_UNKNOWN_PROPOSAL = 2504,
  ERR_PROPOSAL_ALREADY_ACTIVE = 2505,
  ERR_PROPOSAL_ALREADY_CONCLUDED = 2506,
  ERR_PROPOSAL_INACTIVE = 2507,
  ERR_PROPOSAL_NOT_CONCLUDED = 2508,
  ERR_NO_VOTES_TO_RETURN = 2509,
  ERR_QUORUM_NOT_MET = 2510,
  ERR_END_BLOCK_HEIGHT_NOT_REACHED = 2511,
  ERR_DISABLED = 2512,
  ERR_INSUFFICIENT_WEIGHT = 2513,
  ERR_ALREADY_VOTED = 2514,
  ERR_UNKNOWN_PARAMETER = 2515,
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
      'sde-governance-token-with-delegation', 'delegate',
      [types.principal(delegatee), types.principal(delegator)],
      address
    ),
  getVotingWeight: (delegatee: any) => call('sde-governance-token-with-delegation', 'get-voting-weight', [types.principal(delegatee)], address),
  getBalance: (who: any) => call('sde-governance-token-with-delegation', 'get-balance', [types.principal(who)], address),
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
  getCurrentVotes: (proposal: any, voter: any, governanceContract: any) =>
    call(
      'sde-proposal-voting-with-delegation',
      'get-current-total-votes',
      [
        types.principal(proposal),
        types.principal(voter),
        types.principal(governanceContract)
      ],
      address
    ),
  getProposalData: (proposal: any) =>
    call(
      'sde-proposal-voting-with-delegation',
      'get-proposal-data',
      [
        types.principal(proposal),
      ],
      address
    ),
  conclude: (proposal: any) =>
    call('sde-proposal-voting-with-delegation', 'conclude', [types.principal(proposal)], address),
});

Clarinet.test({
  name: '`governance token delegation` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init } = fetchApi(accounts.get('deployer')!);
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    assertEquals(receipts[0].events.length, 9);
  },
});

Clarinet.test({
  name: '`governance token delegation` - submit a proposal with invalid start block height',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, propose } = fetchApi(accounts.get('deployer')!);
    const invalidStartHeight = 144;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, invalidStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectErr().expectUint(DELEGATE_SUBMISSION_CODES.ERR_PROPOSAL_MINIMUM_START_DELAY);
  },
});

Clarinet.test({
  name: '`governance token delegation` - submit a proposal with insufficient voting weight',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, propose } = fetchApi(accounts.get('deployer')!);
    const validStartHeight = 145;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectErr().expectUint(DELEGATE_SUBMISSION_CODES.ERR_INSUFFICIENT_WEIGHT);
  },
});

Clarinet.test({
  name: '`governance token delegation` - cancel a proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate } = fetchApi(accounts.get('deployer')!);
    const { propose } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    // TODO: write tests
  },
});

Clarinet.test({
  name: '`governance token delegation` - submit a successful proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate, getVotingWeight } = fetchApi(accounts.get('deployer')!);
    const { propose } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      getVotingWeight(delegatee),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectUint(12500);
    receipts[3].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: '`governance token delegation` - vote on proposal with insufficient voting weight',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate, vote } = fetchApi(accounts.get('deployer')!);
    const { propose } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    chain.mineEmptyBlockUntil(validStartHeight);
    let { receipts: voteReceipts } = chain.mineBlock([
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    voteReceipts[0].result.expectErr().expectUint(DELEGATE_VOTING_CODES.ERR_INSUFFICIENT_WEIGHT);
  },
});

Clarinet.test({
  name: '`governance token delegation` - vote on proposal too early/late',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate } = fetchApi(accounts.get('deployer')!);
    const { propose, vote } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    const invalidStartHeight = 144;
    const blockDuration = 1440;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    chain.mineEmptyBlockUntil(invalidStartHeight);
    let { receipts: earlyVoteReceipts } = chain.mineBlock([
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    earlyVoteReceipts[0].result.expectErr().expectUint(DELEGATE_VOTING_CODES.ERR_PROPOSAL_INACTIVE);
    chain.mineEmptyBlockUntil(validStartHeight + blockDuration);
    let { receipts: lateVoteReceipts } = chain.mineBlock([
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    lateVoteReceipts[0].result.expectErr().expectUint(DELEGATE_VOTING_CODES.ERR_PROPOSAL_INACTIVE);
  },
});

Clarinet.test({
  name: '`governance token delegation` - vote on proposal more than once',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate } = fetchApi(accounts.get('deployer')!);
    const { propose, vote } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    chain.mineEmptyBlockUntil(validStartHeight);
    let { receipts: voteReceipts } = chain.mineBlock([
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    voteReceipts[1].result.expectErr().expectUint(DELEGATE_VOTING_CODES.ERR_ALREADY_VOTED);
  },
});

Clarinet.test({
  name: '`governance token delegation` - vote on proposal successfully as delegate',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, delegate } = fetchApi(accounts.get('deployer')!);
    const {
      propose,
      vote,
      getCurrentVotes,
      getProposalData,
    } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    const blockDuration = 1440;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    chain.mineEmptyBlockUntil(validStartHeight);
    let { receipts: voteReceipts } = chain.mineBlock([
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
      getCurrentVotes(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, delegatee, GOVERNANCE.DELEGATE_TOKEN),
      getProposalData(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    voteReceipts[1].result.expectUint(12500);
    assertEquals(voteReceipts[2].result.expectSome().expectTuple(), {
      votesFor: types.uint(12500),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + blockDuration),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: delegatee,
    });
  },
});

Clarinet.test({
  name: '`governance token delegation` - conclude a proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      init,
      delegate,
      getBalance,
      conclude
    } = fetchApi(accounts.get('deployer')!);
    const {
      propose,
      vote,
      getCurrentVotes,
      getProposalData,
    } = fetchApi(accounts.get('wallet_2')!);
    const delegatee = accounts.get('wallet_2')!.address;
    const delegator = accounts.get('deployer')!.address;
    const validStartHeight = 145;
    const blockDuration = 1440;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.DELEGATE_VOTING_DAO),
      delegate(delegatee, delegator),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, validStartHeight, GOVERNANCE.DELEGATE_TOKEN),
    ]);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    chain.mineEmptyBlockUntil(validStartHeight);
    let { receipts: voteReceipts } = chain.mineBlock([
      vote(true, PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, GOVERNANCE.DELEGATE_TOKEN),
      getCurrentVotes(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, delegatee, GOVERNANCE.DELEGATE_TOKEN),
      getProposalData(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    voteReceipts[1].result.expectUint(12500);
    assertEquals(voteReceipts[2].result.expectSome().expectTuple(), {
      votesFor: types.uint(12500),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + blockDuration),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: delegatee,
    });
    chain.mineEmptyBlockUntil(validStartHeight + blockDuration);
    let { receipts: concludeReceipts } = chain.mineBlock([
      conclude(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS),
      getProposalData(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS),
      getBalance(accounts.get('wallet_9')!.address),
    ]);
    concludeReceipts[0].result.expectOk().expectBool(true);
    assertEquals(concludeReceipts[1].result.expectSome().expectTuple(), {
      votesFor: types.uint(12500),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + blockDuration),
      concluded: types.bool(true),
      passed: types.bool(true),
      proposer: delegatee,
    });
    concludeReceipts[2].result.expectOk().expectUint(100);
  },
});
