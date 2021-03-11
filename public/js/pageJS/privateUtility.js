import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";
import * as UICommon from "../modules/UICommon.js";
import * as Web3MetaMask from "../modules/web3MetaMask.js";



start();

async function start(){
    await UIHb.createTemplateComponents();


    await UIReturnTokenDetails();
    await UIContractAddresses();
    await UIFaucet();
    await UIMath();
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

async function UIFaucet(){
    await Web3MetaMask.initEthereum(new Web3(window.ethereum));
    const defaultFaucetAcc = await Web3MetaMask.connectToMetaMask();
    $("#faucetAccountToReceive").val(defaultFaucetAcc);

    $("#faucetSubmit").click(async function(){
        const tokenSymbol = $("#faucetTokenSymbol").val();
        const tokenAddressDetails = await APICallouts.findTokenAddressBySymbol($("#faucetTokenSymbol").val());
        console.log(tokenAddressDetails);
        const tokenAddress = tokenAddressDetails.address;
        const amount = $("#faucetAmount").val();
        const accToReceive = $("#faucetAccountToReceive").val();
        console.log("call params", [tokenAddress, amount, accToReceive, tokenSymbol]);
        const receiveTokenByETHResult = await APICallouts.receiveTokenByETH(accToReceive, tokenSymbol, tokenAddress, amount);
        console.log("receiveTokenByETHResult", receiveTokenByETHResult);
        if(receiveTokenByETHResult){
            alert("success");
        }

    })
}

async function UIMath(){
    $("#mathEnter").click(async function(){
        var actualNumber = $("#actualNumber").val();
        var mantissa = $("#mantissa").val();
        var solidityNumber1 = $("#solidityNumber1").val();
        var solidityNumber2 = $("#solidityNumber2").val();

        if(!mantissa){
            alert("Please enter mantissa!");
        }

        if(actualNumber){
            solidityNumber1 = numStr(actualNumber * 10**mantissa);
            solidityNumber2 = parseInt(solidityNumber1).toExponential();
        }

        if(!actualNumber && solidityNumber1){
            actualNumber = numStr(solidityNumber1 / 10**mantissa);
            solidityNumber2 = parseInt(solidityNumber1).toExponential();
        }

        if(!actualNumber && !solidityNumber1 && solidityNumber2){
            solidityNumber1 = numStr(new Number(solidityNumber2));
            actualNumber = numStr(solidityNumber1 / 10**mantissa);
        }

        $("#actualNumber").val(actualNumber);
        $("#mantissa").val(mantissa);
        $("#solidityNumber1").val(solidityNumber1);
        $("#solidityNumber2").val(solidityNumber2);
    })
}

function numStr(number){
    return number.toLocaleString().replaceAll(",", "");
}

async function UIContractAddresses(){
    const data = await APICallouts.findAllContractAddresses();
    const html = await UIHb.createHBhtml(data, "./views/hb_addressDetailSearchResult.html");
    $("#contractDetailsSearchResult").html(html);
}
