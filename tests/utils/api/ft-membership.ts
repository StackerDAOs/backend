import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('ft-membership', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  mint: (amount: any, recipient: any) =>
    call('mint', [types.uint(amount), types.principal(recipient)], address),
});