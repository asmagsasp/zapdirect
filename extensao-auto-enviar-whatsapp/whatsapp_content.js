/**
 * ZapDirect WhatsApp Automation Script v3.6
 * Suporta WhatsApp Web e WhatsApp Business Web
 * Disparo 100% automático em Lote (Planilha) e Individual (1 a 1)
 * Correção definitiva de travamentos: sem colisões de navegação, watchdog seguro e clique limpo.
 */

console.log("[ZapDirect WhatsApp v3.6] Script de automação ativo no WhatsApp Web.");

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
  // 1. data-icon send oficial
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
                  document.querySelector('[aria-label="Send"]');
  if (ariaBtn) return ariaBtn;

  // 3. Botão no footer com svg que não seja microfone
  const footerBtns = document.querySelectorAll('footer button');
  for (const b of footerBtns) {
    const hasSvg = b.querySelector('svg');
    const isMic = b.querySelector('[data-icon="ptt"]') || b.querySelector('[data-icon="microphone"]');
    if (hasSvg && !isMic) {
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
  // 1. Procura em modais de erro
  const modal = document.querySelector('div[role="dialog"]');
  if (modal) {
    const text = (modal.innerText || "").toLowerCase();
    if (text.includes("inválid") || text.includes("invalid") || text.includes("não está no whatsapp") || text.includes("não foi possível")) {
      const okBtn = modal.querySelector('button');
      if (okBtn) okBtn.click();
      return true;
    }
  }

  // 2. Alertas no texto da página
  const bodyText = (document.body ? document.body.innerText : "") || "";
  if (bodyText.includes("número de telefone compartilhado por url é inválido") ||
      bodyText.includes("compartilhado através de url é inválido") ||
      bodyText.includes("não está no WhatsApp") ||
      bodyText.includes("Phone number shared via url is invalid")) {
    const allButtons = document.querySelectorAll('button');
    for (const b of allButtons) {
      const bText = (b.innerText || "").trim().toLowerCase();
      if (bText === "ok" || bText === "entendido") {
        b.click();
        break;
      }
    }
    return true;
  }

  return false;
}

let isSendingAction = false;

function triggerSendAction() {
  if (isSendingAction) return false;
  isSendingAction = true;

  // 1. Tenta clique no botão oficial de enviar
  const sendBtn = findSendButton();
  if (sendBtn) {
    try {
      sendBtn.click();
      console.log("[ZapDirect WhatsApp] Botão de envio clicado com sucesso!");
      setTimeout(() => { isSendingAction = false; }, 2500);
      return true;
    } catch (e) {
      console.error("[ZapDirect] Erro no clique:", e);
    }
  }

  // 2. Se o botão não foi encontrado, tenta Enter no campo de texto
  const inputEl = findChatInput();
  if (inputEl) {
    try {
      inputEl.focus();
      const eventParams = { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
      inputEl.dispatchEvent(new KeyboardEvent("keydown", eventParams));
      inputEl.dispatchEvent(new KeyboardEvent("keyup", eventParams));
      console.log("[ZapDirect WhatsApp] Enter disparado no campo de mensagem.");
      setTimeout(() => { isSendingAction = false; }, 2500);
      return true;
    } catch (e) {
      console.error("[ZapDirect] Erro no Enter:", e);
    }
  }

  isSendingAction = false;
  return false;
}

// ========================================================
// MODO INDIVIDUAL (1 a 1)
// ========================================================
let isSingleSent = false;

function checkSingleUrlSend() {
  if (isSingleSent) return;

  const url = window.location.href;
  // Só atua se a URL for de envio com telefone
  if (!url.includes("phone=") && !url.includes("send?phone=")) return;

  // Se o WhatsApp exibiu modal de número inválido
  if (checkForInvalidNumberModal()) {
    isSingleSent = true;
    updateStatusBanner("⚠️ ZapDirect: O número informado não possui WhatsApp.", true);
    return;
  }

  const sendBtn = findSendButton();
  const inputEl = findChatInput();
  const hasText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;

  if (sendBtn || hasText) {
    isSingleSent = true;
    updateStatusBanner("⚡ ZapDirect: Enviando mensagem automaticamente...");

    setTimeout(() => {
      triggerSendAction();
      updateStatusBanner("✅ ZapDirect: Mensagem enviada com sucesso!", true);
    }, 1200);
  } else {
    if (url.includes("zap_auto=1") && !currentBanner) {
      updateStatusBanner("⏳ ZapDirect: Carregando conversa no WhatsApp...");
    }
  }
}

// ========================================================
// MODO EM LOTE (DISPARO POR PLANILHA)
// ========================================================
let isProcessingContact = false;
let activeCountdownInterval = null;
let currentContactStartTime = 0;
let lastContactIndex = -1;

function checkBatchQueue() {
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

    // Rastreia início do contato para o Watchdog
    if (currentIndex !== lastContactIndex) {
      lastContactIndex = currentIndex;
      currentContactStartTime = Date.now();
    }

    if (hasAlreadySentContact(currentContact.id)) return;

    // 1. Detecta modal de número inválido
    if (checkForInvalidNumberModal()) {
      isProcessingContact = true;
      markContactAsSent(currentContact.id);
      updateStatusBanner(`⚠️ O número ${currentContact.cleanPhone} não possui WhatsApp válido. Pulando...`);

      chrome.storage.local.set({
        zapContactSent: {
          id: currentContact.id,
          cleanPhone: currentContact.cleanPhone,
          status: "skipped_invalid",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      });

      setTimeout(() => {
        advanceQueueToNext(currentIndex, queue, config);
      }, 2500);
      return;
    }

    // 2. WATCHDOG ANTI-TRAVAMENTO (25 segundos)
    // Se o contato ficar mais de 25s sem conseguir enviar (número inexistente, conversa travada):
    const elapsed = Date.now() - currentContactStartTime;
    if (elapsed > 25000) {
      isProcessingContact = true;
      markContactAsSent(currentContact.id);
      console.warn(`[ZapDirect] Watchdog: Contato ${currentContact.cleanPhone} não respondeu em 25s. Pulando...`);
      updateStatusBanner(`⚠️ Contato não respondeu a tempo. Pulando para o próximo...`);

      checkForInvalidNumberModal();

      chrome.storage.local.set({
        zapContactSent: {
          id: currentContact.id,
          cleanPhone: currentContact.cleanPhone,
          status: "skipped_timeout",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      });

      setTimeout(() => {
        advanceQueueToNext(currentIndex, queue, config);
      }, 2000);
      return;
    }

    // 3. Envio normal do contato
    const inputEl = findChatInput();
    const sendBtn = findSendButton();
    const hasText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;

    if (sendBtn || hasText) {
      isProcessingContact = true;
      markContactAsSent(currentContact.id);

      updateStatusBanner(`⚡ ZapDirect: [${currentIndex + 1}/${queue.length}] Enviando para <strong>${currentContact.ownerName || currentContact.salonName}</strong>...`);

      setTimeout(() => {
        triggerSendAction();
        console.log(`[ZapDirect WhatsApp] Mensagem enviada para: ${currentContact.cleanPhone}`);

        chrome.storage.local.set({
          zapContactSent: {
            id: currentContact.id,
            cleanPhone: currentContact.cleanPhone,
            status: "sent",
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          }
        });

        setTimeout(() => {
          advanceQueueToNext(currentIndex, queue, config);
        }, 1800);
      }, 1200);
    } else {
      const remainingSecs = Math.max(1, Math.ceil((25000 - elapsed) / 1000));
      updateStatusBanner(`⏳ ZapDirect: Carregando contato (${remainingSecs}s)...`);
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
  const isBatch = window.location.search.includes("zap_batch=1");
  if (isBatch) {
    checkBatchQueue();
  } else {
    checkSingleUrlSend();
  }
}

// Inicia verificação contínua a cada 600ms
setInterval(mainLoop, 600);
