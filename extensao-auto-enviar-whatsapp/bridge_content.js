/**
 * ZapDirect Bridge Content Script v3.2
 * Roda dentro de http://localhost:3000/*
 * Estabelece a ponte bidirecional entre o painel Web e o chrome.storage da extensão.
 */

console.log("[ZapDirect Bridge v3.2] Extensão conectada ao painel web.");

// Notifica a página web imediatamente que a extensão está ativa
function notifyReady() {
  window.postMessage({ type: "ZAP_EXTENSION_READY", version: "3.2" }, "*");
}
notifyReady();

// Escuta comandos vindos do app.js
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  const { type, payload } = event.data;

  // Responder a pings da página
  if (type === "ZAP_PING_EXTENSION") {
    notifyReady();
  }

  // Iniciar Fila
  if (type === "ZAP_START_BATCH") {
    console.log("[ZapDirect Bridge] Recebida solicitação de início da fila:", payload.contacts.length, "contatos.");

    chrome.storage.local.set({
      zapBatchQueue: payload.contacts,
      zapBatchConfig: payload.config,
      zapBatchStatus: "running",
      zapCurrentIndex: payload.startIndex || 0
    }, () => {
      console.log("[ZapDirect Bridge] Fila gravada no chrome.storage.local com sucesso.");
    });
  }

  // Parar Fila
  if (type === "ZAP_STOP_BATCH") {
    chrome.storage.local.set({ zapBatchStatus: "stopped" });
  }

  // Pausar Fila
  if (type === "ZAP_PAUSE_BATCH") {
    chrome.storage.local.set({ zapBatchStatus: "paused" });
  }

  // Continuar Fila
  if (type === "ZAP_RESUME_BATCH") {
    chrome.storage.local.set({ zapBatchStatus: "running" });
  }

  // Pular Contato
  if (type === "ZAP_SKIP_BATCH") {
    chrome.storage.local.get(["zapCurrentIndex", "zapBatchQueue"], (data) => {
      const nextIndex = (data.zapCurrentIndex || 0) + 1;
      chrome.storage.local.set({ zapCurrentIndex: nextIndex });
    });
  }
});

// Escuta atualizações de storage vindas do WhatsApp Web
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    if (changes.zapContactSent && changes.zapContactSent.newValue) {
      window.postMessage({
        type: "ZAP_CONTACT_SENT_UPDATE",
        payload: changes.zapContactSent.newValue
      }, "*");
    }

    if (changes.zapBatchStatus && changes.zapBatchStatus.newValue === "finished") {
      window.postMessage({
        type: "ZAP_BATCH_FINISHED"
      }, "*");
    }
  }
});
