import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-proposal-voting-with-delegation', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  vote: (vote: any, proposal: any, governanceContract: any) =>
    call(
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
      'get-proposal-data',
      [
        types.principal(proposal),
      ],
      address
    ),
  conclude: (proposal: any) =>
    call('conclude', [types.principal(proposal)], address),
});