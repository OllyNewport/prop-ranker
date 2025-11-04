// Central affiliate map + click events
const AFF = {
  apex: "https://example.com/?coupon=YOURCODE",
  topstep: "https://example.com/?ref=YOURCODE",
  ftmo: "https://example.com/?affid=YOURCODE",
  e2t: "https://example.com/?ref=YOURCODE",
  // add the rest...
};

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.firm-btn[data-aff]');
  if(!btn) return;
  const key = btn.dataset.aff;
  const url = AFF[key];
  if(!url) return;

  if (window.gtag) {
    gtag('event','affiliate_click',{firm:key,page:location.pathname,placement:btn.dataset.placement||'table'});
  }
  window.open(url,'_blank','noopener,noreferrer');
});
