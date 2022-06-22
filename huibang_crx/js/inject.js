(function() {
    "use strict";
    window.addEventListener("message", (event)=>{
        if (event.origin === "https://s.1688.com" && event.data?.ajaxData) {
            Promise.allSettled(event.data.ajaxData.map((oneAjax)=>{
                return new Promise((resolve,reject)=>{
                    //WARN: chrome.storage unavailable here!
                    //for (let oneAjax of event.data.ajaxData) {
                    //Behavior of www.1688.com/offer/...
                    //function(t,e){        r.default.ajax({            url:"https://laputa.1688.com/offer/ajax/CalculateFreight.do",           dataType:"jsonp",           data:o({},t),           success:function(t){                t.success&&e&&t&&t.data&&t.data.costs&&t.data.costs[0]&&e(t.data.costs[0])          }       })  }
                    //Examples:
                    //https://laputa.1688.com/offer/ajax/CalculateFreight.do?amount=2&templateId=15052391&memberId=b2b-221121193482705959&offerId=642221231300&flow=general&excludeAreaCode4FreePostage=ALL&countryCode=1001&provinceCode=1098&cityCode=1099&price=67.50&volume=0&weight=0.2&callback=jsonp1642586798521
                    //https://laputa.1688.com/offer/ajax/CalculateFreight.do?amount=2&templateId=15052391&memberId=b2b-221121193482705959&offerId=642221231300&flow=general&excludeAreaCode4FreePostage=ALL&countryCode=1001&provinceCode=2561&cityCode=2562&price=67.50&volume=0&weight=0.2&callback=jsonp1642586652881
                    if ("FREE" !== oneAjax?.deliveryFee) {
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
