/* global NexT, CONFIG */

HTMLElement.prototype.wrap = function(wrapper) {
  this.parentNode.insertBefore(wrapper, this);
  this.parentNode.removeChild(this);
  wrapper.appendChild(this);
};

NexT.utils = {

  /**
   * Wrap images with fancybox.
   */
  wrapImageWithFancyBox: function() {
    document.querySelectorAll('.post-body :not(a) > img, .post-body > img').forEach(element => {
      var $image = $(element);
      var imageLink = $image.attr('data-src') || $image.attr('src');
      var $imageWrapLink = $image.wrap(`<a class="fancybox fancybox.image" href="${imageLink}" itemscope itemtype="http://schema.org/ImageObject" itemprop="url"></a>`).parent('a');
      if ($image.is('.post-gallery img')) {
        $imageWrapLink.attr('data-fancybox', 'gallery').attr('rel', 'gallery');
      } else if ($image.is('.group-picture img')) {
        $imageWrapLink.attr('data-fancybox', 'group').attr('rel', 'group');
      } else {
        $imageWrapLink.attr('data-fancybox', 'default').attr('rel', 'default');
      }

      var imageTitle = $image.attr('title') || $image.attr('alt');
      if (imageTitle) {
        $imageWrapLink.append(`<p class="image-caption">${imageTitle}</p>`);
        // Make sure img title tag will show correctly in fancybox
        $imageWrapLink.attr('title', imageTitle).attr('data-caption', imageTitle);
      }
    });

    $.fancybox.defaults.hash = false;
    $('.fancybox').fancybox({
      loop   : true,
      helpers: {
        overlay: {
          locked: false
        }
      }
    });
  },

  registerExtURL: function() {
    document.querySelectorAll('.exturl').forEach(element => {
      element.addEventListener('click', event => {
        var exturl = event.currentTarget.getAttribute('data-url');
        var decurl = decodeURIComponent(escape(window.atob(exturl)));
        window.open(decurl, '_blank', 'noopener');
        return false;
      });
    });
  },

  /**
   * One-click copy code support.
   */
  registerCopyCode: function() {
    document.querySelectorAll('figure.highlight').forEach(element => {
      const box = document.createElement('div');
      element.wrap(box);
      box.classList.add('highlight-container');
      box.insertAdjacentHTML('beforeend', '<div class="copy-btn"><i class="fa fa-clipboard"></i></div>');
      var button = element.parentNode.querySelector('.copy-btn');
      button.addEventListener('click', event => {
        var target = event.currentTarget;
        var code = [...target.parentNode.querySelectorAll('.code .line')].map(line => line.innerText).join('\n');
        var ta = document.createElement('textarea');
        ta.style.top = window.scrollY + 'px'; // Prevent page scrolling
        ta.style.position = 'absolute';
        ta.style.opacity = '0';
        ta.readOnly = true;
        ta.value = code;
        document.body.append(ta);
        const selection = document.getSelection();
        const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
        ta.select();
        ta.setSelectionRange(0, code.length);
        ta.readOnly = false;
        var result = document.execCommand('copy');
        if (CONFIG.copycode.show_result) {
          target.querySelector('i').className = result ? 'fa fa-check' : 'fa fa-times';
        }
        ta.blur(); // For iOS
        target.blur();
        if (selected) {
          selection.removeAllRanges();
          selection.addRange(selected);
        }
        document.body.removeChild(ta);
      });
      button.addEventListener('mouseleave', event => {
        setTimeout(() => {
          event.target.querySelector('i').className = 'fa fa-clipboard';
        }, 300);
      });
    });
  },

  wrapTableWithBox: function() {
    document.querySelectorAll('table').forEach(element => {
      const box = document.createElement('div');
      box.className = 'table-container';
      element.wrap(box);
    });
  },

  registerVideoIframe: function() {
    document.querySelectorAll('iframe').forEach(element => {
      const supported = [
        'www.youtube.com',
        'player.vimeo.com',
        'player.youku.com',
        'player.bilibili.com',
        'www.tudou.com'
      ].some(host => element.src.includes(host));
      if (supported && !element.parentNode.matches('.video-container')) {
        const box = document.createElement('div');
        box.className = 'video-container';
        element.wrap(box);
        let width = Number(element.width);
        let height = Number(element.height);
        if (width && height) {
          element.parentNode.style.paddingTop = (height / width * 100) + '%';
        }
      }
    });
  },

  registerScrollPercent: function() {
    var THRESHOLD = 50;
    var backToTop = document.querySelector('.back-to-top');
    var readingProgressBar = document.querySelector('.reading-progress-bar');
    // For init back to top in sidebar if page was scrolled after page refresh.
    window.addEventListener('scroll', () => {
      var scrollPercent;
      if (backToTop || readingProgressBar) {
        var docHeight = document.querySelector('.container').offsetHeight;
        var winHeight = window.innerHeight;
        var contentVisibilityHeight = docHeight > winHeight ? docHeight - winHeight : document.body.scrollHeight - winHeight;
        var scrollPercentRounded = Math.round(100 * window.scrollY / contentVisibilityHeight);
        scrollPercent = Math.min(scrollPercentRounded, 100) + '%';
      }
      if (backToTop) {
        backToTop.classList.toggle('back-to-top-on', window.scrollY > THRESHOLD);
        backToTop.querySelector('span').innerText = scrollPercent;
      }
      if (readingProgressBar) {
        readingProgressBar.style.width = scrollPercent;
      }
    });

    backToTop && backToTop.addEventListener('click', () => {
      window.anime({
        targets  : document.scrollingElement,
        duration : 500,
        easing   : 'linear',
        scrollTop: 0
      });
    });
  },

  /**
   * Tabs tag listener (without twitter bootstrap).
   */
  registerTabsTag: function() {
    // Binding `nav-tabs` & `tab-content` by real time permalink changing.
    document.querySelectorAll('.tabs ul.nav-tabs .tab').forEach(element => {
      element.addEventListener('click', event => {
        event.preventDefault();
        var target = event.currentTarget;
        // Prevent selected tab to select again.
        if (!target.classList.contains('active')) {
          // Add & Remove active class on `nav-tabs` & `tab-content`.
          [...target.parentNode.children].forEach(element => {
            element.classList.remove('active');
          });
          target.classList.add('active');
          var tActive = document.getElementById(target.querySelector('a').getAttribute('href').replace('#', ''));
          [...tActive.parentNode.children].forEach(element => {
            element.classList.remove('active');
          });
          tActive.classList.add('active');
          // Trigger event
          tActive.dispatchEvent(new Event('tabs:click', {
            bubbles: true
          }));
        }
      });
    });

    window.dispatchEvent(new Event('tabs:register'));
  },

  registerCanIUseTag: function() {
    // Get responsive height passed from iframe.
    window.addEventListener('message', event => {
      var data = event.data;
      if ((typeof data === 'string') && (data.indexOf('ciu_embed') > -1)) {
        var featureID = data.split(':')[1];
        var height = data.split(':')[2];
        document.querySelector(`iframe[data-feature=${featureID}]`).style.height = parseInt(height, 10) + 'px';
      }
    }, false);
  },

  registerActiveMenuItem: function() {
    document.querySelectorAll('.menu-item').forEach(element => {
      var target = element.querySelector('a[href]');
      if (!target) return;
      var isSamePath = target.pathname === location.pathname || target.pathname === location.pathname.replace('index.html', '');
      var isSubPath = target.pathname !== CONFIG.root && location.pathname.indexOf(target.pathname) === 0;
      element.classList.toggle('menu-item-active', target.hostname === location.hostname && (isSamePath || isSubPath));
    });
  },

  registerSidebarTOC: function() {
    // Hexo 8+ toc helper uses encodeURI() in href; heading id in DOM is raw Unicode.
    // getElementById(encoded) fails for CJK etc. — decode fragment before lookup.
    var decodeTocHashId = function(href) {
      if (!href) return '';
      var i = href.indexOf('#');
      var fragment = i === -1 ? href : href.slice(i + 1);
      try {
        return decodeURIComponent(fragment);
      } catch (e) {
        return fragment;
      }
    };

    // Pairs of TOC <li> and matching heading, in true document order (not only tree order
    // of .post-toc li — avoids rare mismatches). Clicks and scroll-spy share this list.
    var tocPairs = [];
    document.querySelectorAll('.post-toc li').forEach(function(li) {
      var link = li.querySelector('a.nav-link');
      if (!link) return;
      var section = document.getElementById(decodeTocHashId(link.getAttribute('href')));
      if (!section) return;
      tocPairs.push({ navItem: li, section: section, link: link });
    });
    tocPairs.sort(function(a, b) {
      return a.section.getBoundingClientRect().top - b.section.getBoundingClientRect().top;
    });

    tocPairs.forEach(function(pair) {
      pair.link.addEventListener('click', function(event) {
        event.preventDefault();
        var target = pair.section;
        if (!target) return;
        var offset = target.getBoundingClientRect().top + window.scrollY;
        window.anime({
          targets  : document.scrollingElement,
          duration : 500,
          easing   : 'linear',
          scrollTop: offset + 10
        });
      });
    });

    if (!tocPairs.length) return;

    var tocElement = document.querySelector('.post-toc-wrap');
    var lastTocNavActivated = null;
    function activateNavByIndex(target) {
      if (!target || !target.classList) return;

      var sameItem = lastTocNavActivated === target;
      lastTocNavActivated = target;

      document.querySelectorAll('.post-toc li').forEach(function(element) {
        element.classList.remove('active', 'active-current');
      });
      target.classList.add('active', 'active-current');
      var parent = target.parentNode;
      while (parent && !parent.matches('.post-toc')) {
        if (parent.matches('li')) parent.classList.add('active');
        parent = parent.parentNode;
      }
      if (tocElement && !sameItem) {
        window.anime({
          targets  : tocElement,
          duration : 200,
          easing   : 'linear',
          scrollTop: tocElement.scrollTop - (tocElement.offsetHeight / 2) + target.getBoundingClientRect().top - tocElement.getBoundingClientRect().top
        });
      }
    }

    // Only treat top chrome as scrollspy offset when it is fixed/sticky. Using .site-nav
    // height on Muse/Mist (non-sticky header) shifts the line down and highlights one
    // section ahead of what the reader sees.
    function getTocSpyOffset() {
      var base = 12;
      var nodes = document.querySelectorAll('.headband, .header, .header-inner');
      var i;
      var el;
      var st;
      var maxBottom = 0;
      for (i = 0; i < nodes.length; i++) {
        el = nodes[i];
        st = window.getComputedStyle(el);
        if (st.position !== 'fixed' && st.position !== 'sticky') continue;
        maxBottom = Math.max(maxBottom, el.getBoundingClientRect().bottom);
      }
      return maxBottom > 0 ? Math.round(maxBottom) + 4 : base;
    }

    var tocSpyTicking = false;
    function updateSidebarTOCActive() {
      var line = getTocSpyOffset();
      var activeIdx = 0;
      var j;
      var top;
      for (j = 0; j < tocPairs.length; j++) {
        top = tocPairs[j].section.getBoundingClientRect().top;
        if (top <= line) activeIdx = j;
      }
      activateNavByIndex(tocPairs[activeIdx].navItem);
    }

    function onTocSpyScrollOrResize() {
      if (!tocSpyTicking) {
        tocSpyTicking = true;
        window.requestAnimationFrame(function() {
          updateSidebarTOCActive();
          tocSpyTicking = false;
        });
      }
    }

    window.addEventListener('scroll', onTocSpyScrollOrResize, { passive: true });
    window.addEventListener('resize', onTocSpyScrollOrResize);
    updateSidebarTOCActive();
  },

  hasMobileUA: function() {
    var ua = navigator.userAgent;
    var pa = /iPad|iPhone|Android|Opera Mini|BlackBerry|webOS|UCWEB|Blazer|PSP|IEMobile|Symbian/g;
    return pa.test(ua);
  },

  isTablet: function() {
    return window.screen.width < 992 && window.screen.width > 767 && this.hasMobileUA();
  },

  isMobile: function() {
    return window.screen.width < 767 && this.hasMobileUA();
  },

  isDesktop: function() {
    return !this.isTablet() && !this.isMobile();
  },

  /**
   * Init Sidebar & TOC inner dimensions on all pages and for all schemes.
   * Need for Sidebar/TOC inner scrolling if content taller then viewport.
   */
  initSidebarDimension: function() {
    var sidebarNav = document.querySelector('.sidebar-nav');
    var sidebarNavHeight = sidebarNav.style.display !== 'none' ? sidebarNav.offsetHeight : 0;
    var sidebarOffset = CONFIG.sidebar.offset || 12;
    var sidebarb2tHeight = CONFIG.back2top.enable && CONFIG.back2top.sidebar ? document.querySelector('.back-to-top').offsetHeight : 0;
    var sidebarSchemePadding = (CONFIG.sidebar.padding * 2) + sidebarNavHeight + sidebarb2tHeight;
    // Margin of sidebar b2t: 8px -10px -20px, brings a different of 12px.
    if (CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini') sidebarSchemePadding += (sidebarOffset * 2) - 12;
    // Initialize Sidebar & TOC Height.
    var sidebarWrapperHeight = document.body.offsetHeight - sidebarSchemePadding + 'px';
    document.querySelector('.site-overview-wrap').style.maxHeight = sidebarWrapperHeight;
    document.querySelector('.post-toc-wrap').style.maxHeight = sidebarWrapperHeight;
  },

  updateSidebarPosition: function() {
    var sidebarNav = document.querySelector('.sidebar-nav');
    var hasTOC = document.querySelector('.post-toc');
    if (hasTOC) {
      sidebarNav.style.display = '';
      sidebarNav.classList.add('motion-element');
      document.querySelector('.sidebar-nav-toc').click();
    } else {
      sidebarNav.style.display = 'none';
      sidebarNav.classList.remove('motion-element');
      document.querySelector('.sidebar-nav-overview').click();
    }
    NexT.utils.initSidebarDimension();
    if (!this.isDesktop() || CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini') return;
    // Expand sidebar on post detail page by default, when post has a toc.
    var display = CONFIG.page.sidebar;
    if (typeof display !== 'boolean') {
      // There's no definition sidebar in the page front-matter.
      display = CONFIG.sidebar.display === 'always' || (CONFIG.sidebar.display === 'post' && hasTOC);
    }
    if (display) {
      window.dispatchEvent(new Event('sidebar:show'));
    }
  },

  getScript: function(url, callback, condition) {
    if (condition) {
      callback();
    } else {
      var script = document.createElement('script');
      script.onload = script.onreadystatechange = function(_, isAbort) {
        if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
          script.onload = script.onreadystatechange = null;
          script = undefined;
          if (!isAbort && callback) setTimeout(callback, 0);
        }
      };
      script.src = url;
      document.head.appendChild(script);
    }
  },

  loadComments: function(element, callback) {
    if (!CONFIG.comments.lazyload || !element) {
      callback();
      return;
    }
    let intersectionObserver = new IntersectionObserver((entries, observer) => {
      let entry = entries[0];
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
    intersectionObserver.observe(element);
    return intersectionObserver;
  }
};
