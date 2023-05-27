(function() {
    "use strict";
    window.addEventListener("message", (event)=>{
        if (event.origin === "https://s.1688.com" && event.data?.ajaxData) {
            Promise.allSettled(event.data.ajaxData.map((oneAjax)=>{
                return new Promise((resolve,reject)=>{
                    //WARN: chrome.storage unavailable here!
                    //Behavior of www.1688.com/offer/...
                    //From https://g.alicdn.com/??code/npm/@ali/tdmod-pc-od-dsc-order/0.0.154/index-pc.js :
                    //var p=(0,o.debounce)((function(e,t,n){... a.default.request({api:"mtop.1688.freightInfoService.getFreightInfoWithScene",v:"1.0",data:s({},e)},(function(e){e&&e.data&&t(e.data)}),n) ...
                    //Examples:
                    //"https://h5api.m.1688.com/h5/mtop.1688.freightinfoservice.getfreightinfowithscene/1.0/?jsv=2.4.11&appKey=12574478&t=1683106528432&sign=606a7b2da186ced17e26223928ae4b99&api=mtop.1688.freightInfoService.getFreightInfoWithScene&v=1.0&type=jsonp&isSec=0&timeout=20000&dataType=jsonp&callback=mtopjsonp22&data=%7B%22offerId%22%3A715077182893%2C%22sellerUserId%22%3A0%2C%22sendAddressCode%22%3A%2234995485%22%2C%22receiveAddressCode%22%3A%22110100%22%2C%22freeEndAmount%22%3A-1%2C%22pageScene%22%3A%22dsc%22%2C%22skuCalParams%22%3A%22%5B%5D%22%2C%22extendMap%22%3A%22%7B%5C%22officialLogistics%5C%22%3Afalse%2C%5C%22unitWeight%5C%22%3A1%2C%5C%22sellerLoginId%5C%22%3A%5C%22%E6%B1%87%E9%91%AB%E5%B7%A5%E5%8E%82%E7%9B%B4%E8%90%A5%E5%BA%97%5C%22%2C%5C%22templateId%5C%22%3A17604380%2C%5C%22amount%5C%22%3A1%7D%22%7D"

                    
                    //Old version from https://g.alicdn.com/??code/npm/@ali/tdmod-pc-od-dsc-order/0.0.100/index-pc.js :
                    //function(t,e){        r.default.ajax({            url:"https://laputa.1688.com/offer/ajax/CalculateFreight.do",           dataType:"jsonp",           data:o({},t),           success:function(t){                t.success&&e&&t&&t.data&&t.data.costs&&t.data.costs[0]&&e(t.data.costs[0])          }       })  }
                    //Examples:
                    //https://laputa.1688.com/offer/ajax/CalculateFreight.do?amount=2&templateId=15052391&memberId=b2b-221121193482705959&offerId=642221231300&flow=general&excludeAreaCode4FreePostage=ALL&countryCode=1001&provinceCode=1098&cityCode=1099&price=67.50&volume=0&weight=0.2&callback=jsonp1642586798521
                    //https://laputa.1688.com/offer/ajax/CalculateFreight.do?amount=2&templateId=15052391&memberId=b2b-221121193482705959&offerId=642221231300&flow=general&excludeAreaCode4FreePostage=ALL&countryCode=1001&provinceCode=2561&cityCode=2562&price=67.50&volume=0&weight=0.2&callback=jsonp1642586652881
                    if (!Boolean(oneAjax?.freeDeliverFee)) {
                        $.ajax({
                            url: "https://laputa.1688.com/offer/ajax/CalculateFreight.do",
                            dataType: "jsonp",
                            data: oneAjax,
                            success: (t)=>{
                                //Example of t: {"data":{"costs":[{"cost":"4","subTemplate":"快递"}]},"success":true}
                                // Assuming you've verified the origin of the received message (which
                                // you must do in any case), a convenient idiom for replying to a
                                // message is to call postMessage and provide event.origin as the targetOrigin.
                                if (t.success && t && t.data && t.data.costs && t.data.costs[0]) {
                                    window.postMessage({
                                        id: oneAjax?.offerId,
                                        cost: t.data.costs[0]?.cost,
                                        quantityBegin: event.data?.quantityBegin
                                    }, event.origin);
                                    resolve(oneAjax?.offerId);
                                } else {
                                    console.log(`Error: Mal-format in ajax return values for: ${oneAjax}`);
                                    reject(oneAjax?.offerId);
                                }
                            }
                            //,error:( jqXHR jqXHR, String textStatus, String errorThrown )=>{reject(errorThrown);}
                        });
                    } else {
                        resolve(oneAjax?.offerId);
                    }
                }
                ).catch((error)=>{
                    console.log(error);
                    reject(oneAjax?.offerId);
                }
                );
                //.finally(() => {});
            }
            )).then((results)=>{
                window.postMessage({
                    batchIDs: results.map((oneResult)=>"fulfilled" === oneResult.status ? oneResult.value : oneResult.reason),
                    isLastPage: event.data?.isLastPage,
                    pageNum: event.data?.pageNum,
                    quantityBegin: event.data?.quantityBegin
                }, event.origin);
            }
            );
        }
    }
    , true);
}());
