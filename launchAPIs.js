//============================lib
var env = require("./env.js");
var express = require('express');
var app = express();
const axios = require('axios');
const InputDataDecoder = require("ethereum-input-data-decoder");
const AbiDecoder = require('abi-decoder');
const fs = require('fs');
const Web3 = require("web3");
const web3ProviderURL = env.web3ProviderURL;
const abiFolder = 'abi';
var web3;

app.use(express.static('public'));
app.use(express.json());

init();

app.get('/', function (req, res) {
   res.sendFile(__dirname + "/public/" + "index.html");
})

app.get('/accountsWithDetails.json', async function (req, res) {
   var accounts = await getAccountsWithDetails();
   res.setHeader('Content-Type', 'application/json');
   res.end(JSON.stringify(accounts, null, 4));
})

app.get('/contractsWithDetails.json', async function (req, res) {
   var accounts = await getContractsWithDetails();
   res.setHeader('Content-Type', 'application/json');
   res.end(JSON.stringify(accounts, null, 4));
})

app.get('/transactionsWithDetails.json', async function(req, res){
      var size = req.query.size ? req.query.size : "100";
      const txns = await getTransactionWithReceiptList(size);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(txns, null, 4));
})

app.get('/decodedTransaction.json', async function(req, res){
      const txnHash = req.query.txnHash;
      const decodedTransaction = await getDecodedTransaction(txnHash);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(decodedTransaction, null, 4));
      //res.end(JSON.stringify(mokTest, null, 4));
})

app.get('/blocks.json', async function(req, res){
    var size = req.query.size ? req.query.size : "100";
    const blocks = await getBlocks(size);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(blocks, null, 4));
})

app.get('/data.json', async function(req, res){
      const data = JSON.parse(await fs.promises.readFile("data.JSON", 'utf8'));
      res.setHeader('Content-Type', 'application/json');
      //pretty print data
      res.end(JSON.stringify(data, null, 4));
})

app.get('/getAccountWithDetailsByAccount.json', async function(req, res){
      const data = await getAccountWithDetailsByAccount(req.query.account);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data, null, 4));
})

app.get('/getTransactionOfAccount.json', async function(req, res){

      const data = await getTransactionOfAccount(req.query.account);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data, null, 4));
})

app.get('/getContractWithDetailsByContract.json', async function(req, res){
      const data = await getContractWithDetailsByContract(req.query.contractAddress);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data, null, 4));
})

app.get('/getBlockWithTransactions.json', async function(req, res){
      const data = await getBlockWithTransactions(req.query.blockNumber);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data, null, 4));
})

app.get("/getABI.json", async function (req, res){
    const contractAddress = req.query.contractAddress;
    const abiFilePath = abiFolder + "/" + contractAddress + ".JSON";
    const abi = await fs.promises.readFile(abiFilePath, "utf8");

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(abi, null, 4));
})

app.get("/isSmartContractAddress", async function (req, res){
    const address = req.query.address;
    const _isSmartContractAddress = await isSmartContractAddress(address);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(_isSmartContractAddress));
})


app.post("/addABI", async function (req, res){


    const abis = req.body;


    for(var i = 0; i < abis.length; i++){
        const abi = abis[i];
        const fileName = "abi/" + abi.address + ".JSON";
        const contractName = abi.abi.contractName;
        res.setHeader('Content-Type', 'application/json');

        const files = await fs.promises.readdir(abiFolder);

        for(var j = 0; j < files.length; j++){
            const filePath = abiFolder + '/' + files[j];
            if(filePath.includes(".JSON")){
                const fileBody = JSON.parse(await fs.promises.readFile(filePath, "utf8"));
                if(fileBody.contractName && (fileBody.contractName == contractName)){
                        fs.unlinkSync(filePath);
                }
            }
        }

        const result = await fs.promises.writeFile(fileName, JSON.stringify(abi.abi));
    }

    res.end(JSON.stringify("success"));

})



var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("listening at http://%s:%s", host, port)
})


//==================================================================================================== apis
async function getAccountsWithDetails(){
    var data = JSON.parse(await fs.promises.readFile("data.JSON", 'utf8'));
    const accounts = data["accounts"];
    const erc20TokenList = data["erc20TokenList"];
    const balances = data["balances"];

    var accountsWithDetails = [];
    for(var i = 0; i < accounts.length; i++){
        var cAddress = Web3.utils.toChecksumAddress(accounts[i]);
        const element = {
              account: cAddress,
              balance: (balances[cAddress] / 10**18).toLocaleString(),
              erc20s: []
        }
        for(var j = 0; j < erc20TokenList.length; j++){
            if(Web3.utils.toChecksumAddress(erc20TokenList[j].account) == Web3.utils.toChecksumAddress(accounts[i])){
                element.erc20s.push(erc20TokenList[j]);
            }
        }

        accountsWithDetails.push(element);
    }

    return accountsWithDetails;
}

async function getAccountWithDetailsByAccount(account){
    var accountsWithDetails = await getAccountsWithDetails();
    for(var i = 0; i < accountsWithDetails.length; i++){
        if(accountsWithDetails[i].account == account){
            return [accountsWithDetails[i]];
        }
    }
}

async function getContractWithDetailsByContract(contractAddress){
  var contractsWithDetails = await getContractsWithDetails(); ///
  for(var i = 0; i < contractsWithDetails.length; i++){
      if(contractsWithDetails[i].contractAddress == contractAddress){
          return [contractsWithDetails[i]];
      }
  }
}

async function getTransactionOfAccount(account){

    const allTransactions = await getTransactionWithReceiptList(10000);
    const transactionOfAccount = [];

    for(var i = 0; i < allTransactions.length; i++){
        if(allTransactions[i].from == account || allTransactions[i].to == account){
            transactionOfAccount.push(allTransactions[i]);
        }
    }

    return transactionOfAccount;
}

async function getContractsWithDetails(){
    const data = JSON.parse(await fs.promises.readFile("data.JSON", 'utf8'));
    const contracts = data["contracts"];
    const erc20TokenList = data["erc20TokenList"];

    var contractsWithDetails = [];

    const balances = data["balances"];


    const files = await fs.promises.readdir('abi');

    for(var i = 0; i < contracts.length; i++){

        if(!files.includes(contracts[i].contractAddress + ".JSON")){
            continue;
        }

        const element = contracts[i];
        element["contractName"] = JSON.parse(await fs.promises.readFile("abi/" + contracts[i].contractAddress + ".JSON", 'utf8')).contractName;
        element["balance"] = (balances[element.contractAddress] / 10**18).toLocaleString();
        element["age"] = await timeDifference(element["timestamp"]);
        element["erc20s"] = [];
        for(var j = 0; j < erc20TokenList.length; j++){
            if(Web3.utils.toChecksumAddress(erc20TokenList[j].account) == Web3.utils.toChecksumAddress(contracts[i].contractAddress)){
                element["erc20s"].push(erc20TokenList[j]);
            }
        }

        contractsWithDetails.push(element);
    }

    return contractsWithDetails;
}

async function getTransactionWithReceiptList(size, blockNumber){
    const data = JSON.parse(await fs.promises.readFile("data.JSON", 'utf8'));
    var transactionWithReceiptList = data["transactionWithReceiptList"];

    transactionWithReceiptList = transactionWithReceiptList.reverse();

    const txnToShow = [];

    var _size = size > transactionWithReceiptList.length ? transactionWithReceiptList.length : size;

    for(var i = 0; i < _size; i++){
        if(blockNumber && transactionWithReceiptList[i].blockNumber != blockNumber){
            continue;
        }

        transactionWithReceiptList[i]["age"] = await timeDifference(transactionWithReceiptList[i]["timestamp"]);
        transactionWithReceiptList[i]["valueInEther"] = Web3.utils.fromWei(transactionWithReceiptList[i]["value"], "ether");

        if(transactionWithReceiptList[i].to){
            transactionWithReceiptList[i]["isToContractAddress"] = await isSmartContractAddress(transactionWithReceiptList[i].to);
        }

        txnToShow.push(transactionWithReceiptList[i]);
    }

    return txnToShow;
}


async function getBlocks(size, blockNumber){
    const data = JSON.parse(await fs.promises.readFile("data.JSON", 'utf8'));
    var blocks = data["blocks"];

    blocks = blocks.reverse();

    const blocksToShow = [];

    var _size = size > blocks.length ? blocks.length : size;

    for(var i = 0; i < _size; i++){
        if(blockNumber && blockNumber != blocks[i].number){
            continue;
        }

        blocks[i]["age"] = await timeDifference(blocks[i]["timestamp"]);
        blocksToShow.push(blocks[i]);
    }

    return blocksToShow;
}

async function getBlockWithTransactions(blockNumber){
    const block = await getBlocks(9999, blockNumber);
    const transactions = await getTransactionWithReceiptList(9999, blockNumber);

    return {
        block: block,
        transactions: transactions
    }
}

async function getDecodedTransaction(txnHash){
    //find tx
    const txn = await web3.eth.getTransaction(txnHash);
    //find receipt
    const receipt = await web3.eth.getTransactionReceipt(txnHash);
    //find block
    const block = await web3.eth.getBlock(txn.blockNumber);

    //find abi of "to" - check local and then etherscan
    const toAbi = await findABI(txn.to);
    //decode input data
    var decodedInputData;
    if(toAbi){
        decodedInputData = await decodeInputData(txn.input, toAbi)
    }
    //each log - find "address", do callout to etherscan for ABI, decode log
    const logs = receipt.logs;
    const abiArray = [];
    for(var i = 0; i < logs.length; i++){
        abiArray.push(await findABI(logs[i].address));
    }

    const decodedLogs = await decodeLogs(abiArray, logs);

    const result = txn;
    result["gasFeeInETH"] = await gasFeeInETH(txn);
    result["gasPrice"] = Web3.utils.fromWei(result["gasPrice"], "gwei");
    result["timestamp"] = block.timestamp;
    result["age"] = await timeDifference(block.timestamp);
    result["decodedInputData"] = decodedInputData;
    result["receiptWithDecodedLogs"] = receipt;
    result["receiptWithDecodedLogs"]["DecodedLogs"] = decodedLogs;

    result["enhancedTransferEvents"] = await enhancedTransferEventList(result.receiptWithDecodedLogs.DecodedLogs);


    return result;

}

async function init(){
    web3 = await initWeb3(web3ProviderURL);
}

async function initWeb3(_web3ProviderURL){
    return new Web3(new Web3.providers.HttpProvider(_web3ProviderURL));
}

async function findABI(contractAddress){
    const localABI = await findLocalABI(contractAddress);
    var result;

    if(localABI){
        result = localABI;
    }else{
        //callout to etherscan
        //https://api.etherscan.io/api?module=contract&action=getabi&address=0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413&apikey=
        result = await findEtherscanABI(contractAddress);
    }

    return result;
}

async function findLocalABI(contractAddress){

    const files = await fs.promises.readdir(abiFolder);
    var result;

    for(var i = 0; i < files.length; i++){
        const abiFileName = contractAddress + '.JSON';
        if(files.includes(abiFileName)){
            result = JSON.parse(await fs.promises.readFile(abiFolder + '/' + abiFileName, 'utf8')).abi;
            break;
        }
    }

    return result;
}

async function findEtherscanABI(contractAddress){
    try{
        const etherscanGetAbiUrl = "https://api.etherscan.io/api?module=contract&action=getabi"
                                  + "&address=" + contractAddress
                                  + "&apikey=" + env.etherscanApiKey;
        const etherscanABI = (await axios.get(etherscanGetAbiUrl)).data.result;
        return JSON.parse(etherscanABI);
    }catch(e){
        console.log("ABI not found - error in findEtherscanABI - contractAddress: ", contractAddress);
    }
}

//TBB
async function gasFeeInETH(rawTxn){
    return Web3.utils.fromWei(Web3.utils.toBN(rawTxn.gasPrice * rawTxn.gas), "ether");
}

//TBB
async function enhancedTransferEventList(decodedLogs){
  //const erc20 = new web3.eth.Contract(await getERC20ABI(), address);
    const enhancedTransferEventList = [];
    for(var i = 0; i < decodedLogs.length; i++){
        const element = decodedLogs[i];
        const erc20 = await isERC20TransferEvent(element);

        if(erc20){
            element["ERC20"] = {};
            element["ERC20"]["decimals"] = await erc20.methods.decimals().call();
            element["ERC20"]["name"] = await erc20.methods.name().call();
            element["ERC20"]["symbol"] = await erc20.methods.symbol().call();
            element["events"][2]["amountText"] = (element["events"][2]["value"] / 10**element["ERC20"]["decimals"]).toString() + " " + element["ERC20"]["symbol"];

            enhancedTransferEventList.push(element);
        }
    }

    return enhancedTransferEventList;
}

async function isSmartContractAddress(address){
    const code = await web3.eth.getCode(web3.utils.toChecksumAddress(address));
    if(code == "0x"){
        return false;
    }

    return true;
}



async function getERC20ABI(){
    return JSON.parse(await fs.promises.readFile(abiFolder + "/standard/ERC20.json"));
}

async function isERC20TransferEvent(log){
    if(log.name != "Transfer"){
        return false;
    }

    if(log.events.length != 3){

        return false;
    }

    if(!(log.events[0].name == "from" && log.events[0].type == "address")){
        return false;
    }

    if(!(log.events[1].name == "to" && log.events[1].type == "address")){
        return false;
    }

    if(!(log.events[2].name == "amount" && log.events[2].type == "uint256")){
        return false;
    }

    const erc20 = new web3.eth.Contract(await getERC20ABI(), log.address);

    if(!erc20.methods.decimals().call()){
        return false;
    }

    if(!erc20.methods.name().call()){
        return false;
    }

    if(!erc20.methods.symbol().call()){
        return false;
    }

    return erc20;
}


async function decodeInputData(input, abi){
    const decoder = new InputDataDecoder(abi);
    const decodedInputData = decoder.decodeData(input);

    return decodedInputData;
}

async function decodeLogs(abiArray, logs){
    for(var i = 0; i < abiArray.length; i++){
        AbiDecoder.addABI(abiArray[i]);
    }

    const result = AbiDecoder.decodeLogs(logs);

    for(var i = 0; i < result.length; i++){
        if(!result[i]){
            result[i] = {
                topics: logs[i].topics,
                data: logs[i].data,
                address: logs[i].address
            }
        }
    }

    return result;
}

async function timeDifference(timestamp) {
    var current = Date.now();

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - new Date(timestamp * 1000);

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';
    }

    else if (elapsed < msPerMonth) {
         return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';
    }

    else if (elapsed < msPerYear) {
         return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';
    }

    else {
         return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';
    }
}
