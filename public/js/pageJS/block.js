import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";


var blockNumber;

start();

async function start(){
    await UIHb.createTemplateComponents();

    blockNumber = window.location.hash.split("#")[1];

    if(blockNumber){
        const blockWithTxns = await APICallouts.getBlockWithTransactions(blockNumber);
        await UIHb.createBlockDetalView(blockWithTxns.block[0]);
        await UIHb.createTxnTable(blockWithTxns.transactions);
    }

    await UIOps();
}

async function UIOps(){
    await UICommon.UICopyToClipboard();
    await UICommon.UISearchAddress();

}
