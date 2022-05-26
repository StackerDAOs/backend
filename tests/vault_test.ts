import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/deps.ts';
import {
  BOOTSTRAPS,
  EXTENSIONS,
  FUNGIBLE_TOKENS,
  NON_FUNGIBLE_TOKENS,
  VAULT_CODES,
} from './utils/common.ts';
import { fetchApi as executorApi } from './utils/api/executor-dao.ts';
import { fetchApi as vaultApi } from './utils/api/vault.ts';
import { fetchApi as ftApi } from './utils/api/ft-membership.ts';
import { fetchApi as nftApi } from './utils/api/nft-membership.ts';

Clarinet.test({
  name: '`vault` - deposit STX',
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, any>) {
    const { deposit, getBalance } = vaultApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { mint } = ftApi(accounts.get('deployer')!);
    const {
      depositFt,
      getBalanceOf,
      isWhitelisted,
    } = vaultApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { mint } = ftApi(accounts.get('deployer')!);
    const {
      depositFt,
      getBalanceOf,
      isWhitelisted,
    } = vaultApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { mint, getOwner } = nftApi(accounts.get('deployer')!);
    const {
      depositNft,
      isWhitelisted,
    } = vaultApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
      isWhitelisted(NON_FUNGIBLE_TOKENS.NFT_MEMBERSHIP),
      mint(recipient.address),
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
    const { mint, getOwner } = nftApi(accounts.get('deployer')!);
    const {
      depositNft,
    } = vaultApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      mint(recipient.address),
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
    } = vaultApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { mint } = ftApi(accounts.get('deployer')!);
    const {
      depositFt,
      getBalanceOf,
      transferFt,
    } = vaultApi(accounts.get('deployer')!);
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
    const { init } = executorApi(accounts.get('deployer')!);
    const { mint, getOwner } = nftApi(accounts.get('deployer')!);
    const {
      depositNft,
      transferNft,
    } = vaultApi(accounts.get('deployer')!);
    const recipient = accounts.get('deployer')!;
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.VAULT),
      mint(recipient.address),
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