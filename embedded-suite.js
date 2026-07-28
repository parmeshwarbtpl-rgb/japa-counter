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
