import * as UIHb from "../modules/UIHb.js";


var readAbi;
var writeAbi;
var abi;
var contractAddress;
var account;
var web3;


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

async function abiFuncRead(abi, abiFuncName, params, defaultBlockNumber){
    const contractInstance = new web3.eth.Contract(abi, Web3.utils.toChecksumAddress(contractAddress));
    contractInstance.defaultBlock = defaultBlockNumber;
    console.log("default block number:", contractInstance.defaultBlock);
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
                var functionsToShow = $("#functionsToShow").val();
                if(functionsToShow){
                    if(functionsToShow.split(",").includes(abiElement.name)){
                        readFuncs.push(abiElement);
                    }
                }else{
                    readFuncs.push(abiElement);
                }
            }
        }
    }

    for(var i = 0; i < abi.length; i++){
        const abiElement = abi[i];
        if(abiElement.type == "function"){
            if(["nonpayable", "payable"].includes(abiElement.stateMutability)){
                var functionsToShow = $("#functionsToShow").val();
                if(functionsToShow){
                    if(functionsToShow.split(",").includes(abiElement.name)){
                        writeFuncs.push(abiElement);
                    }
                }else{
                    writeFuncs.push(abiElement);
                }
            }
        }
    }

    return [read, write];
}

//==============UI Funcs=====================
async function UIAbiFuncAction(abiWithType){

    const abi = abiWithType.abi;

    $(".abiFuncAction").click(async function(e){
        const abiIndex = e.target.attributes.data.value;
        const abiElement = abi[abiIndex];
        const abiFuncName = abiElement.name;
        const abiFuncInputs = abiElement.inputs;
        const numberOfReturns = abiElement.outputs.length;

        const params = [];
        var etherValue;
        $("#abiFunc" + abiIndex + " .abiFuncInputValue").each(function(index){
            //array input type
            if(abiFuncInputs[index].type.includes("[]")){
                params.push(JSON.parse($(this).val()));
            }else{
                params.push($(this).val());
            }

        })

        $("#abiFunc" + abiIndex + " .abiFuncInputEtherValue").each(function(){
            etherValue = $(this).val();
        })

        console.log("abiFuncName: ", abiFuncName);
        console.log("params: ", params);
        console.log("etherValue: ", etherValue);

        var result = [];

        if(abiWithType.callType == "Read"){
            var defaultBlockNumber = $("#defaultBlockNumber").val();
            var toBlockNumber = $("#toBlockNumber").val();
            if(!defaultBlockNumber){
                defaultBlockNumber = "latest";
            }

            var numberOfBlocks = 1;
            if(toBlockNumber){
                numberOfBlocks = parseInt(toBlockNumber) - parseInt(defaultBlockNumber) + 1;
            }

            for(var i = 0; i < numberOfBlocks; i++){
               var _blockNumber;
               if(defaultBlockNumber != "latest"){
                   _blockNumber = (parseInt(defaultBlockNumber) + i).toString();
               }else{
                  _blockNumber = defaultBlockNumber;
               }

               result.push({
                    blockNumber: _blockNumber,
                    result: await abiFuncRead(abi, abiFuncName, params, _blockNumber)
               });
            }

        }

        if(abiWithType.callType == "Write"){
            result = await abiFuncWrite(abi, abiFuncName, params, etherValue);
        }

        //return values

        if(abiWithType.callType == "Read"){
            $("#abiFunc" + abiIndex + " .abiFuncReturn").each(async function(index){
                const resultHTML = await UIHb.createAbiResultView(result);
                $(this).html(resultHTML);
            })
        }

        if(abiWithType.callType == "Write"){
            $("#abiFunc" + abiIndex + " .abiFuncReturn").each(function(index){
                var html = "<a target='_blank' href='/transaction.html#" + result.transactionHash + "' >"
                            + result.transactionHash
                            + "</a>";

                $(this).html(html);
            })
        }


    })
}

async function abiFuncWrite(abi, abiFuncName, params, value){
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
      await UIAbiFuncAction(readAbi);
  }

  if($("#abiWriteFuncRadio").prop("checked")){
      await createFuncs(writeAbi);
      await UIAbiFuncAction(writeAbi);
  }
}

async function createFuncs(data){
    var html = await createHBhtml(data, "./views/hb_abiFuncs.html");
    $("#abiFunc").html(html);
}

async function changeContractAddress(_contractAddress){
    contractAddress = _contractAddress;
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
     UIToggleReadWriteFuncs,
     changeContractAddress
}
