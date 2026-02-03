'use client'

import { useState } from 'react'
import { useAccount, useConnect, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { CONTRACTS, CATEGORIES, AUDIENCES } from '@/lib/wagmi'
import { appStoreAbi, erc20Abi } from '@/lib/abi'
import { baseSepolia } from 'wagmi/chains'
import Link from 'next/link'

export default function SubmitApp() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    iconUrl: '',
    category: 0,
    audience: 0,
  })
  const [step, setStep] = useState<'form' | 'approve' | 'submit' | 'success'>('form')

  // Get listing prices
  const { data: prices } = useReadContract({
    address: CONTRACTS.appStore[baseSepolia.id],
    abi: appStoreAbi,
    functionName: 'getListingPrices',
  })

  // Check allowance
  const { data: allowance } = useReadContract({
    address: CONTRACTS.emberToken[baseSepolia.id],
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.appStore[baseSepolia.id]] : undefined,
  })

  // Approve tokens
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Submit app
  const { writeContract: submitApp, data: submitHash, isPending: isSubmitting } = useWriteContract()
  const { isLoading: isSubmitConfirming, isSuccess: isSubmitSuccess } = useWaitForTransactionReceipt({
    hash: submitHash,
  })

  const basicPrice = prices?.[0] || BigInt(0)
  const needsApproval = allowance !== undefined && allowance < basicPrice

  const handleApprove = () => {
    approve({
      address: CONTRACTS.emberToken[baseSepolia.id],
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONTRACTS.appStore[baseSepolia.id], basicPrice],
    })
  }

  const handleSubmit = () => {
    submitApp({
      address: CONTRACTS.appStore[baseSepolia.id],
      abi: appStoreAbi,
      functionName: 'submitApp',
      args: [
        formData.name,
        formData.description,
        formData.url,
        formData.iconUrl,
        formData.category,
        formData.audience,
      ],
    })
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="text-primary hover:underline mb-8 block">← Back to Store</Link>
          <div className="card text-center">
            <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your wallet to submit an app
            </p>
            <button 
              onClick={() => connect({ connector: connectors[0] })}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (isSubmitSuccess) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-4">App Submitted!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your app has been submitted for review. Once approved, it will appear in the store.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Back to Store
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-primary hover:underline mb-8 block">← Back to Store</Link>
        
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Submit Your App</h1>
          
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                App Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="My Awesome App"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                placeholder="What does your app do?"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                App URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="https://myapp.com"
              />
            </div>

            {/* Icon URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon URL (optional)
              </label>
              <input
                type="url"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="https://myapp.com/icon.png"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Audience
              </label>
              <select
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {AUDIENCES.map(aud => (
                  <option key={aud.id} value={aud.id}>
                    {aud.emoji} {aud.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Info */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Listing Fee</span>
                <span className="font-bold">$10 in EMBER</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                100% of the listing fee is burned 🔥
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isApproveConfirming}
                  className="btn-primary flex-1"
                >
                  {isApproving || isApproveConfirming ? 'Approving...' : 'Approve EMBER'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSubmitConfirming || !formData.name || !formData.url}
                  className="btn-primary flex-1"
                >
                  {isSubmitting || isSubmitConfirming ? 'Submitting...' : 'Submit App'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
