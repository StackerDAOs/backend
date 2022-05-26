import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-governance-token-with-delegation', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  delegate: (delegatee: any, delegator: any) =>
    call('delegate', [types.principal(delegatee), types.principal(delegator)], address),
  getVotingWeight: (delegatee: any) =>
    call('get-voting-weight', [types.principal(delegatee)], address),
  getBalance: (who: any) =>
    call('get-balance', [types.principal(who)], address),
});