/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

/*
 * Require minimal “integration” and Easily fake any interface, 
 * Ship with ready-to-use fakes for XMLHttpRequest, timers and more
 *
 * Chai is an assertion library, similar to Node's built-in assert. 
 * It makes testing much easier by giving you lots of assertions you can run against your code.
 * 
 * Sinon–Chai provides a set of custom assertions for using the Sinon.JS spy, 
 * stub, and mocking framework with the Chai assertion library. 
 * You get all the benefits of Chai with all the powerful tools of Sinon.JS.
 * 
 * Performance-now: Implements a function similar to performance.now (based on process.hrtime).
 * 
 * The fabric-contract-api provides the contract interface a high level API for application 
 * developers to implement Smart Contracts. 
 * Working with this API provides a high level entry point to writing business logic.
 * 
 * The fabric-shim provides the chaincode interface, a lower level API for implementing "Smart Contracts".
*/
const sinon = require('sinon'); 
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const now = require('performance-now');

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const AssetTransfer = require('../lib/assetTransfer.js');

let assert = sinon.assert;
chai.use(sinonChai);

const average = list => list.reduce((min0, max0) => min0 + max0) / list.length;

describe('Asset Transfer Basic Tests', () => {
    let transactionContext, chaincodeStub, asset;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        asset = {
            ID: 'asset1',
            Color: 'blue',
            Size: 5,
            Owner: 'Tomoko',
            AppraisedValue: 300,
        };
    });

    describe('Test CreateAsset Performance', () => {
        it('should return error on CreateAsset', async () => {
            chaincodeStub.putState.rejects('failed inserting key');

            let assetTransfer = new AssetTransfer();
            try {
                await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);
                assert.fail('CreateAsset should have failed');
            } catch(err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('CreateAsset with encryption performance ', async () => {
            let assetTransfer = new AssetTransfer();

            const times = [];

            for(let j = 0; j < 100; j++) {
                let totalTime = 0;
                for(let i = 0; i < 100; i++) {
                    let t0 = now();
                    await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);
                    let t1 = now();
                    totalTime += ( t1 - t0 ) * 1000;
                }
                times.push((totalTime / 100));
            }

            console.log(times);
            console.log('Avg = ', average(times));
        });

        it('CreateAsset without encryption performance ', async () => {
            let assetTransfer = new AssetTransfer();

            const times = [];

            for(let j = 0; j < 100; j++) {
                let totalTime = 0;
                for(let i = 0; i < 100; i++) {
                    let t0 = now();
                    await assetTransfer.CreateAssetNoEncryption(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);
                    let t1 = now();
                    totalTime += ( t1 - t0 ) * 1000;
                }
                times.push((totalTime / 100));
            }

            console.log(times);
            console.log('Avg = ', average(times));
        });
    });


    describe('Test ReadAsset', () => {

        it('ReadAsset with encryption performance', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            const times = [];

            for(let j = 0; j < 100; j++) {
                let totalTime = 0;
                for(let i = 0; i < 100; i++) {
                    let t0 = now();
                    await assetTransfer.ReadAsset(transactionContext, asset.ID);
                    let t1 = now();
                    totalTime += ( t1 - t0 ) * 1000;
                }
                times.push( (totalTime / 100) );
            }

            console.log(times);
            console.log('Avg = ', average(times));
        });

        it('ReadAsset without encryption performance', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            const times = [];

            for(let j = 0; j < 100; j++) {
                let totalTime = 0;
                for(let i = 0; i < 100; i++) {
                    let t0 = now();
                    await assetTransfer.ReadAssetNoDecryption(transactionContext, asset.ID);
                    let t1 = now();
                    totalTime += ( t1 - t0 ) * 1000;
                }
                times.push( (totalTime / 100) );
            }

            console.log(times);
            console.log('Avg = ', average(times));
        });
    });

    
    describe('Test UpdateAsset', () => {

        it('UpdateAsset with encryption performance', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            const times = [];

            for(let j = 0; j < 100; j++) {
                let totalTime = 0;
                for(let i = 0; i < 100; i++) {
                    let t0 = now();
                    await assetTransfer.UpdateAssetEncryption(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);
                    let t1 = now();
                    totalTime += ( t1 - t0 ) * 1000;
                }
                times.push( (totalTime / 100) );
            }

            console.log(times);
            console.log('Avg = ', average(times));
        });

        it('UpdateAsset without encryption performance', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            const times = [];

            for(let j = 0; j < 100; j++) {
                let totalTime = 0;
                for(let i = 0; i < 100; i++) {
                    let t0 = now();
                    await assetTransfer.UpdateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);
                    let t1 = now();
                    totalTime += ( t1 - t0 ) * 1000;
                }
                times.push( (totalTime / 100) );
            }

            console.log(times);
            console.log('Avg = ', average(times));
        });
    });


});