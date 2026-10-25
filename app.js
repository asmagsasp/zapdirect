/**
 * ZapDirect Salões - Sistema de Envio Rápido no WhatsApp Web
 * Sem necessidade de cadastro de contatos na agenda.
 */

// Modelos Iniciais Padrão para Salões de Beleza
const DEFAULT_TEMPLATES = [
  {
    id: "template-dor-agendamento",
    name: "🎯 Foco na Dor: Perda de Tempo & Desmarcações (Recomendado)",
    text: "Oi, {destinatario}! Encontrei o *{nome_salao}* no Google e fiquei impressionado com a qualidade do serviço.\n\nUma dúvida rápida: você perde muito tempo do seu dia respondendo mensagens de agendamento e lidando com clientes que desmarcam em cima da hora?\n\nPergunto porque criei uma plataforma simples que automatiza tudo isso para as clientes agendarem sozinhas. Se fizer sentido, te mando um demonstrativo sem compromisso."
  },
  {
    id: "template-google-destaque",
    name: "⭐ Parceria & Destaque Google Recomendado (Gestão & Agenda)",
    text: "Oi, {destinatario}, como vai? Estava buscando por estabelecimentos e esmalterias de destaque na região pelo Google, encontrei o perfil do *{nome_salao}*\n\ne tomei a liberdade de te chamar. Vi que vocês têm uma excelente avaliação de *{nota_salao} estrelas* com *{qtd_comentarios} comentários*, o que mostra o quanto as clientes amam o serviço de vocês!\n\nImagino que manter esse padrão e ainda administrar a equipe e os horários exija bastante energia sua todos os dias. Conversando com outras profissionais da área, notei que o controle de agendamentos e o tempo gasto respondendo mensagens são os maiores gargalos para quem quer continuar crescendo.\n\nEu trabalho com tecnologia e construo plataformas exclusivas para gestão de beleza. Desenvolvi um sistema bem simples que organiza a sua agenda de forma automática e dá uma cara super profissional (à altura das suas avaliações) para o seu negócio na internet. Você estaria aberta a receber um link de demonstração para ver se faria sentido para o seu espaço hoje?"
  },
  {
    id: "template-agenda-direta",
    name: "⚡ Demonstração Rápida de Agendamento Automático (Direto)",
    text: "Olá, {destinatario}! {saudacao}!\n\nEstava analisando os espaços de beleza de destaque no Google da nossa região e encontrei o perfil do *{nome_salao}*.\n\nParabéns pela excelente avaliação de *{nota_salao} estrelas* e os *{qtd_comentarios} comentários positivos*! Isso reflete a qualidade incrível do trabalho de vocês.\n\nSei que cuidar dos atendimentos e ao mesmo tempo administrar agendamentos no WhatsApp toma muito tempo do dia. Criei uma plataforma prática que automatiza a agenda das suas clientes 24h por dia e envia lembretes automáticos para evitar faltas.\n\nVocê teria 1 minutinho para eu te enviar um link de demonstração para ver como ficaria personalizado com o nome do *{nome_salao}*?"
  },
  {
    id: "template-padrao-1",
    name: "Parceria & Destaque Google (Curto)",
    text: "{saudacao}, {destinatario}! Tudo bem?\n\nEstava pesquisando salões de destaque na nossa região e encontrei o *{nome_salao}*. Fiquei muito impressionado com o trabalho de vocês e a ótima reputação com nota *{nota_salao}* e mais de *{qtd_comentarios} avaliações* no Google!\n\nParabéns pelo excelente atendimento que vocês oferecem. Gostaria de te fazer uma pergunta rápida sobre como vocês estão organizando a captação de novas clientes este mês. Podemos bater um papo rápido por aqui?"
  },
  {
    id: "template-padrao-2",
    name: "Elogio Simples & Abordagem Rápida",
    text: "Olá {destinatario}, {saudacao}!\n\nVi as avaliações do *{nome_salao}* e achei sensacional a nota de vocês (*{nota_salao}* estrelas com *{qtd_comentarios} clientes comentando*).\n\nVocê é a responsável pelo salão no momento? Tenho uma proposta bem legal voltada para o seu perfil de atendimento."
  },
  {
    id: "template-padrao-3",
    name: "Primeiro Toque (Super Rápido)",
    text: "{saudacao}! É a responsável do *{nome_salao}*?\n\nVi que vocês são muito bem avaliados no Google (nota *{nota_salao}* com *{qtd_comentarios} avaliações*) e gostaria de trocar uma ideia rápida com você quando tiver um tempinho!"
  }
];

class ZapSalonsApp {
  constructor() {
    this.templates = [];
    this.activeTemplateId = null;
    this.history = [];
    this.theme = "dark";

    // Batch Mode State
    this.currentMode = "single"; // "single" | "batch"
    this.batchContacts = [];
    this.batchStatus = "idle"; // "idle" | "running" | "paused"
    this.currentBatchIndex = 0;
    this.batchTimer = null;
    this.batchCountdown = 0;
    this.batchBaseInterval = 120;
    this.activeFilter = "all";
    this.audioCtx = null;

    this.initElements();
    this.loadState();
    this.bindEvents();
    this.initBatchEvents();
    this.renderActiveTemplateOptions();
    this.updatePreview();
    this.renderHistory();
  }

  initElements() {
    // Mode Switchers & Views
    this.btnModeSingle = document.getElementById("btnModeSingle");
    this.btnModeBatch = document.getElementById("btnModeBatch");
    this.viewSingleMode = document.getElementById("viewSingleMode");
    this.viewBatchMode = document.getElementById("viewBatchMode");

    // Single Mode Inputs
    this.phoneInput = document.getElementById("phoneNumber");
    this.phoneCleanPreview = document.getElementById("phoneCleanPreview");
    this.ownerNameInput = document.getElementById("ownerName");
    this.salonNameInput = document.getElementById("salonName");
    this.salonRatingInput = document.getElementById("salonRating");
    this.reviewCountInput = document.getElementById("reviewCount");
    this.autoGreetingCheck = document.getElementById("autoGreetingCheck");
    this.currentGreetingPreview = document.getElementById("currentGreetingPreview");
    this.activeTemplateSelect = document.getElementById("activeTemplateSelect");

    // Preview
    this.liveMessagePreview = document.getElementById("liveMessagePreview");
    this.previewContactName = document.getElementById("previewContactName");
    this.previewContactPhone = document.getElementById("previewContactPhone");
    this.previewTimestamp = document.getElementById("previewTimestamp");
    this.charCounter = document.getElementById("charCounter");

    // Action Buttons
    this.btnSendWhatsAppWeb = document.getElementById("btnSendWhatsAppWeb");
    this.btnSendWhatsAppApi = document.getElementById("btnSendWhatsAppApi");
    this.btnCopyMessage = document.getElementById("btnCopyMessage");
    this.copyBtnText = document.getElementById("copyBtnText");
    this.btnClearForm = document.getElementById("btnClearForm");
    this.pastePhoneBtn = document.getElementById("pastePhoneBtn");

    // Theme & Navigation
    this.themeToggleBtn = document.getElementById("themeToggleBtn");
    this.btnOpenTemplates = document.getElementById("btnOpenTemplates");
    this.btnHistoryToggle = document.getElementById("btnHistoryToggle");
    this.historyCountBadge = document.getElementById("historyCountBadge");

    // Modal
    this.templateModal = document.getElementById("templateModal");
    this.btnCloseModal = document.getElementById("btnCloseModal");
    this.templateListSelect = document.getElementById("templateListSelect");
    this.btnNewTemplate = document.getElementById("btnNewTemplate");
    this.modalTemplateName = document.getElementById("modalTemplateName");
    this.modalTemplateText = document.getElementById("modalTemplateText");
    this.btnSaveTemplate = document.getElementById("btnSaveTemplate");
    this.btnDeleteTemplate = document.getElementById("btnDeleteTemplate");
    this.btnResetDefaultTemplates = document.getElementById("btnResetDefaultTemplates");

    // Drawer History
    this.historyDrawer = document.getElementById("historyDrawer");
    this.btnCloseHistory = document.getElementById("btnCloseHistory");
    this.historyListContainer = document.getElementById("historyListContainer");
    this.historyTotalLabel = document.getElementById("historyTotalLabel");
    this.btnClearHistory = document.getElementById("btnClearHistory");

    // Toast Container
    this.toastContainer = document.getElementById("toastContainer");

    // Batch Mode Elements
    this.fileDropzone = document.getElementById("fileDropzone");
    this.batchFileInput = document.getElementById("batchFileInput");
    this.btnBrowseFile = document.getElementById("btnBrowseFile");
    this.btnDownloadSample = document.getElementById("btnDownloadSample");
    this.btnLoadTestData = document.getElementById("btnLoadTestData");
    this.dropzoneFileInfo = document.getElementById("dropzoneFileInfo");
    this.loadedFileName = document.getElementById("loadedFileName");
    this.loadedRowsCount = document.getElementById("loadedRowsCount");
    this.btnRemoveFile = document.getElementById("btnRemoveFile");

    this.batchIntervalSelect = document.getElementById("batchIntervalSelect");
    this.randomJitterCheck = document.getElementById("randomJitterCheck");
    this.batchTemplateSelect = document.getElementById("batchTemplateSelect");

    this.timerPulseIcon = document.getElementById("timerPulseIcon");
    this.timerStatusLabel = document.getElementById("timerStatusLabel");
    this.timerClockDisplay = document.getElementById("timerClockDisplay");

    this.statSentCount = document.getElementById("statSentCount");
    this.statRemainingCount = document.getElementById("statRemainingCount");
    this.statTotalCount = document.getElementById("statTotalCount");

    this.btnStartBatch = document.getElementById("btnStartBatch");
    this.btnPauseBatch = document.getElementById("btnPauseBatch");
    this.btnSendNextNow = document.getElementById("btnSendNextNow");
    this.btnSkipCurrent = document.getElementById("btnSkipCurrent");
    this.btnStopBatch = document.getElementById("btnStopBatch");
    this.btnExportBatchCsv = document.getElementById("btnExportBatchCsv");

    this.batchProgressBar = document.getElementById("batchProgressBar");
    this.batchProgressPercent = document.getElementById("batchProgressPercent");
    this.currentProcessingSalon = document.getElementById("currentProcessingSalon");

    this.mappingCard = document.getElementById("mappingCard");
    this.mapPhoneSelect = document.getElementById("mapPhoneSelect");
    this.mapOwnerSelect = document.getElementById("mapOwnerSelect");
    this.mapSalonSelect = document.getElementById("mapSalonSelect");
    this.mapRatingSelect = document.getElementById("mapRatingSelect");
    this.mapReviewsSelect = document.getElementById("mapReviewsSelect");
    this.mapSentSelect = document.getElementById("mapSentSelect");

    this.batchTable = document.getElementById("batchTable");
    this.batchTableBody = document.getElementById("batchTableBody");
    this.tableRowsTotal = document.getElementById("tableRowsTotal");
  }

  loadState() {
    // Templates
    const storedTemplates = localStorage.getItem("zapsalons_templates");
    if (storedTemplates) {
      try {
        this.templates = JSON.parse(storedTemplates);
        // Adiciona modelos padrão novos caso não existam no localStorage atual
        DEFAULT_TEMPLATES.forEach(defT => {
          if (!this.templates.some(t => t.id === defT.id)) {
            this.templates.unshift(defT);
          }
        });
      } catch (e) {
        this.templates = [...DEFAULT_TEMPLATES];
      }
    } else {
      this.templates = [...DEFAULT_TEMPLATES];
    }
    this.saveTemplates();

    const storedActiveTemplate = localStorage.getItem("zapsalons_active_template");
    if (storedActiveTemplate && this.templates.some(t => t.id === storedActiveTemplate)) {
      this.activeTemplateId = storedActiveTemplate;
    } else {
      this.activeTemplateId = this.templates[0].id;
    }

    // History
    const storedHistory = localStorage.getItem("zapsalons_history");
    if (storedHistory) {
      try {
        this.history = JSON.parse(storedHistory);
      } catch (e) {
        this.history = [];
      }
    }

    // Theme
    const storedTheme = localStorage.getItem("zapsalons_theme") || "dark";
    this.setTheme(storedTheme);

    // Initial time and greeting
    this.updateGreetingText();
  }

  saveTemplates() {
    localStorage.setItem("zapsalons_templates", JSON.stringify(this.templates));
  }

  saveHistory() {
    localStorage.setItem("zapsalons_history", JSON.stringify(this.history));
    this.renderHistory();
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem("zapsalons_theme", theme);
    if (theme === "light") {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      this.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.body.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
      this.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  }

  toggleTheme() {
    this.setTheme(this.theme === "dark" ? "light" : "dark");
  }

  bindEvents() {
    // Theme toggle
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

    // Live inputs update preview
    const inputs = [
      this.phoneInput,
      this.ownerNameInput,
      this.salonNameInput,
      this.salonRatingInput,
      this.reviewCountInput,
      this.autoGreetingCheck
    ];
    inputs.forEach(input => {
      input.addEventListener("input", () => this.updatePreview());
      input.addEventListener("change", () => this.updatePreview());
    });

    // Rating pills
    document.querySelectorAll(".btn-pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        const val = e.currentTarget.getAttribute("data-val");
        this.salonRatingInput.value = val;
        document.querySelectorAll(".btn-pill").forEach(p => p.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.updatePreview();
      });
    });

    // Formatting Phone Input while typing
    this.phoneInput.addEventListener("input", (e) => {
      this.formatPhoneInputDisplay(e.target);
      this.updatePreview();
    });

    // Paste Phone button
    this.pastePhoneBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.phoneInput.value = text;
          this.formatPhoneInputDisplay(this.phoneInput);
          this.updatePreview();
          this.showToast("Número colado da área de transferência!", "success");
        }
      } catch (err) {
        this.showToast("Permissão negada para acessar área de transferência", "error");
      }
    });

    // Quick tag chips in preview
    document.querySelectorAll(".tag-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        const tag = e.currentTarget.getAttribute("data-tag");
        navigator.clipboard.writeText(tag);
        this.showToast(`Tag ${tag} copiada! Cole no seu modelo.`, "info");
      });
    });

    // Active Template dropdown change
    this.activeTemplateSelect.addEventListener("change", (e) => {
      this.activeTemplateId = e.target.value;
      localStorage.setItem("zapsalons_active_template", this.activeTemplateId);
      this.updatePreview();
    });

    // Send actions
    this.btnSendWhatsAppWeb.addEventListener("click", () => this.handleSendWhatsApp("web"));
    this.btnSendWhatsAppApi.addEventListener("click", () => this.handleSendWhatsApp("api"));
    this.btnCopyMessage.addEventListener("click", () => this.handleCopyMessage());
    this.btnClearForm.addEventListener("click", () => this.handleClearForm());

    // Keyboard shortcut (Ctrl + Enter)
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.handleSendWhatsApp("web");
      }
    });

    // Template Modal events
    this.btnOpenTemplates.addEventListener("click", () => this.openTemplateModal());
    this.btnCloseModal.addEventListener("click", () => this.closeTemplateModal());
    this.templateModal.addEventListener("click", (e) => {
      if (e.target === this.templateModal) this.closeTemplateModal();
    });

    this.templateListSelect.addEventListener("change", (e) => this.loadTemplateIntoModal(e.target.value));
    this.btnNewTemplate.addEventListener("click", () => this.handleNewTemplate());
    this.btnSaveTemplate.addEventListener("click", () => this.handleSaveModalTemplate());
    this.btnDeleteTemplate.addEventListener("click", () => this.handleDeleteModalTemplate());
    this.btnResetDefaultTemplates.addEventListener("click", () => this.handleResetDefaultTemplates());

    // Insert tag buttons inside modal
    document.querySelectorAll(".insert-tag-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tag = e.currentTarget.getAttribute("data-insert");
        this.insertTagIntoTextarea(tag);
      });
    });

    // History drawer events
    this.btnHistoryToggle.addEventListener("click", () => this.toggleHistoryDrawer(true));
    this.btnCloseHistory.addEventListener("click", () => this.toggleHistoryDrawer(false));
    this.btnClearHistory.addEventListener("click", () => this.handleClearAllHistory());
  }

  // --- Dynamic Greeting ---
  getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  updateGreetingText() {
    const greeting = this.getGreeting();
    if (this.currentGreetingPreview) {
      this.currentGreetingPreview.textContent = greeting;
    }
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    if (this.previewTimestamp) {
      this.previewTimestamp.textContent = `${hours}:${minutes}`;
    }
  }

  // --- Phone Cleaning & Formatting ---
  cleanPhoneNumber(rawInput) {
    if (!rawInput) return "";
    // Remove all non-digits
    let cleaned = rawInput.replace(/\D/g, "");

    // If starts with 0, strip leading 0 (e.g. 011 -> 11)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // If user typed 10 or 11 digits (e.g., 11987654321), append 55
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }

    return cleaned;
  }

  formatPhoneInputDisplay(inputEl) {
    let digits = inputEl.value.replace(/\D/g, "");
    if (digits.startsWith("55") && digits.length > 11) {
      digits = digits.substring(2);
    }

    let formatted = "";
    if (digits.length > 0) {
      formatted = "(" + digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ") ";
      if (digits.length > 7) {
        formatted += digits.substring(2, 7) + "-" + digits.substring(7, 11);
      } else {
        formatted += digits.substring(2);
      }
    }

    if (formatted) {
      inputEl.value = formatted;
    }

    const clean = this.cleanPhoneNumber(inputEl.value);
    if (clean.length >= 12) {
      this.phoneCleanPreview.innerHTML = `Válido para envio: <strong style="color:var(--wa-green)">+${clean}</strong>`;
    } else {
      this.phoneCleanPreview.textContent = "Digite DDD + Número de telefone";
    }
  }

  // --- Message Generation ---
  getCurrentTemplate() {
    let t = this.templates.find(item => item.id === this.activeTemplateId);
    if (!t && this.templates.length > 0) {
      t = this.templates[0];
    }
    return t;
  }

  buildMessageText() {
    const template = this.getCurrentTemplate();
    if (!template) return "";

    let text = template.text;

    // Variables replacement
    const greeting = this.autoGreetingCheck.checked ? this.getGreeting() : "Olá";
    const ownerName = this.ownerNameInput.value.trim();
    const salonName = this.salonNameInput.value.trim() || "seu salão";
    const salonRating = this.salonRatingInput.value.trim() || "5.0";
    const reviewCount = this.reviewCountInput.value.trim() || "várias";

    // Destinatário inteligente: se tiver a dona preenchida, usa a dona. Se não tiver, usa o nome do salão!
    const destinatario = ownerName ? ownerName : salonName;

    text = text.replaceAll("{saudacao}", greeting);
    text = text.replaceAll("{destinatario}", destinatario);
    text = text.replaceAll("{nome_dona}", ownerName || salonName);
    text = text.replaceAll("{nome_salao}", salonName);
    text = text.replaceAll("{nota_salao}", salonRating);
    text = text.replaceAll("{qtd_comentarios}", reviewCount);

    // Clean any double spaces caused by missing name
    text = text.replace(/ ,/g, ",");
    text = text.replace(/  +/g, " ");

    return text;
  }

  formatForWhatsAppHtml(text) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace WhatsApp bold *text* -> <strong>text</strong>
    safe = safe.replace(/\*([^\*]+)\*/g, "<strong>$1</strong>");

    // Replace WhatsApp italics _text_ -> <em>text</em>
    safe = safe.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Replace WhatsApp strikethrough ~text~ -> <del>text</del>
    safe = safe.replace(/~([^~]+)~/g, "<del>$1</del>");

    // Newlines to <br>
    return safe.replace(/\n/g, "<br>");
  }

  updatePreview() {
    this.updateGreetingText();
    const message = this.buildMessageText();

    this.liveMessagePreview.innerHTML = this.formatForWhatsAppHtml(message);
    this.charCounter.textContent = `${message.length} caracteres`;

    // Update WhatsApp Mockup Header
    const salonName = this.salonNameInput.value.trim();
    const ownerName = this.ownerNameInput.value.trim();
    if (salonName) {
      this.previewContactName.textContent = salonName + (ownerName ? ` (${ownerName})` : "");
    } else {
      this.previewContactName.textContent = "Nome do Salão";
    }

    const clean = this.cleanPhoneNumber(this.phoneInput.value);
    if (clean) {
      this.previewContactPhone.textContent = `+${clean} • online`;
    } else {
      this.previewContactPhone.textContent = "+55 (DDD) 99999-9999 • online";
    }
  }

  // --- WhatsApp Sending ---
  handleSendWhatsApp(targetType = "web") {
    const cleanPhone = this.cleanPhoneNumber(this.phoneInput.value);

    if (!cleanPhone || cleanPhone.length < 10) {
      this.phoneInput.focus();
      this.showToast("Por favor, informe o número de WhatsApp válido com DDD!", "error");
      return;
    }

    const message = this.buildMessageText();
    if (!message) {
      this.showToast("A mensagem está vazia. Verifique o modelo cadastrado.", "error");
      return;
    }

    // Build WhatsApp URL
    let url = "";
    if (targetType === "web") {
      // Direct Web WhatsApp link
      url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    } else {
      // Standard API / wa.me link (compatible with WhatsApp Desktop App)
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    }

    // Open in new tab
    window.open(url, "_blank");

    // Save into history
    this.addToHistory({
      phone: cleanPhone,
      displayPhone: this.phoneInput.value,
      salonName: this.salonNameInput.value.trim() || "Salão sem nome",
      ownerName: this.ownerNameInput.value.trim(),
      rating: this.salonRatingInput.value.trim(),
      reviews: this.reviewCountInput.value.trim(),
      templateName: this.getCurrentTemplate()?.name || "Padrão",
      timestamp: new Date().toISOString()
    });

    this.showToast("Abrindo WhatsApp! Conversa iniciada sem salvar número.", "success");
  }

  handleCopyMessage() {
    const message = this.buildMessageText();
    navigator.clipboard.writeText(message).then(() => {
      this.copyBtnText.textContent = "Copiado!";
      this.showToast("Mensagem copiada para a área de transferência!", "success");
      setTimeout(() => {
        this.copyBtnText.textContent = "Copiar Mensagem";
      }, 2000);
    }).catch(() => {
      this.showToast("Erro ao copiar mensagem", "error");
    });
  }

  handleClearForm() {
    this.phoneInput.value = "";
    this.salonNameInput.value = "";
    this.ownerNameInput.value = "";
    this.phoneCleanPreview.textContent = "Digite DDD + Número de telefone";
    this.phoneInput.focus();
    this.updatePreview();
    this.showToast("Formulário limpo para o próximo salão!", "info");
  }

  // --- Templates Management ---
  renderActiveTemplateOptions() {
    this.activeTemplateSelect.innerHTML = "";
    if (this.batchTemplateSelect) {
      this.batchTemplateSelect.innerHTML = "";
    }

    this.templates.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      if (t.id === this.activeTemplateId) {
        opt.selected = true;
      }
      this.activeTemplateSelect.appendChild(opt);

      if (this.batchTemplateSelect) {
        const optBatch = opt.cloneNode(true);
        this.batchTemplateSelect.appendChild(optBatch);
      }
    });
  }

  openTemplateModal() {
    this.renderModalTemplateSelect();
    this.loadTemplateIntoModal(this.activeTemplateId);
    this.templateModal.classList.add("open");
  }

  closeTemplateModal() {
    this.templateModal.classList.remove("open");
  }

  renderModalTemplateSelect() {
    this.templateListSelect.innerHTML = "";
    this.templates.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      this.templateListSelect.appendChild(opt);
    });
  }

  loadTemplateIntoModal(templateId) {
    const template = this.templates.find(t => t.id === templateId) || this.templates[0];
    if (template) {
      this.templateListSelect.value = template.id;
      this.modalTemplateName.value = template.name;
      this.modalTemplateText.value = template.text;
    }
  }

  handleNewTemplate() {
    const newId = "template-" + Date.now();
    const newTemplate = {
      id: newId,
      name: "Novo Modelo " + (this.templates.length + 1),
      text: "{saudacao}, {nome_dona}!\n\nVi as ótimas avaliações do *{nome_salao}* no Google (nota *{nota_salao}* com *{qtd_comentarios} avaliações*).\n\nGostaria de te apresentar uma novidade exclusiva para salões da nossa região!"
    };
    this.templates.push(newTemplate);
    this.activeTemplateId = newId;
    this.saveTemplates();
    this.renderActiveTemplateOptions();
    this.renderModalTemplateSelect();
    this.loadTemplateIntoModal(newId);
    this.updatePreview();
    this.showToast("Novo modelo criado! Personalize o texto.", "success");
  }

  handleSaveModalTemplate() {
    const selectedId = this.templateListSelect.value;
    const name = this.modalTemplateName.value.trim();
    const text = this.modalTemplateText.value.trim();

    if (!name || !text) {
      this.showToast("Nome e corpo do modelo são obrigatórios!", "error");
      return;
    }

    const tIndex = this.templates.findIndex(t => t.id === selectedId);
    if (tIndex >= 0) {
      this.templates[tIndex].name = name;
      this.templates[tIndex].text = text;
      this.activeTemplateId = selectedId;
      this.saveTemplates();
      this.renderActiveTemplateOptions();
      this.updatePreview();
      this.closeTemplateModal();
      this.showToast("Mensagem padrão atualizada com sucesso!", "success");
    }
  }

  handleDeleteModalTemplate() {
    if (this.templates.length <= 1) {
      this.showToast("Você precisa manter pelo menos 1 modelo ativo!", "error");
      return;
    }
    const selectedId = this.templateListSelect.value;
    this.templates = this.templates.filter(t => t.id !== selectedId);
    this.activeTemplateId = this.templates[0].id;
    this.saveTemplates();
    this.renderActiveTemplateOptions();
    this.renderModalTemplateSelect();
    this.loadTemplateIntoModal(this.activeTemplateId);
    this.updatePreview();
    this.showToast("Modelo excluído com sucesso.", "info");
  }

  handleResetDefaultTemplates() {
    if (confirm("Deseja restaurar as mensagens padrões originais de fábrica?")) {
      this.templates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
      this.activeTemplateId = this.templates[0].id;
      this.saveTemplates();
      this.renderActiveTemplateOptions();
      this.renderModalTemplateSelect();
      this.loadTemplateIntoModal(this.activeTemplateId);
      this.updatePreview();
      this.showToast("Modelos originais restaurados!", "success");
    }
  }

  insertTagIntoTextarea(tag) {
    const textarea = this.modalTemplateText;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + tag.length;
  }

  // --- History Management ---
  addToHistory(entry) {
    // Keep max 50 items
    this.history.unshift(entry);
    if (this.history.length > 50) {
      this.history.pop();
    }
    this.saveHistory();
  }

  renderHistory() {
    this.historyCountBadge.textContent = this.history.length;
    this.historyTotalLabel.textContent = `${this.history.length} salões contatados`;

    if (this.history.length === 0) {
      this.historyListContainer.innerHTML = `
        <div class="empty-history">
          <i class="fa-regular fa-paper-plane"></i>
          <p>Nenhum envio registrado ainda.<br>Quando você abrir uma conversa, o salão aparecerá aqui.</p>
        </div>
      `;
      return;
    }

    this.historyListContainer.innerHTML = "";
    this.history.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "history-card";

      const dateObj = new Date(item.timestamp);
      const formattedDate = dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      card.innerHTML = `
        <div class="history-card-top">
          <span class="history-salon-title">${item.salonName}</span>
          <span class="history-time">${formattedDate}</span>
        </div>
        <div class="history-sub">
          <span><i class="fa-brands fa-whatsapp text-muted"></i> +${item.phone}</span>
          ${item.ownerName ? `<span>• Dona: ${item.ownerName}</span>` : ""}
          ${item.rating ? `<span class="history-rating-badge">⭐ ${item.rating}</span>` : ""}
        </div>
        <div class="history-actions">
          <button type="button" class="btn-history-load" data-index="${index}">
            <i class="fa-solid fa-arrows-rotate"></i> Carregar Dados
          </button>
          <button type="button" class="btn-history-delete" data-index="${index}" title="Remover do histórico">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      this.historyListContainer.appendChild(card);
    });

    // Bind item events
    this.historyListContainer.querySelectorAll(".btn-history-load").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
        this.loadHistoryItemIntoForm(index);
      });
    });

    this.historyListContainer.querySelectorAll(".btn-history-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
        this.history.splice(index, 1);
        this.saveHistory();
      });
    });
  }

  loadHistoryItemIntoForm(index) {
    const item = this.history[index];
    if (!item) return;

    this.phoneInput.value = item.displayPhone || item.phone;
    this.formatPhoneInputDisplay(this.phoneInput);
    this.salonNameInput.value = item.salonName || "";
    this.ownerNameInput.value = item.ownerName || "";
    this.salonRatingInput.value = item.rating || "4.9";
    this.reviewCountInput.value = item.reviews || "85";

    this.updatePreview();
    this.toggleHistoryDrawer(false);
    this.showToast(`Dados de "${item.salonName}" carregados no formulário!`, "info");
  }

  handleClearAllHistory() {
    if (this.history.length === 0) return;
    if (confirm("Deseja realmente limpar todo o histórico de envios?")) {
      this.history = [];
      this.saveHistory();
      this.showToast("Histórico limpo com sucesso.", "info");
    }
  }

  toggleHistoryDrawer(isOpen) {
    if (isOpen) {
      this.historyDrawer.classList.add("open");
    } else {
      this.historyDrawer.classList.remove("open");
    }
  }

  // --- Toast Notification Feedback ---
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-triangle-exclamation";

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ========================================================
  // BATCH MODE: DISPARO POR PLANILHA (EXCEL / CSV) & ANTI-BAN
  // ========================================================

  initBatchEvents() {
    // Mode Switching
    if (this.btnModeSingle) {
      this.btnModeSingle.addEventListener("click", () => this.switchMode("single"));
    }
    if (this.btnModeBatch) {
      this.btnModeBatch.addEventListener("click", () => this.switchMode("batch"));
    }

    // Drag and drop & browse
    if (this.btnBrowseFile) {
      this.btnBrowseFile.addEventListener("click", (e) => {
        e.stopPropagation();
        this.batchFileInput.click();
      });
    }

    if (this.fileDropzone) {
      this.fileDropzone.addEventListener("click", (e) => {
        if (e.target.closest("#btnRemoveFile")) return;
        this.batchFileInput.click();
      });

      this.fileDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.fileDropzone.classList.add("dragover");
      });

      this.fileDropzone.addEventListener("dragleave", () => {
        this.fileDropzone.classList.remove("dragover");
      });

      this.fileDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        this.fileDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });
    }

    if (this.batchFileInput) {
      this.batchFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    if (this.btnRemoveFile) {
      this.btnRemoveFile.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleRemoveBatchFile();
      });
    }

    // Sample Download & Direct Test Load
    if (this.btnDownloadSample) {
      this.btnDownloadSample.addEventListener("click", () => this.downloadSampleSpreadsheet());
    }
    if (this.btnLoadTestData) {
      this.btnLoadTestData.addEventListener("click", () => this.loadTestData());
    }

    // Dispatcher Controls
    if (this.btnStartBatch) {
      this.btnStartBatch.addEventListener("click", () => this.startBatchQueue());
    }
    if (this.btnPauseBatch) {
      this.btnPauseBatch.addEventListener("click", () => this.pauseBatchQueue());
    }
    if (this.btnSendNextNow) {
      this.btnSendNextNow.addEventListener("click", () => this.sendNextBatchImmediately());
    }
    if (this.btnSkipCurrent) {
      this.btnSkipCurrent.addEventListener("click", () => this.skipBatchContact());
    }
    if (this.btnStopBatch) {
      this.btnStopBatch.addEventListener("click", () => this.stopBatchQueue());
    }
    if (this.btnExportBatchCsv) {
      this.btnExportBatchCsv.addEventListener("click", () => this.exportBatchCsv());
    }

    // Table Filters
    document.querySelectorAll(".btn-filter").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.activeFilter = e.currentTarget.getAttribute("data-filter");
        this.renderBatchTable();
      });
    });

    // Escuta comunicação da Extensão ZapDirect
    window.addEventListener("message", (event) => {
      if (!event.data) return;

      if (event.data.type === "ZAP_EXTENSION_READY") {
        console.log("[ZapDirect App] Extensão detectada e conectada!");
        this.hasExtension = true;
        this.updateExtensionBadge(true);
      }

      if (event.data.type === "ZAP_CONTACT_SENT_UPDATE") {
        const sentData = event.data.payload;
        const contact = this.batchContacts.find(c => c.id === sentData.id || c.cleanPhone === sentData.cleanPhone);
        if (contact) {
          contact.status = "sent";
          contact.sentAt = sentData.timestamp || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          this.addToHistory({
            phone: contact.cleanPhone,
            displayPhone: contact.rawPhone,
            salonName: contact.salonName,
            ownerName: contact.ownerName,
            rating: contact.rating,
            reviews: contact.reviews,
            templateName: this.getBatchActiveTemplate()?.name || "Modelo em Lote",
            timestamp: new Date().toISOString()
          });

          this.playBeepSound();
          this.showToast(`✅ Enviado para ${contact.ownerName || contact.salonName}!`, "success");
        }

        // Procura próximo pending para marcar como sending na UI
        const nextPending = this.batchContacts.find(c => c.status === "pending");
        if (nextPending) {
          nextPending.status = "sending";
          this.currentProcessingSalon.innerHTML = `Próximo: <strong>${nextPending.salonName}</strong> (+${nextPending.cleanPhone})`;
        }

        this.renderBatchTable();
        this.updateBatchStatsUI();
      }

      if (event.data.type === "ZAP_BATCH_FINISHED") {
        this.batchStatus = "idle";
        this.btnStartBatch.style.display = "inline-flex";
        this.btnStartBatch.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reiniciar Disparos';
        this.btnPauseBatch.style.display = "none";
        this.timerPulseIcon.classList.remove("running");
        this.timerStatusLabel.textContent = "Todos os contatos foram enviados com sucesso!";

        // Garante que nenhum contato fique preso como sending
        this.batchContacts.forEach(c => {
          if (c.status === "sending") c.status = "sent";
        });

        this.renderBatchTable();
        this.updateBatchStatsUI();
        this.showToast("🎉 Parabéns! Todos os contatos da planilha foram enviados!", "success");
      }
    });

    // Pings periódicos para auto-detectar a extensão
    const pingExtension = () => {
      if (!this.hasExtension) {
        window.postMessage({ type: "ZAP_PING_EXTENSION" }, "*");
      }
    };
    pingExtension();
    setInterval(pingExtension, 1500);

    // Mapping selects change
    const mapSelects = [
      this.mapPhoneSelect,
      this.mapOwnerSelect,
      this.mapSalonSelect,
      this.mapRatingSelect,
      this.mapReviewsSelect,
      this.mapSentSelect
    ];
    mapSelects.forEach(sel => {
      if (sel) {
        sel.addEventListener("change", () => {
          if (this.rawSheetData) {
            this.processRowsIntoContacts(this.rawSheetData);
          }
        });
      }
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    if (mode === "single") {
      this.btnModeSingle.classList.add("active");
      this.btnModeBatch.classList.remove("active");
      this.viewSingleMode.style.display = "grid";
      this.viewBatchMode.style.display = "none";
    } else {
      this.btnModeSingle.classList.remove("active");
      this.btnModeBatch.classList.add("active");
      this.viewSingleMode.style.display = "none";
      this.viewBatchMode.style.display = "flex";
      this.updateBatchStatsUI();
    }
  }

  handleFileSelected(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      this.showToast("Formato inválido! Envie uma planilha .xlsx, .xls ou .csv", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let workbook;
        if (ext === "csv") {
          workbook = XLSX.read(data, { type: "string" });
        } else {
          workbook = XLSX.read(data, { type: "binary" });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonData || jsonData.length === 0) {
          this.showToast("A planilha está vazia ou não contém dados válidos.", "error");
          return;
        }

        this.rawSheetData = jsonData;
        this.loadedFileName.textContent = file.name;

        // Auto-detect headers and mapping
        const headers = Object.keys(jsonData[0]);
        this.renderMappingOptions(headers);
        this.processRowsIntoContacts(jsonData);

        // Update UI
        this.fileDropzone.querySelector(".dropzone-body").style.display = "none";
        this.dropzoneFileInfo.style.display = "flex";
        this.mappingCard.style.display = "block";

        this.showToast(`${this.batchContacts.length} contatos carregados com sucesso!`, "success");
      } catch (err) {
        console.error(err);
        this.showToast("Erro ao ler planilha. Verifique a formatação do arquivo.", "error");
      }
    };

    if (ext === "csv") {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsBinaryString(file);
    }
  }

  handleRemoveBatchFile() {
    this.batchFileInput.value = "";
    this.rawSheetData = null;
    this.batchContacts = [];
    this.stopBatchQueue();
    this.fileDropzone.querySelector(".dropzone-body").style.display = "block";
    this.dropzoneFileInfo.style.display = "none";
    this.mappingCard.style.display = "none";
    this.renderBatchTable();
    this.updateBatchStatsUI();
    this.showToast("Planilha removida.", "info");
  }

  renderMappingOptions(headers) {
    const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Guess columns
    let guessedPhone = headers.find(h => ["telefone", "whatsapp", "celular", "fone", "tel", "numero", "contato"].includes(normalize(h))) || headers[0];
    let guessedOwner = headers.find(h => ["destinatario", "dona", "nome", "responsavel", "proprietaria", "contato"].includes(normalize(h))) || "";
    let guessedSalon = headers.find(h => ["salao", "nomesalao", "estabelecimento", "empresa", "espaco", "negocio"].includes(normalize(h))) || headers[1] || "";
    let guessedRating = headers.find(h => ["nota", "avaliacao", "rating", "estrelas", "notagoogle"].includes(normalize(h))) || "";
    let guessedReviews = headers.find(h => ["comentarios", "avaliacoes", "reviews", "qtdavaliacoes", "qtdcomentarios"].includes(normalize(h))) || "";
    let guessedSent = headers.find(h => ["enviado", "enviada", "status", "jaenviado", "disparado", "disparo", "sucesso", "enviados", "sent"].includes(normalize(h))) || "";

    const populateSelect = (selectEl, chosenVal, isRequired = false) => {
      if (!selectEl) return;
      selectEl.innerHTML = isRequired ? "" : '<option value="">-- Não incluir / Opcional --</option>';
      headers.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        if (h === chosenVal) opt.selected = true;
        selectEl.appendChild(opt);
      });
    };

    populateSelect(this.mapPhoneSelect, guessedPhone, true);
    populateSelect(this.mapOwnerSelect, guessedOwner, false);
    populateSelect(this.mapSalonSelect, guessedSalon, true);
    populateSelect(this.mapRatingSelect, guessedRating, false);
    populateSelect(this.mapReviewsSelect, guessedReviews, false);
    populateSelect(this.mapSentSelect, guessedSent, false);
  }

  processRowsIntoContacts(jsonData) {
    const phoneKey = this.mapPhoneSelect.value;
    const ownerKey = this.mapOwnerSelect.value;
    const salonKey = this.mapSalonSelect.value;
    const ratingKey = this.mapRatingSelect.value;
    const reviewsKey = this.mapReviewsSelect.value;
    const sentKey = this.mapSentSelect ? this.mapSentSelect.value : "";

    const isAlreadySentValue = (val) => {
      if (val === undefined || val === null) return false;
      const s = String(val).trim().toLowerCase();
      return ["sim", "s", "yes", "y", "true", "1", "enviado", "enviada", "ok", "feita", "concluido", "concluído"].includes(s);
    };

    this.batchContacts = jsonData.map((row, index) => {
      const rawPhone = String(row[phoneKey] || "").trim();
      const cleanPhone = this.cleanPhoneNumber(rawPhone);
      const ownerName = ownerKey ? String(row[ownerKey] || "").trim() : "";
      const salonName = salonKey ? String(row[salonKey] || "").trim() : "Salão";
      const rating = ratingKey ? String(row[ratingKey] || "").trim() : "5.0";
      const reviews = reviewsKey ? String(row[reviewsKey] || "").trim() : "35";

      const isValid = cleanPhone.length >= 10;
      const isAlreadySent = sentKey ? isAlreadySentValue(row[sentKey]) : false;

      let initialStatus = "pending";
      if (!isValid) {
        initialStatus = "error";
      } else if (isAlreadySent) {
        initialStatus = "sent";
      }

      return {
        id: index + 1,
        rawPhone,
        cleanPhone,
        ownerName,
        salonName,
        rating: rating || "5.0",
        reviews: reviews || "35",
        status: initialStatus, // pending | sending | sent | error | skipped
        sentAt: isAlreadySent ? "Já constava como Enviado = Sim na planilha" : null,
        alreadySentInSheet: isAlreadySent,
        errorMessage: isValid ? "" : "Número incompleto/inválido",
        originalRow: row
      };
    });

    this.currentBatchIndex = 0;
    this.loadedRowsCount.textContent = `${this.batchContacts.length} contatos encontrados`;
    this.renderBatchTable();
    this.updateBatchStatsUI();
  }

  renderBatchTable() {
    this.tableRowsTotal.textContent = this.batchContacts.length;

    if (!this.batchContacts || this.batchContacts.length === 0) {
      this.batchTableBody.innerHTML = `
        <tr class="empty-table-row">
          <td colspan="7">
            <div class="empty-batch-state">
              <i class="fa-solid fa-file-excel"></i>
              <p>Nenhuma planilha importada no momento.<br>Faça o upload do seu arquivo Excel (.xlsx) ou CSV acima para iniciar os disparos.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let filtered = this.batchContacts;
    if (this.activeFilter === "pending") {
      filtered = this.batchContacts.filter(c => c.status === "pending" || c.status === "sending");
    } else if (this.activeFilter === "sent") {
      filtered = this.batchContacts.filter(c => c.status === "sent");
    }

    this.batchTableBody.innerHTML = "";

    filtered.forEach((contact, idx) => {
      const tr = document.createElement("tr");
      if (contact.status === "sending") {
        tr.className = "active-sending";
      }

      let statusBadge = "";
      if (contact.alreadySentInSheet) {
        statusBadge = '<span class="status-pill already-sent" title="Marcado como Enviado = Sim na planilha (não será reenviado)"><i class="fa-solid fa-check-double"></i> Enviado (Planilha)</span>';
      } else if (contact.status === "pending") {
        statusBadge = '<span class="status-pill pending"><i class="fa-regular fa-clock"></i> Pendente</span>';
      } else if (contact.status === "sending") {
        statusBadge = '<span class="status-pill sending"><i class="fa-solid fa-spinner fa-spin"></i> Enviando...</span>';
      } else if (contact.status === "sent") {
        statusBadge = `<span class="status-pill sent" title="${contact.sentAt || ''}"><i class="fa-solid fa-check"></i> Enviado</span>`;
      } else if (contact.status === "skipped") {
        statusBadge = '<span class="status-pill skipped"><i class="fa-solid fa-forward"></i> Ignorado</span>';
      } else if (contact.status === "error") {
        statusBadge = '<span class="status-pill error" title="Telefone inválido"><i class="fa-solid fa-triangle-exclamation"></i> Inválido</span>';
      }

      tr.innerHTML = `
        <td><strong>${contact.id}</strong></td>
        <td>${statusBadge}</td>
        <td>${contact.ownerName || '<span class="text-muted">(salão)</span>'}</td>
        <td><strong>${contact.salonName}</strong></td>
        <td>+${contact.cleanPhone || contact.rawPhone}</td>
        <td>⭐ ${contact.rating} (${contact.reviews})</td>
        <td>
          <button type="button" class="btn-table-send" data-id="${contact.id}" title="Abrir conversa deste contato agora">
            <i class="fa-brands fa-whatsapp"></i> Abrir
          </button>
        </td>
      `;

      this.batchTableBody.appendChild(tr);
    });

    // Row click action
    this.batchTableBody.querySelectorAll(".btn-table-send").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.getAttribute("data-id"), 10);
        const contactIndex = this.batchContacts.findIndex(c => c.id === id);
        if (contactIndex >= 0) {
          this.dispatchSingleBatchRow(contactIndex);
        }
      });
    });
  }

  updateBatchStatsUI() {
    const total = this.batchContacts.length;
    const sent = this.batchContacts.filter(c => c.status === "sent").length;
    const remaining = this.batchContacts.filter(c => c.status === "pending").length;
    const alreadyInSheet = this.batchContacts.filter(c => c.alreadySentInSheet).length;

    this.statTotalCount.textContent = total;
    this.statSentCount.textContent = sent;
    this.statRemainingCount.textContent = remaining;

    const percent = total > 0 ? Math.round((sent / total) * 100) : 0;
    this.batchProgressBar.style.width = `${percent}%`;
    this.batchProgressPercent.textContent = `${percent}% Concluído (${sent} de ${total})`;

    if (this.batchStatus === "running") {
      const current = this.batchContacts[this.currentBatchIndex];
      if (current) {
        this.currentProcessingSalon.innerHTML = `Próximo: <strong>${current.salonName}</strong> (+${current.cleanPhone})`;
      } else {
        this.currentProcessingSalon.textContent = "Todos os contatos foram processados!";
      }
    } else if (this.batchStatus === "paused") {
      this.currentProcessingSalon.textContent = "Fila em pausa. Pressione Iniciar para continuar.";
    } else {
      if (alreadyInSheet > 0) {
        this.currentProcessingSalon.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${remaining} a enviar (${alreadyInSheet} contatos marcados com 'Enviado = Sim' ignorados automaticamente)`;
      } else {
        this.currentProcessingSalon.textContent = total > 0 ? "Pronto para iniciar os envios." : "Aguardando planilha...";
      }
    }
  }

  formatTimeClock(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }


  calculateNextInterval() {
    const baseSeconds = parseInt(this.batchIntervalSelect.value, 10) || 120;
    // Se for modo de teste (10s ou 30s), executa exatamente no tempo de teste sem atraso
    if (baseSeconds <= 30) {
      return baseSeconds;
    }
    if (this.randomJitterCheck && this.randomJitterCheck.checked) {
      const jitter = Math.floor(Math.random() * 21) - 10;
      return Math.max(30, baseSeconds + jitter);
    }
    return baseSeconds;
  }

  startBatchQueue() {
    if (!this.batchContacts || this.batchContacts.length === 0) {
      this.showToast("Carregue uma planilha antes de iniciar os disparos!", "error");
      return;
    }

    // Filtra todos os contatos que ainda estão pendentes (ignora os que já constam como Enviado = Sim)
    const pendingContacts = this.batchContacts
      .filter(c => c.status === "pending")
      .map(c => ({
        id: c.id,
        salonName: c.salonName,
        ownerName: c.ownerName,
        cleanPhone: c.cleanPhone,
        rawPhone: c.rawPhone,
        rating: c.rating,
        reviews: c.reviews,
        message: this.buildBatchMessage(c)
      }));

    if (pendingContacts.length === 0) {
      const alreadyCount = this.batchContacts.filter(c => c.alreadySentInSheet).length;
      if (alreadyCount > 0) {
        this.showToast(`Todos os ${alreadyCount} contatos já constam como 'Enviado = Sim' na planilha! Nenhum reenvio necessário.`, "info");
      } else {
        this.showToast("Todos os contatos da lista já foram enviados ou estão marcados!", "info");
      }
      return;
    }

    const intervalSecs = parseInt(this.batchIntervalSelect.value, 10) || 10;
    const hasJitter = this.randomJitterCheck ? this.randomJitterCheck.checked : false;

    this.batchStatus = "running";
    this.btnStartBatch.style.display = "none";
    this.btnPauseBatch.style.display = "inline-flex";
    if (this.btnSendNextNow) this.btnSendNextNow.style.display = "none";
    this.timerPulseIcon.classList.add("running");
    this.timerStatusLabel.textContent = "Auto-disparo em andamento pelo WhatsApp Web...";

    // 1. Marca o primeiro da fila como 'sending' na tabela
    const firstInTable = this.batchContacts.find(c => c.id === pendingContacts[0].id);
    if (firstInTable) {
      firstInTable.status = "sending";
    }
    this.renderBatchTable();
    this.updateBatchStatsUI();

    // 2. Envia a fila inteira para a extensão através da bridge
    window.postMessage({
      type: "ZAP_START_BATCH",
      payload: {
        contacts: pendingContacts,
        startIndex: 0,
        config: {
          interval: intervalSecs,
          jitter: hasJitter
        }
      }
    }, "*");

    // 3. Abre a janela do WhatsApp Web para o primeiro contato (acionado pelo clique do usuário)
    const firstContact = pendingContacts[0];
    const firstUrl = `https://web.whatsapp.com/send?phone=${firstContact.cleanPhone}&text=${encodeURIComponent(firstContact.message)}&zap_batch=1`;

    this.showToast("🚀 Fila iniciada! Abrindo WhatsApp Web...", "success");

    try {
      if (this.waTab && !this.waTab.closed) {
        this.waTab.location.href = firstUrl;
        this.waTab.focus();
      } else {
        this.waTab = window.open(firstUrl, "zap_sender_window");
      }
    } catch (e) {
      this.waTab = window.open(firstUrl, "zap_sender_window");
    }
  }

  pauseBatchQueue() {
    this.batchStatus = "paused";
    window.postMessage({ type: "ZAP_PAUSE_BATCH" }, "*");

    this.btnStartBatch.style.display = "inline-flex";
    this.btnStartBatch.innerHTML = '<i class="fa-solid fa-play"></i> Continuar Disparos';
    this.btnPauseBatch.style.display = "none";
    this.timerPulseIcon.classList.remove("running");
    this.timerStatusLabel.textContent = "Fila Pausada";

    this.updateBatchStatsUI();
    this.showToast("Fila de disparos pausada.", "info");
  }

  skipBatchContact() {
    window.postMessage({ type: "ZAP_SKIP_BATCH" }, "*");

    const currentSending = this.batchContacts.find(c => c.status === "sending");
    if (currentSending) {
      currentSending.status = "skipped";
    }
    const nextPending = this.batchContacts.find(c => c.status === "pending");
    if (nextPending) {
      nextPending.status = "sending";
    }

    this.renderBatchTable();
    this.updateBatchStatsUI();
    this.showToast("Contato pulado.", "info");
  }

  sendNextBatchImmediately() {
    this.skipBatchContact();
  }

  stopBatchQueue() {
    this.batchStatus = "idle";
    window.postMessage({ type: "ZAP_STOP_BATCH" }, "*");

    this.btnStartBatch.style.display = "inline-flex";
    this.btnStartBatch.innerHTML = '<i class="fa-solid fa-play"></i> Iniciar Disparos';
    this.btnPauseBatch.style.display = "none";
    if (this.btnSendNextNow) this.btnSendNextNow.style.display = "none";
    this.timerPulseIcon.classList.remove("running");
    this.timerStatusLabel.textContent = "Fila Parada";
    this.timerClockDisplay.textContent = this.formatTimeClock(parseInt(this.batchIntervalSelect.value, 10) || 120);

    this.updateBatchStatsUI();
  }

  updateExtensionBadge(isActive) {
    const pill = document.getElementById("extStatusPill");
    const label = document.getElementById("extStatusLabel");
    if (!pill || !label) return;

    if (isActive) {
      pill.classList.remove("offline");
      pill.classList.add("online");
      label.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> Auto-Disparo Ativo (Extensão Conectada)';
    } else {
      pill.classList.remove("online");
      pill.classList.add("offline");
      label.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-warning"></i> Extensão não detectada';
    }
  }

  dispatchSingleBatchRow(index) {
    const contact = this.batchContacts[index];
    if (!contact) return;

    if (!contact.cleanPhone || contact.cleanPhone.length < 10) {
      this.showToast("Número de telefone inválido para este salão!", "error");
      return;
    }

    const message = this.buildBatchMessage(contact);
    const url = `https://web.whatsapp.com/send?phone=${contact.cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    contact.status = "sent";
    contact.sentAt = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    this.addToHistory({
      phone: contact.cleanPhone,
      displayPhone: contact.rawPhone,
      salonName: contact.salonName,
      ownerName: contact.ownerName,
      rating: contact.rating,
      reviews: contact.reviews,
      templateName: this.getBatchActiveTemplate()?.name || "Disparo Avulso",
      timestamp: new Date().toISOString()
    });

    this.renderBatchTable();
    this.updateBatchStatsUI();
    this.showToast(`Conversa com "${contact.salonName}" aberta!`, "success");
  }

  getBatchActiveTemplate() {
    const templateId = this.batchTemplateSelect ? this.batchTemplateSelect.value : this.activeTemplateId;
    return this.templates.find(t => t.id === templateId) || this.templates[0];
  }

  buildBatchMessage(contact) {
    const template = this.getBatchActiveTemplate();
    if (!template) return "";

    let text = template.text;

    const greeting = this.getGreeting();
    const ownerName = contact.ownerName || "";
    const salonName = contact.salonName || "seu salão";
    const rating = contact.rating || "5.0";
    const reviews = contact.reviews || "várias";

    const destinatario = ownerName ? ownerName : salonName;

    text = text.replaceAll("{saudacao}", greeting);
    text = text.replaceAll("{destinatario}", destinatario);
    text = text.replaceAll("{nome_dona}", ownerName || salonName);
    text = text.replaceAll("{nome_salao}", salonName);
    text = text.replaceAll("{nota_salao}", rating);
    text = text.replaceAll("{qtd_comentarios}", reviews);

    text = text.replace(/ ,/g, ",");
    text = text.replace(/  +/g, " ");

    return text;
  }

  playBeepSound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // AudioContext not allowed or not supported, ignore gracefully
    }
  }

  downloadSampleSpreadsheet() {
    try {
      const sampleData = [
        {
          "Telefone": "11987654321",
          "Destinatario": "Mariana",
          "Nome_Salao": "Espaço Bella Mulher",
          "Nota": "4.9",
          "Comentarios": "87",
          "Enviado": "Não"
        },
        {
          "Telefone": "11999998888",
          "Destinatario": "",
          "Nome_Salao": "Studio Saah Esmalteria & Cursos",
          "Nota": "4.9",
          "Comentarios": "34",
          "Enviado": "Não"
        },
        {
          "Telefone": "21988887777",
          "Destinatario": "Camila",
          "Nome_Salao": "Camila Nails Designer",
          "Nota": "5.0",
          "Comentarios": "112",
          "Enviado": "Sim"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Saloes");

      XLSX.writeFile(wb, "modelo_planilha_saloes_whatsapp.xlsx");
      this.showToast("Planilha modelo baixada com sucesso (com coluna 'Enviado')!", "success");
    } catch (err) {
      console.error(err);
      this.showToast("Erro ao gerar planilha modelo.", "error");
    }
  }

  loadTestData() {
    const testRows = [
      {
        "Telefone": "19999995149",
        "Destinatario": "Abel",
        "Nome_Salao": "Studio Abel Hair & Nails",
        "Nota": "5.0",
        "Comentarios": "58",
        "Enviado": "Não"
      },
      {
        "Telefone": "18988212696",
        "Destinatario": "Nair",
        "Nome_Salao": "Espaço Beleza Nair",
        "Nota": "4.9",
        "Comentarios": "42",
        "Enviado": "Não"
      }
    ];

    this.rawSheetData = testRows;
    this.loadedFileName.textContent = "planilha_teste.xlsx (Abel & Nair)";
    const headers = Object.keys(testRows[0]);
    this.renderMappingOptions(headers);
    this.processRowsIntoContacts(testRows);

    this.fileDropzone.querySelector(".dropzone-body").style.display = "none";
    this.dropzoneFileInfo.style.display = "flex";
    this.mappingCard.style.display = "block";

    this.showToast("Planilha de teste com Abel e Nair carregada com sucesso!", "success");
  }

  exportBatchCsv() {
    if (!this.batchContacts || this.batchContacts.length === 0) {
      this.showToast("Nenhum dado para exportar.", "info");
      return;
    }

    try {
      const exportData = this.batchContacts.map(c => {
        const row = c.originalRow ? { ...c.originalRow } : {};
        row["Telefone"] = c.cleanPhone || c.rawPhone;
        row["Destinatario"] = c.ownerName;
        row["Nome_Salao"] = c.salonName;
        row["Nota"] = c.rating;
        row["Comentarios"] = c.reviews;
        row["Enviado"] = c.status === "sent" ? "Sim" : "Não";
        row["Horario_Envio"] = c.sentAt || "";
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Saloes_Atualizados");

      XLSX.writeFile(wb, "planilha_saloes_atualizada.xlsx");
      this.showToast("Planilha atualizada exportada com 'Enviado = Sim'!", "success");
    } catch (err) {
      console.error(err);
      this.showToast("Erro ao exportar relatório.", "error");
    }
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.zapApp = new ZapSalonsApp();
});
