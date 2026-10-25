/**
 * ZapDirect WhatsApp Content Script v3.2
 * Roda dentro de https://web.whatsapp.com/*
 * Gerencia envio automático, proteção anti-ban e navegação contínua na fila de contatos.
 * v3.2: Correção de duplo disparo (anti-duplicação por ID e exclusividade de clique).
 */

console.log("[ZapDirect WhatsApp v3.2] Script de automação carregado.");

// Identifica se esta aba foi especificamente aberta pelo disparador em lote do ZapDirect
if (window.location.search.includes("zap_batch=1")) {
  try {
    sessionStorage.setItem("is_zap_runner", "true");
  } catch (e) {}
}

function isCurrentTabRunner() {
  try {
    return window.location.search.includes("zap_batch=1") || sessionStorage.getItem("is_zap_runner") === "true";
  } catch (e) {
    return false;
  }
}

// Previne duplo envio do mesmo contato na mesma sessão
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
      z-index: 999999;
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
    }, 6000);
  }
}

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
                  document.querySelector('button[aria-label="Send"]');
  if (ariaBtn) return ariaBtn;

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

function triggerSendAction() {
  if (isSendingAction) {
    console.log("[ZapDirect WhatsApp] Disparo bloqueado: ação já em andamento.");
    return false;
  }
  isSendingAction = true;

  // 1. Tenta clicar exclusivamente no botão de enviar oficial
  const sendBtn = findSendButton();
  if (sendBtn) {
    sendBtn.click();
    console.log("[ZapDirect WhatsApp] Botão de envio clicado com sucesso via click().");
    setTimeout(() => { isSendingAction = false; }, 3000);
    return true; // Retorna imediatamente! NUNCA dispara Enter se o botão de envio já foi clicado.
  }

  // 2. Se e somente se o botão não for encontrado, tenta enviar pressionando Enter no campo de texto
  const inputEl = findChatInput();
  if (inputEl) {
    inputEl.focus();
    const eventParams = { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
    inputEl.dispatchEvent(new KeyboardEvent("keydown", eventParams));
    inputEl.dispatchEvent(new KeyboardEvent("keyup", eventParams));
    console.log("[ZapDirect WhatsApp] Enter disparado no campo de texto.");
    setTimeout(() => { isSendingAction = false; }, 3000);
    return true;
  }

  isSendingAction = false;
  return false;
}

let isProcessingContact = false;
let activeCountdownInterval = null;

function checkAndProcessQueue() {
  // Se esta aba não é a aba oficial de disparo do ZapDirect, ignora a fila em lote
  if (!isCurrentTabRunner()) {
    return;
  }

  if (isProcessingContact) return;

  chrome.storage.local.get(["zapBatchQueue", "zapBatchConfig", "zapBatchStatus", "zapCurrentIndex"], (data) => {
    const queue = data.zapBatchQueue || [];
    const config = data.zapBatchConfig || {};
    const status = data.zapBatchStatus || "idle";
    const currentIndex = (typeof data.zapCurrentIndex === "number") ? data.zapCurrentIndex : 0;

    // Se a fila não está rodando, verifica se é um envio avulso direto
    if (status !== "running") {
      checkSingleUrlSend();
      return;
    }

    // Se já finalizou todos os contatos
    if (currentIndex >= queue.length) {
      updateStatusBanner("🎉 ZapDirect: Todos os contatos da planilha foram enviados!", true);
      chrome.storage.local.set({ zapBatchStatus: "finished" });
      return;
    }

    const currentContact = queue[currentIndex];
    if (!currentContact) return;

    // Se este contato já foi enviado nesta aba, não envia de novo
    if (hasAlreadySentContact(currentContact.id)) {
      return;
    }

    // Detecta se o WhatsApp informou que o número é inválido
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

    // Quando o texto estiver preenchido no chat ou o botão de enviar aparecer
    if (sendBtn || hasText) {
      isProcessingContact = true;
      // Trava IMEDIATAMENTE para que nenhum timer subsequente dispare novamente
      markContactAsSent(currentContact.id);

      updateStatusBanner(`⚡ ZapDirect: [${currentIndex + 1}/${queue.length}] Enviando para <strong>${currentContact.ownerName || currentContact.salonName}</strong>...`);

      setTimeout(() => {
        // Executa o disparo uma única vez
        triggerSendAction();
        console.log(`[ZapDirect WhatsApp] Mensagem enviada para: ${currentContact.cleanPhone} (${currentContact.salonName})`);

        // Notifica o armazenamento local para atualizar o painel do sistema
        chrome.storage.local.set({
          zapContactSent: {
            id: currentContact.id,
            cleanPhone: currentContact.cleanPhone,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          }
        });

        // Aguarda confirmação do WhatsApp antes de iniciar a contagem regressiva anti-ban
        setTimeout(() => {
          advanceQueueToNext(currentIndex, queue, config);
        }, 1800);

      }, 1200);
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

        // Atualiza o índice do contato atual no storage
        chrome.storage.local.set({ zapCurrentIndex: nextIndex }, () => {
          const nextUrl = `https://web.whatsapp.com/send?phone=${nextContact.cleanPhone}&text=${encodeURIComponent(nextContact.message)}&zap_batch=1`;
          console.log("[ZapDirect WhatsApp] Navegando aba para o próximo contato:", nextUrl);

          isProcessingContact = false;

          // Navega a própria aba para a próxima conversa sem bloqueios de pop-up
          window.location.href = nextUrl;
        });
      }
    });
  }, 1000);
}

// Suporte para envio avulso via link direto (Modo Individual)
function checkSingleUrlSend() {
  const url = window.location.href;
  if (!url.includes("text=") && !url.includes("send?phone=")) return;

  const inputEl = findChatInput();
  const sendBtn = findSendButton();
  const hasText = inputEl && (inputEl.innerText || inputEl.textContent || "").trim().length > 0;

  if (hasText || sendBtn) {
    if (sessionStorage.getItem("zap_single_sent") !== url) {
      sessionStorage.setItem("zap_single_sent", url);
      updateStatusBanner("⚡ ZapDirect: Enviando mensagem automaticamente...");
      setTimeout(() => {
        triggerSendAction();
        updateStatusBanner("✅ Mensagem enviada com sucesso!", true);
      }, 1500);
    }
  }
}

// Inicia verificação contínua
setInterval(checkAndProcessQueue, 1000);
