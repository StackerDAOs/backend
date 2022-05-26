import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('nft-membership', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  mint: (recipient: any) =>
    call('mint', [types.principal(recipient)], address),
  getOwner: (tokenId: any) =>
    call('get-owner', [types.uint(tokenId)], address),
});