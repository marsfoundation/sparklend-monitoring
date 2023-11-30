import { JsonRpcProvider } from '@ethersproject/providers';

export type TenderlyFork = {
    block_number?: number;
    network_id: string;
    initial_balance?: number;
  };

export type EthersOnTenderlyFork = {
  id: number;
  provider: JsonRpcProvider;
  blockNumber: number;
};