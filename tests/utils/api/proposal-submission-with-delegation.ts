import { 
  Account,
  Tx,
  types,
} from '../deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('sde-proposal-submission-with-delegation', method, args, address)
};

export const fetchApi = ({ address }: Account) => ({
  propose: (proposal: any, startBlock: any, governanceContract: any) => 
    call(
      'propose', 
      [
        types.principal(proposal),
        types.uint(startBlock),
        types.principal(governanceContract),
      ],
      address
    ),
});