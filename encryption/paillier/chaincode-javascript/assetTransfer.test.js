/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const VoteChaincode = require('./lib/voteChaincode.js');

let assert = sinon.assert;
chai.use(sinonChai);

const transactionContext = new Context();

const chaincodeStub = sinon.createStubInstance(ChaincodeStub);

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


const numToadd = '6554013589025466334395531490602802329169868390269260579898608592549334025499352404865147560936969572953118657780955970186142288819102485146458162509884146685758743755033494539452555520496878445793282364341117107630370451678422960568009837121153117790073647535937872726452287254631425446061029985993115575835'
const proof = [["21209649887877338555656770225100579504155027586108646656332204616356130630380571321440973084850397687533626975762882118539644298949740825750456755570475519738795675352756773855155329814494752872052579074614674663122665821752340035681463873395596440191667691383437106601260550293638785303646716268809640205188","41989883283650802116023616563587139475557108379676166139532461095933817315222946229087937266013730150285838111098488793690916819131492755818709654563034845600743900167032907305013013993148214956215842334655392876199726358101862288373169348188095323188404460433624461088901707517352297078534273658934467776390"],["858198182665962369880123303702646820820576773316532113366270555873227818088","9691414818857618939370389186584104471840392066001803302360481015977314092889094126813530143565996617128704131432050815709564745030002392901424131666718465"],["7087029304598647795250323968350352485948392116714810878225203956536101257902475845859384204032870347170076245428509131589115256779275022839349147568124216","3382134843333163639910643426929988549419308706368757655922208714702971959498295006182113758610173628313792908948027407441141071752976950191046553904008603"]]
transactionContext.setChaincodeStub(chaincodeStub);

( async () => {
    let assetTransfer = new VoteChaincode();
    try {
        let a = await assetTransfer.InitLedger(transactionContext);
        console.log(a)
        let ret = JSON.parse((await chaincodeStub.getState('poll1')).toString());
        
        console.log(ret)

        let b = await assetTransfer.Vote(transactionContext, numToadd, JSON.stringify(proof));
        console.log(b)
        b = await assetTransfer.Vote(transactionContext, numToadd, JSON.stringify(proof));
        console.log(b)
        b = await assetTransfer.Vote(transactionContext, numToadd, JSON.stringify(proof));
        console.log(b)
    } catch (err) {
        expect(err.name).to.equal('failed inserting key');
    }
})()

return;

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

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let assetTransfer = new AssetTransfer();
            try {
                await assetTransfer.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState('asset1')).toString());
            expect(ret).to.eql(Object.assign({docType: 'asset'}, asset));
        });
    });

    describe('Test CreateAsset', () => {
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

        it('should return success on CreateAsset', async () => {
            let assetTransfer = new AssetTransfer();

            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            let ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(ret).to.eql(asset);
        });
    });

    describe('Test ReadAsset', () => {
        it('should return error on ReadAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            try {
                await assetTransfer.ReadAsset(transactionContext, 'asset2');
                assert.fail('ReadAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset asset2 does not exist');
            }
        });

        it('should return success on ReadAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            expect(ret).to.eql(asset);
        });
    });

    describe('Test UpdateAsset', () => {
        it('should return error on UpdateAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            try {
                await assetTransfer.UpdateAsset(transactionContext, 'asset2', 'orange', 10, 'Me', 500);
                assert.fail('UpdateAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset asset2 does not exist');
            }
        });

        it('should return success on UpdateAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            await assetTransfer.UpdateAsset(transactionContext, 'asset1', 'orange', 10, 'Me', 500);
            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            let expected = {
                ID: 'asset1',
                Color: 'orange',
                Size: 10,
                Owner: 'Me',
                AppraisedValue: 500
            };
            expect(ret).to.eql(expected);
        });
    });

    describe('Test DeleteAsset', () => {
        it('should return error on DeleteAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            try {
                await assetTransfer.DeleteAsset(transactionContext, 'asset2');
                assert.fail('DeleteAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset asset2 does not exist');
            }
        });

        it('should return success on DeleteAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            await assetTransfer.DeleteAsset(transactionContext, asset.ID);
            let ret = await chaincodeStub.getState(asset.ID);
            expect(ret).to.equal(undefined);
        });
    });

    describe('Test TransferAsset', () => {
        it('should return error on TransferAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            try {
                await assetTransfer.TransferAsset(transactionContext, 'asset2', 'Me');
                assert.fail('DeleteAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset asset2 does not exist');
            }
        });

        it('should return success on TransferAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.ID, asset.Color, asset.Size, asset.Owner, asset.AppraisedValue);

            await assetTransfer.TransferAsset(transactionContext, asset.ID, 'Me');
            let ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(ret).to.eql(Object.assign({}, asset, {Owner: 'Me'}));
        });
    });

    describe('Test GetAllAssets', () => {
        it('should return success on GetAllAssets', async () => {
            let assetTransfer = new AssetTransfer();

            await assetTransfer.CreateAsset(transactionContext, 'asset1', 'blue', 5, 'Robert', 100);
            await assetTransfer.CreateAsset(transactionContext, 'asset2', 'orange', 10, 'Paul', 200);
            await assetTransfer.CreateAsset(transactionContext, 'asset3', 'red', 15, 'Troy', 300);
            await assetTransfer.CreateAsset(transactionContext, 'asset4', 'pink', 20, 'Van', 400);

            let ret = await assetTransfer.GetAllAssets(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(4);

            let expected = [
                {Record: {ID: 'asset1', Color: 'blue', Size: 5, Owner: 'Robert', AppraisedValue: 100}},
                {Record: {ID: 'asset2', Color: 'orange', Size: 10, Owner: 'Paul', AppraisedValue: 200}},
                {Record: {ID: 'asset3', Color: 'red', Size: 15, Owner: 'Troy', AppraisedValue: 300}},
                {Record: {ID: 'asset4', Color: 'pink', Size: 20, Owner: 'Van', AppraisedValue: 400}}
            ];

            expect(ret).to.eql(expected);
        });

        it('should return success on GetAllAssets for non JSON value', async () => {
            let assetTransfer = new AssetTransfer();

            chaincodeStub.putState.onFirstCall().callsFake((key, value) => {
                if (!chaincodeStub.states) {
                    chaincodeStub.states = {};
                }
                chaincodeStub.states[key] = 'non-json-value';
            });

            await assetTransfer.CreateAsset(transactionContext, 'asset1', 'blue', 5, 'Robert', 100);
            await assetTransfer.CreateAsset(transactionContext, 'asset2', 'orange', 10, 'Paul', 200);
            await assetTransfer.CreateAsset(transactionContext, 'asset3', 'red', 15, 'Troy', 300);
            await assetTransfer.CreateAsset(transactionContext, 'asset4', 'pink', 20, 'Van', 400);

            let ret = await assetTransfer.GetAllAssets(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(4);

            let expected = [
                {Record: 'non-json-value'},
                {Record: {ID: 'asset2', Color: 'orange', Size: 10, Owner: 'Paul', AppraisedValue: 200}},
                {Record: {ID: 'asset3', Color: 'red', Size: 15, Owner: 'Troy', AppraisedValue: 300}},
                {Record: {ID: 'asset4', Color: 'pink', Size: 20, Owner: 'Van', AppraisedValue: 400}}
            ];

            expect(ret).to.eql(expected);
        });
    });
});
