$(document).ready(function(){
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
    if(request.action == 'getImgList'){
      var imgArray = [];
      var images = document.images;
      var selector = request.selector;
      var $selector = null;
      var res = {};
      try{
        $selector = document.querySelector(selector);
      }catch{
         res = {
            error:'css selector is not correct or selected element not exist!'
          }
        sendResponse(res);
      }
      if (res.error) {
        return;
      }
      // if (!document.querySelector(selector)) {
      //   res = {
      //     error:'css selector is not correct or selected element not exist!'
      //   }
      //   sendResponse(res);
      //   return;
      // }
      var $img = $selector.querySelectorAll('img');
      if ($img.length>0) {
        for (var i = 0; i <= $img.length - 1; i++) {
          var imgUrl = $img[i].currentSrc;
          if (/^https?.*/.test(imgUrl)) {
            imgArray.push(imgUrl);
          }
        }
        res = {
          data:imgArray
        };
      }else{
        res = {
          error:'no useful images were captured!'
        }
      }
      sendResponse(res);
    }else{
      sendResponse({
        error:'data error,please try again later!'
      });
    }
  });
});
function injectCustomJs(jsPath)
{
    // jsPath = jsPath || 'js/inject.js';
    // var temp = document.createElement('script');
    // temp.setAttribute('type', 'text/javascript');
    // // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    // temp.src = chrome.extension.getURL(jsPath);
    // temp.onload = function()
    // {
    //     // 放在页面不好看，执行完后移除掉
    //     this.parentNode.removeChild(this);
    // };
    var docHead = document.head;
    if (Array.isArray(jsPath)) {
      jsPath.map(item => {
        var temp = document.createElement('script');
        temp.setAttribute('type','text/javascript');
        temp.src = chrome.extension.getURL(jsPath);
        (() => {
          temp.onload = function(){
            docHead.removeChild(temp);    
          }
        })();
        docHead.appendChild(temp);
      });
    }
}
