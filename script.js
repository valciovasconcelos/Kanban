/**
 * Estado da Aplicação
 * Gerenciamos as tarefas num array de objetos e renderizamos a UI baseado neste array,
 * em vez de salvar o HTML diretamente (melhor prática de Clean Code e arquitetura).
 */
let estado = {
    tarefas: []
};

// Quando carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    renderizarQuadros();
    configurarEventosColunas();

    const btnAdicionar = document.getElementById("btnAdicionar");
    btnAdicionar.addEventListener("click", adicionarTarefa);
});

/**
 * Carrega as tarefas do LocalStorage
 */
function carregarDados() {
    const dadosSalvos = localStorage.getItem("kanbanState");
    if (dadosSalvos) {
        estado = JSON.parse(dadosSalvos);
    } else {
        // Tarefas de exemplo caso não tenha nada
        estado.tarefas = [
            { id: gerarId(), texto: "Estudar Flexbox e Grid", status: "aFazer" },
            { id: gerarId(), texto: "Criar repositório no GitHub", status: "fazendo" }
        ];
        salvarDados();
    }
}

/**
 * Salva as tarefas no LocalStorage
 */
function salvarDados() {
    localStorage.setItem("kanbanState", JSON.stringify(estado));
}

/**
 * Renderiza os cards nas colunas corretas
 */
function renderizarQuadros() {
    const colunas = {
        aFazer: document.getElementById("aFazer"),
        fazendo: document.getElementById("fazendo"),
        concluido: document.getElementById("concluido")
    };

    const countCol = {
        aFazer: 0,
        fazendo: 0,
        concluido: 0
    };

    // Limpar as colunas antes de renderizar
    colunas.aFazer.innerHTML = "";
    colunas.fazendo.innerHTML = "";
    colunas.concluido.innerHTML = "";

    // Iterar e adicionar
    estado.tarefas.forEach(tarefa => {
        const card = criarElementoCard(tarefa);
        if (colunas[tarefa.status]) {
            colunas[tarefa.status].appendChild(card);
            countCol[tarefa.status]++;
        }
    });

    // Atualizar contadores
    document.getElementById("count-aFazer").innerText = `(${countCol.aFazer})`;
    document.getElementById("count-fazendo").innerText = `(${countCol.fazendo})`;
    document.getElementById("count-concluido").innerText = `(${countCol.concluido})`;
}

/**
 * Cria o elemento DOM para um card
 * @param {Object} tarefa - O objeto da tarefa {id, texto, status}
 * @returns {HTMLElement}
 */
function criarElementoCard(tarefa) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.setAttribute("draggable", "true");
    card.dataset.id = tarefa.id;

    // Texto da tarefa
    const spanText = document.createElement("span");
    spanText.classList.add("texto-tarefa");
    spanText.innerText = tarefa.texto;
    card.appendChild(spanText);

    // Botão excluir
    const btnExcluir = document.createElement("button");
    btnExcluir.classList.add("btnExcluir");
    btnExcluir.innerHTML = "&times;";
    btnExcluir.title = "Excluir Tarefa";
    btnExcluir.addEventListener("click", (e) => {
        e.stopPropagation(); // Impede outros cliques (como double click na edição)
        if (confirm("Deseja realmente excluir esta tarefa?")) {
            estado.tarefas = estado.tarefas.filter(t => t.id !== tarefa.id);
            salvarDados();
            renderizarQuadros();
        }
    });
    card.appendChild(btnExcluir);

    // Eventos de Drag and Drop
    card.addEventListener("dragstart", (e) => {
        card.classList.add("arrastando");
        // Guarda o ID do elemento arrastado para recuperar no drop (opcional no mesmo painel, mas boa prática)
        e.dataTransfer.setData("text/plain", tarefa.id);
        // Efeito de movimento
        e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("arrastando");
    });

    // Edição com duplo clique
    card.addEventListener("dblclick", () => editarTarefa(tarefa.id));

    // --- EVENTOS DE TOUCH (PARA CELULAR) ---
    let clone = null;
    let shiftX = 0;
    let shiftY = 0;

    card.addEventListener("touchstart", (e) => {
        if (e.target.classList.contains("btnExcluir")) return; // Não iniciar drag se clicou em excluir
        
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        shiftX = touch.clientX - rect.left;
        shiftY = touch.clientY - rect.top;

        // Cria o clone fluante para o dedo
        clone = card.cloneNode(true);
        clone.classList.add("arrastando");
        clone.style.position = "fixed";
        clone.style.zIndex = "1000";
        clone.style.width = rect.width + "px";
        clone.style.left = (touch.clientX - shiftX) + "px";
        clone.style.top = (touch.clientY - shiftY) + "px";
        clone.style.boxShadow = "0 10px 20px rgba(0,0,0,0.5)";
        document.body.appendChild(clone);
        
        card.style.opacity = "0.01"; // Mantém o espaço na lista original
    }, { passive: false });

    card.addEventListener("touchmove", (e) => {
        if (!clone) return;
        e.preventDefault(); // Impede que a tela role para baixo durante o arrasto
        
        const touch = e.touches[0];
        clone.style.left = (touch.clientX - shiftX) + "px";
        clone.style.top = (touch.clientY - shiftY) + "px";
        
        // Esconde temporariamente para achar o que está debaixo do dedo
        clone.style.display = "none";
        const elemUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        clone.style.display = "block";
        
        document.querySelectorAll(".cards").forEach(c => c.classList.remove("drag-over"));
        if (elemUnder) {
            const coluna = elemUnder.closest(".cards");
            if (coluna) coluna.classList.add("drag-over");
        }
    }, { passive: false });

    card.addEventListener("touchend", (e) => {
        if (!clone) return;
        
        const touch = e.changedTouches[0];
        clone.style.display = "none";
        const elemUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (elemUnder) {
            const coluna = elemUnder.closest(".cards");
            if (coluna) {
                atualizarStatusTarefa(tarefa.id, coluna.id);
            }
        }
        
        document.querySelectorAll(".cards").forEach(c => c.classList.remove("drag-over"));
        clone.remove();
        clone = null;
        card.style.opacity = "1";
    });

    return card;
}

/**
 * Adiciona uma nova tarefa na coluna "A Fazer"
 */
function adicionarTarefa() {
    const texto = prompt("Digite a nova tarefa:");
    if (!texto || texto.trim() === "") return;

    const novaTarefa = {
        id: gerarId(),
        texto: texto.trim(),
        status: "aFazer" // status inicial
    };

    estado.tarefas.push(novaTarefa);
    salvarDados();
    renderizarQuadros();
}

/**
 * Edita o texto de uma tarefa existente
 * @param {string} id - O ID da tarefa
 */
function editarTarefa(id) {
    const tarefa = estado.tarefas.find(t => t.id === id);
    if (!tarefa) return;

    const novoTexto = prompt("Editar tarefa:", tarefa.texto);
    if (novoTexto && novoTexto.trim() !== "") {
        tarefa.texto = novoTexto.trim();
        salvarDados();
        renderizarQuadros();
    }
}

/**
 * Configura os eventos de Drag Over e Drop nas colunas
 */
function configurarEventosColunas() {
    const colunas = document.querySelectorAll(".cards");

    colunas.forEach(coluna => {
        coluna.addEventListener("dragover", (e) => {
            e.preventDefault(); // Necessário para permitir o drop
            e.dataTransfer.dropEffect = "move";
            coluna.classList.add("drag-over");
        });

        coluna.addEventListener("dragleave", () => {
            coluna.classList.remove("drag-over");
        });

        coluna.addEventListener("drop", (e) => {
            e.preventDefault();
            coluna.classList.remove("drag-over");

            // Pegar o ID salvo no dragstart
            const id = e.dataTransfer.getData("text/plain");
            const novoStatus = coluna.id; // id da div.cards: aFazer, fazendo, concluido

            atualizarStatusTarefa(id, novoStatus);
        });
    });
}

/**
 * Atualiza o status da tarefa após ser solta
 * @param {string} id - ID da tarefa
 * @param {string} novoStatus - Novo status (id da coluna onde caiu)
 */
function atualizarStatusTarefa(id, novoStatus) {
    const tarefa = estado.tarefas.find(t => t.id === id);
    if (tarefa && tarefa.status !== novoStatus) {
        tarefa.status = novoStatus;
        salvarDados();
        renderizarQuadros();
    }
}

/**
 * Função utilitária para gerar IDs únicos (simples)
 */
function gerarId() {
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}