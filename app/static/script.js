const state = {
  tabs: ["Documento 1", "Documento 2", "Documento 3"],
  activeTab: 0,
  data: {
    "Documento 1": {},
    "Documento 2": {},
    "Documento 3": {}
  },
  editingKey: null,
  docxLoaded: false
};

const tabsContainer = document.getElementById("tabsContainer");
const tableBody = document.getElementById("tableBody");
const statusMsg = document.getElementById("statusMsg");
const docPreview = document.getElementById("docPreview");

const docxFileInput = document.getElementById("docxFileInput");
const varNameInput = document.getElementById("varName");
const varValueInput = document.getElementById("varValue");

const saveVarBtn = document.getElementById("saveVarBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const readDocBtn = document.getElementById("readDocBtn");
const reloadJsonBtn = document.getElementById("reloadJsonBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadDocxBtn = document.getElementById("downloadDocxBtn");

function setStatus(message, type = "normal") {
  if (!statusMsg) return;

  statusMsg.textContent = message;

  if (type === "error") statusMsg.style.color = "#ff9cab";
  else if (type === "success") statusMsg.style.color = "#88f0b4";
  else statusMsg.style.color = "#9aa6c7";
}

function normalizeVariableName(name) {
  return `[${name.trim().toUpperCase().replace(/\s+/g, "_")}]`;
}

function getActiveTabName() {
  return state.tabs[state.activeTab];
}

function renderTabs() {
  tabsContainer.innerHTML = "";

  state.tabs.forEach((tabName, index) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (index === state.activeTab ? " active" : "");
    btn.textContent = tabName;
    btn.type = "button";
    btn.onclick = () => {
      state.activeTab = index;
      renderTabs();
      renderTable();
      clearForm();
    };
    tabsContainer.appendChild(btn);
  });
}

function renderTable() {
  const currentTab = getActiveTabName();
  const entries = Object.entries(state.data[currentTab] || {});

  if (!entries.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty">Nenhuma variável cadastrada nesta aba.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = entries.map(([key, value]) => `
    <tr>
      <td><strong>${escapeHtml(key)}</strong></td>
      <td>${escapeHtml(value)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-secondary btn-mini" type="button" onclick="editRow('${encodeURIComponent(key)}')">Editar</button>
          <button class="btn-danger btn-mini" type="button" onclick="deleteRow('${encodeURIComponent(key)}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function clearForm() {
  varNameInput.value = "";
  varValueInput.value = "";
  state.editingKey = null;
  saveVarBtn.textContent = "Salvar variável";
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

async function loadState(showMessage = false) {
  try {
    const response = await fetch("/api/state");
    const json = await response.json();

    state.tabs = json.tabs;
    state.data = json.data;
    state.activeTab = 0;
    state.editingKey = null;

    renderTabs();
    renderTable();
    clearForm();

    if (showMessage) {
      setStatus("data.json recarregado com sucesso.", "success");
    }
  } catch (error) {
    console.error(error);
    setStatus("Não foi possível carregar o data.json do projeto.", "error");
  }
}

async function saveVariable() {
  const rawName = varNameInput.value.trim();
  const rawValue = varValueInput.value;

  if (!rawName) {
    setStatus("Informe o nome da variável.", "error");
    return;
  }

  const normalizedKey = normalizeVariableName(rawName);
  const currentTab = getActiveTabName();

  try {
    const response = await fetch("/api/save-variable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tab: currentTab,
        key: normalizedKey,
        value: rawValue,
        old_key: state.editingKey
      })
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      throw new Error(json.error || "Erro ao salvar.");
    }

    state.tabs = json.state.tabs;
    state.data = json.state.data;

    renderTabs();
    renderTable();
    clearForm();
    setStatus(`Variável ${normalizedKey} salva com sucesso em "${currentTab}".`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Erro ao salvar variável.", "error");
  }
}

function editRow(encodedKey) {
  const key = decodeURIComponent(encodedKey);
  const currentTab = getActiveTabName();
  const value = state.data[currentTab][key];

  state.editingKey = key;
  varNameInput.value = key.replace(/^\[/, "").replace(/\]$/, "").replace(/_/g, " ");
  varValueInput.value = value;

  saveVarBtn.textContent = "Atualizar variável";
  if (cancelEditBtn) cancelEditBtn.style.display = "block";
  setStatus(`Editando ${key}`, "normal");
}

async function deleteRow(encodedKey) {
  const key = decodeURIComponent(encodedKey);
  const currentTab = getActiveTabName();

  try {
    const response = await fetch("/api/delete-variable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tab: currentTab,
        key
      })
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      throw new Error(json.error || "Erro ao excluir.");
    }

    state.tabs = json.state.tabs;
    state.data = json.state.data;

    renderTabs();
    renderTable();
    clearForm();
    setStatus(`Variável ${key} removida de "${currentTab}".`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Erro ao excluir variável.", "error");
  }
}

async function reloadJson() {
  await loadState(true);
}

async function readDocxPreview() {
  const file = docxFileInput.files[0];

  if (!file) {
    setStatus("Selecione um arquivo DOCX primeiro.", "error");
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/preview-docx", {
      method: "POST",
      body: formData
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      throw new Error(json.error || "Erro ao ler DOCX.");
    }

    docPreview.textContent = json.preview || "Documento lido, mas sem texto visível.";
    state.docxLoaded = true;
    setStatus("Documento DOCX lido com sucesso.", "success");
    return true;
  } catch (error) {
    console.error(error);
    state.docxLoaded = false;
    setStatus(error.message || "Não foi possível ler o DOCX.", "error");
    return false;
  }
}

async function ensureDocxReady() {
  if (state.docxLoaded) return true;

  if (docxFileInput.files[0]) {
    return await readDocxPreview();
  }

  setStatus("Selecione um DOCX e clique em 'Selecionar / Ler documento' primeiro.", "error");
  return false;
}

async function downloadProcessedDocx() {
  const ready = await ensureDocxReady();
  if (!ready) return;

  try {
    setStatus("Gerando DOCX...", "normal");

    const response = await fetch("/api/generate-docx", {
      method: "POST"
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const json = await response.json();
        throw new Error(json.error || "Erro ao gerar DOCX.");
      }
      throw new Error("Erro ao gerar DOCX.");
    }

    const blob = await response.blob();
    triggerDownload(blob, "documento_preenchido.docx");
    setStatus("DOCX preenchido gerado com sucesso.", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Erro ao gerar DOCX.", "error");
  }
}

async function downloadPdf() {
  const ready = await ensureDocxReady();
  if (!ready) return;

  try {
    setStatus("Gerando PDF...", "normal");

    const response = await fetch("/api/generate-pdf", {
      method: "POST"
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const json = await response.json();
        const details = json.details ? ` Detalhes: ${json.details}` : "";
        throw new Error((json.error || "Erro ao gerar PDF.") + details);
      }
      throw new Error("Erro ao gerar PDF.");
    }

    const blob = await response.blob();
    triggerDownload(blob, "documento_preenchido.pdf");
    setStatus("PDF gerado com sucesso.", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Erro ao gerar PDF.", "error");
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

varNameInput.addEventListener("input", () => {
  varNameInput.value = varNameInput.value.toUpperCase();
});

saveVarBtn.addEventListener("click", saveVariable);

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    clearForm();
    setStatus("Edição cancelada.", "normal");
  });
}

readDocBtn.addEventListener("click", readDocxPreview);
reloadJsonBtn.addEventListener("click", reloadJson);
downloadPdfBtn.addEventListener("click", downloadPdf);
downloadDocxBtn.addEventListener("click", downloadProcessedDocx);

window.editRow = editRow;
window.deleteRow = deleteRow;

loadState();