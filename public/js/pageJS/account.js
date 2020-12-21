import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";


var account;

start();

async function start(){
    await UIHb.createTemplateComponents();

    account = window.location.hash.split("#")[1];
    routing(account);

    if(account){
        const accounts = await APICallouts.getAccountWithDetailsByAccount(account);
        const txns = await APICallouts.getTransactionOfAccount(account);
        await UIHb.createAccountDetailView(accounts[0]);
        await UIHb.createTxnTable(txns);
    }

    await UIOps();
}

async function UIOps(){
    await UICommon.UICopyToClipboard();
    await UICommon.UISearchAddress();
}

async function routing(address){


    //is contract address
    if(address.length == 42 && await APICallouts.isSmartContractAddress(address)){
        window.location.href = "/contract.html#" + address;
    }



}
