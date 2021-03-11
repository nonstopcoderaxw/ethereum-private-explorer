var env = require("./env.js");
const axios = require('axios');
const Web3 = require("web3");
const fs = require('fs');
const knownAddresses = require("./knownAddresses");
const knownTokenAddresses = knownAddresses.knownTokenAddresses;
const web3ProviderURL = env.web3ProviderURL;
const abiFolder = 'abi';
const ABIMethod = require("./ABIMethod.js");
const abiERC20 = require("./abi/standard/ERC20.json");
const Tx = require("ethereumjs-tx");
const vaultPvk = env.vaultPvk;
const vaultAddress = env.vaultAddress;
var web3;


init();

async function init(){
    web3 = await initWeb3(web3ProviderURL);
}

async function initWeb3(_web3ProviderURL){
    return new Web3(new Web3.providers.HttpProvider(_web3ProviderURL));
}

async function receiveTokenByETH(recipientAddress, tokenSymbol, tokenAddress, amountOut){
    const uniswapV2Router02Address = await knownAddresses.findContractAddress("UniswapV2Router02");

    //call swap function
    const uniswapV2Router02Contract = await new web3.eth.Contract(await ABIMethod.findABI(uniswapV2Router02Address), uniswapV2Router02Address);

    const path = [knownTokenAddresses["WETH"], knownTokenAddresses[tokenSymbol]];
    const uniswapCalculatedAmountIn = (await uniswapV2Router02Contract.methods.getAmountsIn(amountOut, path).call())[0];

    const slippage = 0.05;
    const amountOutMin = toBigNumber((Number(amountOut) * (1 - slippage)));
    const deadline = getUnixTimestamp(getTomorrow());

    console.log("call params", [amountOutMin.toString(), uniswapCalculatedAmountIn]);

    const swapExactTokensForETH_TxData = uniswapV2Router02Contract.methods.swapExactETHForTokens(amountOutMin, path, recipientAddress, deadline).encodeABI();
    const swapExactTokensForETH_Result = await sendTx(uniswapV2Router02Address, swapExactTokensForETH_TxData, uniswapCalculatedAmountIn);
    console.log("swapExactTokensForETH_Result", swapExactTokensForETH_Result);

    return swapExactTokensForETH_Result;
}

function getUnixTimestamp(date){
    return Math.floor(date.getTime() / 1000);
}

function getTomorrow(){
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tomorrow;
}

function toBigNumber(number){
    return web3.utils.toBN(number.toLocaleString('fullwide', {useGrouping:false}));
}


async function sendTx(to, txData, value){
      const tx_raw = {
                      to: to,
                      from: vaultAddress,
                      data: txData,
                      value: web3.utils.toHex(value)
                    };

      console.log("tx_raw", tx_raw);
      var tx = new Tx.Transaction(tx_raw);
      const count = await web3.eth.getTransactionCount(vaultAddress);
      console.log("count", count);

      const gasCost = await web3.eth.estimateGas(tx_raw);
      console.log("gasCost", gasCost);
      const gasPrice = await web3.eth.getGasPrice();

      tx_raw.nonce = web3.utils.toHex(count);
      tx_raw.gasLimit = web3.utils.toHex(gasCost);
      tx_raw.gasPrice = web3.utils.toHex(gasPrice);

      var tx = new Tx.Transaction(tx_raw);

      const pvk_hex = Buffer.from(vaultPvk, 'hex');
      tx.sign(pvk_hex);

      const signed_tx = "0x" + tx.serialize().toString("hex");
      const result = await web3.eth.sendSignedTransaction(signed_tx);

      return result;
}



module.exports ={
    receiveTokenByETH
}
