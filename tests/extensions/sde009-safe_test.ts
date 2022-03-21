import { 
  Account,
  Clarinet,
  Chain,
  types,
} from '../utils/helpers.ts';
import { ExecutorDao } from '../models/executor-dao-model.ts';
import { SDE006Membership, SDE006_MEMBERSHIP_CODES } from '../models/sde006-membership-model.ts';
import { SDE007ProposalVoting, SDE007_PROPOSAL_VOTING_CODES } from '../models/sde007-proposal-voting-model.ts';
import { SDE008ProposalSubmission, SDE008_PROPOSAL_SUBMISSION_CODES } from '../models/sde008-proposal-submission-model.ts';
import { SDE009Safe, SAFE_CODES } from '../models/sde009-safe-model.ts'; 
import { PROPOSALS, EXTENSIONS, TEST_EXTENSIONS, TEST_PROPOSALS } from '../utils/contract-addresses.ts';


Clarinet.test({
  name: '😢 SDE009Safe - Whitelist Asset',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Safe = new SDE009Safe(chain);
    let data: any = null
    let tokenToWhitelist: string = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC.token'
    
    //Test should ERR Unauthorized because the principal must be the DAO or an Extension
    data = await Safe.setWhitelisted(deployer, types.principal(tokenToWhitelist), types.bool(true))
    data.result.expectErr().expectUint(SAFE_CODES.ERR_UNAUTHORIZED)
  }
});

Clarinet.test({
  name: '😃 SDE009Safe - Deposit STX',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let data: any = null;
    let Safe = new SDE009Safe(chain);
    let amount: number = 10;
    let depositor = accounts.get('wallet_1')!;


    data = await Safe.getBalance(deployer)
    data.result.expectUint(0)
    // 1 Deposit stx in safe
    data = await Safe.depositStx(depositor, types.uint(amount))
    data.result.expectOk().expectBool(true)

    // 2 confirm safe balance has incresed by deposited amount
    data = await Safe.getBalance(deployer)
    data.result.expectUint(10)
  }, 
});

Clarinet.test({
  name: '😃 SDE009Safe - Token whitelisted',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let voter1 = accounts.get('wallet_1')!;
    let voter2 = accounts.get('wallet_2')!;
    let proposedNewMember = accounts.get('wallet_3')!;
    let Dao = new ExecutorDao(chain);
    let Membership = new SDE006Membership(chain);
    let ProposalSubmission = new SDE008ProposalSubmission(chain);
    let ProposalVoting = new SDE007ProposalVoting(chain);
    let Safe = new SDE009Safe(chain);
    let data: any = null;
    let validStartHeight: number = 150;
    let proposalDuration: number = 1440;
    let tokenToWhitelist: string = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC.token';
    let amount: number = 10;

    // 1a. confirm token is not currently whitelisted
    data = await Safe.isWhitelisted(deployer, types.principal(tokenToWhitelist));
    data.result.expectBool(false)
    
    // 2a. initialize the DAO with enabled extensions and set deployer as a member
    data = await Dao.init(deployer);
    data.result.expectOk().expectBool(true);
    
    // 3a. add proposal to whitelist an asset
    data = await ProposalSubmission.propose(deployer, types.principal(TEST_PROPOSALS.sdp009TestWhitelistAsset), types.uint(validStartHeight), types.principal(EXTENSIONS.sde006Membership));
    data.result.expectOk().expectBool(true);

    // 3b. verify new proposal is added to the proposal queue
    data = await ProposalVoting.getProposalData(deployer, types.principal(TEST_PROPOSALS.sdp009TestWhitelistAsset));
    data.result.expectSome().expectTuple({
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
    let vote1 = await ProposalVoting.vote(voter1, types.bool(true), types.principal(TEST_PROPOSALS.sdp009TestWhitelistAsset), types.principal(EXTENSIONS.sde006Membership));
    let vote2 = await ProposalVoting.vote(voter2, types.bool(true), types.principal(TEST_PROPOSALS.sdp009TestWhitelistAsset), types.principal(EXTENSIONS.sde006Membership));
    vote1.result.expectOk().expectBool(true);
    vote2.result.expectOk().expectBool(true);

    // 4b. conclude approval vote for the proposal
    chain.mineEmptyBlockUntil(validStartHeight + proposalDuration); // mine empty blocks to get to the end block height
    data = await ProposalVoting.conclude(deployer, types.principal(TEST_PROPOSALS.sdp009TestWhitelistAsset));
    data.result.expectOk().expectBool(true);

    // 5a. verify the proposal data is updated
    data = await ProposalVoting.getProposalData(deployer, types.principal(TEST_PROPOSALS.sdp009TestWhitelistAsset));
    data.result.expectSome().expectTuple({
      votesFor: types.uint(2),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(validStartHeight + proposalDuration),
      concluded: types.bool(true),
      passed: types.bool(true),
      proposer: types.principal(deployer.address),
    });

    // 6a. confirm that token is now whitelisted  
    data = await Safe.isWhitelisted(deployer, types.principal(tokenToWhitelist));
    data.result.expectBool(true)

  },
});

