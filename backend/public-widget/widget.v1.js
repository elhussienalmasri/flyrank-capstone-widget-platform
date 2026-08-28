/**
 * Widget Platform — embeddable loader (v1).
 * Runs on the customer's website. Renders differently by widget type:
 *   - subscribe -> plain white card, rendered inline, POSTs to /submissions —
 *                   stays visible after submit, confirms via a popup on top
 *   - cta        -> colored banner (own accent color), rendered inline,
 *                   POSTs to /submissions — stays visible after submit,
 *                   and a real popup confirms success on top of it
 *   - popover    -> a form, hidden by default, shown as a modal —
 *                   triggered by click, a time delay, or scroll depth
 *   - signup     -> name/email/password/confirm, POSTs to
 *                   /widgets/:id/signup, stores the returned token
 *   - login      -> email/password, POSTs to /widgets/:id/login,
 *                   stores the returned token
 *
 * Configured via the widget's displayOptions (set through the
 * dashboard), e.g.:
 *   {
 *     "trigger": "delay",             // popover only: "click" (default) | "delay" | "scroll"
 *     "delaySeconds": 5,
 *     "scrollPercent": 50,
 *     "accentColor": "#4f46e5",       // cta only: banner + submit button color
 *     "thankYouTitle": "Thanks!",
 *     "thankYouMessage": "We'll be in touch.",
 *     "thankYouLinkUrl": "https://example.com/next-steps",
 *     "thankYouLinkText": "Learn more",
 *     "thankYouButtonColor": "#4f46e5"
 *   }
 * All of these are optional — sensible defaults apply if omitted.
 *
 * No dependencies — must work on any page regardless of that site's stack.
 */
(function () {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var scriptUrl = new URL(currentScript.src);
  var widgetId = scriptUrl.searchParams.get('id');
  var apiOrigin = scriptUrl.origin;

  if (!widgetId) {
    console.error('[widget] missing ?id= on script tag — nothing to render');
    return;
  }

  // Global, page-wide API so a site can trigger a popover from a
  // plain <button onclick="WidgetPlatform.open('...')"> without
  // writing any other JS.
  window.WidgetPlatform = window.WidgetPlatform || { _widgets: {} };

  fetch(apiOrigin + '/widgets/' + widgetId + '/config')
    .then(function (res) {
      if (!res.ok) throw new Error('config fetch failed: ' + res.status);
      return res.json();
    })
    .then(function (config) {
      renderWidget(config);
    })
    .catch(function (err) {
      console.error('[widget] failed to load config', err);
    });

  // ---------- shared building blocks ----------

  function buildFormShell(config) {
    var isCta = config.type === 'cta';
    var shell = document.createElement('div');
    var title = document.createElement('h3');
    title.textContent = config.title;
    title.style.cssText = 'margin:0 0 4px;font-size:' + (isCta ? '18px;font-weight:700' : '16px;font-weight:600') +
      ';color:' + (isCta ? '#fff' : '#111827') + ';';
    shell.appendChild(title);

    if (config.description) {
      var desc = document.createElement('p');
      desc.textContent = config.description;
      desc.style.cssText = 'margin:0 0 12px;font-size:13px;color:' + (isCta ? 'rgba(255,255,255,0.85)' : '#6b7280') + ';';
      shell.appendChild(desc);
    }
    return shell;
  }

  function buildStatusEl() {
    var statusMsg = document.createElement('p');
    statusMsg.style.cssText = 'margin:8px 0 0;font-size:12px;';
    return statusMsg;
  }

  function buildFieldInputs(form, fields, config) {
    var isCta = config && config.type === 'cta';
    fields.forEach(function (field) {
      var label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = 'font-size:12px;color:' + (isCta ? 'rgba(255,255,255,0.9)' : '#374151') +
        ';display:flex;flex-direction:column;gap:4px;';

      var input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (field.type !== 'textarea') input.type = field.type || 'text';
      input.name = field.name;
      if (field.required) input.required = true;
      input.style.cssText = 'padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;';

      label.appendChild(input);
      form.appendChild(label);
    });
  }

  // A generic "thank you" view — used both when a popover swaps its
  // own content on success, and as a standalone popup shown on top
  // of a cta widget (which otherwise stays visible; see
  // showThankYouOverlay below). The link renders as a real button,
  // not a plain text link, with an independently configurable color.
  function buildThankYouView(config) {
    var opts = config.displayOptions || {};
    var view = document.createElement('div');

    var title = document.createElement('h3');
    title.textContent = opts.thankYouTitle || 'Thanks!';
    title.style.cssText = 'margin:0 0 4px;font-size:16px;color:#111827;';
    view.appendChild(title);

    var message = document.createElement('p');
    message.textContent = opts.thankYouMessage || 'Your submission was received.';
    message.style.cssText = 'margin:0 0 12px;font-size:13px;color:#6b7280;';
    view.appendChild(message);

    if (opts.thankYouLinkUrl) {
      var buttonColor = opts.thankYouButtonColor || '#4f46e5';
      var link = document.createElement('a');
      link.href = opts.thankYouLinkUrl;
      link.textContent = opts.thankYouLinkText || 'Learn more';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.cssText =
        'display:inline-block;margin-top:4px;padding:8px 16px;background:' + buttonColor + ';' +
        'color:#fff;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;';
      view.appendChild(link);
    }

    return view;
  }

  // A one-shot popup: built, shown, and removed from the DOM on
  // close — distinct from the popover widget's overlay, which stays
  // in the DOM and toggles visibility so it can be re-opened.
  function showThankYouOverlay(config) {
    var backdrop = document.createElement('div');
    backdrop.style.cssText =
      'position:fixed;inset:0;background:rgba(17,24,39,0.5);display:flex;' +
      'align-items:center;justify-content:center;z-index:2147483000;font-family:system-ui,sans-serif;';

    var modal = document.createElement('div');
    modal.style.cssText =
      'position:relative;max-width:360px;width:90%;padding:20px;background:#fff;' +
      'border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.2);';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText =
      'position:absolute;top:8px;right:10px;border:none;background:transparent;' +
      'font-size:20px;line-height:1;color:#9ca3af;cursor:pointer;';

    modal.appendChild(closeBtn);
    modal.appendChild(buildThankYouView(config));
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // ---------- lead-capture form (subscribe / cta / popover) -> /submissions ----------

  function buildLeadCaptureForm(config, onSuccess) {
    var isCta = config.type === 'cta';
    var accent = (config.displayOptions && config.displayOptions.accentColor) || '#4f46e5';

    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    // Honeypot — real visitors never see or fill this. A filled
    // honeypot = spam, silently dropped server-side.
    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'companyWebsite';
    honeypot.autocomplete = 'off';
    honeypot.tabIndex = -1;
    honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(honeypot);

    var fields = config.formFields && config.formFields.length
      ? config.formFields
      : [{ name: 'email', label: 'Email', type: 'email', required: true }];
    buildFieldInputs(form, fields, config);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = config.buttonText || 'Submit';
    submitBtn.style.cssText = isCta
      ? 'margin-top:4px;padding:8px 12px;background:#fff;color:' + accent + ';border:none;' +
        'border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;'
      : 'margin-top:4px;padding:8px 12px;background:#4f46e5;color:#fff;border:none;' +
        'border-radius:6px;font-size:13px;cursor:pointer;';
    form.appendChild(submitBtn);

    var statusMsg = buildStatusEl();
    form.appendChild(statusMsg);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      statusMsg.textContent = '';

      var formData = new FormData(form);
      var payload = { widgetId: widgetId, fields: {} };
      formData.forEach(function (value, key) { payload.fields[key] = value; });

      fetch(apiOrigin + '/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            if (res.status === 429) throw new Error('Too many submissions — please try again shortly.');
            if (!res.ok) {
              var msg = (body.error && body.error.message) || 'Submission failed. Please try again.';
              throw new Error(msg);
            }
            return body;
          });
        })
        .then(function () {
          if (onSuccess) {
            onSuccess(); // popover / cta — a popup handles the confirmation
            submitBtn.disabled = false;
            return;
          }
          // subscribe — stays visible, just reports success inline.
          var opts = config.displayOptions || {};
          statusMsg.style.color = '#16a34a';
          statusMsg.textContent = opts.thankYouMessage || 'Thanks! Your submission was received.';
          form.reset();
          submitBtn.disabled = false;
        })
        .catch(function (err) {
          statusMsg.style.color = '#dc2626';
          statusMsg.textContent = err.message;
          submitBtn.disabled = false;
        });
    });

    return form;
  }

  // ---------- signup / login (unchanged behavior, just refactored) ----------

  function buildSignupForm(config, onPending) {
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    var fields = config.formFields && config.formFields.length ? config.formFields : [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'confirmPassword', label: 'Confirm password', type: 'password', required: true },
    ];
    buildFieldInputs(form, fields);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = config.buttonText || 'Sign up';
    submitBtn.style.cssText =
      'margin-top:4px;padding:8px 12px;background:#4f46e5;color:#fff;border:none;' +
      'border-radius:6px;font-size:13px;cursor:pointer;';
    form.appendChild(submitBtn);

    var statusMsg = buildStatusEl();
    form.appendChild(statusMsg);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      statusMsg.textContent = '';

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      fetch(apiOrigin + '/widgets/' + widgetId + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok) throw new Error((body.error && body.error.message) || 'Signup failed.');
            return body;
          });
        })
        .then(function (body) {
          if (body.pending) {
            // Verification required before the account exists yet.
            // Hand off to a code-entry step, still on this same page
            // — never a link that would send the visitor somewhere else.
            if (onPending) onPending(payload.email);
            return;
          }
          localStorage.setItem('widget_visitor_token_' + widgetId, body.token);
          statusMsg.style.color = '#16a34a';
          statusMsg.textContent = 'Account created! You are now signed up.';
          form.reset();
        })
        .catch(function (err) {
          statusMsg.style.color = '#dc2626';
          statusMsg.textContent = err.message;
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

    return form;
  }

  // Shown in place of the signup form once the backend responds
  // "pending" — the visitor types the code emailed to them right
  // here, without ever leaving the customer's site.
  function buildCodeVerifyForm(config, email, onVerified) {
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    var info = document.createElement('p');
    info.textContent = 'We emailed a 6-digit code to ' + email + '. Enter it below to finish creating your account.';
    info.style.cssText = 'margin:0 0 4px;font-size:13px;color:#6b7280;';
    form.appendChild(info);

    var label = document.createElement('label');
    label.textContent = 'Verification code';
    label.style.cssText = 'font-size:12px;color:#374151;display:flex;flex-direction:column;gap:4px;';

    var codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.inputMode = 'numeric';
    codeInput.autocomplete = 'one-time-code';
    codeInput.maxLength = 6;
    codeInput.required = true;
    codeInput.style.cssText =
      'padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:16px;letter-spacing:4px;text-align:center;';
    label.appendChild(codeInput);
    form.appendChild(label);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Verify';
    submitBtn.style.cssText =
      'margin-top:4px;padding:8px 12px;background:#4f46e5;color:#fff;border:none;' +
      'border-radius:6px;font-size:13px;cursor:pointer;';
    form.appendChild(submitBtn);

    var statusMsg = buildStatusEl();
    form.appendChild(statusMsg);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      statusMsg.textContent = '';

      fetch(apiOrigin + '/widgets/' + widgetId + '/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: codeInput.value }),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok) throw new Error((body.error && body.error.message) || 'That code is invalid or has expired.');
            return body;
          });
        })
        .then(function (body) {
          if (onVerified) onVerified(body);
        })
        .catch(function (err) {
          statusMsg.style.color = '#dc2626';
          statusMsg.textContent = err.message;
          submitBtn.disabled = false;
        });
    });

    return form;
  }

  function buildLoginForm(config) {
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    var fields = config.formFields && config.formFields.length ? config.formFields : [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ];
    buildFieldInputs(form, fields);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = config.buttonText || 'Log in';
    submitBtn.style.cssText =
      'margin-top:4px;padding:8px 12px;background:#4f46e5;color:#fff;border:none;' +
      'border-radius:6px;font-size:13px;cursor:pointer;';
    form.appendChild(submitBtn);

    var statusMsg = buildStatusEl();
    form.appendChild(statusMsg);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      statusMsg.textContent = '';

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      fetch(apiOrigin + '/widgets/' + widgetId + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok) throw new Error((body.error && body.error.message) || 'Login failed.');
            return body;
          });
        })
        .then(function (body) {
          localStorage.setItem('widget_visitor_token_' + widgetId, body.token);
          statusMsg.style.color = '#16a34a';
          statusMsg.textContent = 'Logged in!';
          form.reset();
        })
        .catch(function (err) {
          statusMsg.style.color = '#dc2626';
          statusMsg.textContent = err.message;
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

    return form;
  }

  // ---------- content area: renders the form, swaps to thank-you on success ----------

  function renderContentInto(area, config) {
    area.innerHTML = '';
    area.appendChild(buildFormShell(config));

    if (config.type === 'signup') {
      area.appendChild(buildSignupForm(config, function onPending(email) {
        // Swap to a code-entry step, still inside this same widget —
        // never a link that would navigate the visitor away from
        // the customer's site.
        area.innerHTML = '';
        area.appendChild(buildFormShell(config));
        area.appendChild(buildCodeVerifyForm(config, email, function onVerified(body) {
          localStorage.setItem('widget_visitor_token_' + widgetId, body.token);
          area.innerHTML = '';
          area.appendChild(buildFormShell(config));
          var successMsg = document.createElement('p');
          successMsg.textContent = 'Account verified! You are now signed up.';
          successMsg.style.cssText = 'font-size:13px;color:#16a34a;';
          area.appendChild(successMsg);
        }));
      }));
      return;
    }
    if (config.type === 'login') {
      area.appendChild(buildLoginForm(config));
      return;
    }

    // popover — a transient overlay, so swapping its own content
    // for a thank-you view on success makes sense; the whole thing
    // closes or gets dismissed afterward anyway.
    if (config.type === 'popover') {
      var popoverForm = buildLeadCaptureForm(config, function onSuccess() {
        area.innerHTML = '';
        area.appendChild(buildThankYouView(config));
      });
      area.appendChild(popoverForm);
      return;
    }

    // cta — stays visible on the page (banner + form untouched);
    // confirmation is a real popup shown ON TOP of it instead of
    // replacing it or just printing inline text.
    if (config.type === 'cta') {
      var ctaForm = buildLeadCaptureForm(config, function onSuccess() {
        showThankYouOverlay(config);
        ctaForm.reset();
      });
      area.appendChild(ctaForm);
      return;
    }

    // subscribe — the widget itself stays visible on the page after
    // submit (form + title + description untouched), but a real
    // popup confirms success on top of it — same pattern as cta.
    if (config.type === 'subscribe') {
      var subscribeForm = buildLeadCaptureForm(config, function onSuccess() {
        showThankYouOverlay(config);
        subscribeForm.reset();
      });
      area.appendChild(subscribeForm);
      return;
    }

    // Fallback for any future lead-capture type — same popup-on-top
    // behavior as subscribe/cta.
    var fallbackForm = buildLeadCaptureForm(config, function onSuccess() {
      showThankYouOverlay(config);
      fallbackForm.reset();
    });
    area.appendChild(fallbackForm);
  }

  // ---------- inline rendering (subscribe / signup / login / cta) ----------

  function renderInline(config) {
    var container = document.createElement('div');
    container.setAttribute('data-widget-id', widgetId);

    if (config.type === 'cta') {
      // The one concrete visual difference from subscribe: a
      // colored banner instead of a plain white card, using the
      // owner's chosen accent color.
      var accent = (config.displayOptions && config.displayOptions.accentColor) || '#4f46e5';
      container.style.cssText =
        'max-width:400px;padding:20px;border-radius:10px;font-family:system-ui,sans-serif;' +
        'background:' + accent + ';box-shadow:0 4px 14px rgba(0,0,0,0.15);';
    } else {
      container.style.cssText =
        'max-width:360px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;' +
        'font-family:system-ui,sans-serif;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08);';
    }

    renderContentInto(container, config);
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
  }

  // ---------- popover rendering: hidden overlay + modal ----------

  function renderPopover(config) {
    var backdrop = document.createElement('div');
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(17,24,39,0.5);' +
      'align-items:center;justify-content:center;z-index:2147483000;font-family:system-ui,sans-serif;';

    var modal = document.createElement('div');
    modal.style.cssText =
      'position:relative;max-width:360px;width:90%;padding:20px;background:#fff;' +
      'border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.2);';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText =
      'position:absolute;top:8px;right:10px;border:none;background:transparent;' +
      'font-size:20px;line-height:1;color:#9ca3af;cursor:pointer;';

    var contentArea = document.createElement('div');

    modal.appendChild(closeBtn);
    modal.appendChild(contentArea);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    renderContentInto(contentArea, config);

    var hasAutoOpened = false;

    function open() { backdrop.style.display = 'flex'; }
    function close() { backdrop.style.display = 'none'; }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close(); // click outside the modal closes it
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // Register so any page element can trigger it, either
    // declaratively (data-widget-open="<id>") or via JS
    // (WidgetPlatform.open('<id>')) — this always works, regardless
    // of which auto-trigger mode (if any) is also configured below.
    window.WidgetPlatform._widgets[widgetId] = { open: open, close: close };

    // --- auto-trigger modes, configured via displayOptions.trigger ---
    var opts = config.displayOptions || {};
    var trigger = opts.trigger || 'click'; // 'click' = manual only, no auto-open

    if (trigger === 'delay') {
      var delaySeconds = Number(opts.delaySeconds) > 0 ? Number(opts.delaySeconds) : 5;
      setTimeout(function () {
        if (!hasAutoOpened) { hasAutoOpened = true; open(); }
      }, delaySeconds * 1000);
    }

    if (trigger === 'scroll') {
      var scrollPercent = Number(opts.scrollPercent) > 0 ? Number(opts.scrollPercent) : 50; // 50 = page middle
      var onScroll = function () {
        if (hasAutoOpened) return;
        var scrollable = document.documentElement.scrollHeight - window.innerHeight;
        var scrolled = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
        if (scrolled >= scrollPercent) {
          hasAutoOpened = true;
          open();
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  window.WidgetPlatform.open = function (id) {
    var w = window.WidgetPlatform._widgets[id];
    if (w) w.open();
    else console.warn('[widget] no popover registered for id: ' + id);
  };
  window.WidgetPlatform.close = function (id) {
    var w = window.WidgetPlatform._widgets[id];
    if (w) w.close();
  };

  // Declarative trigger: <button data-widget-open="widgetId">.
  // Wired once via event delegation so it also works for buttons
  // added to the page after this script has already run.
  if (!window.WidgetPlatform._delegationWired) {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-widget-open]');
      if (trigger) window.WidgetPlatform.open(trigger.getAttribute('data-widget-open'));
    });
    window.WidgetPlatform._delegationWired = true;
  }

  function renderWidget(config) {
    if (config.type === 'popover') {
      renderPopover(config); // hidden until a trigger opens it
    } else {
      renderInline(config); // subscribe, signup, login, cta render immediately
    }
  }
})();
