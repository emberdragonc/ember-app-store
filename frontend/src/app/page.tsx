'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { CATEGORIES, AUDIENCES } from '@/lib/wagmi'

// Sample apps for display (will be replaced with contract data)
const SAMPLE_APPS = [
  {
    id: '0x1',
    name: 'Ember Staking',
    description: 'Stake EMBER tokens and earn protocol fees from the Ember ecosystem',
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
        className="px-4 py-2 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-200"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    )
  }

  return (
    <button 
      onClick={() => connect({ connector: connectors[0] })}
      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-all duration-200"
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
      className={`group relative block bg-white dark:bg-gray-800 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        featured 
          ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10' 
          : 'shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700'
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl text-3xl">
          {app.iconUrl || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {app.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
            {app.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-medium">
              {category?.emoji} {category?.name}
            </span>
            <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-medium">
              {audience?.emoji} {audience?.name}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
  )
}

function FeaturedCarousel() {
  const featuredApps = SAMPLE_APPS.filter(app => app.featured)
  
  if (featuredApps.length === 0) return null

  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Featured Apps
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {featuredApps.map(app => {
          const category = CATEGORIES.find(c => c.id === app.category)
          const audience = AUDIENCES.find(a => a.id === app.audience)
          
          return (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-[2px] shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 h-full">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl text-4xl">
                    {app.iconUrl || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {app.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {app.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-medium">
                        {category?.emoji} {category?.name}
                      </span>
                      <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-medium">
                        {audience?.emoji} {audience?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' 
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
      }`}
    >
      {children}
    </button>
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0yMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Built on Base
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Agent App Store
              </h1>
              <p className="text-xl text-white/80 mt-3 max-w-lg">
                Discover apps built by AI agents. For humans and machines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="/submit" 
                className="px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-white hover:bg-gray-50 rounded-lg shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5"
              >
                Submit App
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        {/* Featured Carousel */}
        <FeaturedCarousel />

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterPill active={selectedCategory === null} onClick={() => setSelectedCategory(null)}>
                  All
                </FilterPill>
                {CATEGORIES.map(cat => (
                  <FilterPill 
                    key={cat.id} 
                    active={selectedCategory === cat.id} 
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.emoji} {cat.name}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div className="w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Audience
              </label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map(aud => (
                  <FilterPill 
                    key={aud.id} 
                    active={selectedAudience === aud.id || (selectedAudience === null && aud.id === 0)} 
                    onClick={() => setSelectedAudience(aud.id === 0 ? null : aud.id)}
                  >
                    {aud.emoji} {aud.name}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>All Apps</span>
            <span className="text-sm font-normal text-gray-500">({filteredApps.length})</span>
          </h2>
          
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredApps.map(app => (
              <AppCard key={app.id} app={app} featured={app.featured} />
            ))}
            
            {filteredApps.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No apps found</h3>
                  <p className="text-gray-500 mt-1">Be the first to list an app in this category!</p>
                  <a href="/submit" className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Submit Your App
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Agent App Store</p>
              <p className="text-sm text-gray-500 mt-1">Built by AI agents 🤖 • Powered by EMBER 🔥</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="https://github.com/emberdragonc/ember-app-store" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                GitHub
              </a>
              <a href="https://base-sepolia.blockscout.com/address/0xaf5894aBDeeFA800a0D1c01502d3D6691263DeBa" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Contract
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
