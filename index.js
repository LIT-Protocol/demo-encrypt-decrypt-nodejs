import pinataSDK from "@pinata/sdk";
import LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import siwe from "siwe";

import { waitForEnter } from "./utils.js";

const pinata = new pinataSDK(
  "d74988b6b586aafca17b",
  "ca736a005f5cf0cbdfc02e99c56906799bdebdd512a2e0931d46a7c9fa837b17"
);
const privKey =
  "65f66de03181fbbc13c73610248dfb9b05de831a9cfc41a6ebecfeb50e53d893";
const wallet = new ethers.Wallet(privKey);

const client = new LitJsSdk.LitNodeClient({
  debug: false,
});
await client.connect();

const chain = "ethereum";
const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "0",
    },
  },
];

const getSiweAuthsig = async () => {
  //   const domain = "localhost";
  //   const origin = "https://localhost/login";
  //   const statement =
  //     "DAshy- This is a test statement.  You can put anything you want here.";

  //   const siweMessage = new siwe.SiweMessage({
  //     domain,
  //     address: wallet.address,
  //     statement,
  //     uri: origin,
  //     version: "1",
  //     chainId: "1",
  //   });
  //   const messageToSign = siweMessage.prepareMessage();
  //   const signature = await wallet.signMessage(messageToSign);
  //   const recoveredAddress = ethers.verifyMessage(messageToSign, signature);
  //   const authSig = {
  //     sig: signature,
  //     derivedVia: "web3.eth.personal.sign",
  //     signedMessage: messageToSign,
  //     address: recoveredAddress,
  //   };
  return {
    sig: "0x55d4a5a0575029b12e3b7c22cdf4a89bc9d819011955268f0e422670720bd4315f2a6b827c4739ae44b2c1205c47d3d17b0531cb55e06f7fccd92487ab4cd65e1b",
    derivedVia: "web3.eth.personal.sign",
    signedMessage:
      "demo-encrypt-decrypt-react.vercel.app wants you to sign in with your Ethereum account:\n0xEDA4f4A8AbCecB28bf1663df9257Ec6F188B8107\n\n\nURI: https://demo-encrypt-decrypt-react.vercel.app/\nVersion: 1\nChain ID: 1\nNonce: nJMfwJVL3tA09mYKz\nIssued At: 2023-03-10T12:53:41.648Z\nExpiration Time: 2023-03-17T12:53:41.640Z",
    address: "0xeda4f4a8abcecb28bf1663df9257ec6f188b8107",
  };
};

const log = (...args) => console.log("\x1b[35m%s\x1b[0m", ...args);

const litEncryptString = async () => {
  const strToEncrypt = "DAshy";
  log(
    `
    1. You are encrypting the string:
    
    - [String] strToEncrypt: "${strToEncrypt}"`
  );

  await waitForEnter();
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    strToEncrypt
  );

  log(
    `2. You have now encrypted the string. You now have an encryptedString and a symmetricKey. It looks like this:

    - [Blob] encryptedString: ${encryptedString}
    - [Uint8Array] symmetricKey: ${symmetricKey}
    `
  );

  await waitForEnter();

  const encryptedSymmetricKey = await client.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig: await getSiweAuthsig(),
    chain,
  });

  log(`
    3. We have now saved the encryption key to the Lit-Protocol nodes. We did that by providing:

    - [Array] accessControlConditions: ${JSON.stringify(
      accessControlConditions
    )}
    - [Uint8Array] symmetricKey: ${symmetricKey}
    - [Object] authSig: ${await getSiweAuthsig()}
    - [String] chain: ${chain}
    
    It returned encryptedSymmetricKey, and it looks like this:

    - [Uint8Array] encryptedSymmetricKey: ${encryptedSymmetricKey}
    
  `);

  return {
    encryptedString: await LitJsSdk.blobToBase64String(encryptedString),
    encryptedSymmetricKey,
  };
};

const litDecryptString = async (encryptedString, encryptedSymmetricKey) => {
  await waitForEnter();

  log(`
  8. to decrypt the string, first we need to get the encryption key, but before that, we need to convert our encryptedSymmetricKey to a string. We do that with LitJsSdk.uint8arrayToString:

    - [Uint8Array] encryptedSymmetricKey: ${encryptedSymmetricKey}
  `);

  const toDecrypt = await LitJsSdk.uint8arrayToString(
    encryptedSymmetricKey,
    "base16"
  );
  await waitForEnter();

  log(`
    9. Now that we converted our encryptedSymmetricKey to a string, the encryptedSymmetricKey looks like this:

    - [String] encryptedSymmetricKey: ${toDecrypt}

    Then we will get the encryption key from the Lit Nodes, and we will do that by providing:

    - [Array] accessControlConditions: ${JSON.stringify(
      accessControlConditions
    )}
    - [String] toDecrypt: ${toDecrypt}
    - [String] chain: ${chain}
    - [Object] authSig: ${await getSiweAuthsig()}
  `);

  await waitForEnter();

  const symmetricKey = await client.getEncryptionKey({
    accessControlConditions,
    toDecrypt,
    chain,
    authSig: await getSiweAuthsig(),
  });

  log(`
    10. We have now got the symmetric key (unencrypted) from the Lit Nodes. It looks like this:

    - [Uint8Array] symmetricKey: ${symmetricKey}

    Finally, we can decrypt the string with the symmetric key and the encrypted string. We will do that by providing:

    - [Blob] encryptedString: ${encryptedString}
    - [Uint8Array] symmetricKey: ${symmetricKey}
  `);

  await waitForEnter();

  const decryptedString = await LitJsSdk.decryptString(
    encryptedString,
    symmetricKey
  );

  log(`
    11. We have now decrypted the string. It looks like this:

    - [String] decryptedString: ${decryptedString}

    
    That's it! You have now encrypted and decrypted a string with LitProtocol SDK!

    `);

  process.exit();
};

const uploadToIpfs = async (body) => {
  const res = await pinata.pinJSONToIPFS(body);
  return res;
};

const fetchFromIpfs = async (cid) => {
  const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
  const json = JSON.parse(await res.text());
  const encryptedString = json.encryptedString;
  let encryptedSymmetricKey = json.encryptedSymmetricKey;

  await waitForEnter();
  log(`
    6. Now we have fetched the data from IPFS. It looks like this:
    
    - [String] encryptedString: ${encryptedString}
    - [Object] encryptedSymmetricKey: ${JSON.stringify(encryptedSymmetricKey)}

    
    Because the encryptedString is now a base64 string, we need to convert it back to Blob.

    and also because the encryptedSymmetricKey now is an object that has keys and values, we need to convert it back to Uint8Array.

    `);

  await waitForEnter();

  const encryptedStringBlob = await LitJsSdk.base64StringToBlob(
    encryptedString
  );

  encryptedSymmetricKey = new Uint8Array(Object.values(encryptedSymmetricKey));

  log(`
    7. Now we have the data in the correct format. It looks like this:

    - [Blob] encryptedStringBlob: ${encryptedStringBlob}
    - [Uint8Array] encryptedSymmetricKey: ${encryptedSymmetricKey}

    If you look back on step 3, you will now see the encryptedSymmetricKey is the same as the one we got from IPFS.
  `);

  return {
    encryptedStringBlob,
    encryptedSymmetricKey,
  };
};

const data = await litEncryptString();
await waitForEnter();
log(
  `
    4. The "data" that you're about to upload to IPFS looks like this:`,
  data
);

log(`
    ** Please wait for a few seconds while we upload the data to IPFS. **
`);

const { IpfsHash } = await uploadToIpfs(data);
await waitForEnter();
log(
  `
    5. Now then your "data" is uploaded. We got the IPFS hash: ${IpfsHash}. 
    You should be able to view it here: 

    https://ipfs.io/ipfs/${IpfsHash}

    Next we we will fetch the data from IPFS.

    ** Please wait for a few seconds while we fetch the data from IPFS. **
`
);
const { encryptedStringBlob, encryptedSymmetricKey } = await fetchFromIpfs(
  IpfsHash
);

await litDecryptString(encryptedStringBlob, encryptedSymmetricKey);
