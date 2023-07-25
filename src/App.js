import React from 'react';
import { ethers, SigningKey, sha256, ripemd160 } from 'ethers';
import { bech32 } from "bech32";
import './App.css';

const fromHex = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

function App() {
  const [account, setAccount] = React.useState();
  const [publicKey, setPublicKey] = React.useState();
  const [compressedPublicKey, setCompressedPublicKey] = React.useState();
  const [cosmosAddress, setCosmosAddress] = React.useState();
  const [universalAddress, setUniversalAddress] = React.useState();

  const getPublicKey = async () => {
    setAccount(null);
    setPublicKey(null);
    setCompressedPublicKey(null);
    setCosmosAddress(null);
    setUniversalAddress(null);

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: ['pubkey_getter', accounts[0]],
    });
    const msgHash = ethers.keccak256(new TextEncoder().encode(`\x19Ethereum Signed Message:\n${'personal_sign'.length}pubkey_getter`));
    const publicKey = SigningKey.recoverPublicKey(msgHash, signature);
    setPublicKey(publicKey);
    const compressed = SigningKey.computePublicKey(publicKey, true);
    setCompressedPublicKey(compressed);
    let rawAddress = ripemd160(sha256(compressed));
    if (rawAddress.startsWith("0x")) {
      rawAddress = rawAddress.substring(2);
    }
    const cosmosAddress = bech32.encode("cosmos", bech32.toWords(fromHex(rawAddress)));
    setCosmosAddress(cosmosAddress);
    const base64 = btoa((compressed.startsWith('0x') ? 'e701' + compressed.slice(2) : 'e701' + compressed).match(/\w{2}/g).map((a) => { return String.fromCharCode(parseInt(a, 16)); }).join(""));
    const base64Url = base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    const universalAddress = 'u' + base64Url;
    setUniversalAddress(universalAddress);
  }

  return (
    <div className="App">
      <div className='app-title'>
        <h1>GET PUBLIC KEY AND UNIVERSAL ADDRESS</h1>
        <br />
        <button
          className='button-default'
          onClick={getPublicKey}
          disabled={account && !universalAddress}
        >
          {!account && !universalAddress ? 'CONNECT' : (account && !universalAddress ? 'SIGNING...' : 'RECONNECT')}
        </button>
      </div>
      <br /><br />
      <div className='app-content'>
        {
          account ?
            <table className='table-default'>
              <thead />
              <tbody>
                <tr>
                  <th className='th-default'>CONNECTED ACCOUNT</th>
                  <td className='td-default'><pre>{account}</pre></td>
                </tr>
                {
                  publicKey ?
                    <tr>
                      <th className='th-default'>PUBLIC KEY</th>
                      <td className='td-default'><pre>{publicKey}</pre></td>
                    </tr> : null
                }
                {
                  compressedPublicKey ?
                    <tr>
                      <th className='th-default'>COMPRESSED PUBLIC KEY</th>
                      <td className='td-default'><pre>{compressedPublicKey}</pre></td>
                    </tr> : null
                }
                {
                  cosmosAddress ?
                    <tr>
                      <th className='th-default'>COSMOS ADDRESS</th>
                      <td className='td-default'><pre>{cosmosAddress}</pre></td>
                    </tr> : null
                }
                {
                  universalAddress ?
                    <tr>
                      <th className='th-default'>UNIVERSAL ADDRESS</th>
                      <td className='td-default'><pre>{universalAddress}</pre></td>
                    </tr> : null
                }
              </tbody>
            </table> :
            <p>PLEASE CONNECT METAMASK</p>
        }
      </div>
    </div>
  );
}

export default App;
