import React from "react";
import { ethers, SigningKey, sha256, ripemd160, computeAddress, hexlify } from "ethers";
import { bech32 } from "bech32";
import "./App.css";
import { ec } from "elliptic";

const keplrLogo = "https://file.notion.so/f/s/237c011b-62e8-4a9b-bb18-1b5c37ad52c3/keplr_icon.png?id=7d37c09a-0b7d-439b-98a1-0abfc19fddc8&table=block&spaceId=612a5b92-f057-404a-86c0-b3b04722b300&expirationTimestamp=1690502400000&signature=cHD8vtJCrANT8ulnXJ_rTFaOjuEKccPmONSieyd4shM&downloadName=keplr_icon.png";
const metamaskLogo = "https://file.notion.so/f/s/b4773be1-21e8-45cc-aa95-0a765621933d/metamask_logo.png?id=a8f18887-58b5-42f1-9a36-6fc840df86bb&table=block&spaceId=612a5b92-f057-404a-86c0-b3b04722b300&expirationTimestamp=1690430400000&signature=ez5gRCTgs7jpDK-AxGGr1WK9QIJxcfxu2tGsLCKuGbc&downloadName=metamask_logo.png";

function App() {
  const [publicKey, setPublicKey] = React.useState();
  const [compressedPublicKey, setCompressedPublicKey] = React.useState();
  const [ethereumAddress, setEthereumAddress] = React.useState();
  const [cosmosAddress, setCosmosAddress] = React.useState();
  const [universalAddress, setUniversalAddress] = React.useState();
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

  const getUniversalAddress = (compressed) => {
    const base64 = btoa((compressed.startsWith("0x") ? "e701" + compressed.slice(2) : "e701" + compressed).match(/\w{2}/g).map((a) => { return String.fromCharCode(parseInt(a, 16)); }).join(""));
    const base64Url = base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    const universalAddress = "u" + base64Url;
    return universalAddress;
  }

  const connectMetamask = async () => {
    setEthereumAddress(null);
    setPublicKey(null);
    setCompressedPublicKey(null);
    setCosmosAddress(null);
    setUniversalAddress(null);
    setIsConnected(false);

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      setEthereumAddress(accounts[0]);
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
        if (rawAddress.startsWith("0x")) {
          rawAddress = rawAddress.substring(2);
        }
        const cosmosAddress = bech32.encode("cosmos", bech32.toWords(fromHex(rawAddress)));
        setCosmosAddress(cosmosAddress);
        const universalAddress = getUniversalAddress(compressed);
        setUniversalAddress(universalAddress);
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
    setUniversalAddress(null);
    setIsConnected(false);

    const chainId = "cosmoshub-4";
    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    if (accounts.length > 0) {
      const { address, pubkey } = accounts[0];
      const compressed = hexlify(pubkey);
      setCompressedPublicKey(compressed);
      setCosmosAddress(address);
      let publicKey = ec("secp256k1").keyFromPublic(pubkey).getPublic(false, "hex");
      if (!publicKey.startsWith("0x")) {
        publicKey = `0x${publicKey}`;
      }
      setPublicKey(publicKey);
      const ethereumAddress = computeAddress(publicKey);
      setEthereumAddress(ethereumAddress);
      const universalAddress = getUniversalAddress(compressed);
      setUniversalAddress(universalAddress);
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
            <div style={{display: "flex", flexDirection: "row"}}>
              <img alt="metamask" src={metamaskLogo} style={{ width: "30px", height: "30px" }} />&nbsp;&nbsp;
              <div style={{ fontSize: "15px", margin: "auto" }}>CONNECT METAMASK</div>
            </div>
          </button>
          <br/>
          <button
            className="button-default"
            onClick={connectKeplr}
          >
            <div style={{display: "flex", flexDirection: "row"}}>
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
                      <th className="th-default" style={{ padding: "1.2rem 1.2rem 0.6rem"}}>UNCOMPRESSED</th>
                      <td className="td-default" style={{ padding: "1.2rem 1.2rem 0.6rem"}} onClick={() => copyToClipboard(publicKey)}>
                        <pre className="clickable">
                          {publicKey}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  compressedPublicKey ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem"}}>COMPRESSED</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem"}} onClick={() => copyToClipboard(compressedPublicKey)}>
                        <pre className="clickable">
                          {compressedPublicKey}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  ethereumAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem"}}>ETHEREUM</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem"}} onClick={() => copyToClipboard(ethereumAddress)}>
                        <pre className="clickable">
                          {ethereumAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  cosmosAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem"}}>COSMOS</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem"}} onClick={() => copyToClipboard(cosmosAddress)}>
                        <pre className="clickable">
                          {cosmosAddress}
                        </pre>
                      </td>
                    </tr> : null
                }
                {
                  universalAddress ?
                    <tr>
                      <th className="th-default" style={{ padding: "0.6rem 1.2rem 1.2rem"}}>UNIVERSAL</th>
                      <td className="td-default" style={{ padding: "0.6rem 1.2rem 1.2rem"}}   onClick={() => copyToClipboard(universalAddress)}>
                        <pre className="clickable">
                          {universalAddress}
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
