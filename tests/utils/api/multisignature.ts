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
});