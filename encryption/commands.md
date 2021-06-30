
# current env

echo $CORE_PEER_LOCALMSPID

./network.sh createChannel -c channel4

# Environment variables for Org1

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Setup new chaincode

export CHAINCODE_NAME=simple_encryption8
./network.sh deployCC -ccn ${CHAINCODE_NAME} -ccp ../attacks/simple-encryption/valid-js-chaincode/ -ccl javascript -c mychannel

./network.sh deployCC -ccn pailier_smart_contract7 -ccep "OR('Org1MSP.peer','Org2MSP.peer')" -ccp ../attacks/paillier/chaincode-javascript/ -ccl javascript -c channel2
./network.sh deployCC -ccn good_chaincode_timestamp -ccp ../attacks/timestamp/valid-js-chaincode/ -ccl javascript -c channel2

cd /etc/hyperledger/fabric && touch ledger_encryption.key && echo -n 'v2CFd2QFTJ2hMHyuRnax5' >> ledger_encryption.key


# Initialize ledger

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n ${CHAINCODE_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'


peer chaincode invoke -o localhost:7050 \
--ordererTLSHostnameOverride orderer.example.com \
--tls \
--cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
-C channel2 \
-n pailier_smart_contract7 \
--peerAddresses localhost:7051 \
--tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
-c '{"function":"Vote","Args":["6554013589025466334395531490602802329169868390269260579898608592549334025499352404865147560936969572953118657780955970186142288819102485146458162509884146685758743755033494539452555520496878445793282364341117107630370451678422960568009837121153117790073647535937872726452287254631425446061029985993115575835", "[[\"21209649887877338555656770225100579504155027586108646656332204616356130630380571321440973084850397687533626975762882118539644298949740825750456755570475519738795675352756773855155329814494752872052579074614674663122665821752340035681463873395596440191667691383437106601260550293638785303646716268809640205188\",\"41989883283650802116023616563587139475557108379676166139532461095933817315222946229087937266013730150285838111098488793690916819131492755818709654563034845600743900167032907305013013993148214956215842334655392876199726358101862288373169348188095323188404460433624461088901707517352297078534273658934467776390\"],[\"858198182665962369880123303702646820820576773316532113366270555873227818088\",\"9691414818857618939370389186584104471840392066001803302360481015977314092889094126813530143565996617128704131432050815709564745030002392901424131666718465\"],[\"7087029304598647795250323968350352485948392116714810878225203956536101257902475845859384204032870347170076245428509131589115256779275022839349147568124216\",\"3382134843333163639910643426929988549419308706368757655922208714702971959498295006182113758610173628313792908948027407441141071752976950191046553904008603\"]]"
]}'

# Simple query

peer chaincode query -C channel2 -n pailier_smart_contract7 -c '{"Args":["ReadVoteState", "poll1"]}' | jq

# Read assets
peer chaincode query -C mychannel -n ${CHAINCODE_NAME} -c '{"Args":["ReadAsset","asset1"]}'

peer chaincode query -C channel4 -n simple_encryption1 -c '{"Args":["GetAllTransactions"]}'

peer chaincode query -C channel4 -n simple_encryption8 -c '{"Args":["ReadTransaction", "transaction1"]}'

peer chaincode query -C mychannel -n ${CHAINCODE_NAME} -c '{"Args":["GetAllAssets"]}'


peer chaincode query -C mychannel -n ${CHAINCODE_NAME} -c '{"Args":["CreateTransaction", "transaction5", "Rado", "Kevin", "23"]}'

# Create asset

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n ${CHAINCODE_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CreateAsset","Args":["asset7","Red","23","Maria","2"]}'

