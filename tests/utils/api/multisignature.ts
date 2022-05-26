import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-multisig', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  addSigner: (principal: any) =>
    call('add-signer', [types.principal(principal)], address),
  propose: (proposal: any) =>
    call('add-proposal', [types.principal(proposal)], address),
  getProposalData: (proposal: any) =>
    call('get-proposal-data', [types.principal(proposal)], address),
  sign: (proposal: any) =>
    call('sign', [types.principal(proposal)], address),
  getSigner: (who: any) =>
    call('get-signer', [types.principal(who)], address),
  getSignalsRequired: () =>
    call('get-signals-required', [], address),
  getSignersCount: () =>
    call('get-signers-count', [], address),
});