/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const AES = require("crypto-js/aes");
const SHA256 = require("crypto-js/sha256");

const globalSharedPassword = "v2CFd2QFTJ2hMHyuRnax5";
var CryptoJS = require("crypto-js");

function encrypt(asset, id, sharedPassword) {
  const secret_text = SHA256(sharedPassword + id).toString();

  const encryptedResult = {};

  console.log('secret text')
  console.log(secret_text)

  Object.keys(asset).forEach((key) => {
    encryptedResult[key] = AES.encrypt("" + asset[key], secret_text).toString();
  });

  return encryptedResult;
}

const getSymmetricKey = () => 'v2CFd2QFTJ2hMHyuRnax5'
const deterministicEncryption = { mode: CryptoJS.mode.ECB };

function decrypt(asset, id) {

  const symmetricKey = getSymmetricKey()
  const secret_key = CryptoJS.enc.Utf8.parse(SHA256(symmetricKey + id).toString());

  const decryptedResult = {}

  Object.keys(asset).forEach((key) => {
    console.log( AES.decrypt(asset[key], secret_key, deterministicEncryption).toString(
      CryptoJS.enc.Utf8
    ))
    decryptedResult[key] = AES.decrypt("" + asset[key], secret_key, deterministicEncryption).toString(
      CryptoJS.enc.Utf8
    );
  });

  return decryptedResult;
}

class AssetTransfer {
  InitLedger() {
    const assets = [
      {
        ID: "asset1",
        Color: "blue",
        Size: 5,
        Owner: "Tomoko",
        AppraisedValue: 300,
      },
      {
        ID: "asset2",
        Color: "red",
        Size: 5,
        Owner: "Brad",
        AppraisedValue: 400,
      },
      {
        ID: "asset3",
        Color: "green",
        Size: 10,
        Owner: "Jin Soo",
        AppraisedValue: 500,
      },
      {
        ID: "asset4",
        Color: "yellow",
        Size: 10,
        Owner: "Max",
        AppraisedValue: 600,
      },
      {
        ID: "asset5",
        Color: "black",
        Size: 15,
        Owner: "Adriana",
        AppraisedValue: 700,
      },
      {
        ID: "asset6",
        Color: "white",
        Size: 15,
        Owner: "Michel",
        AppraisedValue: 800,
      },
    ];

    for (const asset of assets) {
      asset.docType = "asset";
      const encryptedAsset = encrypt(asset, asset.ID, globalSharedPassword);
    //   console.log(JSON.stringify(encryptedAsset));
      console.info(`Asset ${asset.ID} initialized`);
    }
  }
}

let a = new AssetTransfer()
a.InitLedger()

const key = CryptoJS.enc.Utf8.parse('mGK6qC5Kn8PWtjxAvbBt9gbrJGRv4Eme4ANPLxJAebB6hJ3WE8XMH7e7xvhMCeYxjXURYcyW6Hvbzxg5yp5RE7eSqW5z6HWcxbUd')
const iv = ''

var randString = ''

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

let output = 0


function encrypt(asset, id) {
  // Step 1
  const symmetricKey = getSymmetricKey();

  // Step 2
  const secret_key = CryptoJS.enc.Utf8.parse(
    SHA256(symmetricKey + id).toString()
  );

  const encryptedResult = {};

  // Step 3
  Object.keys(asset).forEach((key) => {
    encryptedResult[key] = AES.encrypt(
      JSON.stringify({ v: asset[key] }),
      secret_key,
      deterministicEncryption
    ).toString();
  });

  // Step 4
  return encryptedResult;
}

for(let i = 0; i < 1000; i++) {

    randString += makeid(1)
    const obj = { el: randString }

    const encryption = encrypt(obj, 'asset1')

    output +=  ( JSON.stringify(encryption).length / JSON.stringify(obj).length)

}


// console.log(decrypt({"ID":"2u6CyYkYIdZNmLQoScG6yQ==","Color":"KaWGxAe8ulNyKjBmzFgcmw==","Size":"MuLd2SKsFEy5rJOwdL7Mxg==","Owner":"OIxU/FdjaYiSihFCsZxKIQ==","AppraisedValue":"i90/4RGyvO9CEASKZBsTNg==","docType":"Bl0KRQDaUDr/UCBB6rt/yw==","addition":"NFZKKVlb4SKxzY4maj77HLlfhzg9SRQ4+HzoUWPfabhqy/umtH1a5IeuY+WHTnIxwykcU1g4Cgu5Sblx7worLEUjqTV96ZOTpug9FIpkYLsuTEjSCVZLukSDaf8SJL7M"}, 'asset1', 'v2CFd2QFTJ2hMHyuRnax5'))
console.log(output / 1000)
