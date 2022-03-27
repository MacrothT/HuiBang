////importScripts('script1.js', 'script2.js');
let bgQuantityBegin;

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    let searchURL = request?.searchURL;
    if (searchURL && searchURL.length !== 0) {
        try {
            //TODO: move searchURL= url+ suffix from popup to here
            loadFirstOrderDiscounts(searchURL, request.tabID);
        } catch (error) {
            console.log(error);
        }
    }
    return true;
    // Add this so that it will respond asynchronously.
}
);

/*chrome.tabs.onUpdated.addListener(function(tabID, changeInfo, tab) {
    // make sure the status is 'complete' and it's the right tab
    if (tempTab && tabID == tempTab.id && changeInfo.status == 'complete') {
    chrome.scripting.executeScript(
        {target: {tabId: tabID}, func: calcFreightScript, args: []},
        injectionResults => {
            for (const frameResult of injectionResults)
                {console.log(`Iframe ID ${frameResult.frameId}, Title: ${frameResult.result}`);}
            //chrome.tabs.remove(tabID);
        });
    }
});*/

async function loadFirstOrderDiscounts(searchURL, tabID) {
    //console.log(searchURL);//&quantityBegin=${quantityBegin.value}&
    const sIdx = searchURL.indexOf("&quantityBegin=")
      , eIdx = searchURL.indexOf('&', sIdx + 1);
    bgQuantityBegin = +searchURL.substring(sIdx + 15, eIdx);
    //String->Int
    extractORD(await fetchHTML(searchURL), tabID);
}

async function fetchHTML(url) {
    const response = await fetch(url, {
        credentials: 'include'
    });
    if (response.ok) {
        return await response.text();
    } else {
        const error = new Error(response.statusText);
        error.response = response;
        throw error;
        //console.log(error);
    }
}

//从fetch的返回页中找到offer数据：
//HTML文本中有...<html...>...<body...>...<script>... window.data.offerresultData = successDataCheck({..."data":{..."pageCount":..."totalCount":...}});
//...</script>...</body>...</html>
function extractORD(html, tabID) {
    let startIdx = html.indexOf('(', html.indexOf("window.data.offerresultData"));
    let endIdx = html.indexOf(');', startIdx)
      , ordStr = html.substring(startIdx + 1, endIdx);
    let jsonObj;
    //, dispHTML = "";
    try {
        jsonObj = JSON.parse(ordStr);
    } catch (error) {
        console.log(`${error} from JSON: ${jsonObj}`);
        //TODO:onMessage(html)
    }
    //处理fetch的返回页中offer列表：
    //Case 0：正常返回offers。
    //Case -1：返回内容为“在您的筛选条件下，没找到...”，即offer数为0：
    //json中有{..."data":{..."pageCount":0..."totalCount":0...}}
    if (!jsonObj?.data?.hasOwnProperty("pageCount")) {
        console.log(`No "data" or "pageCount" in offerresultData: ${ordStr}`);
        //TODO:onMessage(html)
    } else if (0 == jsonObj.data.pageCount) {
        //document.getElementById("body").innerHTML=`在指定的 关键词 及 起批量:${bgQuantityBegin}下没有首单优惠的货源。`;
        console.log(`在指定的 关键词 及 起批量：${bgQuantityBegin} 下没有首单优惠的货源。`);
        //模板字符串必须用`不能用"或'
        //TODO:onMessage(html)
    } else {
        //let onePageOffers = 
        sortQuantityPricesInPage(jsonObj.data, tabID);
        //FIXME:add handler for pageCount>1
        //dispHTML = toDispHTML(onePageOffers);
    }
    //return dispHTML;
}

async function sortQuantityPricesInPage(data, tabID) {
    //let sortedOffersRound1 = new Array();
    if (0 < data?.offerList?.length) {
        let ajaxDataArray = new Array()
          , encounteredPunishPage = false;
        for (let oneOffer of data.offerList) {
            let oneODUrl = oneOffer?.information?.detailUrl;
            await function sleep(time) {
                return new Promise(resolve=>setTimeout(resolve, time));
            }(1200);
            const oneOfferHTML = await fetchHTML(oneODUrl);
            //Return page of fetch(oneODUrl) includes window.__INIT_DATA={"data":{...},"globalData":{...},...}\r\n</script>
            let initDataIdx = oneOfferHTML.indexOf("window.__INIT_DATA");
            if (-1 === initDataIdx) {
                chrome.runtime.sendMessage({
                    error: "<p>Error：可能遇到了Punish页面，任务已中止。</p>"
                });
                encounteredPunishPage = true;
                break;
            } else {
                let startIdx = oneOfferHTML.indexOf('{', initDataIdx);
                let endIdx = oneOfferHTML.indexOf('</', startIdx);
                endIdx = oneOfferHTML.lastIndexOf('}', endIdx);
                let initDataStr = oneOfferHTML.substring(startIdx, endIdx + 1);
                let dataJSON = JSON.parse(initDataStr)?.data["1081181309101"]?.data
                  , offerId = "" + oneOffer.id;
                //Name and value mappings found from https://g.alicdn.com/??code/npm/@ali/tdmod-od-pc-offer-logistics/0.0.11/index-pc.js:formatted
                //"@ali/tdmod-od-pc-offer-logistics/index-pc":{"requires":["@ali/pnpm-react@16/index","@ali/rox-next-ui/index","@ali/rox-emitter/index","@ali/rox-od-jsonp/index","@ali/tdmod-od-pc-offer-logistics/index-pc.css"]}
                //Case 1 "deliveryFee":"TEMPLATED" : window.__INIT_DATA={
                //                                   "data":{..."1081181309101":{
                //                                       "componentType":"@ali/tdmod-od-pc-offer-logistics","data":{
                //                                       ..."templateId":?,"deliveryFee":"TEMPLATED","startAmount":?,"unitWeight":?,
                //                                       "price":"?","volume":?,"freightInfo":{"unitWeight":?,...}}}}...}
                //Case 2 "deliveryFee":"FREE" : window.__INIT_DATA={
                //                              "data":{..."1081181309101":{
                //                                 "componentType":"@ali/tdmod-od-pc-offer-logistics","data":{
                //                                 ..."templateId":1,"deliveryFee":"FREE","startAmount":?,"unitWeight":?,
                //                                 "price":"?","volume":?,"freightInfo":{"unitWeight":?,...}}}}...}
                ajaxDataArray.push({
                    flow: "general",
                    excludeAreaCode4FreePostage: "ALL",
                    countryCode: 1001,
                    provinceCode: 1098,
                    cityCode: 1099,
                    deliveryFee: dataJSON?.deliveryFee,
                    //window.__INIT_DATA.data["1081181309101"].data.deliveryFee
                    amount: bgQuantityBegin,
                    //window.__INIT_DATA.data["1081181309101"].data.startAmount
                    templateId: dataJSON?.templateId,
                    //window.__INIT_DATA.data["1081181309101"].data.templateId
                    memberId: oneOffer?.company?.memberId,
                    //also window.__INIT_DATA.globalData.offerBaseInfo.sellerMemberId
                    offerId: offerId,
                    //also window.__INIT_DATA.globalData.offerBaseInfo.offerId
                    price: dataJSON?.price,
                    //window.__INIT_DATA.data["1081181309101"].data.price
                    volume: dataJSON?.volume,
                    //window.__INIT_DATA.data["1081181309101"].data.volume
                    weight: Math.floor(dataJSON?.unitWeight * bgQuantityBegin * 100) / 100 //window.__INIT_DATA.data["1081181309101"].data.unitWeight * window.__INIT_DATA.data["1081181309101"].data.startAmount
                });

                var tradePrice = oneOffer?.tradePrice || {};
                // tradePrice下有freightPrice字段，但无真实值。
                var offerPrice = tradePrice?.offerPrice || {};
                var quantityPrices = offerPrice?.quantityPrices || [];
                var offerPriceAdded = 0;
                for (oneQP of quantityPrices) {
                    var oneQ = oneQP?.quantity;
                    offerPriceAdded = +oneQP.valueString;
                    var sIdx = oneQ.indexOf('~');
                    if (-1 != sIdx) {
                        var upperQ = +oneQ.substring(sIdx + 1);
                        if (bgQuantityBegin <= upperQ) {
                            //sortedOffersRound1.push(offerId);
                            chrome.storage.local.set({
                                [offerId]: {
                                    priceAdded: offerPriceAdded,
                                    isAdded: Boolean("FREE" === dataJSON?.deliveryFee),
                                    quantity: oneQ,
                                    offer: oneOffer
                                }
                            }, ()=>{}
                            );
                            break;
                        }
                    } else {
                        sIdx = oneQ.indexOf('≥');
                        var lowerQ = +oneQ.substring(sIdx + 1);
                        if (bgQuantityBegin >= lowerQ) {
                            //sortedOffersRound1.push(offerId);
                            chrome.storage.local.set({
                                [offerId]: {
                                    priceAdded: offerPriceAdded,
                                    isAdded: Boolean("FREE" === dataJSON?.deliveryFee),
                                    quantity: oneQ,
                                    offer: oneOffer
                                }
                            }, ()=>{}
                            );
                            break;
                        }
                    }
                }
            }
        }
        if (!encounteredPunishPage) {
            chrome.tabs.sendMessage(tabID, {
                fodAjaxData: ajaxDataArray
            }, (response)=>{
                console.log(response);
            }
            );
        }
    }
    //return sortedOffersRound1;//TODO: no need to return?
}

function save(quantityBegin) {//bgQuantityBegin=quantityBegin;
}
