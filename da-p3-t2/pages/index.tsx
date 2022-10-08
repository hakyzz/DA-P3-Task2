import { bundlrStorage, Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
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
  const [ updateButtonText, setUpdateButtonText ] = useState("Update traits");
  const traitRefs = useRef<any>([]);
  const traitValueRefs = useRef<any>([]);
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

  const getNFTByMintId = async (mintId: string) => {
    const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);
    setUpdateErrorMessage("");
    setErrorMessage("");

    if(mintId.length > 0 && isBase58(mintId)) { 
      let mintAddress;
      try {
        mintAddress = new PublicKey(mintId);

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
    } else if(mintId.length === 0) {
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
    let newTraits: any = [];
    setUpdateButtonText("Updating...");
    traitRefs.current.map((trait: any, i: number) => {
      if(trait && trait.value.length > 0 && traitValueRefs.current[i].value.length > 0) {
        newTraits.push({"trait_type": trait.value, "value": traitValueRefs.current[i].value});
      }
    });

    try {
      const { uri: newUri } = await metaplex
      .nfts()
      .uploadMetadata({
        ...nft.json,
        attributes: newTraits
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
        
        setUpdateButtonText("Update traits");
        getNFTByMintId(nft.address.toBase58());
      } catch(e) {
        setUpdateErrorMessage("Something went wrong... Update unsuccessful");
        setUpdateButtonText("Update traits");
        console.log(e);
      }
    } catch(e) {
      setUpdateErrorMessage("Something went wrong... Update unsuccessful");
      setUpdateButtonText("Update traits");
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
      <div className="flex flex-wrap items-start mb-4">
        <div className="w-screen">
          <div className="max-w-sm mb-8">
            <label htmlFor="mintAddress" className="block text-white text-sm font-bold mb-2">NFT Mint ID</label>
            <input className="shadow appearance-none rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline" type="text" name="mintAddress" onChange={(e) => getNFTByMintId(e.target.value)} />
            {errorMessage && <div><span className="text-red-500 text-xs ">{errorMessage}</span></div>}
          </div>
        </div>
        {
          nft && nftAttributes.length > 0 && (
            <div>
              <div className="flex mb-4 items-center">
                <h1 className="text-lg font-bold mr-4">Traits</h1>
                {publicKey && <button className="bg-violet-800 hover:bg-violet-900 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline" onClick={addTrait}>+ Add trait</button>}
              </div>
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

              {publicKey && <button className="bg-violet-800 hover:bg-violet-900 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline" onClick={handleTraitSubmit} type="button">{updateButtonText}</button>}
              {updateErrorMessage && <div><span className="text-red-500 text-xs ">{updateErrorMessage}</span></div>}
            </div>
          )
        }
        {
          tokenAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">SPL Tokens</h2>
              <table>
                <thead className="bg-violet-800 text-left">
                  <tr>
                    <th className="p-3">Token Account Address</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-violet-400">
                  {
                    tokenAccounts.map((account: any, i: number) => {
                      return (
                        <tr key={i}>
                          <td className="p-3">{account.account.data["parsed"]["info"]["mint"]}</td>
                          <td className="p-3 text-center">{account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]}</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default Home
