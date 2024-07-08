import React from "react";
import { ethers, SigningKey, sha256, ripemd160, computeAddress, hexlify } from "ethers";
import { bech32 } from "bech32";
import "./App.css";
import { ec } from "elliptic";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";

const keplrLogo = `${process.env.PUBLIC_URL}/keplr_logo.png`;
const metamaskLogo = `${process.env.PUBLIC_URL}/metamask_logo.png`;

function App() {
  const [publicKey, setPublicKey] = React.useState();
  const [compressedPublicKey, setCompressedPublicKey] = React.useState();
  const [ethereumAddress, setEthereumAddress] = React.useState();
  const [cosmosRawAddress, setCosmosRawAddress] = React.useState();
  const [cosmosAddress, setCosmosAddress] = React.useState();
  const [evmosAddress, setEvmosAddress] = React.useState();
  const [substrateAddress, setSubstrateAddress] = React.useState();
  const [nostrAddress, setNostrAddress] = React.useState();
  const [isConnected, setIsConnected] = React.useState(false);
  const [isSigning, setIsSigning] = React.useState(false);
  const [isMessageOn, setIsMessageOn] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState(false);

  const fromHex = (hexString) => Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

  const copyToClipboard = (text) => {
    setToastMessage(`Copied!`);
    navigator.clipboard.writeText(text);
    setIsMessageOn(true);
    setTimeout(() => {
      setIsMessageOn(false);
    }, 1000);
  }

  const getSubstrateAddress = (compressed) => {
    return encodeAddress(blake2AsHex(compressed, 256));
  }

  const getNostrAddress = (compressed) => {
    let bytes = fromHex(compressed.substring(2));
    return bech32.encode("npub", bech32.toWords(bytes.slice(1)));
  }

  const connectMetamask = async () => {
    setEthereumAddress(null);
    setPublicKey(null);
    setCompressedPublicKey(null);
    setCosmosAddress(null);
    setSubstrateAddress(null);
    setEvmosAddress(null);
    setIsConnected(false);

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      setEthereumAddress(accounts[0]);
      setEvmosAddress(bech32.encode("evmos", bech32.toWords(fromHex(accounts[0].startsWith("0x") ? accounts[0].substring(2) : accounts[0]))));
      setIsSigning(true);
      try {
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: ["pubkey_getter", accounts[0]],
        });

        const msgHash = ethers.keccak256(new TextEncoder().encode(`\x19Ethereum Signed Message:\n${"personal_sign".length}pubkey_getter`));
        const publicKey = SigningKey.recoverPublicKey(msgHash, signature);
        setPublicKey(publicKey);
        const compressed = SigningKey.computePublicKey(publicKey, true);
        setCompressedPublicKey(compressed);
        let rawAddress = ripemd160(sha256(compressed));
        setCosmosRawAddress(rawAddress);
        const cosmosAddress = bech32.encode("cosmos", bech32.toWords(fromHex(rawAddress.startsWith("0x") ? rawAddress.substring(2) : rawAddress)));
        setCosmosAddress(cosmosAddress);
        const substrateAddress = getSubstrateAddress(compressed);
        setSubstrateAddress(substrateAddress);
        const nostrAddress = getNostrAddress(compressed);
        setNostrAddress(nostrAddress);
        setIsConnected(true);
      } catch (e) {
      } finally {
        setIsSigning(false);
      }
    }
  }

  const connectKeplr = async () => {
    setEthereumAddress(null);
    setPublicKey(null);
    setCompressedPublicKey(null);
    setCosmosAddress(null);
    setSubstrateAddress(null);
    setEvmosAddress(null);
    setIsConnected(false);

    const chainId = "cosmoshub-4";
    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    if (accounts.length > 0) {
      const { address, pubkey } = accounts[0];
      setCosmosAddress(address);
      const compressed = hexlify(pubkey);
      setCompressedPublicKey(compressed);
      let rawAddress = ripemd160(sha256(compressed));
      setCosmosRawAddress(rawAddress);
      let publicKey = ec("secp256k1").keyFromPublic(pubkey).getPublic(false, "hex");
      if (!publicKey.startsWith("0x")) {
        publicKey = `0x${publicKey}`;
      }
      setPublicKey(publicKey);
      const ethereumAddress = computeAddress(publicKey);
      setEthereumAddress(ethereumAddress);
      setEvmosAddress(bech32.encode("evmos", bech32.toWords(fromHex(ethereumAddress.startsWith("0x") ? ethereumAddress.substring(2) : ethereumAddress))));
      const substrateAddress = getSubstrateAddress(compressed);
      setSubstrateAddress(substrateAddress);
      const nostrAddress = getNostrAddress(compressed);
      setNostrAddress(nostrAddress);
      setIsConnected(true);
    }
  }

  return (
    <div className="App">
      <div className="app-title">
        <h1>GET PUBLIC KEY AND DERIVE ADDRESS</h1>
        <br />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            className="button-default"
            onClick={connectMetamask}
          >
            <div style={{ display: "flex", flexDirection: "row" }}>
              <img alt="metamask" src={metamaskLogo} style={{ width: "30px", height: "30px" }} />&nbsp;&nbsp;
              <div style={{ fontSize: "15px", margin: "auto" }}>CONNECT METAMASK</div>
            </div>
          </button>
          <br />
          <button
            className="button-default"
            onClick={connectKeplr}
          >
            <div style={{ display: "flex", flexDirection: "row" }}>
              <img alt="keplr" src={keplrLogo} style={{ width: "30px", height: "30px" }} />&nbsp;&nbsp;
              <div style={{ fontSize: "15px", margin: "auto" }}>CONNECT KEPLR</div>
            </div>
          </button>
        </div>
      </div>
      <br /><br />
      <div className="app-content">
        {
          publicKey ?
            <table className="table-default">
              <thead />
              <tbody>
                {
                  publicKey ?
                    <tr>
                      <th className="th-default" style={{ padding: "1.2rem 1.2rem 0.6rem" }}>UNCOMPRESSED</th>
                      <td className="td-default" style={{ padding: "1.2rem 1.2rem 0.6rem" }} onClick={() => copyToClipboard(publicKey)}>
                        <pre className="clickable">
                          {publicKey}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  compressedPublicKey ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem" }}>COMPRESSED</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem" }} onClick={() => copyToClipboard(compressedPublicKey)}>
                        <pre className="clickable">
                          {compressedPublicKey}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  ethereumAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem" }}>ETHEREUM</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem" }} onClick={() => copyToClipboard(ethereumAddress)}>
                        <pre className="clickable">
                          {ethereumAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  cosmosRawAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem" }}>COSMOS RAW</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem" }} onClick={() => copyToClipboard(cosmosRawAddress)}>
                        <pre className="clickable">
                          {cosmosRawAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  cosmosAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem" }}>COSMOS</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem" }} onClick={() => copyToClipboard(cosmosAddress)}>
                        <pre className="clickable">
                          {cosmosAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  evmosAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem 1.2rem" }}>EVMOS</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem 1.2rem" }} onClick={() => copyToClipboard(evmosAddress)}>
                        <pre className="clickable">
                          {evmosAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  substrateAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem 1.2rem" }}>SUBSTRATE</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem 1.2rem" }} onClick={() => copyToClipboard(substrateAddress)}>
                        <pre className="clickable">
                          {substrateAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  nostrAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem 1.2rem" }}>NOSTR</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem 1.2rem" }} onClick={() => copyToClipboard(nostrAddress)}>
                        <pre className="clickable">
                          {nostrAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
              </tbody>
            </table> : null
        }
        <br />
        <p className="message">{isConnected ? null : "PLEASE CLICK BUTTON AND CONNECT WALLET!"}</p>
        <p className="message">{isSigning ? "PLEASE APPROVE SIGNING TO DERIVE PUBLIC KEY AND ADDRESS!" : null}</p>
        <p className="message">{isMessageOn ? toastMessage : null}</p>
      </div>
    </div>
  );
}

export default App;
