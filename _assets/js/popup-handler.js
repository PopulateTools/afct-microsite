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

  // https://javascript.info/cookie
  function getCookie(name) {
    let matches = document.cookie.match(
      new RegExp(
        "(?:^|; )" +
          name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
          "=([^;]*)"
      )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  function setCookie(name, value, options = {}) {
    options = {
      path: "/",
      // add other defaults here if necessary
      ...options,
    };

    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }

    let updatedCookie =
      encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
      updatedCookie += "; " + optionKey;
      let optionValue = options[optionKey];
      if (optionValue !== true) {
        updatedCookie += "=" + optionValue;
      }
    }

    document.cookie = updatedCookie;
  }

  function deleteCookie(name) {
    setCookie(name, "", {
      "max-age": -1,
    });
  }

  let IS_WIDGET_INITIALIZED = false;
  let REPORT_URL = null;
  let widget = null;

  observeDOM(document.body, function () {
    widget = document.querySelector("[widgetid^='PopupSignupForm']");

    if (widget && !IS_WIDGET_INITIALIZED) {
      IS_WIDGET_INITIALIZED = true;
      widget.style.opacity = 0;
      widget.style.transform = "translate(-9999px)";
    }

    if (!widget && REPORT_URL) {
      window.open(REPORT_URL, "_blank");
      REPORT_URL = null;
    }

    // https://talk.jekyllrb.com/t/solved-anyone-made-a-mailchimp-subscribe-pop-up-work-on-click/1706/3
    if (getCookie("MCPopupClosed") !== undefined) {
      deleteCookie("MCPopupClosed");
    }

    if (getCookie("MCPopupSubscribed") !== undefined) {
      deleteCookie("MCPopupSubscribed");
    }
  });

  window.onclick = (e) => {
    const { dataset: { triggerModal } = {}, href } = e.target;

    if (triggerModal !== undefined) {
      // const widget = document.querySelector("[widgetid^='PopupSignupForm']");

      // https://talk.jekyllrb.com/t/solved-anyone-made-a-mailchimp-subscribe-pop-up-work-on-click/1706/3
      if (getCookie("MCPopupClosed") !== undefined) {
        deleteCookie("MCPopupClosed");
      }

      if (getCookie("MCPopupSubscribed") !== undefined) {
        deleteCookie("MCPopupSubscribed");
      }

      if (
        widget &&
        (getCookie("MCPopupClosed") !== "yes" ||
          getCookie("MCPopupSubscribed") !== "yes")
      ) {
        e.preventDefault();
        REPORT_URL = href;
        widget.style.opacity = null;
        widget.style.transform = null;
      }
    }
  };
})();
