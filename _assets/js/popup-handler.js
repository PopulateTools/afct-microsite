(function () {
  const observeDOM = (function () {
    const MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver;
    const eventListenerSupported = window.addEventListener;

    return function (obj, callback) {
      if (MutationObserver) {
        // define a new observer
        const obs = new MutationObserver(function (mutations, observer) {
          if (
            mutations[0].addedNodes.length ||
            mutations[0].removedNodes.length
          )
            callback();
        });
        // have the observer observe foo for changes in children
        obs.observe(obj, { childList: true, subtree: true });
      } else if (eventListenerSupported) {
        obj.addEventListener("DOMNodeInserted", callback, false);
        obj.addEventListener("DOMNodeRemoved", callback, false);
      }
    };
  })();

  let IS_WIDGET_INITIALIZED = false
  let REPORT_URL = null

  observeDOM(document.body, function () {
    const widget = document.querySelector("[widgetid^='PopupSignupForm']");
  
    if (widget && !IS_WIDGET_INITIALIZED) {
      IS_WIDGET_INITIALIZED = true
      widget.style.opacity = 0;
      widget.style.transform = "translate(-9999px)";
    }

    if (!widget && REPORT_URL) {
      window.open(REPORT_URL, "_blank");
      REPORT_URL = null
    }
  });

  window.onclick = (e) => {
    const { dataset: { triggerModal } = {}, href } = e.target

    if (triggerModal !== undefined) {
      const widget = document.querySelector("[widgetid^='PopupSignupForm']");

      require(
        ["mojo/signup-forms/Loader"],
        function(L) {
          L.start({"baseUrl":"mc.us10.list-manage.com","uuid":"66bafd0ef0d33f5bf8fbe1e87","lid":"113ab4bd34","uniqueMethods":true})
        }
      );

      // https://talk.jekyllrb.com/t/solved-anyone-made-a-mailchimp-subscribe-pop-up-work-on-click/1706/3
      document.cookie = "MCPopupClosed=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "MCPopupSubscribed=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      if (widget) {
        e.preventDefault()
        REPORT_URL = href
        widget.style.opacity = null;
        widget.style.transform = null;
      }
    }
  }
})();
