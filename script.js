document.addEventListener('DOMContentLoaded', function(){
  var SB_BASE_URL = 'https://cayfcvkqjrphbshdysnb.supabase.co';
  var SB_PUBLIC_KEY = 'sb_publishable_4QWsFfheXQVs6lH0-tbwDw_JYr3p1Mr';
  var sbClient = (typeof supabase !== 'undefined')
    ? supabase.createClient(SB_BASE_URL, SB_PUBLIC_KEY)
    : null;

  var toggle = document.querySelector('.menu-toggle');
  var links = document.querySelector('nav.links');
  var backdrop = document.querySelector('.nav-backdrop');

  function openMenu(){
    links.classList.add('open');
    if(backdrop) backdrop.classList.add('open');
    document.body.classList.add('menu-open');
  }
  function closeMenu(){
    links.classList.remove('open');
    if(backdrop) backdrop.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  if(toggle && links){
    toggle.addEventListener('click', function(){
      if(links.classList.contains('open')) closeMenu();
      else openMenu();
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        closeMenu();
      });
    });
    if(backdrop){
      backdrop.addEventListener('click', closeMenu);
    }
    window.addEventListener('resize', function(){
      if(window.innerWidth > 860) closeMenu();
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

  function showToast(msg){
    var toast = document.querySelector('.site-toast');
    if(!toast){
      toast = document.createElement('div');
      toast.className = 'site-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    requestAnimationFrame(function(){ toast.classList.add('show'); });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2400);
  }

  var langToggle = document.querySelector('.lang-toggle');
  var langMenu = document.querySelector('.lang-menu');
  if(langToggle && langMenu){
    var enMap = {
      'index.html':'index-en.html', 'courses.html':'courses-en.html',
      'books.html':'books-en.html', 'about.html':'about-en.html',
      'contact.html':'contact-en.html', 'login.html':'index-en.html',
      'mycourses.html':'index-en.html', '':'index-en.html'
    };
    var arMap = {
      'index-en.html':'index.html', 'courses-en.html':'courses.html',
      'books-en.html':'books.html', 'about-en.html':'about.html',
      'contact-en.html':'contact.html', '':'index.html'
    };
    var currentLang = document.documentElement.lang === 'en' ? 'en' : 'ar';

    langToggle.addEventListener('click', function(e){
      e.stopPropagation();
      langMenu.classList.toggle('open');
    });
    langMenu.querySelectorAll('button').forEach(function(btn){
      if(btn.dataset.lang === currentLang) btn.classList.add('active-lang');
      btn.addEventListener('click', function(){
        langMenu.classList.remove('open');
        if(btn.dataset.lang === currentLang) return;
        if(btn.dataset.lang === 'en' || btn.dataset.lang === 'ar'){
          var current = window.location.pathname.split('/').pop();
          var target = (btn.dataset.lang === 'en') ? (enMap[current] || 'index-en.html') : (arMap[current] || 'index.html');
          window.location.href = target;
          return;
        }
        showToast('نسخة الموقع بلغة ' + btn.textContent + ' هتتوفر قريبًا');
      });
    });
    document.addEventListener('click', function(e){
      if(!langMenu.contains(e.target) && e.target !== langToggle){
        langMenu.classList.remove('open');
      }
    });
  }

  function updateAuthUI(isLoggedIn){
    document.querySelectorAll('.auth-link').forEach(function(link){
      var wantsIn = link.dataset.authState === 'in';
      link.style.display = (wantsIn === isLoggedIn) ? '' : 'none';
    });
  }

  if(sbClient){
    sbClient.auth.getSession().then(function(res){
      updateAuthUI(!!(res.data && res.data.session));
    });
    sbClient.auth.onAuthStateChange(function(event, session){
      updateAuthUI(!!session);
    });
  } else {
    updateAuthUI(false);
  }

  document.querySelectorAll('.auth-link[data-auth-state="in"]').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      if(!sbClient) return;
      sbClient.auth.signOut().then(function(){
        updateAuthUI(false);
        showToast('تم تسجيل الخروج بنجاح');
        if(window.location.pathname.indexOf('mycourses.html') !== -1){
          setTimeout(function(){ window.location.href = 'index.html'; }, 900);
        }
      });
    });
  });

  // ---- Contact form -> Supabase ----
  var SUPABASE_URL = 'https://cayfcvkqjrphbshdysnb.supabase.co/rest/v1';
  var SUPABASE_KEY = 'sb_publishable_4QWsFfheXQVs6lH0-tbwDw_JYr3p1Mr';

  var contactForm = document.getElementById('contact-form');
  if(contactForm){
    var isEnglish = document.documentElement.lang === 'en';
    var msgs = isEnglish ? {
      sending: 'Sending...',
      success: 'Thanks! Your details were received — I\'ll be in touch soon.',
      error: 'Something went wrong. Please try again, or message me directly on WhatsApp.'
    } : {
      sending: 'جاري الإرسال...',
      success: 'تم استلام بياناتك بنجاح، هيتم التواصل معاك قريب.',
      error: 'حصل خطأ، حاول تاني أو تواصل معايا مباشرة على واتساب.'
    };

    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var submitBtn = document.getElementById('contact-submit');
      var statusEl = document.getElementById('contact-status');
      var nameEl = document.getElementById('name');
      var emailEl = document.getElementById('email');
      var phoneEl = document.getElementById('phone');

      var originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = msgs.sending;

      function setStatus(ok, text){
        if(!statusEl) return;
        statusEl.style.display = 'block';
        statusEl.style.color = ok ? '#3FA65A' : 'var(--rust)';
        statusEl.textContent = text;
      }

      fetch(SUPABASE_URL + '/customers', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          full_name: nameEl.value.trim(),
          email: emailEl.value.trim(),
          phone: phoneEl.value.trim()
        })
      }).then(function(res){
        if(res.ok){
          setStatus(true, msgs.success);
          showToast(msgs.success);
          contactForm.reset();
        } else {
          return res.json().catch(function(){ return {}; }).then(function(err){
            throw new Error(err.message || ('HTTP ' + res.status));
          });
        }
      }).catch(function(err){
        setStatus(false, msgs.error);
        console.error('Supabase insert failed:', err);
      }).finally(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      });
    });
  }

  // ---- Payment cards: copy to clipboard ----
  document.querySelectorAll('.pay-copy-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var text = btn.getAttribute('data-copy');
      var done = function(){
        var original = btn.textContent;
        btn.textContent = 'اتنسخ ✓';
        btn.classList.add('copied');
        setTimeout(function(){
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1600);
      };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(function(){
          fallbackCopy(text); done();
        });
      } else {
        fallbackCopy(text); done();
      }
    });
  });
  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }

  // ---- Receipt upload form ----
  var fileInput = document.getElementById('receipt-file');
  var fileNameEl = document.getElementById('file-drop-name');
  var fileLabelEl = document.querySelector('#file-drop-label .file-drop-label');
  if(fileInput){
    fileInput.addEventListener('change', function(){
      if(fileInput.files && fileInput.files[0]){
        fileNameEl.textContent = fileInput.files[0].name;
        fileNameEl.style.display = 'block';
        fileLabelEl.style.display = 'none';
      } else {
        fileNameEl.style.display = 'none';
        fileLabelEl.style.display = 'block';
      }
    });
  }

  var receiptForm = document.getElementById('receipt-form');
  if(receiptForm && sbClient){
    var receiptIsEnglish = document.documentElement.lang === 'en';
    var receiptMsgs = receiptIsEnglish ? {
      sending: 'Sending...', uploading: 'Uploading receipt...',
      success: 'Received! We\'ll confirm and activate your product shortly.',
      error: 'Something went wrong. Please try again or send it on WhatsApp instead.'
    } : {
      sending: 'جاري الإرسال...', uploading: 'جاري رفع الإيصال...',
      success: 'تم الاستلام! هنراجع الإيصال ونفعّل المنتج قريب.',
      error: 'حصل خطأ، حاول تاني أو ابعت الإيصال على واتساب بدل كده.'
    };

    receiptForm.addEventListener('submit', function(e){
      e.preventDefault();
      var submitBtn = document.getElementById('receipt-submit');
      var statusEl = document.getElementById('receipt-status');
      var phone = document.getElementById('receipt-phone').value.trim();
      var note = document.getElementById('receipt-note').value.trim();
      var file = fileInput && fileInput.files ? fileInput.files[0] : null;

      function setReceiptStatus(ok, text){
        statusEl.style.display = 'block';
        statusEl.style.color = ok ? '#3FA65A' : 'var(--rust)';
        statusEl.textContent = text;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = receiptMsgs.sending;

      function insertOrder(receiptUrl){
        return sbClient.from('orders').insert({
          student_name: phone,
          contact: phone,
          payment_method: note || 'إيصال مرفوع من الموقع',
          status: 'pending',
          receipt_url: receiptUrl || null
        });
      }

      var uploadPromise;
      if(file){
        submitBtn.textContent = receiptMsgs.uploading;
        var safeName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        uploadPromise = sbClient.storage.from('receipts').upload(safeName, file).then(function(res){
          if(res.error) throw res.error;
          var pub = sbClient.storage.from('receipts').getPublicUrl(safeName);
          return pub && pub.data ? pub.data.publicUrl : null;
        });
      } else {
        uploadPromise = Promise.resolve(null);
      }

      uploadPromise.then(function(receiptUrl){
        submitBtn.textContent = receiptMsgs.sending;
        return insertOrder(receiptUrl);
      }).then(function(res){
        if(res.error) throw res.error;
        setReceiptStatus(true, receiptMsgs.success);
        showToast(receiptMsgs.success);
        receiptForm.reset();
        if(fileNameEl){ fileNameEl.style.display = 'none'; }
        if(fileLabelEl){ fileLabelEl.style.display = 'block'; }
      }).catch(function(err){
        setReceiptStatus(false, receiptMsgs.error);
        console.error('Receipt submit failed:', err);
      }).finally(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = receiptIsEnglish ? 'Send for review' : 'إرسال للمراجعة';
      });
    });
  }
});
