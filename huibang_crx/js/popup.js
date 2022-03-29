document.body.style.border = "2px solid #E5F2F2";

const searchBtn = document.querySelector('button[name="search"]');
searchBtn.onclick = function(){
    //var background = chrome.extension.getBackgroundPage();
    //background.save(quantityBegin.value);
    //WARN: chrome.tabs.getCurrent() NOT available here!
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs){
        const url = tabs[0].url
          , errorDiv = document.getElementById("error-content");
        if (url?.startsWith("https://s.1688.com/selloffer/offer_search.htm?keywords=")) {
            const searchURL = url + `&quantityBegin=${quantityBegin.value}&sortType=price&descendOrder=false&filt=y&filtMemberTags=1445761#sm-filtbar`;
            errorDiv.style.display = "none";
            try {
                chrome.runtime.sendMessage({
                    searchURL: `${searchURL}`,
                    tabID: tabs[0].id
                });
                //console.log(searchURL);
            } catch (error) {
                display(error);
                console.log(error);
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

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    let err = request?.error;
    if (err && err.length !== 0) {
        try {
            display(err);
        } catch (error) {
            display(error);
            console.log(error);
        }
    }else if (request?.progress && 0 !== request?.progress.length){
        const progressDiv = document.getElementById("progress-content");
        progressDiv.innerHTML = `${request.progress}`;
        progressDiv.style.display = "block";
    }
    return true;
    // Add this so that it will respond asynchronously.
}
);
