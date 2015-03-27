var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-2390830-17']);
var _readerApp = location.protocol == "chrome-extension:" ? ("extension-"+chrome.app.getDetails().version) : "website";
_gaq.push(['_setCustomVar', 2, 'ReaderApp', _readerApp, 2]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();