chrome.tabs.getSelected(null, function (tab) {
  $('#qrcode').qrcode({
    text:tab.url,
    width: 100,
    height: 100,
  });
});
function sendMessageToContentScript(message, callback){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
  {
    chrome.tabs.sendMessage(tabs[0].id, message, function(response)
    {
      if(callback) callback(response);
    });
  });
}
var imageItem = [];
var urlToPromise = function(url) {
  return new Promise(function(resolve, reject) {
    JSZipUtils.getBinaryContent(url, function (err, data) {
      if(err) {
          reject(err);
      } else {
          resolve(data);
      }
    });
  });
}
var imgUrlAdapter = function(imgSrc){
  var _imgSrc = imgSrc;
  if (!/(png|jpg|jpeg|gif)/.test(imgSrc)) {
    _imgSrc = _imgSrc+'.jpg';
  }
  _imgSrc = _imgSrc.replace(/(?<=png|jpg|jpeg|gif)(.*)/,'');
  return _imgSrc;
}
var downloadImages = function(ele){
  if (imageItem.length<1) {
    alert('no images are available!');
    return;
  }
  var zip = new JSZip();

  ele.attr('disabled',true);
  ele.text('downloading...');
  
  // find every checked item
  imageItem.map(function (item, index) {
      var url = imgUrlAdapter(item.img);
      var ext = url.substr(url.lastIndexOf('.'),url.lastIndexOf('.') + 1);
      var filename = 'id_'+item.id.replace(/\//g,'_') + ext;
      var promise = urlToPromise(url);
      promise.then(function(data) {
        zip.file(filename, Promise.resolve(data), {binary:true});
        if(index === imageItem.length - 1) {
          setTimeout(zipAll, 500);
        }
      }).catch(function(err) {
        console.log('err', err);
        if(index === imageItem.length - 1) {
          setTimeout(zipAll, 500);
        }
      })
  });

  const zipAll = function() {
    // when everything has been downloaded, we can trigger the dl
    zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
        var msg = "progression : " + metadata.percent.toFixed(2) + " %";
        if(metadata.currentFile) {
            msg += ", current file = " + metadata.currentFile;
        }
        //updatePercent(metadata.percent|0);
    })
    .then(function callback(blob) {
        // see FileSaver.js
        saveAs(blob, 'img_'+new Date().getTime()+'.zip');
        ele.text(ele.data('btntext'));
    }, function (e) {
        // pageMessage(e);
        console.log(e);
    });

  }
  return false;
}
var makeImageList = function(selector){
  sendMessageToContentScript({action:'getImgList',selector:selector},function(res){
    console.log('from contentjs replay:',res);
    if (res && res.error) {
      alert(res.error);
      return;
    }
    if (Array.isArray(res.data) && res.data.length) {
      var html = res.data.map((item,index) => {
      return '\
            <tr>\
              <td style="text-align:center"><input class="imgitem" type="checkbox" value="img_' + index + '" data-img="'+ item +'" /></td>\
              <td>\
                <div class="img-item">\
                  <img src="'+item+'">\
                </div>\
              </td>\
          </tr>\
          '
      });
      $('#imglist tbody').html(html);
      $('#imgcount').text('('+res.length+' items)');
    }else{
      alert("no useful images were captured!");
    }
  });
}

$(document).ready(function(){

  $('#popup-wrap')
  .on('click','#get',function(){
    var selector = $('#selector').val();
    if (selector.trim() == '') {
      selector = 'body';
    }
    makeImageList(selector);    
  })
  .on('click','#getall',function(){
    makeImageList('body');
  })
  .on('click','input.imgitem',function(){
    var $this = $(this);
    var id = $this.val();
    var img = $this.data('img');
    if ($this.prop('checked')) {
      imageItem.push({id,img})
    }else{
      imageItem = imageItem.filter(item => {
        return item.id!=id;
      });
    }
    console.log(imageItem);
  })
  .on('click','input#all',function(){
    imageItem = [];
    $('.imgitem').each(function(){
      imageItem.push({id:$(this).val(),img:$(this).data('img')});
      $(this).prop('checked',true);
    });
    console.log(imageItem);
  })
  .on('click','#save',function(){
    downloadImages($(this));
  });

});