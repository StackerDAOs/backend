import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-vault', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  deposit: (amount: any) =>
    call('deposit', [types.uint(amount)], address),
  depositFt: (fungibleToken: any, amount: any) =>
    call('deposit-ft', [types.principal(fungibleToken), types.uint(amount)], address),
  depositNft: (nonFungibleToken: any, amount: any) =>
    call('deposit-nft', [types.principal(nonFungibleToken), types.uint(amount)], address),
  transfer: (amount: any, recipient: any) =>
    call('transfer', [types.uint(amount), types.principal(recipient)], address),
  transferFt: (fungibleToken: any, amount: any, recipient: any) =>
    call('transfer-ft', [types.principal(fungibleToken), types.uint(amount), types.principal(recipient)], address),
  transferNft: (nonFungibleToken: any, amount: any, recipient: any) =>
    call('transfer-nft', [types.principal(nonFungibleToken), types.uint(amount), types.principal(recipient)], address),
  getBalance: () =>
    call('get-balance', [], address),
  getBalanceOf: (token: any) =>
    call('get-balance-of', [types.principal(token)], address),
  isWhitelisted: (token: any) =>
    call('is-whitelisted', [types.principal(token)], address),
});