(() => {
  const CHANNEL = "openguessr-research-recorder";
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (
      !message ||
      message.channel !== CHANNEL ||
      message.source !== "google-frame"
    ) {
      return;
    }

    chrome.runtime
      .sendMessage({
        type: "OGRR_EVENT",
        source: message.source,
        event: message.event,
        payload: message.payload,
      })
      .catch(() => {});
  });
})();
