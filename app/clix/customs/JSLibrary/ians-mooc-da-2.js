/* 
 * IANS MOOC direct access JS
 * version 2.1.0
 */

$(document).ready(function() {

  "use strict";

  var contentIframe = $('#content-iframe');
  if (contentIframe.length) {
    var head = $('head');
    iansGASharedCode.detectIframeUpdate(
      document,
      'content-iframe',
      head.data('module-code'),
      'Direct Access URL',
      'Direct Access URL',
      head.data('access-type'),
      'bypages',
      head.data('course-mode'),
      head.data('course-provider')
    );

    /* The iframe is resized to get the full available size, first at the beginning and also when the window resizes */
    resizeIFrame();
    $(window).on("resize", resizeIFrame);

    contentIframe.on('load', function() {
      updateNavBar(contentIframe[0]);
    });

    $(window).on('beforeunload', function() {
      sessionStorage.removeItem('moocda-scroll')
    });

  } else {
    if ($('.mooc-syllabus').length) {
      var scroll = sessionStorage.getItem('moocda-scroll');
      if (scroll) {
        $(document).scrollTop(scroll);
      }
    }

    $('a').not('[target=_blank]').click(function() {
      var scroll = $(document).scrollTop();
      sessionStorage.setItem('moocda-scroll', scroll);
    });
  }
  
  /* Function that resizes the iframe to the available size */
  function resizeIFrame() {
    var iframe = $('#content-iframe');
    var newwidth = $(window).innerWidth();
    var newheight = $(window).innerHeight();
      
    newheight -= $('#mooc-top-bar').outerHeight(true);
    newheight -= 5; // to avoid scroll in this window
    iframe.width(newwidth);
    iframe.outerHeight(newheight);
  }

  /* Function that hides or shows the navbar as appropriate (not visible in syllabus) */
  function updateNavBar(iframe) {
    var inSyllabus = false;
    try {
      if (iframe.src === iframe.contentWindow.location.href) {
        inSyllabus = true;
      }
    } catch(e) {}

    if (inSyllabus) {
      $('#link-syllabus').animate({
        left: '-12.5rem'
      });
    } else {
      $('#link-syllabus').animate({
        left: 0
      });
    }
  }

  /* Make accordion behaviour in folders */
  var syllabus = $('.mooc-syllabus');
  if (syllabus.length) {
    syllabus.find('h2, h3').click(function() {
      $(this).toggleClass('accordion-closed');
      $(this).next().slideToggle();
    });

    syllabus.find('h3').parent().addClass('folder-l2');
  }

});