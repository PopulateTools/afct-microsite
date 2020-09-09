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

  window.onclick = (e) => {
    const { dataset: { triggerModal } = {} } = e.target
    if (triggerModal !== undefined) {
      e.preventDefault()

      const widget = document.querySelector("[widgetid^='PopupSignupForm']");
      widget.style.opacity = null;
      widget.style.transform = null;
    }
  }
})();
