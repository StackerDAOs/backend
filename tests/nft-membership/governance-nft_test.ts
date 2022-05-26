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
  NFT_VOTING_CODES,
  NFT_SUBMISSION_CODES,
} from '../utils/common.ts';
import { fetchApi as executorApi } from '../utils/api/executor-dao.ts';
import { fetchApi as proposalApi } from '../utils/api/proposal-submission-with-nft.ts';
import { fetchApi as voteApi } from '../utils/api/proposal-voting-with-nft.ts';
import { fetchApi as nftApi } from '../utils/api/nft-membership.ts';

Clarinet.test({
  name: '`nft governance` - initialize the dao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init } = executorApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { mint } = nftApi(accounts.get('deployer')!);
    const { propose } = proposalApi(accounts.get('deployer')!);
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
