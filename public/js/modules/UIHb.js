async function createAbiResultView(data){
    var html = await createHBhtml(data, "./views/hb_abiResultRead.html");
    return html;
}

async function createTransactionEventLookupResult(data){
    var html = await createHBhtml(data, "./views/hb_transactionEventLookupResult.html");
    return html;
}


async function createAccountTable(data){
    var html = await createHBhtml(data, "./views/hb_accountTable.html");
    $("#accountsTable").html(html);
}

async function createContractsTable(data){
    var html = await createHBhtml(data, "./views/hb_contractTable.html");
    $("#contractsTable").html(html);
}

async function createTxnDetailView(data){
    var html = await createHBhtml(data, "./views/hb_txnDetailView.html");
    $("#txnDetailView").html(html);
}

async function createAccountDetailView(data){
    var html = await createHBhtml(data, "./views/hb_accountDetailView.html");
    $("#accountDetailView").html(html);
}

async function createContractDetailView(data){
    var html = await createHBhtml(data, "./views/hb_contractDetailView.html");
    $("#contractDetailView").html(html);
}

async function createTxnTable(data){
    var html = await createHBhtml(data, "./views/hb_txnTable.html");
    $("#txnTable").html(html);
}

async function createBlocks(data){
    var html = await createHBhtml(data, "./views/hb_blocksTable.html");
    $("#blockTable").html(html);
}

async function createBlockDetalView(data){
    var html = await createHBhtml(data, "./views/hb_blockDetailView.html");
    $("#blockDetailView").html(html);
}

async function createABIPicklist(data){
    var html = await createHBhtml(data, "./views/hb_abiPicklist.html");
    $("#implABISection").html(html);
}

async function createTemplateComponents(){
    const navHtml = await createHBhtml({}, "./views/hb_nav.html");

    $("#tNav").html(navHtml);
}

async function createHBhtml(data, url){
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });

    var template = await $.get(url);
    var theTemplate = Handlebars.compile(template);
    var theCompiledHtml = theTemplate(data);

    return theCompiledHtml;
}

export{
    createAccountTable,
    createContractsTable,
    createTxnDetailView,
    createTxnTable,
    createBlocks,
    createABIPicklist,
    createBlockDetalView,
    createTemplateComponents,
    createAccountDetailView,
    createContractDetailView,
    createHBhtml,
    createAbiResultView,
    createTransactionEventLookupResult
}
