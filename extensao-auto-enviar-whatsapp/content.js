/**
 * ZapDirect Auto-Send v2.0 - WhatsApp Web
 * Clica automaticamente no botão Enviar e despacha a mensagem.
 */

console.log("[ZapDirect Auto-Send] Extensão iniciada no WhatsApp Web.");

// 1. Captura se a URL atual contém dados de envio pré-carregados
function checkInitialUrl() {
  const url = window.location.href;
  if (url.includes("text=") || url.includes("phone=") || url.includes("send?")) {
    sessionStorage.setItem("zap_auto_send_pending", "true");
    sessionStorage.setItem("zap_target_url", url);
    console.log("[ZapDirect] Envio detectado na URL! Flag ativada.");
  }
}

checkInitialUrl();

let isSending = false;
let notificationShown = false;

function showSuccessBanner() {
  if (notificationShown) return;
  notificationShown = true;

  const banner = document.createElement("div");
  banner.id = "zap-auto-banner";
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      background: #00a884;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 30px;
      font-family: sans-serif;
      font-size: 14px;
      font-weight: 700;
      z-index: 999999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <span>⚡ ZapDirect: Mensagem enviada automaticamente!</span>
    </div>
  `;
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.remove();
    notificationShown = false;
  }, 4000);
}

function findSendButton() {
  // Procura por ícones de envio do WhatsApp Web e WhatsApp Business Web
  const sendIcon = document.querySelector('span[data-icon="send"]') ||
                   document.querySelector('span[data-icon="wds-ic-send"]') ||
                   document.querySelector('span[data-icon="send-light"]');

  if (sendIcon) {
    const btn = sendIcon.closest("button");
    if (btn) return btn;
  }

  // Procura por aria-label em português e inglês
  const ariaBtn = document.querySelector('button[aria-label="Enviar"]') ||
                  document.querySelector('button[aria-label="Send"]') ||
                  document.querySelector('button[data-tab="11"]');
  if (ariaBtn) return ariaBtn;

  // Procura no footer
  const footerButtons = document.querySelectorAll('footer button');
  for (let b of footerButtons) {
    if (b.querySelector('svg') && !b.querySelector('span[data-icon="ptt"]') && !b.querySelector('span[data-icon="microphone"]')) {
      return b;
    }
  }

  return null;
}

function findChatInput() {
  return document.querySelector('footer div[contenteditable="true"]') ||
         document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
         document.querySelector('div[contenteditable="true"]');
}

function attemptSend() {
  if (isSending) return;

  const isPending = sessionStorage.getItem("zap_auto_send_pending") === "true";
  const inputEl = findChatInput();
  const sendBtn = findSendButton();

  // Verifica se o campo de texto tem conteúdo ou se o botão de envio está pronto
  const hasText = inputEl && inputEl.innerText && inputEl.innerText.trim().length > 0;

  if (isPending && (hasText || sendBtn)) {
    isSending = true;
    console.log("[ZapDirect] Mensagem pronta para disparo! Aguardando 1.2s para validação...");

    setTimeout(() => {
      // 1. Tenta clicar no botão de enviar
      const btn = findSendButton();
      if (btn) {
        btn.click();
        console.log("[ZapDirect] Botão de envio clicado!");
      }

      // 2. Dispara tecla Enter no campo de texto para garantia
      const currentInput = findChatInput();
      if (currentInput) {
        currentInput.focus();
        const enterDown = new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13
        });
        currentInput.dispatchEvent(enterDown);

        const enterUp = new KeyboardEvent("keyup", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13
        });
        currentInput.dispatchEvent(enterUp);
      }

      // Limpa a flag para não reenviar na mesma conversa
      sessionStorage.removeItem("zap_auto_send_pending");
      showSuccessBanner();

      setTimeout(() => {
        isSending = false;
      }, 2000);
    }, 1200);
  }
}

// Monitora mutações no DOM do WhatsApp Web
const observer = new MutationObserver(() => {
  attemptSend();
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

// Checagem em intervalos curtos
setInterval(attemptSend, 800);
