import { bundlrStorage, Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AccountInfo, ParsedAccountData, PublicKey } from "@solana/web3.js";
import type { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';

type TokenAccounts = {
  pubkey: PublicKey,
  account:  AccountInfo<Buffer | ParsedAccountData>
}

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [ tokenAccounts, setTokenAccounts ] = useState<TokenAccounts[]>([]);
  const [ nft, setNft ] = useState<any>({});
  const [ nftAttributes, setNftAttributes ] = useState<any>([]);
  const [ errorMessage, setErrorMessage ] = useState("");
  const [ updateErrorMessage, setUpdateErrorMessage ] = useState("");
  const traitRefs = useRef<any>([]);
  const traitValueRefs = useRef<any>([]);
  const [ traits, setTraits ] = useState<any>([]);
  const metaplex = Metaplex.make(connection)
  .use(walletAdapterIdentity(useWallet()))
  .use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: 'https://api.devnet.solana.com',
    timeout: 60000,
  }))

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
    setUpdateErrorMessage("");
    setErrorMessage("");

    if(e.target.value.length > 0 && isBase58(e.target.value)) { 
      let mintAddress;
      try {
        mintAddress = new PublicKey(e.target.value);

        try {
          const nft = await metaplex.nfts().findByMint({ mintAddress }).run();
          setNft(nft);
          setNftAttributes(nft.json?.attributes);
        } catch(e) {
          setNft({});
          setNftAttributes([]);
          setErrorMessage("No NFT found");
        }
      } catch {
        setNft({});
        setNftAttributes([]);
        setErrorMessage("Wrong Mint-Address");
      }
    } else if(e.target.value.length === 0) {
      setNft({});
      setNftAttributes([]);
      setErrorMessage("");
    } else {
      setNft({});
      setNftAttributes([]);
      setErrorMessage("Wrong input");
    }
  } 

  const handleTraitSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    traitRefs.current.map((trait: any, i: number) => {
      if(trait.value && trait.value.length > 0 && traitValueRefs.current[i].value.length > 0) {
        traits.push({"trait_type": trait.value, "value": traitValueRefs.current[i].value});
      }
    }); 
    setTraits(traits);

    try {
      const { uri: newUri } = await metaplex
      .nfts()
      .uploadMetadata({
        ...nft.json,
        attributes: traits
      })
      .run()

      try {
        await metaplex
        .nfts()
        .update({ 
            nftOrSft: nft,
            uri: newUri
        })
        .run();
        
        alert("Updated successfully");
      } catch(e) {
        setUpdateErrorMessage("Something went wrong... Update unsuccessful");
        console.log(e);
      }
    } catch(e) {
      setUpdateErrorMessage("Something went wrong... Update unsuccessful");
      console.log(e);
    }
  }

  const addTrait = async () => {
    setNftAttributes((old: any) => [...old, {"trait_type": "", "value": ""}]);
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>, id: number, type: string) => {
    let attributes = nftAttributes;
    attributes = attributes.map((x: any, i: number) => {
      if (i === id && type === "trait_type") x.trait_type = e.target.value;
      if (i === id && type === "value") x.value = e.target.value;
      return x;
    });
    setNftAttributes(attributes); 
  }

  return (
    <div className="container mx-auto px-4">
      <div className="p-2 flex flex-1 justify-end">
        <WalletMultiButton />
      </div>
      <div className="flex flex-col items-start mb-4">
        <div className="max-w-sm mb-8">
          <label htmlFor="mintAddress" className="block text-white text-sm font-bold mb-2">NFT Mint ID</label>
          <input className="shadow appearance-none rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline" type="text" name="mintAddress" onChange={getNFTByMintId} />
          {errorMessage && <div><span className="text-red-500 text-xs ">{errorMessage}</span></div>}
        </div>
        <div>
        {
          nft && nftAttributes.length > 0 && (
            <div>
              <h1 className="mb-4">Traits</h1>
              {publicKey && <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline" onClick={addTrait}>+</button>}
              <div className="flex flex-wrap">
                <div className="flex flex-col items-end mb-4 mr-4">
                  {
                    nftAttributes.map((attribute: any, i: number) => {
                      return (
                        <div key={i} className="flex flex-row py-2">
                          <div className="max-w-sm mr-4 mb-2">
                            <label htmlFor="traitType" className="block text-white text-sm font-bold mb-2">Trait type</label>
                            <input ref={(el) => (traitRefs.current[i] = el)} className="shadow appearance-none rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline" type="text" name="traitType" value={attribute.trait_type} onChange={(e) => handleChange(e, i, "trait_type")}/>
                          </div>
                          <div className="max-w-sm">
                            <label htmlFor="traitValue" className="block text-white text-sm font-bold mb-2">Value</label>
                            <input ref={(el) => (traitValueRefs.current[i] = el)} className="shadow appearance-none rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline" type="text" name="traitValue" value={attribute.value} onChange={(e) => handleChange(e, i, "value")} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>

              {publicKey && <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline" onClick={handleTraitSubmit} type="button">Update traits</button>}
              {updateErrorMessage && <div><span className="text-red-500 text-xs ">{updateErrorMessage}</span></div>}
            </div>
          )
        }
        </div>
      </div>
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
    </div>
  )
}

export default Home
