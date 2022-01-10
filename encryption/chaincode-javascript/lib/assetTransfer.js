/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

const AES = require('crypto-js/aes');
const SHA256 = require('crypto-js/sha256');
const CryptoJS = require('crypto-js');
const { readFileSync } = require('fs');
const sss = require('shamirs-secret-sharing')

const deterministicEncryption = { mode: CryptoJS.mode.ECB };

/* 
 * This is only for testing, normally it should be generated and then secretly shared as shares between 
 * peers of organisations.
 * Only shares are then uploaded to the docker container of the chaincode.
 * The chaincodew will then take care of the reconstruction of the key, if the threshold is not suffiecient
 * such that only one peer is trying to get the data, nothing will happens! 
 * The data will remain safe and it will not be decrypted, no key is recovered!
*/
const getSymmetricKey = () => '3t6w9z$C&F)J@NcRfUjXnZr4u7x!A%D*'
//     readFileSync('/etc/hyperledger/fabric/ledger_encryption.key').toString();


// Add shamir secret sharing part, first get the key and then divide it into number of parts
const shares = sss.split(getSymmetricKey(), { shares: 10, threshold: 2 })
/* 
 * Determine the threshold for peers to be able to recover the key.
 * Such step need to be considered when doing production scenario!
 */
const getKey = () => sss.combine(shares.slice(2, 4))

function encryptId(id) {
    const recovered = getKey()

    const secret_key = CryptoJS.enc.Utf8.parse(
        SHA256(recovered + id).toString()
    );

    const encryptedId = AES.encrypt(
            JSON.stringify(id),
            secret_key,
            deterministicEncryption
        );
    return encryptedId.ID;
}


function encrypt(asset, id) {
    // Step 1
    const recovered = getKey()

    // Step 2
    const secret_key = CryptoJS.enc.Utf8.parse(
        SHA256(recovered + id).toString()
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

function decrypt(asset, id) {
    const recovered = getKey()

    const secret_key = CryptoJS.enc.Utf8.parse(
        SHA256(recovered + id).toString()
    );

    const decryptedResult = {};

    Object.keys(asset).forEach((key) => {
        const decryptedString = AES.decrypt(
            asset[key],
            secret_key,
            deterministicEncryption
        ).toString(CryptoJS.enc.Utf8);
        decryptedResult[key] = JSON.parse(decryptedString).v;
    });

    return decryptedResult;
}

class AssetTransfer extends Contract {
    async InitLedger(ctx) {
        const assets = [
            {
                ID: 'asset1',
                Color: 'blue',
                Size: 5,
                Owner: 'Tomoko',
                AppraisedValue: 300,
            },
            {
                ID: 'asset2',
                Color: 'red',
                Size: 5,
                Owner: 'Brad',
                AppraisedValue: 400,
            },
            {
                ID: 'asset3',
                Color: 'green',
                Size: 10,
                Owner: 'Jin Soo',
                AppraisedValue: 500,
            },
            {
                ID: 'asset4',
                Color: 'yellow',
                Size: 10,
                Owner: 'Max',
                AppraisedValue: 600,
            },
            {
                ID: 'asset5',
                Color: 'black',
                Size: 15,
                Owner: 'Adriana',
                AppraisedValue: 700,
            },
            {
                ID: 'asset6',
                Color: 'white',
                Size: 15,
                Owner: 'Michel',
                AppraisedValue: 800,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            const encryptedAsset = encrypt(asset, asset.ID);
            await ctx.stub.putState(
                asset.ID,
                Buffer.from(JSON.stringify(encryptedAsset))
            );
            console.info(`Asset ${asset.ID} initialized`);
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        
        const encryptedId = encryptId(asset, id); 
        const exists = await this.AssetExists(ctx, encryptedId);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const encryptedAsset = encrypt(asset, asset.ID);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(encryptedAsset)));
        return JSON.stringify(asset);
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAssetNoEncryption(ctx, id, color, size, owner, appraisedValue) {
        //  When testing the next three lines are not working probably
        // const exists = await this.AssetExists(ctx, id);
        // if (exists) {
        //     throw new Error(`The asset ${id} already exists`);
        // }

        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        // const encryptedId = encryptId(asset, id); 
        // // get the asset from chaincode state
        // Normally, the id should be also encrypted when it containes important info
        // But for test cases, raw ids will be used!
        const assetJSON = await ctx.stub.getState(id); 
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }

        const asset = JSON.parse(assetJSON.toString());
        const decryptedAsset = decrypt(asset, id);

        return JSON.stringify(decryptedAsset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAssetNoDecryption(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }

        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }


    // UpdateAsset updates an existing asset in the world state with provided parameters with encryption.
    async UpdateAssetEncryption(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };

        const encryptedUpdatedAsset = encrypt(updatedAsset, id);
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(encryptedUpdatedAsset)));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const decryptedAsset = decrypt(asset, id);
        decryptedAsset.Owner = newOwner;
        const encryptedAsset = encrypt(decryptedAsset, id);
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(encryptedAsset)));
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // GetAllAssets returns all assets found in the world state, and decrypt them.
    async GetAllAssetsD(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record, decryptedRecord;
            console.log(strValue);
            try {
                record = JSON.parse(strValue);
                decryptedRecord = decrypt(record, result.value.id);
                console.log(record.toString());
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            console.log(decryptedRecord.toString());
            allResults.push({ Key: result.value.key, Record: decryptedRecord });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
