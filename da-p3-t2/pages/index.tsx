import { Metaplex } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AccountInfo, ParsedAccountData, PublicKey } from "@solana/web3.js";
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';

type TokenAccounts = {
  pubkey: PublicKey,
  account:  AccountInfo<Buffer | ParsedAccountData>
}

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const metaplex = new Metaplex(connection);
  const [ tokenAccounts, setTokenAccounts ] = useState<TokenAccounts[]>([]);
  const [ nftAttributes, setNftAttributes ] = useState<any>([]);
  const [ errorMessage, setErrorMessage ] = useState("");

  useEffect(() => {
    if(publicKey) {
      getTokenAccounts(publicKey.toBase58());
    } else {
      setTokenAccounts([]);
    }
  }, [publicKey])

  const getTokenAccounts = async (publicKey: string) => {
    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165,
          },
          {
            memcmp: {
              offset: 32,
              bytes: publicKey,
            },
          },
        ],
      }
    );

    setTokenAccounts(accounts);
  }

  const getNFTByMintId = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);

    if(e.target.value.length > 0 && isBase58(e.target.value)) { 
      let mintAddress;
      try {
        mintAddress = new PublicKey(e.target.value);

        try {
          const nft = await metaplex.nfts().findByMint({ mintAddress }).run();
          setNftAttributes(nft.json?.attributes);
        } catch(e) {
          setNftAttributes([]);
          setErrorMessage("No NFT found");
        }
      } catch {
        setNftAttributes([]);
        setErrorMessage("Wrong Mint-Address");
      }
    } else if(e.target.value.length === 0) {
      setNftAttributes([]);
      setErrorMessage("");
    } else {
      setNftAttributes([]);
      setErrorMessage("Wrong input");
    }
  } 

  return (
    <>
      <WalletMultiButton />
      <div>
        <input type="text" name="mintAddress" onChange={getNFTByMintId} />
        {errorMessage && <div><span>{errorMessage}</span></div>}
      </div>
        {
          nftAttributes.length > 0 && (
            <table>
              <tbody>
                <tr>
                  <td>Trait Type</td>
                  <td>Value</td>
                </tr>
              {
                nftAttributes.map((attribute: any, i: number) => {
                  return (
                    <tr key={i}>
                      <td>{attribute.trait_type}</td>
                      <td>{attribute.value}</td>
                    </tr>
                  )
                })
              }
             </tbody>
            </table>
          )
        }
        {
          tokenAccounts && (
            <table>
              <tbody>
                {
                  tokenAccounts.map((account: any, i: number) => {
                    return (
                      <tr key={i}>
                        <td>Token Account Address {i + 1}: {account.pubkey.toString()}</td>
                        <td>Mint: {account.account.data["parsed"]["info"]["mint"]}</td>
                        <td>Amount: {account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]}</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          )
        }
    </>
  )
}

export default Home
