import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/deps.ts';
import { BOOTSTRAPS, EXTENSIONS, PROPOSALS, MULTISIG_CODES } from './utils/common.ts';
import { fetchApi as executorApi } from './utils/api/executor-dao.ts';
import { fetchApi as multisigApi } from './utils/api/multisignature.ts';

Clarinet.test({
  name: '`multisig` - add a signer',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { init, isExtension } = await executorApi(accounts.get('deployer')!);
    const {
      addSigner,
      getSigner,
      propose,
      getProposalData,
      getSignalsRequired,
      getSignersCount,
    } = multisigApi(accounts.get('deployer')!);
    const newSigner = accounts.get('wallet_3')!;
    const { receipts } = chain.mineBlock([
      addSigner(newSigner.address),
      getSigner(newSigner.address),
    ]);
    receipts[0].result.expectErr().expectUint(MULTISIG_CODES.ERR_UNAUTHORIZED);
    receipts[1].result.expectNone();

    // Begin proposal process for adding a signer
    const { receipts: proposalReceipts } = chain.mineBlock([
      init(BOOTSTRAPS.MULTISIG_DAO),
      isExtension(EXTENSIONS.MULTISIG),
      propose(PROPOSALS.SDP_ADD_SIGNER),
      getProposalData(PROPOSALS.SDP_ADD_SIGNER),
    ]);
    proposalReceipts[0].result.expectOk().expectBool(true);
    proposalReceipts[1].result.expectBool(true);
    proposalReceipts[2].result.expectOk().expectBool(true);
    assertEquals(proposalReceipts[3].result.expectSome().expectTuple(), {
      concluded: types.bool(false),
      proposer: accounts.get('deployer')!.address,
    })

    // Another signer signs off on the proposal and executes automatically
    const signer = accounts.get('wallet_1')!
    const { sign } = multisigApi(signer);
    const { receipts: signerReceipts } = chain.mineBlock([
      sign(PROPOSALS.SDP_ADD_SIGNER),
      getProposalData(PROPOSALS.SDP_ADD_SIGNER),
      getSigner(newSigner.address),
      getSignalsRequired(),
      getSignersCount(),
    ]);
    signerReceipts[0].result.expectOk().expectUint(2);
    assertEquals(signerReceipts[1].result.expectSome().expectTuple(), {
      concluded: types.bool(true),
      proposer: accounts.get('deployer')!.address,
    })
    signerReceipts[2].result.expectSome().expectPrincipal(newSigner.address);
    signerReceipts[3].result.expectUint(3);
    signerReceipts[4].result.expectUint(4);
  },
});

Clarinet.test({
  name: '`multisig` - unauthorized proposal failure',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const { init, isExtension } = executorApi(accounts.get('deployer')!);
    const { propose, getProposalData } = multisigApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!.address;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MULTISIG_DAO),
      propose(PROPOSALS.SDP_UNAUTHORIZED_TRANSFER_STX),
      getProposalData(PROPOSALS.SDP_UNAUTHORIZED_TRANSFER_STX),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectOk().expectBool(true);
    assertEquals(receipts[2].result.expectSome().expectTuple(), {
      concluded: types.bool(false),
      proposer: accounts.get('deployer')!.address,
    })

    // Another signer signs off on the proposal and executes automatically
    const signer = accounts.get('wallet_1')!
    const { sign } = multisigApi(signer);
    const { receipts: signerReceipts } = chain.mineBlock([
      sign(PROPOSALS.SDP_ADD_SIGNER),
      sign(PROPOSALS.SDP_UNAUTHORIZED_TRANSFER_STX),
    ]);
    signerReceipts[0].result.expectErr().expectUint(MULTISIG_CODES.ERR_PROPOSAL_NOT_FOUND);
    signerReceipts[1].result.expectErr().expectUint(4); // returns (err u4) because the sender principal in proposal is not authorized
  },
});