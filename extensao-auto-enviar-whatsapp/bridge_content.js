/**
 * ZapDirect Bridge Content Script v3.8
 * Estabelece a ponte bidirecional entre o painel Web e o chrome.storage da extensão.
 * Suporta http://localhost/*, http://127.0.0.1/*, https://*.vercel.app/* e file:///*
 */

console.log("[ZapDirect Bridge v3.8] Extensão conectada ao painel web.");

// Notifica a página web que a extensão está pronta e ativa
function notifyReady() {
  try {
    window.postMessage({ 
      type: "ZAP_EXTENSION_READY", 
      version: "3.8",
      timestamp: Date.now()
    }, "*");
  } catch (e) {
    console.error("[ZapDirect Bridge] Erro ao enviar postMessage:", e);
  }
}

// 1. Notifica imediatamente
notifyReady();

// 2. Notifica após o DOM estar pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", notifyReady);
}
setTimeout(notifyReady, 400);
setTimeout(notifyReady, 1200);

// 3. Escuta comandos vindos do app.js
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  const { type, payload } = event.data;

  // Responder a pings da página
  if (type === "ZAP_PING_EXTENSION") {
    notifyReady();
    return;
  }

  // Iniciar Fila
  if (type === "ZAP_START_BATCH") {
    console.log("[ZapDirect Bridge] Início da fila recebido:", payload.contacts ? payload.contacts.length : 0, "contatos.");

    chrome.storage.local.set({
      zapBatchQueue: payload.contacts,
      zapBatchConfig: payload.config,
      zapBatchStatus: "running",
      zapCurrentIndex: payload.startIndex || 0,
      zapWaitingNext: false,
      zapForceNext: false
    }, () => {
      console.log("[ZapDirect Bridge] Fila gravada no chrome.storage.local.");
    });
  }

  // Forçar Envio do Próximo Contato Imediatamente (Bypassa o contador anti-ban)
  if (type === "ZAP_FORCE_NEXT_NOW") {
    console.log("[ZapDirect Bridge] Comando para enviar próximo contato agora!");
    chrome.storage.local.set({
      zapForceNext: true,
      zapNextDispatchTime: Date.now() - 1000
    });
  }

  // Parar Fila
  if (type === "ZAP_STOP_BATCH") {
    chrome.storage.local.set({ 
      zapBatchStatus: "stopped",
      zapWaitingNext: false
    });
  }

  // Pausar Fila
  if (type === "ZAP_PAUSE_BATCH") {
    chrome.storage.local.set({ 
      zapBatchStatus: "paused" 
    });
  }

  // Continuar Fila
  if (type === "ZAP_RESUME_BATCH") {
    chrome.storage.local.set({ 
      zapBatchStatus: "running" 
    });
  }

  // Pular Contato
  if (type === "ZAP_SKIP_BATCH") {
    chrome.storage.local.get(["zapCurrentIndex", "zapBatchQueue"], (data) => {
      const nextIndex = (data.zapCurrentIndex || 0) + 1;
      chrome.storage.local.set({ 
        zapCurrentIndex: nextIndex,
        zapForceNext: true,
        zapWaitingNext: false
      });
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

    if (changes.zapNextDispatchTime && changes.zapNextDispatchTime.newValue) {
      window.postMessage({
        type: "ZAP_TIMER_TARGET_UPDATE",
        payload: {
          targetTimestamp: changes.zapNextDispatchTime.newValue
        }
      }, "*");
    }

    if (changes.zapBatchStatus && changes.zapBatchStatus.newValue === "finished") {
      window.postMessage({
        type: "ZAP_BATCH_FINISHED"
      }, "*");
    }
  }
});
