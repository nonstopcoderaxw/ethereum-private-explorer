//============================vars
const interval = process.argv[2];//0;
const reset = process.argv[3];//true;
//============================lib
const fs = require('fs');
const ABIMethod = require("./ABIMethod.js");
const AbiDecoder = require('abi-decoder');
const InputDataDecoder = require("ethereum-input-data-decoder");
//==============================web3
const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const env = require("./env.js");

const web3ProviderURL = env.web3ProviderURL;
var web3;
var abiERC20 = require("./abi/standard/ERC20.json");
var data;
//data structure
const dataObj = {
    accounts: [],
    firstPrivateBlock: null,
    lastScannedBlock: null,
    erc20TokenList: [],
    contracts: [],
    balances: {},
    transactionWithReceiptList: [],
    blocks: []
};

const erc20TokenListElementObj = {
    tokenAddress: null,
    account: null,
    name: null,
    symbol: null,
    decimals: null,
    balance: null
  }

const contractsElementObj = {
    contractAddress: null,
    account: null,
    blockNumber: null,
    timestamp: null
}

const transactionWithReceiptListElementObj = {
    hash: null,
    blockHash: null,
    blockNumber: null,
    transactionIndex: null,
    from: null,
    to: null,
    value: null,
    gas: null,
    gasPrice: null,
    input: null,
    timestamp: null,
    receipt: {
        status: null,
        contractAddress: null,
        cumulativeGasUsed: null,
        gasUsed: null,
        logs: []
    }
}

const blockElementObj = {
    number: null,
    hash: null,
    parentHash: null,
    nonce: null,
    sha3Uncles: null,
    logsBloom: null,
    transactionsRoot: null,
    stateRoot: null,
    miner: null,
    difficulty: null,
    size: null,
    extraData: null,
    gasLimit: null,
    gasUsed: null,
    timestamp: null,
    count: null
}



//==============================web3


//==================================================================================================== web3

main();

async function main(){
    await init();

    if(reset === "true"){ await createFile("data.JSON", ""); }

    var dataFileContent;
    try{
        dataFileContent = await fs.promises.readFile("data.JSON", 'utf8');
    }catch(e){
        await createFile("data.JSON", "");
    }


    if(!dataFileContent){
        data = Object.assign({}, dataObj);
        data["accounts"] = await getAccounts();
        data["firstPrivateBlock"] = await getFirstPrivateBlock(data["accounts"]);
        data["lastScannedBlock"] = data["firstPrivateBlock"];
    }else{
        data = JSON.parse(dataFileContent);
    }

    scanTxn();
}

//tide up as next step
async function scanTxn(){


    //data
    var erc20TokenAddressesMap = await getErc20TokenAddressesMap();
    var accounts = data["accounts"];
    var contractsMap = await getContractsMap();
    var balances = data["balances"];
    var blocks = data["blocks"];
    var transactionWithReceiptList = data["transactionWithReceiptList"];
    //block info
    var scanningBlock;
    const firstPrivateBlock = data["firstPrivateBlock"];
    var lastScannedBlock = data["lastScannedBlock"];
    const currentBlock = await web3.eth.getBlockNumber();

    //others
    var allAddresses = [];
    console.log("lastScannedBlock", lastScannedBlock);
    console.log("currentBlock", currentBlock);
    while(lastScannedBlock != currentBlock){
        scanningBlock = lastScannedBlock + 1;

        const theBlock = await getBlock(scanningBlock);
        blocks.push(theBlock);

        const numberOfTxnOfTheBlock = theBlock.count;

        if(numberOfTxnOfTheBlock == 0){
            lastScannedBlock = scanningBlock;
            continue;
        }

        if(numberOfTxnOfTheBlock > 0){

              // to be reviewed START - process one block

              for(var i = 0; i < numberOfTxnOfTheBlock; i++){

                      const txn = await web3.eth.getTransactionFromBlock(scanningBlock, i);
                      const txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);                      //@refresh accounts
                      accounts = await getAccounts();
                      //@check if the block is private
                      if(!accounts.includes(txn.from)){throw new Error("Please restart the block explorer!");}
                      //@ERC20 List
                      const tokenDetailsList = await getERC20ListByTxn(txn);
                      if(tokenDetailsList.length > 0){
                          for(var _i = 0; _i < tokenDetailsList.length; _i++){
                              const tokenDetails = tokenDetailsList[_i];

                              erc20TokenAddressesMap.set(Web3.utils.toChecksumAddress(tokenDetails.account) +
                                                         Web3.utils.toChecksumAddress(tokenDetails.tokenAddress),
                                                         tokenDetails);
                          }
                      }

                      //@Contracts and their details including ERC20s list for each contract
                      if(!txn.to){
                            const contractWithDetails = await getContractsByTxnReceipt(txnReceipt, scanningBlock, theBlock.timestamp, txn.from);
                            contractsMap.set(contractWithDetails.contractAddress, contractWithDetails);

                      }
                      const contractsList = await getContractAddressListFromMap(contractsMap);
                      //@refresh balances
                      allAddresses = allAddresses.concat(accounts);
                      allAddresses = allAddresses.concat(contractsList);

                      balances = await getBalances(allAddresses);

                      //@transactions
                      const transactionWithReceiptListElement = await getTransactionWithReceiptList(txn, txnReceipt, theBlock.timestamp);
                      transactionWithReceiptList.push(transactionWithReceiptListElement);


                }
                lastScannedBlock = scanningBlock;

                data["erc20TokenList"] = Array.from(erc20TokenAddressesMap.values());
                //refresh the balance of each ERC20
                data["erc20TokenList"] = await refreshBalance(data["erc20TokenList"]);

                break;

          }
          // to be reviewed END

      }

      //commit changes
      data["accounts"] = accounts;
      data["contracts"] = Array.from(contractsMap.values());
      data["balances"] = balances;
      data["lastScannedBlock"] = lastScannedBlock;
      data["transactionWithReceiptList"] = transactionWithReceiptList;
      data["blocks"] = blocks;





      const existingData = await readFile("data.JSON");

      if(JSON.stringify(data) != existingData){
          const status = await createFile("data.JSON", JSON.stringify(data));
          if(status){
              console.log("data: ", data);
              console.log("data updated to the block - " + data["lastScannedBlock"]);
          }
      }

      setTimeout(scanTxn, interval);
}

async function getErc20TokenAddressesMap(){
      var erc20TokenAddressesMap = new Map();
      if(data["erc20TokenList"].length > 0){
          for(var i = 0; i < data["erc20TokenList"].length; i++){
              erc20TokenAddressesMap.set(Web3.utils.toChecksumAddress(data["erc20TokenList"][i].account) +
                                         Web3.utils.toChecksumAddress(data["erc20TokenList"][i].tokenAddress),
                                         data["erc20TokenList"][i]);
          }
      }

      return erc20TokenAddressesMap;
}


async function getContractsMap(){
      var contractsMap = new Map();

      if(data["contracts"].length > 0){
          for(var i = 0; i < data["contracts"].length; i++){
              contractsMap.set(data["contracts"][i].contractAddress, data["contracts"][i]);
          }
      }

      return contractsMap;
}

async function getContractAddressListFromMap(contractsMap){
      const contractsList = [];
      const contractObjectList = Array.from(contractsMap.values());
      for(var i = 0; i < contractObjectList.length; i++){
          contractsList.push(web3.utils.toChecksumAddress(contractObjectList[i].contractAddress));
      }

      return contractsList;
}

async function getERC20ListByTxn(txn){
      const result = [];

      var txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
      const logs = txnReceipt.logs;
      //check if txn.from is beyond the node accounts, throw an error
      if(logs.length > 0){
          //retrieve all ERC20 ABIs - Transfer event can have some difference in ABI
          AbiDecoder.addABI(abiERC20);

          var decodedLogs = AbiDecoder.decodeLogs(txnReceipt.logs);

          for(var x = 0; x < decodedLogs.length; x++){
              if(decodedLogs[x] && decodedLogs[x].name == "Transfer"){
                  const tokenAddress = decodedLogs[x].address;
                  const from = decodedLogs[x].events[0].value;
                  const to = decodedLogs[x].events[1].value;
                  const erc20Contract = new web3.eth.Contract(abiERC20, tokenAddress);
                  const decimals = await erc20Contract.methods.decimals().call();
                  const erc20Balance = await erc20Contract.methods.balanceOf(to).call();
                  const name = await erc20Contract.methods.name().call();
                  const symbol = await erc20Contract.methods.symbol().call();

                  if(erc20Balance != 0){
                      const erc20TokenListElement = Object.assign({}, erc20TokenListElementObj);
                      erc20TokenListElement["tokenAddress"] = tokenAddress;
                      erc20TokenListElement["account"] = to;
                      erc20TokenListElement["name"] = name;
                      erc20TokenListElement["symbol"] = symbol;
                      erc20TokenListElement["decimals"] = decimals;
                      erc20TokenListElement["balance"] = (erc20Balance / 10**decimals).toFixed(2);

                      result.push(erc20TokenListElement);
                  }
              }
          }
      }

      return result;
}

async function refreshBalance(erc20TokenList){
    for(var i = 0; i < erc20TokenList.length; i++){
        const erc20Contract = new web3.eth.Contract(abiERC20, erc20TokenList[i].tokenAddress);
        const decimals = await erc20Contract.methods.decimals().call();
        const erc20Balance = await erc20Contract.methods.balanceOf(erc20TokenList[i].account).call();

        erc20TokenList["erc20Balance"] = erc20Balance;
    }

    return erc20TokenList;
}

async function getContractsByTxnReceipt(txnReceipt, blockNumber, timestamp, from){
      const contractAddress = txnReceipt.contractAddress;
      var contractJSONFile;
/**
       try{
         contractJSONFile = await fs.promises.readFile('abi/' + txnReceipt.contractAddress + ".JSON", 'utf8');
       }catch(e){
           //file not found
       }
**/

       var contractWithDetails = Object.assign({}, contractsElementObj);

       contractWithDetails["contractAddress"] = contractAddress;
       contractWithDetails["account"] = from;
       contractWithDetails["blockNumber"] = blockNumber;
       contractWithDetails["timestamp"] = timestamp;


       return contractWithDetails;
}

async function getTransactionWithReceiptList(txn, receipt, timestamp){
      const transactionWithReceiptListElement = Object.assign({}, transactionWithReceiptListElementObj);

      var inputData;
      var logs;


      /*
      try{
          var abi = require("./abi/" + txn.to + ".JSON").abi;

          var input = txn.input;
          const decoder = new InputDataDecoder(abi);
          const inputData = decoder.decodeData(input);

          AbiDecoder.addABI(abi);

      }catch(e){

      }
      */
      //AbiDecoder.addABI(abiERC20);
      //logs = AbiDecoder.decodeLogs(receipt.logs);

      transactionWithReceiptListElement["hash"] = txn.hash;
      transactionWithReceiptListElement["blockHash"] = txn.blockHash;
      transactionWithReceiptListElement["blockNumber"] = txn.blockNumber;
      transactionWithReceiptListElement["transactionIndex"] = txn.transactionIndex;
      transactionWithReceiptListElement["from"] = txn.from;
      transactionWithReceiptListElement["to"] = txn.to;
      transactionWithReceiptListElement["value"] = txn.value;
      transactionWithReceiptListElement["gas"] = txn.gas;
      transactionWithReceiptListElement["gasPrice"] = txn.gasPrice;
      transactionWithReceiptListElement["input"] = txn.input;
      transactionWithReceiptListElement["timestamp"] = timestamp;
      transactionWithReceiptListElement["receipt"] = {
                                                        status: receipt.status,
                                                        contractAddress: receipt.contractAddress,
                                                        cumulativeGasUsed: receipt.cumulativeGasUsed,
                                                        gasUsed: receipt.gasUsed,
                                                        logs: receipt.logs
                                                    }


      return transactionWithReceiptListElement;
}

async function getBlock(blockNumber){

    const _block = await web3.eth.getBlock(blockNumber);

    const theBlock = Object.assign({}, blockElementObj);

    theBlock.number = _block.number;
    theBlock.hash = _block.hash;
    theBlock.parentHash = _block.parentHash;
    theBlock.nonce = _block.nonce;
    theBlock.sha3Uncles = _block.sha3Uncles;
    theBlock.logsBloom = _block.logsBloom;
    theBlock.transactionsRoot = _block.transactionsRoot;
    theBlock.stateRoot = _block.stateRoot;
    theBlock.difficulty = _block.difficulty;
    theBlock.miner = _block.miner;
    theBlock.size = _block.size;
    theBlock.extraData = _block.extraData;
    theBlock.gasLimit = _block.gasLimit;
    theBlock.gasUsed = _block.gasUsed;
    theBlock.timestamp = _block.timestamp;
    theBlock.count = _block.transactions.length;

    return theBlock;
}




async function getAccounts(){
    var accounts = await web3.eth.personal.getAccounts();
    return accounts;
}

async function getBalances(accounts){
    var calls = [];

    var balancesByAccount = {}

    for(var i = 0; i < accounts.length; i++){
        calls.push(web3.eth.getBalance(accounts[i]));
    }

    var result = await Promise.all(calls);

    for(var i = 0; i < accounts.length; i++){
        balancesByAccount[accounts[i]] = result[i];
    }

    return balancesByAccount;
}


async function getFirstPrivateBlock(accounts){

    try{
      const currentBlockNumber = await web3.eth.getBlockNumber();
      for(var i = currentBlockNumber; currentBlockNumber > 0; i--){
          const numberOfTxnOfTheBlock = await web3.eth.getBlockTransactionCount(i);

          if(numberOfTxnOfTheBlock > 0){
              const blockNumber = i;
              const txns = await web3.eth.getTransactionFromBlock(blockNumber, 0);
              if(!accounts.includes(txns.from)){
                  return blockNumber + 1;
              }
          }
      }
    }catch(e){
        console.log("err in getFirstPrivateBlock: ", e);
        throw (e.message);
    }

}



async function playground(){
    var blockNumber;
    var transactionHash;
    var abi = require("../build/contracts/CompAgentImplementationV2.json").abi;
    var abiERC20 = require("../build/contracts/IERC20.json").abi;


    var accounts = await web3.eth.personal.getAccounts();
    console.log("================================================================================");
    console.log("accounts: ", accounts);
    console.log("================================================================================");

    var currentBlock = await web3.eth.getBlockNumber();
    console.log("the current block number: ", currentBlock);
    console.log("================================================================================");

    blockNumber = "11326179";

    var transactionCount = await web3.eth.getBlockTransactionCount(blockNumber);
    console.log("the transaction count of a given block ", transactionCount);
    console.log("================================================================================");

    var transactionFromBlock = await web3.eth.getTransactionFromBlock(blockNumber, 0);
    console.log("the transaction of a given block and index ", transactionFromBlock);
    console.log("================================================================================");

    transactionHash = "0x91ff6001b6b33f62b9a81304d9004d1539b3388ce7aa96a5ff51b20b16a15d04";
    var transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
    console.log("the transaction receipt of a given tx hash ", JSON.stringify(transactionReceipt));
    console.log("================================================================================");


    //decode transaction input data
    const InputDataDecoder = require("ethereum-input-data-decoder");
    abi = require("../build/contracts/CompAgentImplementationV2.json").abi;
    var transactionByHash = await web3.eth.getTransaction(transactionHash);
    var inputData = transactionByHash.input;
    const decoder = new InputDataDecoder(abi);
    const decodedInputData = decoder.decodeData(inputData);
    //continue to write the BN parse
    var inputDataTypes = decodedInputData.types;
    for(var i = 0; i < inputDataTypes.length; i++){
        if(inputDataTypes[i].includes("uint") && web3.utils.isBN(decodedInputData.inputs[i])){
            decodedInputData.inputs[i] = decodedInputData.inputs[i].toString();
        }
    }
    console.log("Decoded Input Data: ", decodedInputData);
    console.log("================================================================================");

    //decode receipt logs
    const AbiDecoder = require('abi-decoder');
    var transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
    AbiDecoder.addABI(abi);
    AbiDecoder.addABI(abiERC20);
    var decodedLogs = AbiDecoder.decodeLogs(transactionReceipt.logs);

    console.log("Decoded log: ", decodedLogs);
    console.log("================================================================================");

}

async function init(){
    web3 = await initWeb3(web3ProviderURL);
}


async function initWeb3(_web3ProviderURL){
    return new Web3(new Web3.providers.HttpProvider(_web3ProviderURL));
}

//==================================================================================================== utils
async function createFile(fileName, body){
    await fs.promises.writeFile(fileName, body);
    return true;
}

async function readFile(fileName){
    return await fs.promises.readFile(fileName, 'utf8');
}
