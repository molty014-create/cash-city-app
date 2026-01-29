import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import CashCityPrelaunch from './CashCityPrelaunch'
import ErrorBoundary from './components/ErrorBoundary'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

function App() {
  // Use mainnet-beta for production, devnet for testing
  const network = 'mainnet-beta'
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // Configure wallets - Phantom and Solflare are the most popular
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <CashCityPrelaunch />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  )
}

export default App
