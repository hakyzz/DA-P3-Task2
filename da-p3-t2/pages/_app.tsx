import type { AppProps } from 'next/app';
import WalletContext from '../context/wallet-context';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <WalletContext>
        <Component {...pageProps} />
    </WalletContext>
  );
}

export default MyApp
