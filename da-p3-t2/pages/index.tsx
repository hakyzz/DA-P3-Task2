import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AccountInfo, PublicKey, ParsedAccountData} from "@solana/web3.js";
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';

type TokenAccounts = {
  pubkey: PublicKey,
  account:  AccountInfo<Buffer | ParsedAccountData>
}

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [ tokenAccounts, setTokenAccounts ] = useState<TokenAccounts[]>([]);

  useEffect(() => {
    if(publicKey) {
      getTokenAccounts(publicKey.toBase58());
    }
  }, [publicKey])

  const getTokenAccounts = async (publicKey: string) => {
    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: publicKey, // base58 encoded string
            },
          },
        ],
      }
    );

    setTokenAccounts(accounts);
  }

  console.log(tokenAccounts);

  return (
    <>
      <WalletMultiButton />
      <table>
        {
          tokenAccounts && (
            tokenAccounts.map((account: any, i) => {
              return (
                <tr key={i}>
                  <td>Token Account Address {i + 1}: {account.pubkey.toString()}</td>
                  <td>Mint: {account.account.data["parsed"]["info"]["mint"]}</td>
                  <td>Amount: {account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]}</td>
                </tr>
              )
            })
          )
        }
      </table>
    </>
  )
}

export default Home
