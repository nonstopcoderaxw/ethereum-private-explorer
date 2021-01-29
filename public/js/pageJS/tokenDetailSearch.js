import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";



start();

async function start(){
    await UIHb.createTemplateComponents();

    await UIReturnTokenDetails();
}

async function UIReturnTokenDetails(){

    $("#tokenSymbol").change(async function(){
        const tokenSymbol = $(this).val();
        const data = await APICallouts.findTokenAddressBySymbol(tokenSymbol);
        if(data.address){
            data["sampleUnit"] = "1 " + data["symbol"] + " = " + 10**parseInt(data["decimals"]).toString();
            const htmlResult = await UIHb.createHBhtml(data, "./views/hb_tokenDetailsSearchResult.html");
            $("#tokenDetailsSearchResult").html(htmlResult);
        }
    });
}
