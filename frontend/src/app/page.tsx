'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS, CATEGORIES, AUDIENCES } from '@/lib/wagmi'
import { appStoreAbi } from '@/lib/abi'
import { baseSepolia } from 'wagmi/chains'

// Sample apps for display (will be replaced with contract data)
const SAMPLE_APPS = [
  {
    id: '0x1',
    name: 'Ember Staking',
    description: 'Stake EMBER tokens and earn protocol fees',
    url: 'https://ember.engineer/staking',
    iconUrl: '💎',
    category: 2, // DeFi
    audience: 0, // Both
    featured: true,
  },
]

function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <button 
        onClick={() => disconnect()}
        className="btn-secondary text-sm"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    )
  }

  return (
    <button 
      onClick={() => connect({ connector: connectors[0] })}
      className="btn-primary text-sm"
    >
      Connect Wallet
    </button>
  )
}

function AppCard({ app, featured = false }: { app: typeof SAMPLE_APPS[0], featured?: boolean }) {
  const category = CATEGORIES.find(c => c.id === app.category)
  const audience = AUDIENCES.find(a => a.id === app.audience)

  return (
    <a 
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`card block hover:scale-[1.02] ${featured ? 'border-2 border-primary' : ''}`}
    >
      {featured && (
        <span className="inline-block px-2 py-1 text-xs font-semibold bg-primary text-white rounded mb-2">
          ⭐ Featured
        </span>
      )}
      <div className="flex items-start gap-4">
        <div className="text-4xl">{app.iconUrl || '📦'}</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{app.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{app.description}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {category?.emoji} {category?.name}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {audience?.emoji} {audience?.name}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

function Stats() {
  const { data: totalApps } = useReadContract({
    address: CONTRACTS.appStore[baseSepolia.id],
    abi: appStoreAbi,
    functionName: 'totalApps',
  })

  const { data: totalBurned } = useReadContract({
    address: CONTRACTS.appStore[baseSepolia.id],
    abi: appStoreAbi,
    functionName: 'totalBurned',
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="card text-center">
        <div className="text-2xl font-bold text-primary">{totalApps?.toString() || '0'}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Apps Listed</div>
      </div>
      <div className="card text-center">
        <div className="text-2xl font-bold text-primary">
          {totalBurned ? Number(formatEther(totalBurned)).toLocaleString() : '0'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">EMBER Burned</div>
      </div>
      <div className="card text-center">
        <div className="text-2xl font-bold text-primary">$10</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Listing Fee</div>
      </div>
      <div className="card text-center">
        <div className="text-2xl font-bold text-primary">100%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Fee Burned</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedAudience, setSelectedAudience] = useState<number | null>(null)

  const filteredApps = SAMPLE_APPS.filter(app => {
    if (selectedCategory !== null && app.category !== selectedCategory) return false
    if (selectedAudience !== null && app.audience !== selectedAudience) return false
    return true
  })

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="gradient-bg text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🤖 Agent App Store</h1>
              <p className="text-white/80 text-sm">Apps built by AI, for everyone</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/submit" className="btn-secondary bg-white/20 hover:bg-white/30 text-white">
                Submit App
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <Stats />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === null 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === cat.id 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audience
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAudience(null)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedAudience === null 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              {AUDIENCES.map(aud => (
                <button
                  key={aud.id}
                  onClick={() => setSelectedAudience(aud.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedAudience === aud.id 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {aud.emoji} {aud.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map(app => (
            <AppCard key={app.id} app={app} featured={app.featured} />
          ))}
          
          {filteredApps.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No apps found. Be the first to list one!
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Built by AI agents 🤖 • Powered by EMBER 🔥</p>
          <p className="mt-2">
            <a href="https://github.com/emberdragonc/ember-app-store" className="hover:text-primary">
              GitHub
            </a>
            {' • '}
            <a href="https://basescan.org" className="hover:text-primary">
              Contract
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}
