import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/helpers.ts';

import {
  BOOTSTRAPS,
  EXTENSIONS,
  FUNGIBLE_TOKENS,
  NON_FUNGIBLE_TOKENS,
} from './utils/contract-addresses.ts';

enum VAULT_CODES {
  ERR_UNAUTHORIZED = 3200,
  ERR_ASSET_NOT_WHITELISTED = 3201,
  ERR_FAILED_TO_TRANSFER_STX = 3202,
  ERR_FAILED_TO_TRANSFER_FT = 3203,
  ERR_FAILED_TO_TRANSFER_NFT = 3204,
};

const call = (contract: string, method: string, args: any[], address: string) => {
  return Tx.contractCall(contract, method, args, address)
};

const fetchApi = ({ address }: Account) => ({
  init: (proposal: any) =>
    call('executor-dao', 'init', [types.principal(proposal)], address),
  mint: (amount: any, recipient: any) =>
    call('ft-membership', 'mint', [types.uint(amount), types.principal(recipient)], address),
  mintNft: (recipient: any) =>
    call('nft-membership', 'mint', [types.principal(recipient)], address),
  deposit: (amount: any) =>
    call('sde-vault', 'deposit', [types.uint(amount)], address),
  depositFt: (fungibleToken: any, amount: any) =>
    call('sde-vault', 'deposit-ft', [types.principal(fungibleToken), types.uint(amount)], address),
  depositNft: (nonFungibleToken: any, amount: any) =>
    call('sde-vault', 'deposit-nft', [types.principal(nonFungibleToken), types.uint(amount)], address),
  transfer: (amount: any, recipient: any) =>
    call('sde-vault', 'transfer', [types.uint(amount), types.principal(recipient)], address),
  transferFt: (fungibleToken: any, amount: any, recipient: any) =>
    call('sde-vault', 'transfer-ft', [types.principal(fungibleToken), types.uint(amount), types.principal(recipient)], address),
  transferNft: (nonFungibleToken: any, amount: any, recipient: any) =>
    call('sde-vault', 'transfer-nft', [types.principal(nonFungibleToken), types.uint(amount), types.principal(recipient)], address),
  getBalance: () => call('sde-vault', 'get-balance', [], address),
  getBalanceOf: (token: any) =>
    call('sde-vault', 'get-balance-of', [types.principal(token)], address),
  getOwner: (tokenId: any) =>
    call('nft-membership', 'get-owner', [types.uint(tokenId)], address),
  isWhitelisted: (token: any) =>
    call('sde-vault', 'is-whitelisted', [types.principal(token)], address),
});

Clarinet.test({
  name: '`vault` - deposit STX',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const { deposit, getBalance } = fetchApi(accounts.get('deployer')!);
    const { receipts } = chain.mineBlock([
      getBalance(),
      deposit(150),
      getBalance(),
    ]);
    receipts[0].result.expectUint(0);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectUint(150);
  },
});

Clarinet.test({
  name: '`vault` - deposit fungible tokens',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
      mint,
      depositFt,
      getBalanceOf,
      isWhitelisted,
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
      isWhitelisted(FUNGIBLE_TOKENS.FT_MEMBERSHIP),
      mint(150, recipient.address),
      getBalanceOf(FUNGIBLE_TOKENS.FT_MEMBERSHIP),
      depositFt(FUNGIBLE_TOKENS.FT_MEMBERSHIP, 150),
      getBalanceOf(FUNGIBLE_TOKENS.FT_MEMBERSHIP),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    receipts[3].result.expectOk().expectUint(0);
    receipts[4].result.expectOk().expectBool(true);
    receipts[5].result.expectOk().expectUint(150);
  },
});

Clarinet.test({
  name: '`vault` - deposit unwhitelisted fungible tokens',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
      mint,
      depositFt,
      getBalanceOf,
      isWhitelisted,
    } = fetchApi(accounts.get('deployer')!);
    const { receipts } = chain.mineBlock([
      getBalanceOf(FUNGIBLE_TOKENS.FT_MEMBERSHIP),
      depositFt(FUNGIBLE_TOKENS.FT_MEMBERSHIP, 150),
    ]);
    receipts[0].result.expectOk().expectUint(0);
    receipts[1].result.expectErr().expectUint(VAULT_CODES.ERR_ASSET_NOT_WHITELISTED);
  },
});

Clarinet.test({
  name: '`vault` - deposit nfts',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
      isWhitelisted,
      mintNft,
      depositNft,
      getOwner,
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
      isWhitelisted(NON_FUNGIBLE_TOKENS.NFT_MEMBERSHIP),
      mintNft(recipient.address),
      getOwner(1),
      depositNft(NON_FUNGIBLE_TOKENS.NFT_MEMBERSHIP, 1),
      getOwner(1),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectBool(true);
    receipts[2].result.expectOk().expectUint(1);
    receipts[3].result.expectOk().expectSome().expectPrincipal(recipient.address);
    receipts[4].result.expectOk().expectBool(true);
    receipts[5].result.expectOk().expectSome().expectPrincipal(EXTENSIONS.VAULT);
  },
});

Clarinet.test({
  name: '`vault` - deposit unwhitelisted nfts',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      mintNft,
      depositNft,
      getOwner,
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      mintNft(recipient.address),
      getOwner(1),
      depositNft(NON_FUNGIBLE_TOKENS.NFT_MEMBERSHIP, 1),
      getOwner(1),
    ]);
    receipts[0].result.expectOk().expectUint(1);
    receipts[1].result.expectOk().expectSome().expectPrincipal(recipient.address);
    receipts[2].result.expectErr().expectUint(VAULT_CODES.ERR_ASSET_NOT_WHITELISTED);
    receipts[3].result.expectOk().expectSome().expectPrincipal(recipient.address);
  },
});

Clarinet.test({
  name: '`vault` - transfer of STX',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      deposit,
      transfer,
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      deposit(150),
      transfer(150, recipient.address),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectErr().expectUint(VAULT_CODES.ERR_UNAUTHORIZED);
  },
});

Clarinet.test({
  name: '`vault` - transfer of fungible tokens',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
      mint,
      depositFt,
      getBalanceOf,
      transferFt,
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
      mint(150, recipient.address),
      depositFt(FUNGIBLE_TOKENS.FT_MEMBERSHIP, 150),
      getBalanceOf(FUNGIBLE_TOKENS.FT_MEMBERSHIP),
      transferFt(FUNGIBLE_TOKENS.FT_MEMBERSHIP, 150, recipient.address),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectOk().expectBool(true);
    receipts[2].result.expectOk().expectBool(true);
    receipts[3].result.expectOk().expectUint(150);
    receipts[4].result.expectErr().expectUint(VAULT_CODES.ERR_UNAUTHORIZED);
  },
});

Clarinet.test({
  name: '`vault` - transfer of nfts',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const {
      init,
      mintNft,
      depositNft,
      transferNft,
      getOwner,
    } = fetchApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
      mintNft(recipient.address),
      getOwner(1),
      depositNft(NON_FUNGIBLE_TOKENS.NFT_MEMBERSHIP, 1),
      transferNft(NON_FUNGIBLE_TOKENS.NFT_MEMBERSHIP, 1, recipient.address),
      getOwner(1),
    ]);
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectOk().expectUint(1);
    receipts[2].result.expectOk().expectSome().expectPrincipal(recipient.address);
    receipts[3].result.expectOk().expectBool(true);
    receipts[4].result.expectErr().expectUint(VAULT_CODES.ERR_UNAUTHORIZED);
    receipts[5].result.expectOk().expectSome().expectPrincipal(EXTENSIONS.VAULT);
  },
});