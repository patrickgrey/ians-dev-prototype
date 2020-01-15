// hack to avoid scroll problems with internal links in iframe content in iOS
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {

  $(document).ready(function() {

    var $iframe = $(window.parent.document).find('iframe');
    if ($iframe.length) {
      // we are in an iframe, patch is needed
      var iframeOffset = $iframe.offset().top;  // vertical offset of the iframe
      $("a[href^='#']").click(function(event) {
        event.preventDefault(); 
        var href = $(this).attr('href')
        if (href === '#') {
          $(window.top.document).scrollTop(0);
        } else {
          var $target = $(href); // element to scroll to
          if ($target.length) {
            $(window.top.document).scrollTop($target.offset().top + iframeOffset);
          }
        }
      });
    }

  });

}
