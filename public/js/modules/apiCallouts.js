
async function getAccountsWithDetails(){
    return await $.get("/accountsWithDetails.json");
}

async function getContractsWithDetails(){
    return await $.get("/contractsWithDetails.json");
}

async function getTransactionWithReceiptList(size){
    return await $.get("/transactionsWithDetails.json?size=" + size);
}

async function getBlocks(size){
    return await $.get("/blocks.json?size=" + size);
}

async function getDecodedTransaction(txnHash){
    return await $.get("/decodedTransaction.json?txnHash=" + txnHash);
}

async function getDecodeLogs(abiArray, logs){

    return await $.ajax({
                    url:"/decodeLogs",
                    type:"POST",
                    data: JSON.stringify({abiArray: abiArray, logs: logs}),
                    contentType:"application/json; charset=utf-8",
                    dataType:"json"
                });
}

async function getAccountWithDetailsByAccount(account){
    return await $.get("/getAccountWithDetailsByAccount.json?account=" + account);
}

async function getTransactionOfAccount(account){
    return await $.get("/getTransactionOfAccount.json?account=" + account);
}

async function getContractWithDetailsByContract(contractAddress){
    return await $.get("/getContractWithDetailsByContract.json?contractAddress=" + contractAddress);
}

async function getABIByContractAddress(contractAddress){
    return await $.get("/getABI.json?contractAddress=" + contractAddress);
}

async function getBlockWithTransactions(blockNumber){
    return await $.get("/getBlockWithTransactions.json?blockNumber=" + blockNumber);
}

async function isSmartContractAddress(address){
    return JSON.parse(await $.get("/isSmartContractAddress?address=" + address));
}

async function forkedAtBlockNumber(){
    return JSON.parse(await $.get("/forkedAtBlockNumber"));
}

async function findTokenAddressBySymbol(symbol){
    return await $.get("/findTokenDetailsBySymbol?symbol=" + symbol);
}



export{
    getAccountsWithDetails,
    getContractsWithDetails,
    getTransactionWithReceiptList,
    getBlocks,
    getDecodedTransaction,
    getAccountWithDetailsByAccount,
    getTransactionOfAccount,
    getContractWithDetailsByContract,
    getABIByContractAddress,
    getBlockWithTransactions,
    isSmartContractAddress,
    forkedAtBlockNumber,
    getDecodeLogs,
    findTokenAddressBySymbol
}
