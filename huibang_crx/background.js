////importScripts('script1.js', 'script2.js');
const cptKey = "currentPriceThreshold";

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    let searchURL = request?.searchURL;
    if (searchURL && 0 !== searchURL.length && request?.fodSuffix && 0 !== request.fodSuffix.length) {
        //const fodURL = searchURL + request.fodSuffix;
        //console.log(fodURL);
        try {
            chrome.runtime.sendMessage({
                progress: "开始处理第一批"
            });
            chrome.storage.local.clear();
            chrome.storage.local.set({
                [cptKey]: Number.MAX_SAFE_INTEGER
            }, ()=>sendResponse());
        } catch (error) {
            console.error(error);
        }
        //async()=>{await...
        loadFirstOrderDiscounts(searchURL + request.fodSuffix, request.tabID).then((searchURL,request)=>{
            chrome.runtime.sendMessage({
                progress: "开始处理第二批"
            });
            //Load One Item Consign Offers//FIXME
            //extractORD(searchURL, Infinity, request.tabID);
        }
        ).catch((e)=>console.error(e));
    }
    //return true;
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

async function loadFirstOrderDiscounts(fodURL, tabID) {
    const START = fodURL.indexOf("&quantityBegin=")
      , END = fodURL.indexOf('&', START + 1)
      , quantityBegin = +fodURL.substring(START + 15, END);
    //String->Int
    extractORD(fodURL, quantityBegin, tabID);
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

//连续从fetch的返回页中找到offer数据，聚合多个页面中符合条件的offer形成一个结果集。
//每个HTML文本中均有...<html...>...<body...>...<script>... window.data.offerresultData = successDataCheck({..."data":{..."pageCount":..."totalCount":...}});
//...</script>...</body>...</html>
async function extractORD(searchURL, quantityBegin, tabID) {
    let pageNum = 1
      , pageCnt = 0
      , isLastPage = true
      , sortedInMultiplePages = 0
      , toNextPage = true;
    do {
        const PAGEURL = searchURL + `&beginPage=${pageNum}`;
        //模板字符串必须用`不能用"或'
        const HTML = await fetchHTML(PAGEURL);
        const START = HTML.indexOf('(', HTML.indexOf("window.data.offerresultData"));
        const END = HTML.indexOf(");", START)
          , ORD_STRING = HTML.substring(START + 1, END);
        let jsonObj;
        try {
            jsonObj = JSON.parse(ORD_STRING);
        } catch (e) {
            const TIP = e + " from JSON";
            console.error(`${TIP}: ${jsonObj}`);
            chrome.runtime.sendMessage({
                "error": TIP
            });
        }
        //处理fetch的返回页中offer列表：
        //Case 0：正常返回offers。
        //Case -1：返回内容为“在您的筛选条件下，没找到...”，即offer数为0：
        //json中有{..."data":{..."pageCount":0..."totalCount":0...}}
        //------

        if (1 === pageNum) {
            pageCnt = jsonObj.data?.pageCount;
            if (!jsonObj.data?.hasOwnProperty("pageCount")) {
                const TIP = 'No "data" or "pageCount" in offerresultData';
                console.warn(`${TIP}: ${ORD_STRING}`);
                chrome.runtime.sendMessage({
                    "error": TIP
                });
                break;
            } else if (0 === pageCnt) {
                const HINT = (Infinity !== quantityBegin) ? `在指定的 关键词 及 起批量：${quantityBegin} 下没有首单优惠的货源。` : "在指定的 关键词 下没有一件代发的货源。";
                console.log(HINT);
                chrome.runtime.sendMessage({
                    "progress": HINT
                });
                break;
            }
        }
        isLastPage = !!(pageNum === pageCnt);
        const PAGE_RESULT = await sortQuantityPricesInPage(jsonObj.data, sortedInMultiplePages, quantityBegin, tabID, pageNum, isLastPage);
        sortedInMultiplePages += PAGE_RESULT.addedCount;
        toNextPage = (0 !== PAGE_RESULT.addedCount) && (PAGE_RESULT.addedCount === PAGE_RESULT.offersCount);
        pageNum++;
        await sleep(3000);
    } while (!isLastPage && toNextPage);
}

async function sortQuantityPricesInPage(data, sortedBefore, quantityBegin, tabID, pageNum, isLastPage) {
    //let sortedOffersRound1 = new Array();
    let offersCountInPage = data?.offerList?.length
      , ajaxDataArray = new Array();
    if (offersCountInPage && (0 < offersCountInPage)) {
        let processed = sortedBefore + 1, offersCountForNow = sortedBefore + offersCountInPage, msg, encounteredPunishPage = false;
        for (let oneOffer of data.offerList) {
            msg = "正在处理第" + processed + " / " + offersCountForNow + "个，耐心等待……";

            chrome.runtime.sendMessage({
                progress: msg
            });
            processed++;
            let oneODUrl = oneOffer?.information?.detailUrl;
            await sleep(2500);
            const oneOfferHTML = await fetchHTML(oneODUrl);
            //Return page of fetch(oneODUrl) includes window.__INIT_DATA={"data":{...},"globalData":{...},...}\r\n</script>
            let initDataIdx = oneOfferHTML.indexOf("window.__INIT_DATA");
            if (-1 === initDataIdx) {
                encounteredPunishPage = true;
                const errTip = "<p>Error：可能遇到了Punish页面，任务已中止。等待一段时间、或重新登录后重试。</p>";
                chrome.runtime.sendMessage({
                    error: errTip
                });
                console.warn(errTip);
                break;
            } else {
                let startIdx = oneOfferHTML.indexOf('{', initDataIdx);
                let endIdx = oneOfferHTML.indexOf('</', startIdx);
                endIdx = oneOfferHTML.lastIndexOf('}', endIdx);
                let initDataStr = oneOfferHTML.substring(startIdx, endIdx + 1);
                let dataJSON = JSON.parse(initDataStr)?.data["1081181309101"]?.data
                  , offerId = "" + oneOffer.id;
                var tradePrice = oneOffer?.tradePrice || {};
                // tradePrice下有freightPrice字段，但无真实值。
                var offerPrice = tradePrice?.offerPrice || {};
                var quantityPrices = offerPrice?.quantityPrices || [];
                let offerPriceAdded = 0
                  , aboveThreshold = false;
                for (oneQP of quantityPrices) {
                    var oneQ = oneQP?.quantity;
                    offerPriceAdded = +oneQP.valueString;
                    var sIdx = oneQ.indexOf('~');
                    if (-1 != sIdx) {
                        var upperQ = +oneQ.substring(sIdx + 1);
                        if (quantityBegin <= upperQ) {
                            aboveThreshold = await compareWithCPT({
                                priceAdded: offerPriceAdded,
                                isAdded: Boolean("FREE" === dataJSON?.deliveryFee),
                                quantity: oneQ,
                                offer: oneOffer
                            });
                            //sortedOffersRound1.push(offerId);
                            break;
                        }
                    } else {
                        sIdx = oneQ.indexOf('≥');
                        var lowerQ = +oneQ.substring(sIdx + 1);
                        if (quantityBegin >= lowerQ) {
                            //sortedOffersRound1.push(offerId);
                            aboveThreshold = await compareWithCPT({
                                priceAdded: offerPriceAdded,
                                isAdded: Boolean("FREE" === dataJSON?.deliveryFee),
                                quantity: oneQ,
                                offer: oneOffer
                            });
                            break;
                        }
                    }
                }

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
                if (!aboveThreshold) {
                    ajaxDataArray.push({
                        flow: "general",
                        excludeAreaCode4FreePostage: "ALL",
                        countryCode: 1001,
                        provinceCode: 1098,
                        cityCode: 1099,
                        deliveryFee: dataJSON?.deliveryFee,
                        //window.__INIT_DATA.data["1081181309101"].data.deliveryFee
                        amount: quantityBegin,
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
                        weight: Math.floor(dataJSON?.unitWeight * quantityBegin * 100) / 100 //window.__INIT_DATA.data["1081181309101"].data.unitWeight * window.__INIT_DATA.data["1081181309101"].data.startAmount
                    });
                } else {
                    isLastPage = true;
                    break;
                }
            }
        }
        if (!encounteredPunishPage) {
            chrome.tabs.sendMessage(tabID, {
                "ajaxData": ajaxDataArray,
                "pageNum": pageNum,
                "isLastPage": isLastPage
            }, (response)=>{
                console.log(response);
            }
            );
        } else
            offersCountInPage = 0;
    }
    return {
        "addedCount": ajaxDataArray.length,
        "offersCount": offersCountInPage
    };
    //return sortedOffersRound1;
}

async function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}

async function compareWithCPT(fod) {
    return new Promise((resolve,reject)=>{
        chrome.storage.local.get([cptKey], (result)=>{
            if (chrome.runtime.lastError) {
                reject(false);
            } else if (fod.priceAdded <= result[cptKey]) {
                chrome.storage.local.set({
                    ["" + fod.offer.id]: fod
                }, ()=>{}
                );
                resolve(false);
            } else {
                resolve(true);
            }
        }
        );
    }
    );
}
