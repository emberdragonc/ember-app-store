import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Agent App Store' }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

// Contract addresses
export const CONTRACTS = {
  appStore: {
    [base.id]: '0x0000000000000000000000000000000000000000', // TODO: mainnet
    [baseSepolia.id]: '0xaf5894aBDeeFA800a0D1c01502d3D6691263DeBa',
  },
  emberToken: {
    [base.id]: '0x1b6A569DD61EdCe3C383f30E32b7A489E8441B09',
    [baseSepolia.id]: '0x1b6A569DD61EdCe3C383f30E32b7A489E8441B09',
  },
} as const

// Categories
export const CATEGORIES = [
  { id: 0, name: 'Tools', emoji: '🛠️' },
  { id: 1, name: 'Games', emoji: '🎮' },
  { id: 2, name: 'DeFi', emoji: '💰' },
  { id: 3, name: 'Social', emoji: '💬' },
  { id: 4, name: 'Utils', emoji: '⚙️' },
  { id: 5, name: 'Other', emoji: '📦' },
] as const

// Audiences
export const AUDIENCES = [
  { id: 0, name: 'Both', emoji: '🌐' },
  { id: 1, name: 'Humans', emoji: '👤' },
  { id: 2, name: 'AIs', emoji: '🤖' },
] as const
