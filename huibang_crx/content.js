(function() {
    "use strict";
    window.addEventListener("DOMContentLoaded", (event)=> injectScript() );

    function injectScript() {
        let htmlHead = document.head
          , lastC = htmlHead.lastChild;
        const idConst = "Huibang_inject";
        try {
            if (lastC && lastC?.id !== idConst) {
                let temp = document.createElement("script");
                //tagName, also nodeName
                temp.id = idConst;
                temp.type = "text/javascript";
                // 获得的地址类似：chrome-extension://jpbhpadpclighmdnppghdmjldffhegak/js/inject.js
                temp.src = chrome.runtime.getURL("js/inject.js");
                htmlHead.append(temp);
            }
        } catch (error) {
            console.log(error);
        }
        //TODO:onMessage(error)
    }

    window.addEventListener("message", (event)=>{
        if (event.origin === "https://s.1688.com") {
            try {
                if (event.data?.id && event.data?.cost) {
                    let id = "" + event.data.id;
                    chrome.storage.local.get([id], (result)=>{
                        let fod = result[id];
                        //console.log("storage value is ", fod);
                        if (!fod.isAdded) {
                            fod.priceAdded = fod.priceAdded + Number(event.data.cost);
                        }
                        fod.isAdded = true;
                        chrome.storage.local.set({
                            [id]: fod
                        }, ()=>{}
                        );
                    }
                    );
                } else if (event.data?.fodIDs) {
                    Promise.all(event.data.fodIDs.map((oneID)=>{
                        // Immediately return a promise and start asynchronous work
                        return new Promise(function(resolve,reject){
                            let timeoutID = setTimeout(()=>{
                                // Asynchronously get data from storage.local.
                                chrome.storage.local.get([oneID], (result)=>{
                                    // Pass any observed errors down the promise chain.
                                    if (chrome.runtime.lastError) {
                                        return reject(chrome.runtime.lastError);
                                    }
                                    // Pass the data retrieved from storage down the promise chain.
                                    let oneFOD = result[oneID];
                                    if (oneFOD?.isAdded) {
                                        clearTimeout(timeoutID);
                                        resolve(oneFOD);
                                    }
                                }
                                )
                            }
                            , 1000);
                        }
                        );
                    }
                    )).then(function(fodArray){
                        fodArray.sort((a,b)=>a.priceAdded - b.priceAdded);
                        let dispHTML = toDispHTML(fodArray);
                        const rsWindow = window.open("", `Huibang排序结果：`);
                        //${window.data.pageConfigData.originalKeywords}`);
                        rsWindow.document.write(dispHTML);
                        console.log(dispHTML);
                    }
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
    , true);

    chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
        /*typeof fodAjaxData : Array({flow: "general", excludeAreaCode4FreePostage: "ALL", 
         * countryCode: 1001, provinceCode: 1098, cityCode: 1099, amount: ?, templateId: ?, memberId: ?, 
         * offerId: ?, price: ?, volume: ?, weight: ? }, {...},...) */
        let fodAjaxData = request?.fodAjaxData;
        if (fodAjaxData && fodAjaxData.length !== 0) {
            try {
                //console.log(fodAjaxData);
                injectScript();
                window.postMessage({
                    ajaxData: fodAjaxData
                }, "https://s.1688.com");
                //"*");
                //await new Promise(resolve => setTimeout(resolve, 10000)).then(()=> {if (lastC && lastC?.id === idConst){ lastC.remove(); }});
            } catch (error) {
                console.log(error);
            }
            //TODO:onMessage(error)
        }
        sendResponse("Aloha! Remember to call sendResponse(...) if you specify the responseCallback parameter for sendMessage()!");
        //return true;  // Need responding synchronously here.
    }
    );

    /*<li><div class="space-offer-card-box" style="overflow: hidden;">
    <div class="normalcommon-offer-card">
        <div class="img-container"><div class="mojar-element-image">
            <a href="https://detail.1688.com/offer/642221231300.html" target="_blank">
                <div class="img" style="background-image: url(&quot;https://cbu01.alicdn.com/img/ibank/O1CN01Rs23Qf1lWoTpEAx2z_!!2211211934827-0-cib.290x290.jpg?_=2020&quot;);">
            </div></a></div></div>
        <div class="mojar-element-title">
            <a href="https://detail.1688.com/offer/642221231300.html" target="_blank">
                <div class="title">包邮 欢舞加厚高清下载运动健身跳舞机 电脑USB单人家用跳舞毯</div>
        </a></div>
        <div class="mojar-element-offerTag"><div class="offer-tag-container">
            <div class="offer-tags"><span class="promotion-text-tag" title="包邮">包邮</span>
                <a class="service-text-tag" title="深度验商">深度验商</a>
                <a class="service-text-tag" title="免费赊账">免费赊账</a>
        </div></div></div>
        <div class="mojar-element-price"><div class="showPricec"><div class="rmb">¥</div>
            <div class="price">67.50</div><div class="pricestyle"></div></div>
        </div>
        <div class="mojar-element-company">
            <a class="credit-tag identity-tag" href="https://shop3e67986509770.1688.com/page/creditdetail.htm" target="_blank" title="阿里巴巴建议您优先选择诚信通会员">1年</a>
            <div class="common-company-tag"></div>
            <div class="company-name" title="新罗区智绛沛百货店">
                <a href="https://shop3e67986509770.1688.com" target="_blank">
                    <div class="company-name">新罗区智绛沛百货店</div>
        </a></div></div>
        <div class="card-element-hover" style="display: none;">
            <div class="deal-container"><div class="dealInfo-1 deal">
                <div class="deal-item"><div class="price-container">
                    <div class="rmb">¥</div><div class="price">67.50</div></div>
                    <div class="deal-num">≥2件</div>
        </div></div></div></div>
        <div class="mojar-element-promotion"></div>
    </div></div></li>*/
    function toDispHTML(FODOffers) {
        const innerHead = '<!DOCTYPE html><html lang="cmn-Hans"><head><meta charset="utf-8"><title>惠帮</title></head><body class="zh-cn" style="position: relative;"><div id="app"><div><div class="space-common-offerlist"><div data-spm="offerlist"><div class="common-original-offer-list"><div class="sm-offer"><ol id="sm-offer-list" class="offer-list">';
        const innerEnd = "</ol></div></div></div></div></div></div></body></html>";
        let innerLi = "";
        for (let oneFOD of FODOffers) {
            innerLi += '<li><div class="space-offer-card-box" style="overflow: hidden;"><div class="normalcommon-offer-card"><div class="img-container"><div class="mojar-element-image">';
            let oneOffer = oneFOD?.offer
              , oneInfo = oneOffer?.information;
            let oneDUrl = oneInfo?.detailUrl;
            innerLi += `<a href="${oneDUrl}" target="_blank">`;
            innerLi += `<div class="img" style="background-image: url(&quot;${oneOffer?.image?.imgUrlOf290x290}?_=2020&quot;);"></div></a></div></div>`;
            innerLi += `<div class="mojar-element-title"><a href="${oneDUrl}" target="_blank">`;
            innerLi += `<div class="title">${oneInfo?.simpleSubject}</div></a></div>`;
            //TODO: innerLi += '<div class="mojar-element-offerTag"><div class="offer-tag-container"><div class="offer-tags">';...
            //innerLi += '</div>';//innerLi += '</div></div>';
            innerLi += '<div class="mojar-element-price"><div class="showPricec"><div class="rmb">¥</div>';
            innerLi += `<div class="price">${oneFOD?.priceAdded}</div><div class="pricestyle"></div></div></div>`;
            let oneCmpn = oneOffer?.company;
            innerLi += '<div class="mojar-element-company">';
            //innerLi += `<a class="credit-tag identity-tag" href="https://shop3e67986509770.1688.com/page/creditdetail.htm" target="_blank" title="阿里巴巴建议您优先选择诚信通会员">1年</a>`;
            innerLi += `<div class="common-company-tag"></div><div class="company-name" title="${oneCmpn?.name}">`;
            innerLi += `<a href="${oneCmpn?.url}" target="_blank"><div class="company-name">${oneCmpn?.name}</div>`;
            innerLi += '</a></div></div>';
            innerLi += '<div class="card-element-hover"><div class="deal-container"><div class="dealInfo-1 deal"><div class="deal-item"><div class="price-container"><div class="rmb">¥</div>';
            innerLi += `<div class="price">${oneFOD?.priceAdded}</div></div><div class="deal-num">${oneFOD?.quantity}</div>`;
            innerLi += '</div></div></div></div><div class="mojar-element-promotion"></div></div></div></li>';
            //console.log(innerLi);
        }
        return innerHead + innerLi + innerEnd;
    }
}());
