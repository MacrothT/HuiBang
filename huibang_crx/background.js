////importScripts("common.js");
const CPT_KEY = "currentPriceThreshold"
  , ACT_OPEN = "open";
////import*as Common from "./common.js";

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    const searchURL = request?.searchURL
      , iodSfx = request?.iodSuffix;
    if (searchURL && 0 !== searchURL.length && iodSfx && 0 !== iodSfx.length) {
        //const iodURL = searchURL + request.iodSuffix;
        //console.log(iodURL);
        try {
            chrome.runtime.sendMessage({
                progress: "开始处理第一批"
            });
            chrome.storage.local.clear();
            chrome.storage.local.set({
                [CPT_KEY]: Number.MAX_SAFE_INTEGER
            }, ()=>{}
            );
            //Load Initial Order Discounts
            const START = iodSfx.indexOf("&quantityBegin=")
              , END = iodSfx.indexOf('&', START + 1)
              , quantityBegin = +iodSfx.substring(START + 15, END);
            //String->Int
            (async()=>{
                await extractORD(searchURL + iodSfx, quantityBegin, request.tabID);
                chrome.runtime.sendMessage({
                    progress: "开始处理第二批"
                });
                //Load One Item Consign Offers
                const oicoURL = searchURL + "&sortType=price&descendOrder=false&filt=y&feature=100020070:33097";
                //quantity===Number.MIN_SAFE_INTEGER here is a contract, a signal of OICO, do NOT change it alone
                await extractORD(oicoURL, Number.MIN_SAFE_INTEGER, request.tabID);
            }
            )();
        } catch (error) {
            console.error(error);
        } finally {
            sendResponse();
        }
    } else if (ACT_OPEN === request?.action) {
        openStoredOffersTab(request.tabID);
        sendResponse();
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

async function fetchHTML(url) {
    const response = await fetch(url, {
        credentials: "include"
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
async function extractORD(url, quantityBegin, tabID) {
    let pageNum = 1
      , pageCnt = 0
      , isLastPage = true
      , sortedInMultiplePages = 0
      , toNextPage = true;
    const IS_IOD = !!(Number.MIN_SAFE_INTEGER !== quantityBegin);
    do {
        const PAGE_URL = url + `&beginPage=${pageNum}`;
        //模板字符串必须用`不能用"或'
        const HTML = await fetchHTML(PAGE_URL);
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
                    error: TIP
                });
                break;
            } else if (0 === pageCnt) {
                //const HINT = IS_IOD ? `在指定的 关键词 及 起批量：${quantityBegin} 下没有首单优惠的货源。` : "在指定的 关键词 下没有一件代发的货源。";
                //console.log(HINT);
                chrome.runtime.sendMessage({
                    progress: `在指定的 关键词${IS_IOD ? " 及 起批量：" + quantityBegin : ""} 下没有${IS_IOD ? "首单优惠" : "一件代发"}的货源。`//HINT
                });
                break;
            }
        }
        isLastPage = !!(pageNum === pageCnt);
        const PAGE_RESULT = await sortQuantityPricesInPage(jsonObj.data, sortedInMultiplePages, quantityBegin, tabID, pageNum, isLastPage);
        sortedInMultiplePages += PAGE_RESULT.addedCount;
        toNextPage = !isLastPage && (0 !== PAGE_RESULT.addedCount) && (PAGE_RESULT.addedCount === PAGE_RESULT.offersCount);
        if (toNextPage) {
            if (!isLastPage) {
                pageNum++;
                await sleep(5000 + Math.floor(Math.random() * 3500));
            } else {
                console.error(new Error("Code running into impossible business case!"));
            }
        } else {
            if (!IS_IOD) {
                openStoredOffersTab(tabID);
            }
        }
    } while (!isLastPage && toNextPage);
}

function openStoredOffersTab(tabID) {
    // use null-safe operator since chrome.runtime is lazy inited and might return undefined
    if (chrome.runtime?.id) {
        try {
            // Temporarily use CPT_KEY as a message to open new window showing stored offers.
            chrome.tabs.sendMessage(tabID, CPT_KEY, (response)=>{
                console.log(response);
            }
            );
        } catch (err) {
            console.error(err);
        }
    }
}

async function sortQuantityPricesInPage(data, sortedBefore, quantityBegin, tabID, pageNum, isLastPage) {
    let offersCountInPage = data?.offerList?.length
      , ajaxDataArray = new Array();
    if (offersCountInPage && (0 < offersCountInPage)) {
        let processed = sortedBefore + 1
          , offersCountForNow = sortedBefore + offersCountInPage
          , encounteredPunishPage = false;
        const IS_IOD = !!(Number.MIN_SAFE_INTEGER !== quantityBegin);
        for (let oneOffer of data.offerList) {
            chrome.runtime.sendMessage({
                progress: `正在处理第 ${processed} / ${offersCountForNow} 个，耐心等待……`
            });
            processed++;
            let oneODUrl = oneOffer?.information?.detailUrl;
            await sleep(4500 + Math.floor(Math.random() * 3500));
            const oneOfferHTML = await fetchHTML(oneODUrl);
            //Return page of fetch(oneODUrl) includes window.__INIT_DATA={"data":{...},"globalData":{...},...}\r\n</script>
            let initDataIdx = oneOfferHTML.indexOf("window.__INIT_DATA");
            if (-1 === initDataIdx) {
                encounteredPunishPage = true;
                const errTip = "<p>Error：可能遇到了Punish页面，任务已中止。等待一段时间、或重新登录后重试。正在显示已处理的记录……</p>";
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
                let fitQuantityAndPrice = {
                    isAdded: Boolean("FREE" === dataJSON?.deliveryFee),
                    offer: {
                        company: {
                            name: oneOffer.company.name,
                            url: oneOffer.company.url
                        },
                        id: offerId,
                        image: {
                            imgUrlOf290x290: oneOffer.image.imgUrlOf290x290
                        },
                        information: {
                            detailUrl: oneOffer.information.detailUrl,
                            simpleSubject: oneOffer.information.simpleSubject
                        }
                    },
                    priceAdded: 0,
                    quantity: 0
                };
                for (oneQP of quantityPrices) {
                    const oneQ = oneQP?.quantity
                      , oneQPNum = +oneQP.valueString;
                    if (!IS_IOD) {
                        fitQuantityAndPrice.priceAdded = oneQPNum;
                        fitQuantityAndPrice.quantity = oneQ;
                        break;
                    } else {
                        let sIdx = oneQ.indexOf('~');
                        if (-1 != sIdx) {
                            const upperQ = +oneQ.substring(sIdx + 1);
                            if (quantityBegin <= upperQ) {
                                fitQuantityAndPrice.priceAdded = oneQPNum;
                                fitQuantityAndPrice.quantity = oneQ;
                                break;
                            }
                        } else {
                            sIdx = oneQ.indexOf('≥');
                            const lowerQ = +oneQ.substring(sIdx + 1);
                            if (quantityBegin >= lowerQ) {
                                fitQuantityAndPrice.priceAdded = oneQPNum;
                                fitQuantityAndPrice.quantity = oneQ;
                                break;
                            }
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
                const aboveThreshold = await compareWithCPT(fitQuantityAndPrice);
                if (!aboveThreshold) {
                    ajaxDataArray.push({
                        flow: "general",
                        excludeAreaCode4FreePostage: "ALL",
                        countryCode: 1001,
                        provinceCode: 1098,
                        cityCode: 1099,
                        deliveryFee: dataJSON?.deliveryFee,
                        //window.__INIT_DATA.data["1081181309101"].data.deliveryFee
                        amount: IS_IOD ? quantityBegin : 1,
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
                        weight: IS_IOD ? Math.floor(dataJSON?.unitWeight * quantityBegin * 100) / 100 : dataJSON?.unitWeight //window.__INIT_DATA.data["1081181309101"].data.unitWeight * window.__INIT_DATA.data["1081181309101"].data.startAmount
                    });
                } else {
                    isLastPage = true;
                    break;
                }
            }
        }
        let msg = CPT_KEY;
        // Temporarily use CPT_KEY as a message to open new window showing stored offers.
        if (!encounteredPunishPage) {
            msg = {
                ajaxData: ajaxDataArray,
                isLastPage: isLastPage,
                pageNum: pageNum,
                quantityBegin: quantityBegin
            };
        }
        // else {            offersCountInPage = 0;        }
        // use null-safe operator since chrome.runtime is lazy inited and might return undefined
        if (chrome.runtime?.id) {
            try {
                chrome.tabs.sendMessage(tabID, msg, (response)=>{
                    console.log(response);
                }
                );
            } catch (err) {
                console.error(err);
            }
        }
    }
    return {
        addedCount: ajaxDataArray.length,
        offersCount: offersCountInPage
    };
}

async function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}

async function compareWithCPT(iodOrOICO) {
    return new Promise((resolve,reject)=>{
        chrome.storage.local.get([CPT_KEY], (result)=>{
            if (chrome.runtime.lastError) {
                reject(false);
            } else if (iodOrOICO.priceAdded <= result[CPT_KEY]) {
                chrome.storage.local.set({
                    ["" + iodOrOICO.offer.id]: iodOrOICO
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
