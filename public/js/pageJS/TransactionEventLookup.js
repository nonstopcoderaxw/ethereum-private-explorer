import * as UICommon from "../modules/UICommon.js";
import * as APICallouts from "../modules/apiCallouts.js";
import * as UIHb from "../modules/UIHb.js";



const params = UICommon.parse_query_string(window.location.search.split("?")[1]);
const archievedNodeProvider = params.n;

var web3;

start();



async function start(){
    await UISetTitle("Transaction Event Lookup Tool")
    await UIOps();
}

async function UISearchAction(){
    $("#searchAction").click(async function(){
        const archievedNodeProvider = $("#archievedNodeProvider").val();
        const eventName = $("#eventName").val();
        const fromBlockNumber = $("#fromBlockNumber").val();
        const toBlockNumber = $("#toBlockNumber").val();
        const address = $("#contractAddress").val();
        const contractAbi = $("#contractAbi").val();
        const eventDetailsFilter = $("#eventDetailsFilter").val();

        await transactionEventLookup(archievedNodeProvider, eventName, fromBlockNumber, toBlockNumber, address, contractAbi, eventDetailsFilter);

    })
}

async function transactionEventLookup(archievedNodeProvider, eventName, fromBlockNumber, toBlockNumber, address, contractAbi, eventDetailsFilter){
    web3 = new Web3(new Web3.providers.WebsocketProvider(archievedNodeProvider));

    //get topcis by event name
    const topics = await getTopicBy(JSON.parse(contractAbi), [eventName]);
    console.log("topics", topics);

    //learn how to use getPastLogs
    const logs = await web3.eth.getPastLogs({
        fromBlock: fromBlockNumber,
        toBlock: toBlockNumber,
        address: address,
        topics: topics
    });

    console.log("logs", logs);

    //get decoded transaction
    const decodedLogs = await APICallouts.getDecodeLogs([JSON.parse(contractAbi)], logs);
    console.log("decodedLogs", decodedLogs);

    //parse the eventDetailsFilter
    var result;
    if(eventDetailsFilter){
          const filter = [];
          const filters = eventDetailsFilter.split(";");
          for(var i = 0; i < filters.length; i++){
              const filterStr = filters[i];
              filter.push({
                  name: filterStr.split("=")[0],
                  value: filterStr.split("=")[1]
              })
          }

          console.log("filter", filter);

          const filteredDecodedLogs = [];

          loop1:
          for(var i = 0; i < decodedLogs.length; i++){
              const events = decodedLogs[i].events;
              var isMatched = false;
              loop2:
              for(var _i = 0; _i < events.length; _i++){
                  const key = events[_i].name;
                  const value = events[_i].value;
                  loop3:
                  for(var x = 0; x < filter.length; x++){
                      console.log("key", key);
                      console.log("value", value);

                      if(filter[x].name == key && filter[x].value == value){
                          isMatched = true;
                          break loop2;
                      }
                  }
              }

              if(isMatched){
                  filteredDecodedLogs.push(decodedLogs[i]);
              }
          }

          result = filteredDecodedLogs;
    }

    if(!eventDetailsFilter){
        result = decodedLogs;
    }

    $("#transactionEventLookupResult").html(await UIHb.createTransactionEventLookupResult(result));

}

async function getTopicBy(abi, eventNames){

    var topics = [];
    for(var _i = 0; _i < eventNames.length; _i++){
        var topic;
        var eventName = eventNames[_i];
        console.log("eventName", eventName);
        console.log("abi.length", abi.length);
        for(var i = 0; i < abi.length; i++){
             if(abi[i].name == eventNames[_i]){
                  topic = abi[i].name + "(";
                  const inputs = abi[i].inputs;
                  for(var j = 0; j < inputs.length; j++){
                      console.log("inputs[j].type", inputs[j].type);
                      topic += inputs[j].type + ",";
                  }
             }
        }

        console.log("topic", topic);

        if(topic){
            topic = topic.substring(0, topic.length - 1) + ")";
            console.log("topic", topic);
            topics.push(web3.utils.sha3(topic));
        }

    }

    return topics;


}

async function UISetTitle(title){
    $("#cTitle").html(title);
}

async function popEtherScanABI(){
    $("#contractAddress").change(async function(){
        const contractAddress = $(this).val();

        const abiResp = await APICallouts.getABIByContractAddress(Web3.utils.toChecksumAddress(contractAddress));
        var abi;
        if(abiResp){
            abi = JSON.stringify(abiResp);
        }

        $("#contractAbi").val(abi);
        $("#searchAction").click();
    })
}

async function setDefaultUIValues(){
    $("#archievedNodeProvider").val(archievedNodeProvider);
}

async function UIOps(){
    await setDefaultUIValues();
    await popEtherScanABI();
    await UISearchAction();
}
