# Ethereum Private Block Explorer
A private block explorer designed and built for Ethereum Smart Contract development in the private testnet environment. It's particularly useful for Ganache forked mainnet environment. It was originally built for my personal Smart Contract project so use at your own risk.

# Screenshots
**Home Page** - show all the private accounts, contracts with ABIs, Transactions and Blocks

![alt text](https://raw.githubusercontent.com/AlexTheCodeMan/ethereumPrivateBlockExplorer/main/readmeimgs/homePage.png)

**Contract Integration Page** - Generates an UI to read or write all the functions mapped from an ABI. All private ABIs will be automatically pushed via Truffle Migration script. Please go to Contract ABIs for more details.

![alt text](https://github.com/AlexTheCodeMan/ethereumPrivateBlockExplorer/blob/main/readmeimgs/contractPage.png?raw=true)

**Transaction Page** - Transaction logs and ERC20 Transfer history will be interpreted with private ABIs or ABIs matched against Ethersan APIs. 

![alt text](https://github.com/AlexTheCodeMan/ethereumPrivateBlockExplorer/blob/main/readmeimgs/transactionPage.png?raw=true)

# How to set it up 
Clone the repo.
```
git clone https://github.com/AlexTheCodeMan/ethereumPrivateBlockExplorer.git
```

Add an "env.js" at root directory like below.
```javascript
const etherscanApiKey = "Your etherscan api key";
const web3ProviderURL = "http://127.0.0.1:8545"; //update this if your rpc is in a different location
const hostPort = "8081"; //update this if port 8081 has been used

module.exports ={
    hostPort, etherscanApiKey, web3ProviderURL
}
```

Install npm packages.
```
npm install
```
Open another terminal and then run below to launch the web UI of the block explorer.
```
npm run runClient
```
Add and update the migration script below into your truffle project.

```javascript
const axios = require('axios')
const fs = require('fs');

const privateExplorerURL = "http://127.0.0.1:8081"  // ***Update this if required
const Contract1 = artifacts.require("./Contract1.sol"); // ***Update this
const Contract2 = artifacts.require("./Contract2.sol"); // ***Update this
const Contract3 = artifacts.require("./Contract3.sol"); // ***Update this
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
        return {
                  address: (await Contract.deployed()).address,
                  abi: {contractName: Contract.contractName, abi: Contract.abi}
               }
}

```
Install the following npm packages under your Truffle project

```javascript
npm install axios
npm install fs
```

Migrate your Truffle Contracts
```javascript
truffle migrate --reset
```

Reindex transactions
```
npm run resetBlocks
```


Access this block explorer via http://127.0.0.1:8081










