(() => {
  "use strict";

  if (!document.getElementById("embeddedSuiteDropInStyles")) {
    const style = document.createElement("style");
    style.id = "embeddedSuiteDropInStyles";
    style.textContent = "/* Embedded My App Suite */\n.embedded-suite-screen[hidden]{display:none!important}\n.embedded-suite-screen{position:fixed;inset:0;z-index:30000;overflow-y:auto;overscroll-behavior:contain;background:radial-gradient(circle at 10% -5%,#fff2df 0,transparent 30%),#f6f7fb;color:#1f2937;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}\n.embedded-suite-screen *{box-sizing:border-box}.embedded-suite-shell{width:min(760px,100%);min-height:100%;margin:0 auto;padding-bottom:calc(32px + env(safe-area-inset-bottom))}\n.embedded-suite-hero{position:relative;overflow:hidden;padding:calc(24px + env(safe-area-inset-top)) 22px 30px;border-radius:0 0 30px 30px;background:linear-gradient(135deg,#ff6600,#ff9200);color:#fff;box-shadow:0 14px 34px rgba(217,95,0,.16)}\n.embedded-suite-hero:after{content:\"\";position:absolute;width:190px;height:190px;right:-75px;bottom:-95px;border:2px solid rgba(255,255,255,.16);border-radius:50%}\n.embedded-suite-hero-row{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:16px}.embedded-suite-brand{display:flex;align-items:center;gap:14px}.embedded-suite-brand-mark{display:grid;width:58px;height:58px;flex:0 0 58px;place-items:center;border:2px solid rgba(255,255,255,.8);border-radius:18px;background:rgba(255,255,255,.12);font-size:28px;backdrop-filter:blur(6px)}\n.embedded-suite-brand h1,.embedded-suite-brand p{margin:0}.embedded-suite-brand h1{color:#fff;font-size:clamp(24px,6vw,34px);letter-spacing:-.035em}.embedded-suite-brand p{margin-top:4px;color:rgba(255,255,255,.88);font-size:12px;line-height:1.45}.embedded-suite-hero-actions{display:flex;gap:8px}.embedded-suite-hero-action{min-height:38px;border:1px solid rgba(255,255,255,.78);border-radius:999px;padding:0 12px;background:rgba(255,255,255,.95);color:#d95f00;font-size:10px;font-weight:900;cursor:pointer}\n.embedded-suite-identity{position:relative;z-index:1;display:inline-flex;align-items:center;gap:7px;margin-top:17px;border:1px solid rgba(255,255,255,.34);border-radius:999px;padding:7px 10px;background:rgba(255,255,255,.11);color:rgba(255,255,255,.96);font-size:9px;font-weight:850;backdrop-filter:blur(5px)}.embedded-suite-dot{width:7px;height:7px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.14)}\n.embedded-suite-content{padding:20px 18px}.embedded-suite-welcome{margin-bottom:14px}.embedded-suite-welcome h2,.embedded-suite-welcome p{margin:0}.embedded-suite-welcome h2{color:#1f2937;font-size:18px}.embedded-suite-welcome p{margin-top:4px;color:#6b7280;font-size:11px;line-height:1.5}.embedded-suite-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}\n.embedded-suite-card{position:relative;display:grid;width:100%;min-height:235px;overflow:hidden;border:1px solid #eadfd2;border-radius:24px;padding:18px;background:#fff;color:inherit;text-align:left;text-decoration:none;font:inherit;box-shadow:0 10px 28px rgba(38,33,27,.06);cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.embedded-suite-card:hover,.embedded-suite-card:focus-visible{transform:translateY(-3px);box-shadow:0 16px 34px rgba(38,33,27,.1);outline:none}.embedded-suite-card:active{transform:scale(.985)}\n.embedded-suite-current-badge{position:absolute;top:15px;right:15px;border-radius:999px;padding:5px 8px;background:#fff1e3;color:#d95f00;font-size:8px;font-weight:900}.embedded-suite-app-icon{display:grid;width:62px;height:62px;place-items:center;border-radius:19px;background:#fff0e0;font-size:31px}.embedded-suite-card.japa .embedded-suite-app-icon{background:#fff5e8;color:#d95f00;font-size:35px;font-weight:900}.embedded-suite-label{display:inline-flex;width:fit-content;align-items:center;gap:5px;margin-top:13px;border-radius:999px;padding:5px 8px;background:#fff1e3;color:#d95f00;font-size:8px;font-weight:900}.embedded-suite-card h3{margin:8px 0 0;color:#1f2937;font-size:18px;letter-spacing:-.02em}.embedded-suite-card p{margin:7px 0 0;color:#6b7280;font-size:10.5px;line-height:1.5}\n.embedded-suite-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.embedded-suite-tag{border-radius:999px;padding:5px 8px;background:#f6f7f9;color:#596170;font-size:8px;font-weight:800}.embedded-suite-open-row{align-self:end;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;color:#d95f00;font-size:10px;font-weight:950}.embedded-suite-arrow{font-size:22px;line-height:1}.embedded-suite-privacy{display:grid;gap:8px;margin-top:16px;border:1px solid #cce7d8;border-radius:18px;padding:14px 16px;background:#f3fbf6}.embedded-suite-privacy strong{color:#17824f;font-size:11px}.embedded-suite-privacy span{color:#4e6d5e;font-size:9.5px;line-height:1.5}.embedded-suite-footer{padding:4px 18px 0;color:#6b7280;text-align:center;font-size:8.5px;line-height:1.5}.embedded-suite-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));z-index:30020;transform:translateX(-50%);width:min(360px,calc(100vw - 28px));border-radius:14px;padding:11px 14px;background:#20242c;color:#fff;text-align:center;font-size:10px;box-shadow:0 14px 34px rgba(0,0,0,.18)}.embedded-suite-toast[hidden]{display:none!important}\n.app-switcher-layer{display:none!important}.embedded-suite-settings-button{width:100%}.header-app-switcher-button{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;margin-left:auto;margin-right:8px;border:1px solid rgba(255,255,255,.78);border-radius:13px;background:rgba(255,255,255,.96);color:#d95f00;font:inherit;font-size:21px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 5px 14px rgba(165,71,0,.12)}\n@media(max-width:560px){.embedded-suite-hero{padding-left:17px;padding-right:17px;padding-bottom:23px;border-radius:0 0 24px 24px}.embedded-suite-brand-mark{width:50px;height:50px;flex-basis:50px;border-radius:16px;font-size:24px}.embedded-suite-hero-row{align-items:flex-start}.embedded-suite-hero-actions{flex-direction:column}.embedded-suite-hero-action{min-height:34px;padding:0 10px}.embedded-suite-content{padding:17px 14px}.embedded-suite-grid{grid-template-columns:1fr;gap:11px}.embedded-suite-card{min-height:200px;border-radius:20px;padding:16px}.header-app-switcher-button{width:38px;height:38px;flex-basis:38px;margin-right:6px;border-radius:11px;font-size:19px}}\n@media(max-width:390px){.embedded-suite-brand p{max-width:180px}.embedded-suite-hero-actions{gap:6px}.embedded-suite-hero-action{font-size:9px}}\n@media(prefers-reduced-motion:reduce){.embedded-suite-card{transition:none}}\n\n.unified-safety-card{overflow:hidden}\n.unified-safety-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}\n.unified-safety-heading h3{margin:0}\n.unified-safety-badge{flex:0 0 auto;border:1px solid #bce8d5;border-radius:999px;padding:6px 9px;background:#e8f8f1;color:#147a52;font-size:.72rem;font-weight:800;white-space:nowrap}\n.unified-safety-list{overflow:hidden;border:1px solid #e1e5ea;border-radius:14px;background:#fafbfd}\n.unified-safety-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #e1e5ea;font-size:.83rem}\n.unified-safety-row:last-child{border-bottom:0}\n.unified-safety-row span{color:#6f7379}.unified-safety-row strong{color:#147a52;text-align:right}\n.unified-safety-note{margin-top:12px;padding:11px 12px;border:1px solid #c8d9ee;border-radius:14px;background:#f7fbff;color:#656b73;font-size:.82rem;line-height:1.55}\n.unified-safety-note strong{color:#20252b}\n.trusted-device-status{margin-top:10px;padding:10px 12px;border-radius:12px;background:#fff8ef;color:#7b4b18;font-size:.8rem;line-height:1.5}\n@media(max-width:520px){.unified-safety-heading{flex-direction:column}}\n";
    document.head.appendChild(style);
  }
})();

(() => {
  "use strict";
  const BIRTHDAY_URL = "https://parmjee2026.github.io/Birthday-Reminder-Web-App/";
  const JAPA_URL = "https://parmeshwarbtpl-rgb.github.io/japa-counter/";
  const path = location.pathname.toLowerCase();
  const title = document.title.toLowerCase();
  const current = (path.includes("japa-counter") || title.includes("naam jaap")) ? "japa" : "birthday";
  let installPrompt = null;

  function card(kind) {
    const isBirthday = kind === "birthday";
    const isCurrent = kind === current;
    const tag = isCurrent ? "button" : "a";
    const attrs = isCurrent
      ? 'type="button" data-enter-current-app'
      : `href="${isBirthday ? BIRTHDAY_URL : JAPA_URL}?enter=1" data-switch-to-app`;
    const icon = isBirthday ? "🎂" : "ॐ";
    const name = isBirthday ? "Birthday Reminder" : "Naam Jaap Counter";
    const desc = isBirthday
      ? "Privately manage birthdays, wishes, calendar exports, backups and your local contact copy."
      : "Continue your mantra counting, goals, history and secure account synchronization.";
    const tags = isBirthday
      ? '<span class="embedded-suite-tag">Google Contacts Read Only</span><span class="embedded-suite-tag">Device Privacy</span><span class="embedded-suite-tag">Calendar</span>'
      : '<span class="embedded-suite-tag">Jaap Counter</span><span class="embedded-suite-tag">History</span><span class="embedded-suite-tag">Secure Sync</span>';
    return `<${tag} class="embedded-suite-card ${kind === 'japa' ? 'japa' : 'birthday'}" ${attrs}>
      ${isCurrent ? '<span class="embedded-suite-current-badge">Current App</span>' : ''}
      <div class="embedded-suite-app-icon" aria-hidden="true">${icon}</div>
      <div class="embedded-suite-label">✦ My App Suite</div>
      <h3>${name}</h3><p>${desc}</p><div class="embedded-suite-tags">${tags}</div>
      <div class="embedded-suite-open-row"><span>Open ${name}</span><span class="embedded-suite-arrow">→</span></div>
    </${tag}>`;
  }

  function markup() {
    return `<section id="embeddedSuiteLauncher" class="embedded-suite-screen" aria-label="My App Suite">
      <div class="embedded-suite-shell">
        <header class="embedded-suite-hero"><div class="embedded-suite-hero-row">
          <div class="embedded-suite-brand"><div class="embedded-suite-brand-mark" aria-hidden="true">✦</div><div><h1>My App Suite</h1><p>Your apps. Separate data. One clean home.</p></div></div>
          <div class="embedded-suite-hero-actions"><button id="embeddedSuiteShare" class="embedded-suite-hero-action" type="button">↗ Share</button><button id="embeddedSuiteInstall" class="embedded-suite-hero-action" type="button">⬇ Install</button></div>
        </div><div class="embedded-suite-identity"><span class="embedded-suite-dot" aria-hidden="true"></span><span>2 independent apps · 1 common home</span></div></header>
        <main class="embedded-suite-content"><section class="embedded-suite-welcome"><h2>Your Apps</h2><p>Open either app from here. Their login, permissions and stored data remain separate.</p></section>
          <section class="embedded-suite-grid" aria-label="Your apps">${card('birthday')}${card('japa')}</section>
          <section class="embedded-suite-privacy"><strong>🔒 Same launcher, separate app data</strong><span>My App Suite is built into both apps. It does not read, copy or combine Birthday Reminder contacts with Naam Jaap activity.</span></section>
        </main><footer class="embedded-suite-footer">Built into this app · No separate My App Suite installation required</footer>
      </div><div id="embeddedSuiteToast" class="embedded-suite-toast" role="status" hidden></div></section>`;
  }

  function setup() {
    document.getElementById("headerAppSwitcherButton")?.remove();
    document.getElementById("myAppSwitcherLayer")?.remove();
    if (!document.getElementById("embeddedSuiteLauncher")) document.body.insertAdjacentHTML("afterbegin", markup());
    const launcher=document.getElementById("embeddedSuiteLauncher");
    const headerBirthday=document.getElementById("appSwitcherButton");

    function toast(msg){const el=document.getElementById("embeddedSuiteToast");if(!el)return;el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}
    function show(){const old=document.getElementById("appSwitcherLayer");if(old)old.hidden=true;launcher.hidden=false;document.body.style.overflow="hidden";launcher.scrollTop=0;headerBirthday?.setAttribute("aria-expanded","true");document.getElementById("embeddedSuiteHeaderButton")?.setAttribute("aria-expanded","true")}
    function hide(){launcher.hidden=true;document.body.style.overflow="";headerBirthday?.setAttribute("aria-expanded","false");document.getElementById("embeddedSuiteHeaderButton")?.setAttribute("aria-expanded","false")}

    launcher.querySelectorAll("[data-enter-current-app]").forEach(b=>b.addEventListener("click",hide));
    launcher.querySelectorAll("[data-switch-to-app]").forEach(a=>{a.removeAttribute("target");a.removeAttribute("rel")});

    if(headerBirthday) headerBirthday.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();show()},true);

    if(current==="japa"){
      const header=document.querySelector(".app-header"), account=document.getElementById("accountButton");
      if(header&&account&&!document.getElementById("embeddedSuiteHeaderButton")){const b=document.createElement("button");b.id="embeddedSuiteHeaderButton";b.className="header-app-switcher-button";b.type="button";b.title="My Apps";b.setAttribute("aria-label","Open My Apps");b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-expanded","false");b.innerHTML='<span aria-hidden="true">▦</span>';header.insertBefore(b,account);b.addEventListener("click",show)}
      const auth=document.querySelector("#authGate .auth-card");
      if(auth&&!document.getElementById("embeddedSuiteAuthButton")){const b=document.createElement("button");b.id="embeddedSuiteAuthButton";b.className="secondary-btn full-width";b.type="button";b.textContent="▦ My Apps";b.addEventListener("click",show);const privacy=auth.querySelector(".privacy-note");auth.insertBefore(b,privacy||null)}
    } else {
      const actions=document.querySelector(".login-secondary-actions");
      if(actions&&!document.getElementById("loginEmbeddedSuiteButton")){const b=document.createElement("button");b.id="loginEmbeddedSuiteButton";b.className="secondary-button login-install-button";b.type="button";b.textContent="▦ My Apps";b.addEventListener("click",show);actions.appendChild(b)}
    }

    const more=document.querySelector(".more-apps-card");
    if(more){more.innerHTML='<h3>App Switcher</h3><p>My App Suite is built directly into this app. No separate launcher app is required.</p><button class="'+(current==='japa'?'primary-btn full-width':'orange-action-button')+' embedded-suite-settings-button" type="button" data-open-embedded-suite>▦ Open My Apps</button>';more.querySelector("[data-open-embedded-suite]")?.addEventListener("click",show)}

    document.getElementById("embeddedSuiteShare")?.addEventListener("click",async()=>{
      if(current==="birthday"){const existing=document.getElementById("loginShareButton");if(existing){existing.click();return}}
      const data={title:current==="birthday"?"Birthday Reminder":"Naam Jaap Counter",text:current==="birthday"?"Privacy-first birthday reminder.":"Naam Jaap, mala goals and history.",url:current==="birthday"?BIRTHDAY_URL:JAPA_URL};
      try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);toast("App link copied.")}}catch(e){if(e?.name!=="AbortError")toast("Share could not be opened.")}
    });

    document.getElementById("embeddedSuiteInstall")?.addEventListener("click",async()=>{
      const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;if(standalone){toast("This app is already installed.");return}
      if(current==="birthday"){const existing=document.getElementById("loginInstallButton")||document.getElementById("installButton");if(existing){existing.click();return}}
      if(installPrompt){try{await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return}catch(e){console.warn(e)}}
      toast(/iphone|ipad|ipod/i.test(navigator.userAgent)?"Tap Share → Add to Home Screen.":"Open browser menu → Install app / Add to Home screen.")
    });

    const u=new URL(location.href);if(u.searchParams.get("enter")==="1"){hide();u.searchParams.delete("enter");history.replaceState(null,"",u.pathname+(u.search?u.search:"")+u.hash)}else show();
  }

  addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e});
  addEventListener("appinstalled",()=>{installPrompt=null});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();



(() => {
  "use strict";

  function buildSafetyCard() {
    if (document.getElementById("unifiedDataSafetyCard")) return;

    const settingsView = document.querySelector(
      '#settingsView, [data-view="settings"]'
    );
    const accountCard = settingsView?.querySelector(".account-card");

    if (!settingsView || !accountCard) return;

    const card = document.createElement("section");
    card.id = "unifiedDataSafetyCard";
    card.className = "card unified-safety-card";
    card.innerHTML = `
      <div class="unified-safety-heading">
        <div>
          <p class="eyebrow">Data Safety</p>
          <h3>App Data Safety</h3>
        </div>
        <span class="unified-safety-badge">Privacy First</span>
      </div>

      <div class="unified-safety-list">
        <div class="unified-safety-row">
          <span>Google password / client secret</span>
          <strong>Never stored</strong>
        </div>
        <div class="unified-safety-row">
          <span>Analytics / advertising SDK</span>
          <strong>Not used</strong>
        </div>
        <div class="unified-safety-row">
          <span>Birthday Reminder data received</span>
          <strong>None</strong>
        </div>
      </div>

      <div class="unified-safety-note">
        <strong>Naam Jaap data flow:</strong>
        verified Google account details and jaap activity sync through
        Google Apps Script to Google Sheets. Birthday Reminder contacts
        are not transferred to this app.
      </div>

      <div id="trustedDeviceStatus" class="trusted-device-status">
        Trusted device access: checking…
      </div>
    `;

    accountCard.parentElement.insertBefore(card, accountCard);
  }

  function updateTrustedStatus() {
    const status = document.getElementById("trustedDeviceStatus");
    if (!status) return;

    const hasUser =
      typeof authState !== "undefined" &&
      Boolean(authState.user);

    const live =
      typeof isAuthenticated === "function" &&
      isAuthenticated();

    if (live) {
      status.textContent =
        "Trusted Device: active · Cloud sync is connected.";
    } else if (hasUser) {
      status.textContent =
        "Trusted Device: local mode active · Reconnect only when cloud sync is needed.";
    } else {
      status.textContent =
        "Trusted Device: sign in once to verify this device.";
    }
  }

  function improveLoginCopy() {
    const privacy = document.querySelector("#authGate .privacy-note");
    if (!privacy || privacy.querySelector("[data-trusted-device-copy]")) return;

    const extra = document.createElement("div");
    extra.dataset.trustedDeviceCopy = "";
    extra.style.marginTop = "8px";
    extra.textContent =
      "Trusted device: after verified sign-in, the installed app can reopen locally. Cloud sync may require reconnection.";
    privacy.appendChild(extra);
  }

  function initialize() {
    buildSafetyCard();
    improveLoginCopy();
    updateTrustedStatus();

    const reconnect = document.getElementById("reconnectBtn");
    if (reconnect) reconnect.textContent = "Reconnect Sync";

    window.setInterval(updateTrustedStatus, 3000);
    window.addEventListener("online", updateTrustedStatus);
    window.addEventListener("offline", updateTrustedStatus);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();

