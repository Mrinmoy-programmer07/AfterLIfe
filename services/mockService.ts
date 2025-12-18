import { AssetState, Guardian, Beneficiary } from '../types';

export const INITIAL_ASSETS: AssetState[] = [
  { id: '1', name: 'Main Vault (ETH)', value: '142.5 ETH', status: 'LOCKED', unlockDate: Date.now() + 86400000 * 30 },
  { id: '2', name: 'Stablecoin Reserve', value: '50,000 USDC', status: 'LOCKED', unlockDate: Date.now() + 86400000 * 60 },
  { id: '3', name: 'NFT Collection', value: '12 Items', status: 'LOCKED', unlockDate: Date.now() + 86400000 * 90 },
];

export const INITIAL_GUARDIANS: Guardian[] = [
  { address: '0x71...9A2', name: 'Alice (Sister)', isConfirmed: false, lastActive: Date.now() - 3600000 },
  { address: '0x3B...8C1', name: 'Bob (Lawyer)', isConfirmed: true, lastActive: Date.now() - 7200000 },
  { address: '0x9F...2D4', name: 'Charlie (Partner)', isConfirmed: false, lastActive: Date.now() - 1800000 },
  { address: '0x1A...5E9', name: 'Gnosis Safe', isConfirmed: false, lastActive: Date.now() - 86400000 },
  { address: '0x4C...7F0', name: 'Backup Hardware', isConfirmed: true, lastActive: Date.now() - 10000 },
];

export const INITIAL_BENEFICIARIES: Beneficiary[] = [
  { address: '0x5D...1A3', name: 'Sarah (Wife)', allocation: 60, amountClaimed: '0 ETH' },
  { address: '0x8E...9B2', name: 'Kids Trust', allocation: 30, amountClaimed: '0 ETH' },
  { address: '0x2C...4D1', name: 'Charity Fund', allocation: 10, amountClaimed: '0 ETH' },
];

export const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};
