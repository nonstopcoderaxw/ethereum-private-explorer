import * as UICommon from "../modules/UICommon.js";
import * as ABIReader from "../modules/abiReader.js";
import * as Web3MetaMask from "../modules/web3MetaMask.js";
import * as APICallouts from "../modules/apiCallouts.js";

const params = UICommon.parse_query_string(window.location.search.split("?")[1]);
const version = params.v;
const archievedNodeProvider = params.n;


var account;
var web3;


if(version == "1"){
    web3 = new Web3(window.ethereum);
    startV1();
}

if(version == "2"){
    startV2();
}

async function startV1(){
    await UIV1();
    await UISetTitle("Private ABI Reader - Forked at Block Number " + await APICallouts.forkedAtBlockNumber())
    await UIOps();
}

async function startV2(){
    await UIV2();
    await UISetTitle("Private ABI Reader - Archieved Node Provder");

    await UIOps();
}

async function UIV1(){
    $("#connectToMetaMask").show();
    $(".cV1").show();
    $(".cV2").hide();
    await UIConnectToMetaMask();
}

async function UIV2(){
    $("#connectToMetaMask").hide();
    $(".cV1").hide();
    $(".cV2").show();
}

async function UISetTitle(title){
    $("#cTitle").html(title);
}

async function setDefaultUIValues(){
    $("#archievedNodeProvider").val(archievedNodeProvider);
}

async function popEtherScanABI(){
    $("#ImplmentationContractAddress").change(async function(){
        const contractAddress = $(this).val();

        const abiResp = await APICallouts.getABIByContractAddress(contractAddress);
        var abi;
        if(abiResp){
            abi = JSON.stringify(abiResp);
        }

        $("#contractAbi").val(abi);
        $("#generateAction").click();
    })
}

async function UIGenerate(){


      $("#generateAction").click(async function(){
          if(!web3){
              web3 = new Web3(new Web3.providers.WebsocketProvider($("#archievedNodeProvider").val()));
          }

          const abi = JSON.parse($("#contractAbi").val());
          const contractAddress = $("#ProxyContractAddress").val();

          await ABIReader.init(web3, account, abi, contractAddress);
      });
}


async function UIConnectToMetaMask(){
      await Web3MetaMask.initEthereum(web3);
      account = await Web3MetaMask.connectToMetaMask();

      //check if the connected account belongs the private testnet
      const _isPrivateTestnetAccount = await isPrivateTestnetAccount(account);
      if(!_isPrivateTestnetAccount){
          alert("The connected account does not belong to the private testnet. Please ensure the MetaMask network is set to the Private Testnet not the Main Net!");
          return false;
      }

      if(account){
          await UIMetaMaskConnected();
          return true;
      }
}

async function isPrivateTestnetAccount(account){
      const accounts = await APICallouts.getAccountsWithDetails(account);
      const accountsList = [];

      for(var i = 0; i < accounts.length; i++){
          accountsList.push(accounts[i].account);
      }

      if(accountsList.includes(account)){
          return true;
      }

      return false;
}

async function UIMetaMaskConnected(){
    $(".aConnectWeb3").html("MetaMask Connected");
    $(".aConnectWeb3").prop("disabled", true);
    $(".aConnectWeb3").css("background", "green");
}

async function UIOps(){
    await setDefaultUIValues();
    await UIGenerate();
    await popEtherScanABI();
}
