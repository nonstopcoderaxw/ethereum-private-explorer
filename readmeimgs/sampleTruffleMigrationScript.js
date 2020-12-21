const axios = require('axios')
const fs = require('fs');

const privateExplorerURL = "http://127.0.0.1:8081"  // ***to be updated
const Contract1 = artifacts.require("./Contract1.sol"); // ***to be updated
const Contract2 = artifacts.require("./Contract2.sol"); // ***to be updated
const Contract3 = artifacts.require("./Contract3.sol"); // ***to be updated
const ContractsToExplorer = [Contract1, Contract2, Contract3];

module.exports = function(deployer) {

     migrateABI();

}

async function migrateABI(){


    try{

      const abis = [];

      for(var i = 0; i < ContractsToExplorer.length; i++){
          abis.push(await createABIInput(ContractsToExplorer[i]));
      }

      await axios.post(privateExplorerURL + "/addABI", abis)


    }catch(e){
        console.log("error! Please ensure the private block explorer server running!")
    }
}

async function createABIInput(Contract){
        return    {
                    address: (await Contract.deployed()).address,
                    abi: {contractName: Contract.contractName, abi: Contract.abi}
                  }
}
