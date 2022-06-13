document.body.style.border = "2px solid #E5F2F2";
const ACT_OPEN = "open";

document.querySelector('button[name="search"]').onclick = function() {
    //WARN: chrome.tabs.getCurrent() NOT available here!
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs)=>{
        const url = tabs[0].url
          , errorDiv = document.getElementById("error-content");
        if (url?.startsWith("https://s.1688.com/selloffer/offer_search.htm?keywords=")) {
            errorDiv.style.display = "none";
            try {
                chrome.runtime.sendMessage({
                    searchURL: url,
                    iodSuffix: `&quantityBegin=${quantityBegin.value}&sortType=price&descendOrder=false&filt=y&filtMemberTags=1445761`,
                    //#sm-filtbar`,
                    tabID: tabs[0].id
                }, (response)=>{}
                //See https://stackoverflow.com/questions/59914490/how-to-handle-unchecked-runtime-lasterror-the-message-port-closed-before-a-res/59915897
                );
                //console.log(searchURL);
            } catch (error) {
                display(error);
                console.error(error);
            }
        } else {
            //%C4%FD%BD%BA+%B1%F9%B5%E6&
            display("<p>Error：必须在货源搜索页面进行操作</p>");
        }
    }
    );
}

function display(errorText) {
    const errorDiv = document.getElementById("error-content");
    errorDiv.innerHTML = `${errorText}`;
    errorDiv.style.display = "block";
}

document.querySelector('button[name="open"]').onclick = function() {
    document.getElementById("error-content").style.display = "none";
    //WARN: chrome.tabs.getCurrent() NOT available here!
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs)=>{
        try {
            chrome.runtime.sendMessage({
                action: ACT_OPEN,
                tabID: tabs[0].id
            }, (response)=>{}
            );
        } catch (error) {
            display(error);
            console.error(error);
        }
    }
    );
}

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    let err = request?.error;
    if (err && err.length !== 0) {
        try {
            display(err);
        } catch (error) {
            display(error);
            console.log(error);
        }
    } else if (request?.progress && 0 !== request?.progress.length) {
        const progressDiv = document.getElementById("progress-content");
        progressDiv.innerHTML = `${request.progress}`;
        progressDiv.style.display = "block";
    }
    sendResponse();
    //return true;
    // Add this so that it will respond asynchronously.
}
);

document.querySelector('button[name="test"]').onclick = function() {
    // iodOrOICO{priceAdded: offerPriceAdded,isAdded: Boolean("FREE" === dataJSON?.deliveryFee),     quantity: oneQ,
    // offer: {company:{name:...,url:...}, image: {imgUrlOf290x290:...}, information:{detailUrl:..., simpleSubject:...}} }
    let dispHTML = toDispHTML([new Array({
        priceAdded: 87.5,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 92,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 93,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 94,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 95,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    }), new Array({
        priceAdded: 187.5,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 192,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 193,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 194,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    },{
        priceAdded: 195,
        isAdded: true,
        quantity: 2,
        offer: JSON.parse('{"company":{"name":"深圳市新田电池有限公司","url":"https://shop7406j1u893p97.1688.com"},"image":{"imgUrlOf290x290":"https://cbu01.alicdn.com/img/ibank/O1CN01fM0hAy2DPlf0Oupwa_!!3938148602-0-cib.290x290.jpg"},"information":{"detailUrl":"https://detail.1688.com/offer/577932025981.html","simpleSubject":"松下LR41纽扣电池AG3体温计温度计L736 192 392A手表1.5V碱性电池"}}')
    })]);
    const rsWindow = window.open("", `Test排序结果：`);
    //${window.data.pageConfigData.originalKeywords}`);
    //rsWindow.document.documentElement.innerHTML = dispHTML;
    rsWindow.document.write(dispHTML);
    //console.log(dispHTML);
    rsWindow.document.close();
}

function toDispHTML(offerArrays) {
    const innerHead = '<!DOCTYPE html><html lang="cmn-Hans"><head><meta charset="utf-8"><title>惠帮</title><style>.space-common-offerlist{overflow:hidden;position:relative;margin:0 auto}@media (max-width: 1219px){.space-common-offerlist{width:992px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist{width:1192px}}@media (min-width: 1420px){.space-common-offerlist{width:1392px}}.space-common-offerlist .image-offer-shade{width:100%;height:100%;position:absolute;top:0;left:0;background-color:rgba(0,0,0,0.7);z-index:99}.space-common-offerlist .sm-offer{margin-top:0}@media (max-width: 1219px){.space-common-offerlist .sm-offer{width:992px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .sm-offer{width:1192px}}@media (min-width: 1420px){.space-common-offerlist .sm-offer{width:1392px}}.space-common-offerlist .sm-offer .offer-list{padding:0;margin:0;display:flex}.space-common-offerlist .sm-offer .offer-list .space-offer-card-box{vertical-align:top}@media (max-width: 1219px){.space-common-offerlist .sm-offer .offer-list{margin-right:-34px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .sm-offer .offer-list{margin-right:-20px}}@media (min-width: 1420px){.space-common-offerlist .sm-offer .offer-list{margin-right:-12px}}.space-common-offerlist .sm-offer .offer-list .card-container{float:left}@media (max-width: 1219px){.space-common-offerlist .sm-offer .offer-list .card-container{margin-right:34px;margin-bottom:34px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .sm-offer .offer-list .card-container{margin-right:20px;margin-bottom:20px}}@media (min-width: 1420px){.space-common-offerlist .sm-offer .offer-list .card-container{margin-right:12px;margin-bottom:12px}}.space-common-offerlist .qrwlist{display:inline-block}.space-common-offerlist .i2ilist{display:inline-block}@media (max-width: 1219px){.space-common-offerlist .common-filt-zero-result{width:992px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .common-filt-zero-result{width:1192px}}@media (min-width: 1420px){.space-common-offerlist .common-filt-zero-result{width:1392px}}.space-common-offerlist .common-filt-zero-result .sm-noresult{height:308px;box-sizing:content-box}.space-common-offerlist .common-filt-zero-result .sm-noresult .noresult-logo{float:left;width:204px;height:204px;margin-top:50px;margin-right:84px;margin-left:280px;background:url(//cbu01.alicdn.com/cms/upload/2013/909/997/1799909_1367035968.png) no-repeat 0 0;_display:inline}.space-common-offerlist .common-filt-zero-result .sm-noresult .noresult-content{overflow:hidden;zoom:1;padding-top:100px}.space-common-offerlist .common-filt-zero-result .sm-noresult .noresult-hd{font-family:"Microsoft Yahei";font-size:18px;color:#444;padding-bottom:30px}.space-common-offerlist .common-filt-zero-result .sm-noresult .noresult-hd em{font-family:tahoma;font-size:24px;color:#ff7300}.space-common-offerlist .common-filt-zero-result .sm-noresult .noresult-item-hd{color:#777;font-weight:bold;padding-bottom:20px}.space-common-offerlist .common-filt-zero-result .sm-noresult .noresult-item{color:#666;padding-bottom:10px}.space-common-offerlist .common-filt-zero-result .noresult-btn{height:18px;line-height:16px;line-height:18px\\9;display:inline-block;padding:3px 14px;margin-left:8px;border:solid 1px #ff5400;color:#ffffff;background-color:#ff7100;border-radius:3px;text-decoration:none}.space-common-offerlist .common-filt-zero-result .sw-layout-990 .sm-noresult .noresult-logo{margin-left:180px}.space-common-offerlist .common-filt-zero-result .sw-layout-1390 .sm-noresult .noresult-logo{margin-left:380px}.space-common-offerlist .common-filt-zero-result .sm-filtered-noresult{height:134px;margin-top:20px;margin-bottom:10px;border:1px solid #ddd;background-color:#f6f6f6}.space-common-offerlist .common-filt-zero-result .sm-filtered-noresult .filted-noresult-hint{margin-left:380px;margin-top:34px}.space-common-offerlist .common-filt-zero-result .sm-filtered-noresult .filted-noresult-hint-icon{width:35px;height:40px;float:left;margin-right:20px;background:url(//cbu01.alicdn.com/cms/upload/search/list/others/main.default.others.20121107.png) no-repeat 0 -23px}.space-common-offerlist .common-filt-zero-result .sm-filtered-noresult .filted-noresult-hint-bd{overflow:hidden;_zoom:1}.space-common-offerlist .common-filt-zero-result .sm-filtered-noresult .filted-noresult-hint p{font-family:"宋体";font-size:14px;font-weight:bold;color:#444;margin-top:5px}.space-common-offerlist .common-filt-zero-result .sm-filtered-noresult .filted-noresult-hint em{color:#ff7300}.space-common-offerlist .common-filt-zero-result .sw-layout-990 .sm-filtered-noresult .filted-noresult-hint{margin-left:220px}.space-common-offerlist .common-filt-zero-result .sw-layout-1190 .sm-filtered-noresult .filted-noresult-hint{margin-left:320px}.space-common-offerlist .common-filt-zero-result .sw-layout-1390 .sm-filtered-noresult .filted-noresult-hint{margin-left:420px}.space-common-offerlist .common-filt-zero-result .noresult-btn-addon{margin-left:0;margin-top:18px}.space-common-offerlist .common-filt-zero-result .sm-filtered-title{position:relative;padding:15px 0;padding-bottom:10px;margin-top:10px;border-top:2px solid #E8E8E8;font-weight:700;font-size:14px;color:#888}.space-common-offerlist .common-filt-zero-result .sm-filtered-title em{font-weight:bold;color:#ff7300;padding:0 4px}.space-common-offerlist .common-filt-zero-result .sm-filtered-title a:link,.space-common-offerlist .common-filt-zero-result .sm-filtered-title a:visited,.space-common-offerlist .common-filt-zero-result .sm-filtered-title a:active{color:#1e50a2}.space-common-offerlist .common-filt-zero-result .sm-filtered-title a:hover{color:#ff7300}.space-common-offerlist .common-filt-zero-result .sm-filtered-more{position:absolute;right:0;top:13px;height:18px;line-height:17px;padding:2px 6px 2px 10px;font-size:12px;font-weight:normal;color:#888 !important;text-decoration:none !important;border:1px solid #E8E8E8}.space-common-offerlist .common-filt-zero-result .sm-filtered-more:hover{color:#FF7300 !important}.space-common-offerlist .common-filt-zero-result .sm-filtered-more em{font-weight:normal;padding:0}.space-common-offerlist .common-filt-zero-result .sm-gongyi{margin:14px 0;text-align:center}.space-common-offerlist .common-filt-zero-result .sm-gongyi iframe{width:970px;height:300px;vertical-align:middle}.space-common-offerlist .common-dangerouschemicalresult .clear{*zoom:1}.space-common-offerlist .common-dangerouschemicalresult .clear:before,.space-common-offerlist .common-dangerouschemicalresult .clear:after{content:" ";display:table;line-height:0}.space-common-offerlist .common-dangerouschemicalresult .clear:after{clear:both}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger{margin:100px auto;width:1190px;background:#FAFAFA url(https://cbu01.alicdn.com/cms/upload/2015/365/415/2514563_471649453.png) center 50px no-repeat;height:406px;margin-left:auto;border:1px solid #E5E5E5;margin-right:auto;text-align:center}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-title{font-size:14px;color:#444;padding-top:144px}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-title em{color:#FF7300}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .clear{*zoom:1}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .clear:before,.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .clear:after{content:" ";display:table;line-height:0}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .clear:after{clear:both}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-btn-list{margin:50px auto 12px auto}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-btn-list a{display:inline-block;text-decoration:none;margin:2px 5px;height:36px;line-height:36px;color:#FF7300;font-size:14px;width:151px;border:1px solid #FF7300}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-btn-list a:hover{background:#FF7300;color:#FFF;cursor:pointer}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-desc{color:#999;margin-bottom:30px}.space-common-offerlist .common-dangerouschemicalresult .mod-detail-danger .mod-detail-danger-link{color:#ff7300;line-height:28px}.space-common-offerlist .common-zero-result{margin-top:100px;display:flex;justify-content:center;margin-bottom:200px}.space-common-offerlist .common-zero-result .sm-noresult{height:308px;box-sizing:content-box}.space-common-offerlist .common-zero-result .sm-noresult .noresult-logo{float:left;width:204px;height:204px;margin-top:50px;margin-right:84px;margin-left:0;background:url("//cbu01.alicdn.com/cms/upload/2013/909/997/1799909_1367035968.png") no-repeat 0 0;_display:inline}.space-common-offerlist .common-zero-result .sm-noresult .noresult-content{overflow:hidden;zoom:1;padding-top:100px}.space-common-offerlist .common-zero-result .sm-noresult .noresult-hd{font-family:"Microsoft Yahei";font-size:18px;color:#444;padding-bottom:30px}.space-common-offerlist .common-zero-result .sm-noresult .noresult-hd em{font-family:tahoma;font-size:24px;color:#ff7300}.space-common-offerlist .common-zero-result .sm-noresult .noresult-item-hd{color:#777;font-weight:bold;padding-bottom:20px}.space-common-offerlist .common-zero-result .sm-noresult .noresult-item{color:#666;padding-bottom:10px}.space-common-offerlist .common-zero-result .noresult-btn{height:18px;line-height:16px;display:inline-block;padding:3px 14px;margin-left:8px;border:solid 1px #ff5400;color:#ffffff;background-color:#ff7100;border-radius:3px;text-decoration:none}.space-common-offerlist .common-zero-result .sm-filtered-noresult{height:134px;margin-top:20px;margin-bottom:10px;border:1px solid #ddd;background-color:#f6f6f6}.space-common-offerlist .common-zero-result .sm-filtered-noresult .filted-noresult-hint{margin-left:380px;margin-top:34px}.space-common-offerlist .common-zero-result .sm-filtered-noresult .filted-noresult-hint-icon{width:35px;height:40px;float:left;margin-right:20px;background:url("//cbu01.alicdn.com/cms/upload/search/list/others/main.default.others.20121107.png") no-repeat 0 -23px}.space-common-offerlist .common-zero-result .sm-filtered-noresult .filted-noresult-hint-bd{overflow:hidden;_zoom:1}.space-common-offerlist .common-zero-result .sm-filtered-noresult .filted-noresult-hint p{font-family:"宋体";font-size:14px;font-weight:bold;color:#444;margin-top:5px}.space-common-offerlist .common-zero-result .sm-filtered-noresult .filted-noresult-hint em{color:#ff7300}.space-common-offerlist .common-zero-result .sw-layout-990 .sm-filtered-noresult .filted-noresult-hint{margin-left:220px}.space-common-offerlist .common-zero-result .sw-layout-1190 .sm-filtered-noresult .filted-noresult-hint{margin-left:320px}.space-common-offerlist .common-zero-result .sw-layout-1390 .sm-filtered-noresult .filted-noresult-hint{margin-left:420px}.space-common-offerlist .common-zero-result .noresult-btn-addon{margin-left:0;margin-top:18px}.space-common-offerlist .common-zero-result .sm-filtered-title{position:relative;padding:15px 0;padding-bottom:10px;margin-top:10px;border-top:2px solid #E8E8E8;font-weight:700;font-size:14px;color:#888}.space-common-offerlist .common-zero-result .sm-filtered-title em{font-weight:bold;color:#ff7300;padding:0 4px}.space-common-offerlist .common-zero-result .sm-filtered-title a:link,.space-common-offerlist .common-zero-result .sm-filtered-title a:visited,.space-common-offerlist .common-zero-result .sm-filtered-title a:active{color:#1e50a2}.space-common-offerlist .common-zero-result .sm-filtered-title a:hover{color:#ff7300}.space-common-offerlist .common-zero-result .sm-filtered-more{position:absolute;right:0;top:13px;height:18px;line-height:17px;padding:2px 6px 2px 10px;font-size:12px;font-weight:normal;color:#888 !important;text-decoration:none !important;border:1px solid #E8E8E8}.space-common-offerlist .common-zero-result .sm-filtered-more:hover{color:#FF7300 !important}.space-common-offerlist .common-zero-result .sm-filtered-more em{font-weight:normal;padding:0}.space-common-offerlist .common-zero-result .sm-gongyi{margin:14px 0;text-align:center}.space-common-offerlist .common-zero-result .sm-gongyi iframe{width:970px;height:300px;vertical-align:middle}.space-common-offerlist .common-qrw-offer-list *{font-size:0;line-height:0;font:12px/1.5 Tahoma, Arial, sans-serif}@media (max-width: 1219px){.space-common-offerlist .common-qrw-offer-list{width:734px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .common-qrw-offer-list{width:948px}}@media (min-width: 1420px){.space-common-offerlist .common-qrw-offer-list{width:1158px}}.space-common-offerlist .common-qrw-offer-list .qrw-tip{border:1px solid #ffe4b5;padding:8px 16px;background-color:#fff1db}.space-common-offerlist .common-qrw-offer-list .qrw-tip span{color:#555}.space-common-offerlist .common-qrw-offer-list .qrw-tip .qrw-extend-words{margin-right:12px;color:#ff7300}.space-common-offerlist .common-qrw-offer-list .qrw-bar{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;border-top:2px solid #e8e8e8;margin-top:10px;padding:13px 0}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-recommend *{margin-right:8px;font-size:14px;font-weight:bold;color:#888;line-height:24px}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-recommend .qrw-delete-string{text-decoration:line-through}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-recommend .qrw-extend-words{color:#ff7300}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more{text-align:right}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a{display:inline-block;text-decoration:none;padding:2px 6px 2px 10px;border:1px solid #e8e8e8;background-color:#fff;color:#888;line-height:17px}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:link,.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:visited{color:#888}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:link .qrw-more-icon i,.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:link .qrw-more-icon em,.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:visited .qrw-more-icon i,.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:visited .qrw-more-icon em{background-color:#aaa}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:hover{color:#ff7300;text-decoration:none}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:hover .qrw-more-icon i,.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a:hover .qrw-more-icon em{background-color:#ff7300}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a .qrw-more-icon{display:inline-block;margin-top:3px;margin-left:4px;width:11px;height:11px}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a .qrw-more-icon i{display:block;width:11px;height:1px;overflow:hidden;background:#aaa}.space-common-offerlist .common-qrw-offer-list .qrw-bar .qrw-more a .qrw-more-icon em{display:block;width:1px;height:11px;overflow:hidden;background:#aaa;margin:-6px 0 0 5px}.space-common-offerlist .common-i2i-offer-list *{box-sizing:content-box;font-size:0;line-height:0;font:12px/1.5 Tahoma, Arial, sans-serif}.space-common-offerlist .common-i2i-offer-list .i2i-tip{border-top:2px solid #e8e8e8;margin-top:10px;padding:13px 0}.space-common-offerlist .common-i2i-offer-list .i2i-tip span{margin-right:8px;font-size:14px;font-weight:bold;color:#888;line-height:24px}.space-common-offerlist .common-original-offer-list{float:left}.space-common-offerlist .common-original-offer-list .sm-offer{margin-top:0}@media (max-width: 1219px){.space-common-offerlist .common-original-offer-list .sm-offer{width:734px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .common-original-offer-list .sm-offer{width:948px}}@media (min-width: 1420px){.space-common-offerlist .common-original-offer-list .sm-offer{width:1158px}}.space-common-offerlist .common-original-offer-list .sm-offer .offer-list{padding:0;margin:0;display:flex;flex-wrap:wrap;justify-content:space-around}@media (max-width: 1219px){.space-common-offerlist .common-original-offer-list .sm-offer .offer-list{margin-right:-34px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .common-original-offer-list .sm-offer .offer-list{margin-right:-20px}}@media (min-width: 1420px){.space-common-offerlist .common-original-offer-list .sm-offer .offer-list{margin-right:-12px}}.space-common-offerlist .common-original-offer-list .sm-offer .offer-list .card-container{float:left}@media (max-width: 1219px){.space-common-offerlist .common-original-offer-list .sm-offer .offer-list .card-container{margin-right:34px;margin-bottom:34px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .common-original-offer-list .sm-offer .offer-list .card-container{margin-right:20px;margin-bottom:20px}}@media (min-width: 1420px){.space-common-offerlist .common-original-offer-list .sm-offer .offer-list .card-container{margin-right:12px;margin-bottom:12px}}.space-common-offerlist #sm-offer-list>div{display:inline-block;background-color:#ffffff}@media (max-width: 1219px){.space-common-offerlist #sm-offer-list>div{margin-right:34px;margin-bottom:34px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist #sm-offer-list>div{margin-right:20px;margin-bottom:20px}}@media (min-width: 1420px){.space-common-offerlist #sm-offer-list>div{margin-right:12px;margin-bottom:12px}}@media (max-width: 1219px){.space-common-offerlist .common-original-offer-list.noRightP4P .sm-offer,.space-common-offerlist .common-qrw-offer-list.noRightP4P .sm-offer{width:992px}}@media (min-width: 1220px) and (max-width: 1419px){.space-common-offerlist .common-original-offer-list.noRightP4P .sm-offer,.space-common-offerlist .common-qrw-offer-list.noRightP4P .sm-offer{width:1192px}}@media (min-width: 1420px){.space-common-offerlist .common-original-offer-list.noRightP4P .sm-offer,.space-common-offerlist .common-qrw-offer-list.noRightP4P .sm-offer{width:1392px}}.space-common-offerlist-1192{width:1192px}.space-common-offerlist-1192 .common-original-offer-list.noRightP4P .sm-offer,.space-common-offerlist-1192 .common-qrw-offer-list.noRightP4P .sm-offer{width:100%}.space-common-offerlist-1350{width:1350px;margin:0 0 0 0}.space-common-offerlist-1350 .common-original-offer-list.noRightP4P .sm-offer,.space-common-offerlist-1350 .common-qrw-offer-list.noRightP4P .sm-offer{width:100%}.dlhBottomWhite{height:100px;width:100%;display:inline-block}</style><style>.img-container{height:290px;width:290px;overflow:hidden;cursor:pointer}.mojar-element-image .img{height:290px;width:290px;background-size:contain;background-repeat:no-repeat;transform:scale(1);transition:all 0.5s ease 0s;background-position:center}.mojar-element-image .img:hover{transform:scale(1.05)}.mojar-element-image .saleCount{height:20px;width:40px;font-family:Helvetica;font-size:12px;color:#FFFFFF;letter-spacing:0;position:absolute;top:188px;left:65px;z-index:1001;text-align:center;line-height:18px}.mojar-element-image .slider-container{height:290px;width:290px;overflow:hidden;position:relative;display:block;cursor:pointer}.mojar-element-image .slider-container:hover .prev-arrow{display:block !important}.mojar-element-image .slider-container:hover .next-arrow{display:block !important}.mojar-element-image .slider-img-item{width:290px;height:290px}.mojar-element-image .prev-arrow{display:none !important;position:absolute;width:32px;cursor:pointer;height:32px;top:100px;left:0;background:url("https://img.alicdn.com/tfs/TB1SVnrqAvoK1RjSZFNXXcxMVXa-33-32.png") no-repeat center}.mojar-element-image .next-arrow{display:none !important;position:absolute;width:32px;cursor:pointer;height:32px;top:100px;right:0;background:url("https://img.alicdn.com/tfs/TB1kOvoqrPpK1RjSZFFXXa5PpXa-32-32.png") no-repeat center}</style><style>.normalcommon-offer-card{width:290px;border:1px solid #E7E7E7;background-color:#ffffff;position:relative;box-sizing:border-box}</style></head><body class="zh-cn" style="position: relative;">';
    const innerEnd = "</body></html>";
    let innerLi = "";
    for (let oneArray of offerArrays) {
        innerLi += '<div id="app"><div><div class="space-common-offerlist"><div data-spm="offerlist"><div class="common-original-offer-list"><div class="sm-offer"><ol id="sm-offer-list" class="offer-list">';
        for (let oneObj of oneArray) {
            innerLi += '<li><div class="space-offer-card-box" style="overflow: hidden;"><div class="normalcommon-offer-card"><div class="img-container"><div class="mojar-element-image">';
            let oneOffer = oneObj?.offer
              , oneInfo = oneOffer?.information;
            let oneDUrl = oneInfo?.detailUrl;
            innerLi += `<a href="${oneDUrl}" target="_blank">`;
            innerLi += `<div class="img" style="background-image: url('${oneOffer?.image?.imgUrlOf290x290}?_=2020');"></div></a></div></div>`;
            innerLi += `<div class="mojar-element-title"><a href="${oneDUrl}" target="_blank">`;
            innerLi += `<div class="title">${oneInfo?.simpleSubject}</div></a></div>`;
            //TODO: innerLi += '<div class="mojar-element-offerTag"><div class="offer-tag-container"><div class="offer-tags">';...
            //innerLi += '</div>';//innerLi += '</div></div>';
            innerLi += '<div class="mojar-element-price"><div class="showPricec"><div class="rmb">¥</div>';
            innerLi += `<div class="price">${oneObj?.priceAdded}</div><div class="pricestyle"></div></div></div>`;
            let oneCmpn = oneOffer?.company;
            innerLi += '<div class="mojar-element-company">';
            //innerLi += `<a class="credit-tag identity-tag" href="https://shop3e67986509770.1688.com/page/creditdetail.htm" target="_blank" title="阿里巴巴建议您优先选择诚信通会员">1年</a>`;
            innerLi += `<div class="common-company-tag"></div><div class="company-name" title="${oneCmpn?.name}">`;
            innerLi += `<a href="${oneCmpn?.url}" target="_blank"><div class="company-name">${oneCmpn?.name}</div>`;
            innerLi += '</a></div></div>';
            innerLi += '<div class="card-element-hover"><div class="deal-container"><div class="dealInfo-1 deal"><div class="deal-item"><div class="price-container"><div class="rmb">¥</div>';
            innerLi += `<div class="price">${oneObj?.priceAdded}</div></div><div class="deal-num">${oneObj?.quantity}</div>`;
            innerLi += '</div></div></div></div><div class="mojar-element-promotion"></div></div></div></li>';
            //console.log(innerLi);
        }
        innerLi += '</ol></div></div></div></div></div></div><p style="height:20px;"></p>';
    }
    return innerHead + innerLi + innerEnd;
}
