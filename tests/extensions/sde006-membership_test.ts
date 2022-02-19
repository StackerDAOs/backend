
import { 
  Clarinet, 
  Tx, 
  Chain, 
  Account, 
  types, 
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDao } from '../models/executor-dao-model.ts';
import { SDE006Membership, MEMBERSHIP_CODES } from '../models/sde006-membership-model.ts';
import { SDE008MembershipProposalSubmission, MEMBERSHIP_PROPOSAL_SUBMISSION_CODES } from '../models/sde008-membership-proposal-submission-model.ts';
import { SDE007MembershipProposalVoting, MEMBERSHIP_PROPOSAL_VOTING_CODES } from '../models/sde007-membership-proposal-voting-model.ts';
import { EXTENSIONS, PROPOSALS } from '../models/utils/contract-addresses.ts';

Clarinet.test({
  name: '😢 SDE006Membership',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Dao = new ExecutorDao(chain);
    let Membership = new SDE006Membership(chain);
    let ProposalSubmission = new SDE008MembershipProposalSubmission(chain);
    let result: any = null;
    let invalidStartHeight: number = 50; 
    
    // 1a. should return false when you are not a member
    result = await Membership.isMember(deployer, types.principal(deployer.address));
    result.expectBool(false);

    // 1b. should return error if trying to set member without going through approval process
    result = await Membership.setMember(deployer, types.principal(deployer.address), types.bool(true));
    result.expectErr().expectUint(MEMBERSHIP_CODES.ERR_UNAUTHORIZED);

    // 1c. should not allow a non-member to add a proposal
    result = await ProposalSubmission.propose(deployer, types.principal(PROPOSALS.sdp006AddMember), types.uint(150), types.principal(EXTENSIONS.sde006Membership));
    result.expectErr().expectUint(MEMBERSHIP_PROPOSAL_VOTING_CODES.ERR_UNAUTHORIZED);

    // 2a. initialize the DAO with enabled extensions and set deployer as a member
    result = await Dao.initialize(deployer);
    result.expectOk().expectBool(true);

    // 3a. should not allow a startHeight less than the minimum 
    result = await ProposalSubmission.propose(deployer, types.principal(PROPOSALS.sdp006AddMember), types.uint(invalidStartHeight), types.principal(EXTENSIONS.sde006Membership));
    result.expectErr().expectUint(MEMBERSHIP_PROPOSAL_SUBMISSION_CODES.ERR_PROPOSAL_MINIMUM_START_DELAY);

    // 3b. should not allow a startHeight greater than the maximum 
    invalidStartHeight = 1100;
    result = await ProposalSubmission.propose(deployer, types.principal(PROPOSALS.sdp006AddMember), types.uint(invalidStartHeight), types.principal(EXTENSIONS.sde006Membership));
    result.expectErr().expectUint(MEMBERSHIP_PROPOSAL_SUBMISSION_CODES.ERR_PROPOSAL_MAXIMUM_START_DELAY);
  },
});

Clarinet.test({
  name: '😃 SDE006Membership',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let voter1 = accounts.get('wallet_1')!;
    let voter2 = accounts.get('wallet_2')!;
    let proposedNewMember = accounts.get('wallet_3')!;
    let Dao = new ExecutorDao(chain);
    let Membership = new SDE006Membership(chain);
    let ProposalSubmission = new SDE008MembershipProposalSubmission(chain);
    let ProposalVoting = new SDE007MembershipProposalVoting(chain);
    let result: any = null;
    let validStartHeight: number = 150;
    let proposalDuration: number = 1440;

    // 1a. initialize the DAO with enabled extensions and set deployer as a member
    result = await Dao.initialize(deployer);
    result.expectOk().expectBool(true);
    
    // 2a. should return false when you are not a member
    result = await Membership.isMember(deployer, types.principal(proposedNewMember.address));
    result.expectBool(false);

    // 3a. add proposal to add a member to the DAO membership contract
    result = await ProposalSubmission.propose(deployer, types.principal(PROPOSALS.sdp006AddMember), types.uint(validStartHeight), types.principal(EXTENSIONS.sde006Membership));
    result.expectOk().expectBool(true);

    // 3b. verify new proposal is added to the proposal queue
    result = await ProposalVoting.getProposalData(deployer, types.principal(PROPOSALS.sdp006AddMember));
    result.expectSome().expectTuple({
      votesFor: types.uint(0),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: types.principal(deployer.address),
    });

    // 4a. simulate approval votes for proposal
    chain.mineEmptyBlockUntil(validStartHeight); // mine empty blocks to get to the start height
    let vote1 = await ProposalVoting.vote(voter1, types.bool(true), types.principal(PROPOSALS.sdp006AddMember), types.principal(EXTENSIONS.sde006Membership));
    let vote2 = await ProposalVoting.vote(voter2, types.bool(true), types.principal(PROPOSALS.sdp006AddMember), types.principal(EXTENSIONS.sde006Membership));
    vote1.expectOk().expectBool(true);
    vote2.expectOk().expectBool(true);

    // 4b. conclude approval vote for the proposal
    chain.mineEmptyBlockUntil(validStartHeight + proposalDuration); // mine empty blocks to get to the end block height
    result = await ProposalVoting.conclude(deployer, types.principal(PROPOSALS.sdp006AddMember));
    result.expectOk().expectBool(true);

    // 5a. verify the proposal data is updated
    result = await ProposalVoting.getProposalData(deployer, types.principal(PROPOSALS.sdp006AddMember));
    result.expectSome().expectTuple({
      votesFor: types.uint(2),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(true),
      passed: types.bool(true),
      proposer: types.principal(deployer.address),
    });

    // 5b. verify that the proposed member is now a member
    result = await Membership.isMember(deployer, types.principal(proposedNewMember.address));
    result.expectBool(true);
  },
});