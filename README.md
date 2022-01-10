[//]: # (SPDX-License-Identifier: CC-BY-4.0)

# Secure enhancement for Hyperledger Fabric smart contract

This research extends the research done by this
[paper](https://repository.tudelft.nl/islandora/object/uuid:dbf548c7-849f-4aad-b4b7-455ba4a1835d?collection=education) 

Research paper of this research can be found in the [TU Delft Repository](https://repository.tudelft.nl/islandora/object/uuid:dbf548c7-849f-4aad-b4b7-455ba4a1835d?collection=education) 

## Setup of network

This is a fork from [this research](https://repository.tudelft.nl/islandora/object/uuid:dbf548c7-849f-4aad-b4b7-455ba4a1835d?collection=education) which is also forking from the original fabric samples. 

This repo extends the research by adding secret sharing to it. The symmetric key, which used by Rado, is now shared secretlt between peers using Shamir's secret sharing scheme.
This will increase the security of the encrypted data stored on the ledger.

The numbers of peers has been increased and some folders has been removed for the sake of simplicity.

First navigate to test-network folder:
`cd fabric-samples/test-network`

From inside the test-network directory:
- Bring network down to remove any artifacts from previous work: `./network.sh down`
- Then you can bring it up: `./network.sh up`
- Create a channel: `./network.sh createChannel`
- Start the basic chaincode on the channel: `./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript`

Further documentation on how to install and setup the network can be found [here](https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html).

## Symmetric encryption setup


1. Code is located in `encryption/symmetric-encryption`. 
NOTE! The functions `CreateAssetNoEncryption` and `ReadAssetNoDecryption` will write and read data without applying encryption. They are only used for performance evaluation, and it is encouraged to delete them before installing the chaincode
2. Navigate to the `./test-network` folder
3. Start the network using `./network.sh up`
4. Create a new channel using `./network.sh createChannel`
<!-- 5. Run `export CHAINCODE_NAME=simple_encryption` where simple_encryption can be changed to the needed name of the chaincode -->
5. Run `./network.sh deployCC -ccn simple_encryption -ccp ../encryption/chaincode-javascript/ -ccl javascript -c mychannel` to install the chaincode
7. Run both `export PATH=${PWD}/../bin:$PATH` and `export FABRIC_CFG_PATH=$PWD/../config/`
8. To enter Org1 POV, paste the following in the terminal
```
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```
9. To add the symmetric keys to all peers, enter the chaincode docker container of each peer, and execute the following command: `cd /etc/hyperledger/fabric && touch ledger_encryption.key && echo -n 'SECRET_SYMMETRIC_KEY' >> ledger_encryption.key` where `SECRET_SYMMETRIC_KEY` is the value of the chosen secret key.
10. To initialize the ledger, execute

```
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n ${CHAINCODE_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'
```

11. The chaincode can be used as normal with all functions accessible. For example, to read the data, you can invoke `peer chaincode query -C mychannel -n ${CHAINCODE_NAME} -c '{"Args":["GetAllAssets"]}'`. To read a single asset, `peer chaincode query -C mychannel -n ${CHAINCODE_NAME} -c '{"Args":["ReadAsset","asset1"]}'`. To create a transaction, run `peer chaincode query -C mychannel -n ${CHAINCODE_NAME} -c '{"Args":["CreateTransaction", "transaction5", "Rado", "Kevin", "23"]}'`

### Symmetric encryption performance evaluation

1. Navigate to `./encryption/chaincode-javascript`
2. Run `npm install`
3. Run `npm test`. You will see the chaincode evaluation time for the Read and Write methods, both with and without encryption for comparison.
