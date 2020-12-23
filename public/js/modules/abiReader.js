
var readAbi;
var writeAbi;
var abi;
var contractAddress;
var account;
var web3


async function init(_web3, _account, _abi, _contractAddress){
    web3 = _web3;
    account = _account;
    abi = _abi;
    contractAddress = _contractAddress;

    const groupedAbi = await abiToFuncs(abi);
    readAbi = groupedAbi[0];
    writeAbi = groupedAbi[1];

    await UIToggleReadWriteFuncs();

}

async function abiFuncRead(contractAddress, abi, abiFuncName, params){
    const contractInstance = new web3.eth.Contract(abi, Web3.utils.toChecksumAddress(contractAddress));

    var result = await contractInstance.methods[abiFuncName].apply(this, params).call();

    console.log("result:", result);

    return result;
}


async function abiToFuncs(abi){

    const readFuncs = [];
    const writeFuncs = [];

    const read = {
        callType: "Read",
        abi: readFuncs
    }

    const write = {
        callType: "Write",
        abi: writeFuncs
    }

    for(var i = 0; i < abi.length; i++){
        const abiElement = abi[i];
        if(abiElement.type == "function"){
            if(["nonpayable", "view", "pure"].includes(abiElement.stateMutability)){
                readFuncs.push(abiElement);
            }
        }
    }

    for(var i = 0; i < abi.length; i++){
        const abiElement = abi[i];
        if(abiElement.type == "function"){
            if(["nonpayable", "payable"].includes(abiElement.stateMutability)){
                writeFuncs.push(abiElement);
            }
        }
    }

    return [read, write];
}

//==============UI Funcs=====================
async function UIAbiFuncAction(contractAddress, abiWithType){

    const abi = abiWithType.abi;

    $(".abiFuncAction").click(async function(e){
        const abiIndex = e.target.attributes.data.value;
        const abiElement = abi[abiIndex];
        const abiFuncName = abiElement.name;
        const numberOfReturns = abiElement.outputs.length;

        const params = [];
        var etherValue;
        $("#abiFunc" + abiIndex + " .abiFuncInputValue").each(function(index){
            params.push($(this).val());
        })

        $("#abiFunc" + abiIndex + " .abiFuncInputEtherValue").each(function(){
            etherValue = $(this).val();
        })

        console.log("abiFuncName: ", abiFuncName);
        console.log("params: ", params);
        console.log("etherValue: ", etherValue);

        var result;

        if(abiWithType.callType == "Read"){
            result = await abiFuncRead(contractAddress, abi, abiFuncName, params);
        }

        if(abiWithType.callType == "Write"){
            result = await abiFuncWrite(contractAddress, abi, abiFuncName, params, etherValue);
        }

        //return values

        if(abiWithType.callType == "Read"){
            $("#abiFunc" + abiIndex + " .abiFuncReturn").each(function(index){
                if(numberOfReturns > 1){
                  $(this).html(JSON.stringify(result[index]));
                }else{
                  $(this).html(JSON.stringify(result));
                }
            })
        }

        if(abiWithType.callType == "Write"){
            $("#abiFunc" + abiIndex + " .abiFuncReturn").each(function(index){
                $(this).html(result.transactionHash);
            })
        }


    })
}

async function abiFuncWrite(contractAddress, abi, abiFuncName, params, value){
      const contractInstance = new web3.eth.Contract(abi, Web3.utils.toChecksumAddress(contractAddress));

      var valueObj = {from:account}
      if(value){
          valueObj = {from:account, value:web3.utils.toWei(value, "ether")};
      }

      var result = await contractInstance.methods[abiFuncName].apply(this, params).send(valueObj);

      console.log("result:", result);

      return result;
}

async function UIToggleReadWriteFuncs(){
    await _UIToggleReadWriteFuncs();
    $(".abiRadio").change(async function(){
        await _UIToggleReadWriteFuncs();
    })
}

async function _UIToggleReadWriteFuncs(){
  if($("#abiReadFuncRadio").prop("checked")){
      await createFuncs(readAbi);
      await UIAbiFuncAction(contractAddress, readAbi);
  }

  if($("#abiWriteFuncRadio").prop("checked")){
      await createFuncs(writeAbi);
      await UIAbiFuncAction(contractAddress, writeAbi);
  }
}

async function createFuncs(data){
    var html = await createHBhtml(data, "./views/hb_abiFuncs.html");
    $("#abiFunc").html(html);
}


async function createHBhtml(data, url){
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    var template = await $.get(url);
    var theTemplate = Handlebars.compile(template);
    var theCompiledHtml = theTemplate(data);

    return theCompiledHtml;
}

export{
     abi,
     contractAddress,
     init,
     UIToggleReadWriteFuncs
}
