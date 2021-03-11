var env = require("./env.js");
const axios = require('axios');
const Web3 = require("web3");
const fs = require('fs');
const knownAddresses = require("./knownAddresses");
const web3ProviderURL = env.web3ProviderURL;
const abiFolder = 'abi';
var web3;

init();

const knownProxyContractPair = knownAddresses.knownProxyContractPair;

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

        if(knownProxyContractPair[contractAddress]){
            if(knownProxyContractPair[contractAddress].includes("0x")){
                const proxyContract = new web3.eth.Contract(JSON.parse(etherscanABI), contractAddress);
                //run findEtherscanABI again
                const implmentationContract = knownProxyContractPair[contractAddress];
                console.log("findEtherscanABI implmentationContract", implmentationContract);
                return findEtherscanABI(implmentationContract);
            }else{
                const proxyContract = new web3.eth.Contract(JSON.parse(etherscanABI), contractAddress);
                //run findEtherscanABI again
                const implmentationContract = await proxyContract.methods[knownProxyContractPair[contractAddress]].apply(this, null).call();
                console.log("findEtherscanABI implmentationContract", implmentationContract);
                return findEtherscanABI(implmentationContract);
            }
        }

        return JSON.parse(etherscanABI);

    }catch(e){
        console.log("findEtherscanABI error: ", e);
        console.log("ABI not found - error in findEtherscanABI - contractAddress: ", contractAddress);
        return null;
    }
}

async function findAllContractAddresses(){
    //const knownProxyContractPair = knowntokenAddresses.knownProxyContractPair;
    const knownContracts = knownAddresses.knownContracts;

    for(var i = 0; i < knownContracts.length; i++){
        const contractAddress = knownContracts[i].Address
        if(knownContracts[i].IsProxy){
            knownContracts[i].ImplementationAddress = knownAddresses.knownProxyContractPair[knownContracts[i].Address];
        }
    }

    return knownContracts;
}


module.exports ={
    findABI, knownProxyContractPair, findAllContractAddresses
}
