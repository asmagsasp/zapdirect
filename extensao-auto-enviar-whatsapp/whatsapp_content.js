/**
 * ZapDirect WhatsApp Automation Script v3.4
 * Suporta WhatsApp Web e WhatsApp Business Web
 * Disparo 100% automático em Lote (Planilha) e Individual (1 a 1)
 */

console.log("[ZapDirect WhatsApp v3.4] Script de automação carregado no WhatsApp Web.");

// 1. Captura da URL inicial IMEDIATAMENTE em document_start antes do WhatsApp reescrever a URL
const INITIAL_URL = window.location.href;
const INITIAL_SEARCH = window.location.search;

if (INITIAL_SEARCH.includes("zap_batch=1")) {
  try {
    sessionStorage.setItem("is_zap_batch_runner", "true");
  } catch (e) {}
}

if (INITIAL_URL.includes("phone=") || INITIAL_URL.includes("text=") || INITIAL_URL.includes("zap_auto=1")) {
  try {
    sessionStorage.setItem("zap_single_pending", "true");
    sessionStorage.setItem("zap_single_target", INITIAL_URL);
    console.log("[ZapDirect] Auto-envio individual detectado e armado:", INITIAL_URL);
  } catch (e) {}
}

// Previne duplo envio do mesmo contato na mesma sessão em lote
function hasAlreadySentContact(contactId) {
  try {
    return sessionStorage.getItem("zap_sent_contact_" + contactId) === "true";
  } catch (e) {
    return false;
  }
}

function markContactAsSent(contactId) {
  try {
    sessionStorage.setItem("zap_sent_contact_" + contactId, "true");
  } catch (e) {}
}

let currentBanner = null;

function updateStatusBanner(htmlContent, isDone = false) {
  if (!currentBanner) {
    currentBanner = document.createElement("div");
    currentBanner.id = "zap-floating-banner";
    currentBanner.style.cssText = `
      position: fixed;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #00a884 0%, #075e54 100%);
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 30px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999999;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255,255,255,0.25);
      pointer-events: none;
    `;
    document.body.appendChild(currentBanner);
  }

  currentBanner.innerHTML = htmlContent;

  if (isDone) {
    setTimeout(() => {
      if (currentBanner) {
        currentBanner.remove();
        currentBanner = null;
      }
    }, 5000);
  }
}

function findSendButton() {
  // 1. Seletores oficiais de ícone no WhatsApp Web e WhatsApp Business Web
  const sendIcon = document.querySelector('span[data-icon="send"]') ||
                   document.querySelector('span[data-icon="wds-ic-send"]') ||
                   document.querySelector('span[data-icon="send-light"]') ||
                   document.querySelector('[data-testid="send"]') ||
                   document.querySelector('[data-icon="send"]');

  if (sendIcon) {
    const btn = sendIcon.closest("button") || sendIcon.closest('[role="button"]') || sendIcon;
    if (btn) return btn;
  }

  // 2. aria-label Enviar / Send
  const ariaBtn = document.querySelector('button[aria-label="Enviar"]') ||
                  document.querySelector('button[aria-label="Send"]') ||
                  document.querySelector('[aria-label="Enviar"]') ||
                  document.querySelector('[aria-label="Send"]') ||
                  document.querySelector('button[data-tab="11"]');
  if (ariaBtn) return ariaBtn;

  // 3. Botão no footer que contenha svg e não seja o microfone
  const footerButtons = document.querySelectorAll('footer button, div[role="textbox"] ~ div button');
  for (const b of footerButtons) {
    const hasSendSvg = b.querySelector('svg path[d*="M1.101"]') || b.querySelector('[data-icon="send"]');
    const isMic = b.querySelector('[data-icon="ptt"]') || b.querySelector('[data-icon="microphone"]') || b.querySelector('[data-icon="audio-mic"]');
    if (hasSendSvg && !isMic) {
      return b;
    }
  }

  return null;
}

function findChatInput() {
  return document.querySelector('footer div[contenteditable="true"]') ||
         document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
         document.querySelector('div[contenteditable="true"][role="textbox"]') ||
         document.querySelector('div[contenteditable="true"]');
}

function checkForInvalidNumberModal() {
  const bodyText = document.body ? (document.body.innerText || "") : "";
  if (bodyText.includes("número de telefone compartilhado por url é inválido") ||
      bodyText.includes("Phone number shared via url is invalid") ||
      bodyText.includes("não está no WhatsApp") ||
      bodyText.includes("isn't on WhatsApp")) {
    
    const okBtn = document.querySelector('button[data-testid="popup-controls-ok"]') ||
                  document.querySelector('div[role="button"][data-tab]') ||
                  document.querySelector('button');
    if (okBtn) okBtn.click();
    return true;
  }
  return false;
}

let isSendingAction = false;

function doTriggerSend() {
  if (isSendingAction) return false;
  isSendingAction = true;

  const sendBtn = findSendButton();
  const inputEl = findChatInput();

  let sent = false;

  // 1. Tenta clique oficial com a sequência completa de eventos do mouse
  if (sendBtn) {
    try {
      ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(evtName => {
        sendBtn.dispatchEvent(new MouseEvent(evtName, {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      });
      sendBtn.click();
      sent = true;
      console.log("[ZapDirect WhatsApp] Clique executado no botão de envio!");
    } catch (e) {
      console.error("[ZapDirect WhatsApp] Falha no clique:", e);
    }
  }

  // 2. Dispara também Enter no campo de texto para garantia total
  if (inputEl) {
    try {
      inputEl.focus();
      const enterParams = { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
      inputEl.dispatchEvent(new KeyboardEvent("keydown", enterParams));
      inputEl.dispatchEvent(new KeyboardEvent("keyup", enterParams));
      console.log("[ZapDirect WhatsApp] Enter disparado no campo de mensagem.");
      sent = true;
    } catch (e) {
      console.error("[ZapDirect WhatsApp] Falha no Enter:", e);
    }
  }

  setTimeout(() => {
    isSendingAction = false;
  }, 2500);

  return sent;
}

// ========================================================
// MODO INDIVIDUAL (1 a 1)
// ========================================================
let isSingleProcessing = false;

function checkSingleUrlSend() {
  const isPending = sessionStorage.getItem("zap_single_pending") === "true";
  if (!isPending) return;

  if (isSingleProcessing) return;

  // Checa se o WhatsApp deu modal de número inválido
  if (checkForInvalidNumberModal()) {
    isSingleProcessing = true;
    sessionStorage.removeItem("zap_single_pending");
    updateStatusBanner("⚠️ ZapDirect: O número informado não possui WhatsApp.", true);
    return;
  }

  const sendBtn = findSendButton();
  const inputEl = findChatInput();
  const hasText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;

  // O WhatsApp terminou de carregar a conversa quando o botão de envio está pronto ou o texto foi injetado
  if (sendBtn || hasText) {
    isSingleProcessing = true;
    updateStatusBanner("⚡ ZapDirect: Conversa pronta! Disparando mensagem...");

    // Remove a pendência para não duplicar envio
    sessionStorage.removeItem("zap_single_pending");

    setTimeout(() => {
      doTriggerSend();
      updateStatusBanner("✅ ZapDirect: Mensagem enviada automaticamente com sucesso!", true);
      console.log("[ZapDirect WhatsApp] Mensagem enviada automaticamente no Modo Individual.");

      // Segunda tentativa preventiva após 900ms caso o botão precisasse de outro ciclo
      setTimeout(() => {
        const stillBtn = findSendButton();
        const stillText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;
        if (stillBtn && stillText) {
          console.log("[ZapDirect WhatsApp] Tentando segundo clique preventivo...");
          doTriggerSend();
        }
        isSingleProcessing = false;
      }, 900);
    }, 700);
  } else {
    // Enquanto o WhatsApp ainda está carregando a conversa
    if (!currentBanner) {
      updateStatusBanner("⏳ ZapDirect: Carregando conversa no WhatsApp...");
    }
  }
}

// ========================================================
// MODO EM LOTE (PLANILHA)
// ========================================================
let isProcessingContact = false;
let activeCountdownInterval = null;

function checkBatchQueue() {
  const isBatch = sessionStorage.getItem("is_zap_batch_runner") === "true" || window.location.search.includes("zap_batch=1");
  if (!isBatch) return;

  if (isProcessingContact) return;

  chrome.storage.local.get(["zapBatchQueue", "zapBatchConfig", "zapBatchStatus", "zapCurrentIndex"], (data) => {
    const queue = data.zapBatchQueue || [];
    const config = data.zapBatchConfig || {};
    const status = data.zapBatchStatus || "idle";
    const currentIndex = (typeof data.zapCurrentIndex === "number") ? data.zapCurrentIndex : 0;

    if (status !== "running") return;

    if (currentIndex >= queue.length) {
      updateStatusBanner("🎉 ZapDirect: Todos os contatos da planilha foram enviados!", true);
      chrome.storage.local.set({ zapBatchStatus: "finished" });
      return;
    }

    const currentContact = queue[currentIndex];
    if (!currentContact) return;

    if (hasAlreadySentContact(currentContact.id)) return;

    if (checkForInvalidNumberModal()) {
      isProcessingContact = true;
      markContactAsSent(currentContact.id);
      updateStatusBanner(`⚠️ O número ${currentContact.cleanPhone} não possui WhatsApp. Pulando...`);
      setTimeout(() => {
        advanceQueueToNext(currentIndex, queue, config);
      }, 3000);
      return;
    }

    const inputEl = findChatInput();
    const sendBtn = findSendButton();
    const hasText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;

    if (sendBtn || hasText) {
      isProcessingContact = true;
      markContactAsSent(currentContact.id);

      updateStatusBanner(`⚡ ZapDirect: [${currentIndex + 1}/${queue.length}] Enviando para <strong>${currentContact.ownerName || currentContact.salonName}</strong>...`);

      setTimeout(() => {
        doTriggerSend();
        console.log(`[ZapDirect WhatsApp] Mensagem enviada para: ${currentContact.cleanPhone} (${currentContact.salonName})`);

        chrome.storage.local.set({
          zapContactSent: {
            id: currentContact.id,
            cleanPhone: currentContact.cleanPhone,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          }
        });

        setTimeout(() => {
          advanceQueueToNext(currentIndex, queue, config);
        }, 1800);
      }, 1000);
    }
  });
}

function advanceQueueToNext(currentIndex, queue, config) {
  const nextIndex = currentIndex + 1;

  if (nextIndex >= queue.length) {
    updateStatusBanner("🎉 ZapDirect: Todos os contatos da planilha foram enviados com sucesso!", true);
    chrome.storage.local.set({ zapBatchStatus: "finished" });
    isProcessingContact = false;
    return;
  }

  const nextContact = queue[nextIndex];
  const baseInterval = config.interval || 10;
  let delaySecs = baseInterval;

  if (config.jitter && baseInterval >= 30) {
    const jitter = Math.floor(Math.random() * 21) - 10;
    delaySecs = Math.max(15, baseInterval + jitter);
  }

  console.log(`[ZapDirect WhatsApp] Próximo envio para ${nextContact.salonName} em ${delaySecs} segundos.`);

  const targetTimestamp = Date.now() + (delaySecs * 1000);

  if (activeCountdownInterval) {
    clearInterval(activeCountdownInterval);
  }

  updateStatusBanner(`⏳ Anti-Ban: Próximo envio para <strong>${nextContact.ownerName || nextContact.salonName}</strong> em ${delaySecs}s...`);

  activeCountdownInterval = setInterval(() => {
    chrome.storage.local.get(["zapBatchStatus"], (st) => {
      const currentStatus = st.zapBatchStatus || "running";

      if (currentStatus === "paused") {
        updateStatusBanner(`⏸️ ZapDirect: Disparos em pausa. Clique em 'Continuar' no painel.`);
        return;
      }
      if (currentStatus === "stopped") {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
        isProcessingContact = false;
        updateStatusBanner(`⏹️ ZapDirect: Disparos interrompidos.`, true);
        return;
      }

      const remainingSecs = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
      updateStatusBanner(`⏳ Anti-Ban: Próximo envio para <strong>${nextContact.ownerName || nextContact.salonName}</strong> em ${remainingSecs}s...`);

      if (Date.now() >= targetTimestamp) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;

        updateStatusBanner(`🚀 Carregando conversa de <strong>${nextContact.ownerName || nextContact.salonName}</strong>...`);

        chrome.storage.local.set({ zapCurrentIndex: nextIndex }, () => {
          const nextUrl = `https://web.whatsapp.com/send?phone=${nextContact.cleanPhone}&text=${encodeURIComponent(nextContact.message)}&zap_batch=1`;
          console.log("[ZapDirect WhatsApp] Navegando aba para o próximo contato:", nextUrl);

          isProcessingContact = false;
          window.location.href = nextUrl;
        });
      }
    });
  }, 1000);
}

// Loop principal de verificação contínua
function mainLoop() {
  const isBatch = sessionStorage.getItem("is_zap_batch_runner") === "true" || window.location.search.includes("zap_batch=1");
  if (isBatch) {
    checkBatchQueue();
  } else {
    checkSingleUrlSend();
  }
}

// Inicia verificação contínua a cada 500ms
setInterval(mainLoop, 500);
