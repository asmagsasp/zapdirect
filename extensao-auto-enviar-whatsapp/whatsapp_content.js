/**
 * ZapDirect WhatsApp Automation Script v3.8
 * Suporta WhatsApp Web e WhatsApp Business Web
 * Disparo 100% automático em Lote (Planilha) e Individual (1 a 1)
 * Arquitetura resiliente com Persistência em Storage, Eleição de Aba Mestre e Anti-Travamento
 */

console.log("[ZapDirect WhatsApp v3.8] Script de automação ativo no WhatsApp Web.");

// Identificador único desta aba para eleição de Aba Mestre
const MY_TAB_ID = "zap_tab_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();

// Banner Flutuante de Status no WhatsApp Web
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

// Localizadores de Elementos do WhatsApp Web
function findSendButton() {
  const sendIcon = document.querySelector('span[data-icon="send"]') ||
                   document.querySelector('span[data-icon="wds-ic-send"]') ||
                   document.querySelector('span[data-icon="send-light"]') ||
                   document.querySelector('[data-testid="send"]') ||
                   document.querySelector('[data-icon="send"]');

  if (sendIcon) {
    const btn = sendIcon.closest("button") || sendIcon.closest('[role="button"]') || sendIcon;
    if (btn) return btn;
  }

  const ariaBtn = document.querySelector('button[aria-label="Enviar"]') ||
                  document.querySelector('button[aria-label="Send"]') ||
                  document.querySelector('[aria-label="Enviar"]') ||
                  document.querySelector('[aria-label="Send"]');
  if (ariaBtn) return ariaBtn;

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
  const dialogs = document.querySelectorAll('div[role="dialog"]');
  for (const modal of dialogs) {
    const text = (modal.innerText || "").toLowerCase();
    if (text.includes("inválid") || text.includes("invalid") || text.includes("não está no whatsapp") || text.includes("não foi possível") || text.includes("compartilhado através de url")) {
      const okBtn = modal.querySelector('button');
      if (okBtn) okBtn.click();
      return true;
    }
  }

  const bodyText = (document.body ? document.body.innerText : "") || "";
  if (bodyText.includes("número de telefone compartilhado por url é inválido") ||
      bodyText.includes("compartilhado através de url é inválido") ||
      bodyText.includes("não está no WhatsApp") ||
      bodyText.includes("Phone number shared via url is invalid")) {
    const allButtons = document.querySelectorAll('button');
    for (const b of allButtons) {
      const bText = (b.innerText || "").trim().toLowerCase();
      if (bText === "ok" || bText === "entendido" || bText === "fechar") {
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

  const sendBtn = findSendButton();
  if (sendBtn) {
    try {
      sendBtn.click();
      console.log("[ZapDirect WhatsApp] Botão de envio clicado com sucesso!");
      setTimeout(() => { isSendingAction = false; }, 2000);
      return true;
    } catch (e) {
      console.error("[ZapDirect] Erro no clique:", e);
    }
  }

  const inputEl = findChatInput();
  if (inputEl) {
    try {
      inputEl.focus();
      const eventParams = { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
      inputEl.dispatchEvent(new KeyboardEvent("keydown", eventParams));
      inputEl.dispatchEvent(new KeyboardEvent("keyup", eventParams));
      console.log("[ZapDirect WhatsApp] Enter disparado no campo de mensagem.");
      setTimeout(() => { isSendingAction = false; }, 2000);
      return true;
    } catch (e) {
      console.error("[ZapDirect] Erro no Enter:", e);
    }
  }

  isSendingAction = false;
  return false;
}

// ========================================================
// ELEIÇÃO DE ABA MESTRE (Previne conflitos entre múltiplas abas abertas)
// ========================================================
function isMasterTab(batchStatus) {
  if (batchStatus !== "running") return Promise.resolve(true);

  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(["zapMasterTabId", "zapMasterHeartbeat"], (data) => {
        const now = Date.now();
        const currentMaster = data.zapMasterTabId;
        const lastHeartbeat = data.zapMasterHeartbeat || 0;

        if (!currentMaster || currentMaster === MY_TAB_ID || (now - lastHeartbeat > 6000)) {
          chrome.storage.local.set({
            zapMasterTabId: MY_TAB_ID,
            zapMasterHeartbeat: now
          });
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (e) {
      resolve(true);
    }
  });
}

// Mantém heartbeat da aba se for o mestre
setInterval(() => {
  try {
    chrome.storage.local.get(["zapMasterTabId"], (data) => {
      if (data && data.zapMasterTabId === MY_TAB_ID) {
        chrome.storage.local.set({ zapMasterHeartbeat: Date.now() });
      }
    });
  } catch (e) {}
}, 2000);

// ========================================================
// MODO INDIVIDUAL (1 a 1 via formulário)
// ========================================================
let isSingleSent = false;

function checkSingleUrlSend() {
  if (isSingleSent) return;

  const url = window.location.href;
  if (!url.includes("phone=") && !url.includes("send?phone=")) return;

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
let isSendingCurrent = false;
let contactStartTime = 0;
let lastTrackedContactId = null;

function handleCountdownPhase(targetTimestamp, currentIndex, queue, config, forceNext) {
  const now = Date.now();
  const nextContact = queue[currentIndex];
  const remainingSecs = Math.max(0, Math.ceil((targetTimestamp - now) / 1000));

  if (nextContact) {
    updateStatusBanner(`⏳ Anti-Ban: Próximo envio para <strong>${nextContact.ownerName || nextContact.salonName}</strong> em ${remainingSecs}s...`);
  }

  if (now >= targetTimestamp || forceNext) {
    console.log("[ZapDirect WhatsApp] Anti-ban finalizado ou envio forçado. Abrindo próximo contato:", currentIndex);
    if (nextContact) {
      updateStatusBanner(`🚀 Carregando conversa de <strong>${nextContact.ownerName || nextContact.salonName}</strong>...`);
    }

    try {
      chrome.storage.local.set({
        zapWaitingNext: false,
        zapForceNext: false
      });
    } catch (e) {}

    if (!nextContact) return;

    const nextUrl = `https://web.whatsapp.com/send?phone=${nextContact.cleanPhone}&text=${encodeURIComponent(nextContact.message)}&zap_batch=1`;

    window.onbeforeunload = null;
    const input = findChatInput();
    if (input) {
      try { input.textContent = ""; } catch (e) {}
    }

    setTimeout(() => {
      window.location.href = nextUrl;
    }, 500);
  }
}

function handleSendingPhase(currentContact, currentIndex, queue, config) {
  if (isSendingCurrent) return;

  if (lastTrackedContactId !== currentContact.id) {
    lastTrackedContactId = currentContact.id;
    contactStartTime = Date.now();
  }

  // 1. Detecta modal de número inválido
  if (checkForInvalidNumberModal()) {
    isSendingCurrent = true;
    updateStatusBanner(`⚠️ O número ${currentContact.cleanPhone} não possui WhatsApp válido. Pulando...`);

    try {
      chrome.storage.local.set({
        zapContactSent: {
          id: currentContact.id,
          cleanPhone: currentContact.cleanPhone,
          status: "skipped_invalid",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      });
    } catch (e) {}

    setTimeout(() => {
      startAntiBanTransition(currentIndex, queue, config);
    }, 2000);
    return;
  }

  // 2. Watchdog Anti-Travamento (25 segundos)
  const elapsed = Date.now() - contactStartTime;
  if (elapsed > 25000) {
    isSendingCurrent = true;
    console.warn(`[ZapDirect] Watchdog: Contato ${currentContact.cleanPhone} não respondeu em 25s. Pulando...`);
    updateStatusBanner(`⚠️ Contato não respondeu a tempo. Pulando para o próximo...`);

    checkForInvalidNumberModal();

    try {
      chrome.storage.local.set({
        zapContactSent: {
          id: currentContact.id,
          cleanPhone: currentContact.cleanPhone,
          status: "skipped_timeout",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      });
    } catch (e) {}

    setTimeout(() => {
      startAntiBanTransition(currentIndex, queue, config);
    }, 2000);
    return;
  }

  // 3. Envio quando campo ou botão estiverem prontos
  const inputEl = findChatInput();
  const sendBtn = findSendButton();
  const hasText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;

  if (sendBtn || hasText) {
    isSendingCurrent = true;
    updateStatusBanner(`⚡ ZapDirect: [${currentIndex + 1}/${queue.length}] Enviando para <strong>${currentContact.ownerName || currentContact.salonName}</strong>...`);

    setTimeout(() => {
      triggerSendAction();
      console.log(`[ZapDirect WhatsApp] Mensagem enviada para: ${currentContact.cleanPhone}`);

      try {
        chrome.storage.local.set({
          zapContactSent: {
            id: currentContact.id,
            cleanPhone: currentContact.cleanPhone,
            status: "sent",
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          }
        });
      } catch (e) {}

      setTimeout(() => {
        startAntiBanTransition(currentIndex, queue, config);
      }, 1500);
    }, 1000);
  } else {
    const remainingWait = Math.max(1, Math.ceil((25000 - elapsed) / 1000));
    updateStatusBanner(`⏳ ZapDirect: Carregando conversa (${remainingWait}s)...`);
  }
}

function startAntiBanTransition(currentIndex, queue, config) {
  const nextIndex = currentIndex + 1;

  if (nextIndex >= queue.length) {
    updateStatusBanner("🎉 ZapDirect: Todos os contatos da planilha foram enviados com sucesso!", true);
    try {
      chrome.storage.local.set({
        zapBatchStatus: "finished",
        zapWaitingNext: false,
        zapCurrentIndex: nextIndex
      });
    } catch (e) {}
    isSendingCurrent = false;
    return;
  }

  const baseInterval = config.interval || 10;
  let delaySecs = baseInterval;

  if (config.jitter && baseInterval >= 30) {
    const jitter = Math.floor(Math.random() * 21) - 10;
    delaySecs = Math.max(15, baseInterval + jitter);
  }

  const targetTimestamp = Date.now() + (delaySecs * 1000);
  const nextContact = queue[nextIndex];

  console.log(`[ZapDirect WhatsApp] Anti-ban: Próximo envio para ${nextContact.salonName} em ${delaySecs}s.`);

  try {
    chrome.storage.local.set({
      zapCurrentIndex: nextIndex,
      zapNextDispatchTime: targetTimestamp,
      zapWaitingNext: true,
      zapForceNext: false
    }, () => {
      isSendingCurrent = false;
    });
  } catch (e) {
    isSendingCurrent = false;
  }
}

// Loop Principal de Verificação
function checkQueueState() {
  try {
    chrome.storage.local.get([
      "zapBatchStatus",
      "zapBatchQueue",
      "zapBatchConfig",
      "zapCurrentIndex",
      "zapNextDispatchTime",
      "zapWaitingNext",
      "zapForceNext"
    ], async (data) => {
      const status = data.zapBatchStatus || "idle";
      const queue = data.zapBatchQueue || [];
      const config = data.zapBatchConfig || {};
      const currentIndex = typeof data.zapCurrentIndex === "number" ? data.zapCurrentIndex : 0;

      // Se a fila em lote não estiver rodando, executa modo individual (1 a 1 via URL)
      if (status !== "running" || queue.length === 0) {
        checkSingleUrlSend();
        return;
      }

      // Garante que apenas uma aba mestre do WhatsApp processe
      const isMaster = await isMasterTab(status);
      if (!isMaster) return;

      // Fila concluída
      if (currentIndex >= queue.length) {
        updateStatusBanner("🎉 ZapDirect: Todos os contatos da planilha foram enviados!", true);
        chrome.storage.local.set({ zapBatchStatus: "finished", zapWaitingNext: false });
        return;
      }

      const currentContact = queue[currentIndex];
      if (!currentContact) return;

      // Fase de Contagem Regressiva Anti-Ban
      if (data.zapWaitingNext && data.zapNextDispatchTime) {
        handleCountdownPhase(data.zapNextDispatchTime, currentIndex, queue, config, data.zapForceNext);
        return;
      }

      // Fase de Envio do Contato Atual
      handleSendingPhase(currentContact, currentIndex, queue, config);
    });
  } catch (e) {
    // Contexto da extensão invalidado durante recarregamento
  }
}

// Inicia verificação contínua a cada 500ms
setInterval(checkQueueState, 500);
