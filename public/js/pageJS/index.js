import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";


start();

async function start(){
    await UIHb.createTemplateComponents();

    var accounts = await APICallouts.getAccountsWithDetails();
    var contracts = await APICallouts.getContractsWithDetails();
    var txns = await APICallouts.getTransactionWithReceiptList(20);
    var blocks = await APICallouts.getBlocks(20);
    await UIHb.createAccountTable(accounts);
    await UIHb.createContractsTable(contracts);
    await UIHb.createTxnTable(txns);
    await UIHb.createBlocks(blocks);

    await UIOps();
}

async function UIOps(){
    await UICommon.UICopyToClipboard();
    await UICommon.UISearchAddress();
}
