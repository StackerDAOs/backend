import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-proposal-voting-with-nft', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  vote: (vote: any, proposal: any, nftContract: any) =>
    call(
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
      'get-proposal-data',
      [
        types.principal(proposal),
      ],
      address
    ),
});