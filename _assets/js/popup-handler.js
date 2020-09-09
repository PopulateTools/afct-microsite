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

  observeDOM(document.body, function () {
    const widget = document.querySelector("[widgetid^='PopupSignupForm']");
  
    if (widget && !IS_WIDGET_INITIALIZED) {
      IS_WIDGET_INITIALIZED = true
      widget.style.opacity = 0;
      widget.style.transform = "translate(-9999px)";
    }
  });

  let REPORT_URL;

  window.onclick = (e) => {
    const { dataset: { triggerModal, action } = {}, href } = e.target

    if (triggerModal !== undefined) {
      const widget = document.querySelector("[widgetid^='PopupSignupForm']");

      if (widget) {
        e.preventDefault()
        REPORT_URL = href
        widget.style.opacity = null;
        widget.style.transform = null;
      }
    }

    if (action !== undefined && action === "close-mc-modal" && REPORT_URL) {
      window.open(REPORT_URL, "_blank");
    }
  }
})();
