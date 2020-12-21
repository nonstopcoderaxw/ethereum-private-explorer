import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";

start();

async function start(){
    await UIHb.createTemplateComponents();

    const txnHash = window.location.hash.split("#")[1];

    const decodedTransactionData = await APICallouts.getDecodedTransaction(txnHash);
    await UIHb.createTxnDetailView(decodedTransactionData);

    await UIOps();
}


async function UIOps(){
    await UICommon.UISearchAddress();
    //keep it to the last
    await UICommon.UIToggleLoader();
}
