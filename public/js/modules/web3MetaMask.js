
var web3;

async function initEthereum(_web3){
    ethereum.autoRefreshOnNetworkChange = false;
    web3 = _web3;
}

async function connectToMetaMask(){

    try{
        await window.ethereum.enable();
        const account = (await web3.eth.getAccounts())[0];
        console.log("Connected to this account: ", account);

        return account;

    }catch(e){
        console.log("connection failed!");
    }
}

export{
    initEthereum,
    connectToMetaMask
}
