import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import type { NextPage } from 'next'

const Home: NextPage = () => {
  return (
    <>
      <WalletMultiButton />
    </>
  )
}

export default Home
