const inp = document.getElementById('prompt');
const dly = document.getElementById('delay');
const btn = document.getElementById('save');
const st = document.getElementById('status');

browser.storage.local.get({ prompt: "Briefly explain what this is about:", maxWait: 5500 })
  .then(d => { inp.value = d.prompt; dly.value = d.maxWait / 1000; });

btn.addEventListener('click', async () => {
  const delayMs = Math.min(60000, Math.max(1000, parseFloat(dly.value) * 1000));
  await browser.storage.local.set({ prompt: inp.value, maxWait: delayMs });
  st.style.opacity = '1';
  setTimeout(() => st.style.opacity = '0', 1500);
});
