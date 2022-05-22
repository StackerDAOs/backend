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

enum NFT_VOTING_CODES {
  ERR_UNAUTHORIZED = 3400,
  ERR_NOT_NFT_OWNER = 3401,
  ERR_PROPOSAL_ALREADY_EXECUTED = 3402,
  ERR_PROPOSAL_ALREADY_EXISTS = 3403,
  ERR_UNKNOWN_PROPOSAL = 3404,
  ERR_PROPOSAL_ALREADY_STARTED = 3405,
  ERR_PROPOSAL_ALREADY_CONCLUDED = 3406,
  ERR_PROPOSAL_INACTIVE = 3407,
  ERR_PROPOSAL_NOT_CONCLUDED = 3408,
  ERR_NO_VOTES_TO_RETURN = 3409,
  ERR_ALREADY_VOTED = 3410,
  ERR_END_BLOCK_HEIGHT_NOT_REACHED = 3411,
  ERR_DISABLED = 3412,
};

enum NFT_SUBMISSION_CODES {
  ERR_UNAUTHORIZED = 3500,
  ERR_NOT_NFT_OWNER = 3501,
  ERR_UNKNOWN_PARAMETER = 3502,
  ERR_PROPOSAL_MINIMUM_START_DELAY = 3503,
  ERR_PROPOSAL_MAXIMUM_START_DELAY = 3504,
};



const call = (contract: string, method: string, args: any[], address: string) => {
  return Tx.contractCall(contract, method, args, address)
};

const fetchApi = ({ address }: Account) => ({
  init: (proposal: any) =>
    call('executor-dao', 'init', [types.principal(proposal)], address),
  mint: (recipient: any) =>
    call('nft-membership', 'mint', [types.principal(recipient)], address),
  propose: (proposal: any, tokenId: any, startBlock: any) => 
    call(
      'sde-proposal-submission-with-nft', 
      'propose', 
      [
        types.principal(proposal),
        types.uint(tokenId),
        types.uint(startBlock),
      ],
      address
    ),
  vote: (vote: any, proposal: any, nftContract: any) =>
    call(
      'sde-proposal-voting-with-nft',
      'vote',
      [
        types.bool(vote),
        types.principal(proposal),
        types.principal(nftContract),
      ],
      address,
    ),
  getCurrentVotes: (proposal: any, voter: any, nftContract: any) =>
    call(
      'sde-proposal-voting-with-nft',
      'get-current-total-votes',
      [
        types.principal(proposal),
        types.principal(voter),
        types.principal(nftContract)
      ],
      address
    ),
  getProposalData: (proposal: any) =>
    call(
      'sde-proposal-voting-with-nft',
      'get-proposal-data',
      [
        types.principal(proposal),
      ],
      address
    ),
});

Clarinet.test({
  name: '`nft governance` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init } = fetchApi(accounts.get('deployer')!);
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.NFT_DAO),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    assertEquals(receipts[0].events.length, 6);
  },
});

Clarinet.test({
  name: '`nft governance` - submit a proposal with invalid start block height',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, mint, propose } = fetchApi(accounts.get('deployer')!);
    const invalidStartHeight = 144;
    let { receipts: mintReceipts } = chain.mineBlock([
      mint(accounts.get('deployer')!.address),
    ]);
    mintReceipts[0].result.expectOk().expectUint(1);
    const tokenId = 1;
    let { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.NFT_DAO),
      propose(PROPOSALS.SDP_TRANSFER_FUNGIBLE_TOKENS, tokenId, invalidStartHeight),
    ]);
    receipts[1].result.expectErr().expectUint(NFT_SUBMISSION_CODES.ERR_PROPOSAL_MINIMUM_START_DELAY);
  },
});
