document.addEventListener('DOMContentLoaded', function(){
  var toggle = document.querySelector('.menu-toggle');
  var links = document.querySelector('nav.links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
    });
  }

  document.querySelectorAll('.faq-q').forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = btn.closest('.faq-item');
      var ans = item.querySelector('.faq-a');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(o){
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

  var themeBtn = document.querySelector('.theme-toggle');
  if(themeBtn){
    themeBtn.addEventListener('click', function(){
      var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try{ localStorage.setItem('theme', next); }catch(e){}
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el){
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    if(reduceMotion){ el.textContent = prefix + target; return; }
    var duration = 1100;
    var start = null;
    function step(ts){
      if(start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(eased * target);
      el.textContent = prefix + value;
      if(progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target;
    }
    requestAnimationFrame(step);
  }

  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var seenParents = new Map();
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var el = entry.target;
          var parent = el.parentElement;
          var idx = seenParents.get(parent) || 0;
          seenParents.set(parent, idx + 1);
          var delay = reduceMotion ? 0 : Math.min(idx * 90, 360);
          setTimeout(function(){
            el.classList.add('in-view');
            var counter = el.querySelector('[data-count]');
            if(counter && !counter.dataset.animated){
              counter.dataset.animated = 'true';
              animateCount(counter);
            }
          }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ observer.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  var progressBar = document.getElementById('scroll-progress');
  if(progressBar){
    var ticking = false;
    function updateProgress(){
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.transform = 'scaleX(' + Math.min(ratio, 1) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    });
    updateProgress();
  }
});
