import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from '../utils/deps.ts';
import {
  BOOTSTRAPS,
  EXTENSIONS,
  GOVERNANCE,
  PROPOSALS,
  DELEGATE_GOVERNANCE_CODES,
  DELEGATE_VOTING_CODES,
  DELEGATE_SUBMISSION_CODES,
} from '../utils/common.ts';
import { fetchApi as executorApi } from '../utils/api/executor-dao.ts';
import { fetchApi as governanceTokenApi } from '../utils/api/governance-token-with-delegation.ts';
import { fetchApi as proposalApi } from '../utils/api/proposal-submission-with-delegation.ts';
import { fetchApi as voteApi } from '../utils/api/proposal-voting-with-delegation.ts';

Clarinet.test({
  name: '`governance token delegation` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init } = executorApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate } = governanceTokenApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate, getVotingWeight } = governanceTokenApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate } = governanceTokenApi(accounts.get('deployer')!);
    const { vote } = voteApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate } = governanceTokenApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
    const { vote } = voteApi(accounts.get('wallet_2')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate } = governanceTokenApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
    const { vote } = voteApi(accounts.get('wallet_2')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate } = governanceTokenApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
    const { vote, getCurrentVotes, getProposalData } = voteApi(accounts.get('wallet_2')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { delegate } = governanceTokenApi(accounts.get('deployer')!);
    const { getBalance } = governanceTokenApi(accounts.get('deployer')!);
    const { conclude } = voteApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('wallet_2')!);
    const { vote, getCurrentVotes, getProposalData } = voteApi(accounts.get('wallet_2')!);
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
