
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
    return JSON.parse(await $.get("/getABI.json?contractAddress=" + contractAddress)).abi;
}

async function getBlockWithTransactions(blockNumber){
    return await $.get("/getBlockWithTransactions.json?blockNumber=" + blockNumber);
}

async function isSmartContractAddress(address){
    return JSON.parse(await $.get("/isSmartContractAddress?address=" + address));
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
    isSmartContractAddress
}
