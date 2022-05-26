import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-proposal-submission-with-nft', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  propose: (proposal: any, tokenId: any, startBlock: any) => 
    call(
      'propose', 
      [
        types.principal(proposal),
        types.uint(tokenId),
        types.uint(startBlock),
      ],
      address
    ),
});