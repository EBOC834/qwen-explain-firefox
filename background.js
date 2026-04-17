browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({ id: "explain_qwen", title: "Explain in Qwen", contexts: ["link", "selection"] });
  });
});

browser.contextMenus.onClicked.addListener(async (info) => {
  const source = info.linkUrl || info.selectionText?.trim();
  if (!source) return;

  const { prompt: userPrompt = "Briefly explain what this is about:", maxWait = 5500 } = await browser.storage.local.get({ prompt: "Briefly explain what this is about:", maxWait: 5500 });

  const finalText = `${userPrompt} ${source}`;
  const tab = await browser.tabs.create({ url: "https://chat.qwen.ai/" });
  await new Promise(r => setTimeout(r, maxWait));

  try {
    const [ok] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: (txt) => {
        const setVal = (el, v) => {
          const proto = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          if(desc && desc.set) desc.set.call(el, v);
          el.dispatchEvent(new Event('input', {bubbles:true}));
          el.dispatchEvent(new Event('change', {bubbles:true}));
        };
        let att=0;
        return new Promise(res=>{
          const loop=()=>{
            const el=document.querySelector('textarea,[contenteditable="true"],input[type="text"]');
            if(!el||el.disabled) return ++att<8?setTimeout(loop,600):res(false);
            setVal(el,txt);
            setTimeout(()=>{
              if(el.value===txt){
                el.focus();
                setTimeout(()=>{
                  let btn = document.querySelector('button[type="submit"], [data-testid*="send"], [aria-label*="Send"], .chat-input button:last-child');
                  if(btn && !btn.disabled) { btn.click(); return; }
                  el.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', code:'Enter', bubbles:true}));
                }, 600);
                res(true);
              } else if(++att<8) loop(); else res(false);
            },700);
          }; loop();
        });
      },
      args: [finalText]
    });
    if (!ok) throw new Error("SPA reset");
  } catch {
    await navigator.clipboard.writeText(finalText);
    browser.notifications.create({type:"basic",title:"Qwen Explain",message:"Prompt copied. Press Enter in chat."});
  }
});
