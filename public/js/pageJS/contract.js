import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";
import * as ABIReader from "../modules/abiReader.js";
import * as Web3MetaMask from "../modules/web3MetaMask.js";



var contractAddress;

const web3 = new Web3(window.ethereum);
var account;

start();

async function start(){
    await UIHb.createTemplateComponents();

    contractAddress = window.location.hash.split("#")[1];
    if(contractAddress){
        console.log(contractAddress);
        const contracts = await APICallouts.getContractWithDetailsByContract(contractAddress);
        const txns = await APICallouts.getTransactionOfAccount(contractAddress);

        await UIHb.createContractDetailView(contracts[0]);
        await UIHb.createTxnTable(txns);
    }

    //abi reader funcs

    await UIOps();
}

async function UIRenderABIList(){
    const contractsList = await APICallouts.getContractsWithDetails();
    //sorting - set the selected to the first
    const sortContractsList = [];

    for(var i = 0; i < contractsList.length; i++){
        if(contractsList[i].contractAddress == contractAddress){
            sortContractsList.push(contractsList[i]);
        }
    }

    for(var i = 0; i < contractsList.length; i++){
        if(contractsList[i].contractAddress != contractAddress){
            sortContractsList.push(contractsList[i]);
        }
    }

    //hb view
    await UIHb.createABIPicklist(sortContractsList);

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

async function UINavRequireMetamask(){
    $(".cNavRequireMetaMask").click(async function(){
         await UITabTwoInit();
    })
}

async function UIMetaMaskConnected(){
    $(".aConnectWeb3").html("MetaMask Connected");
    $(".aConnectWeb3").prop("disabled", true);
    $(".aConnectWeb3").css("background", "green");
}

async function UIAbiReaderInit(){
    const abi = await APICallouts.getABIByContractAddress(contractAddress);
    await ABIReader.init(web3, account, abi, contractAddress);
}

async function UIIsProxy(){
    $("#isProxy").change(function(){
        if($(this).prop("checked")){
            $("#implABISection").show();
        }else{
            $("#implABISection").hide();
        }
    })

    await UIRenderABIList();
}

async function UIChangeABI(){
    $(".aChangeABI").change(async function(){
        contractAddress = $(this).val();
        await UIAbiReaderInit();
    })
}

async function UIDefaultTab(){
    const tabNo = await findGetParameter("tab");
    if(tabNo && tabNo == 2){
        $("#tabOne").removeClass("active");
        $("#tabOneContent").removeClass("show active");

        $("#tabTwo").addClass("active");
        $("#tabTwoContent").addClass("show active");

        await UITabTwoInit();
    }
}

async function UITabTwoInit(){
     if(await UIConnectToMetaMask()){
         if(account){
             await UIAbiReaderInit();
             await UIMetaMaskConnected();
         }
     }
}

async function UIChangeContractAddress(){
      window.onhashchange = async function(){
          contractAddress = window.location.hash.split("#")[1];
          await ABIReader.changeContractAddress(contractAddress);
      }
}

async function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

async function UIOps(){
     await UICommon.UICopyToClipboard();
     await UICommon.UISearchAddress();
     await UINavRequireMetamask();
     await UIIsProxy();
     await UIChangeABI();
     await UIDefaultTab();
     await UIChangeContractAddress();

}
