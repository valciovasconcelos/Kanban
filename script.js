document.addEventListener("DOMContentLoaded", function () {

    let botao = document.getElementById("btnAdicionar");

    // CARREGAR DADOS
    let dadosSalvos = localStorage.getItem("kanban");

    if (dadosSalvos) {
        let dados = JSON.parse(dadosSalvos);

        document.getElementById("aFazer").innerHTML = dados.aFazer;
        document.getElementById("fazendo").innerHTML = dados.fazendo;
        document.getElementById("concluido").innerHTML = dados.concluido;
    }

    ativarCards();

    // CRIAR CARD
    botao.addEventListener("click", function () {

        let texto = prompt("Digite a tarefa:");

        if (!texto) return;

        let card = criarCard(texto);

        document.getElementById("aFazer").appendChild(card);

        salvarDados();
    });

    // DRAG NAS COLUNAS
    let colunas = document.querySelectorAll(".cards");

    colunas.forEach(function(coluna) {

        coluna.addEventListener("dragover", function(e) {
            e.preventDefault();
        });

        coluna.addEventListener("drop", function() {

            let card = document.querySelector(".arrastando");

            coluna.appendChild(card);

            card.classList.remove("arrastando");

            salvarDados();
        });

    });

});


// FUNÇÃO PARA CRIAR CARD
function criarCard(texto) {

    let card = document.createElement("div");

    card.innerText = texto;
    card.classList.add("card");

    // DRAG
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", function () {
        card.classList.add("arrastando");
    });

    // EDITAR
    card.addEventListener("dblclick", function () {

        let novoTexto = prompt("Editar tarefa:", card.innerText);

        if (!novoTexto) return;

        card.innerText = novoTexto;

        salvarDados();
    });

    return card;
}


//  SALVAR
function salvarDados() {

    let dados = {
        aFazer: document.getElementById("aFazer").innerHTML,
        fazendo: document.getElementById("fazendo").innerHTML,
        concluido: document.getElementById("concluido").innerHTML
    };

    localStorage.setItem("kanban", JSON.stringify(dados));
}


//  REATIVAR CARDS
function ativarCards() {

    let cards = document.querySelectorAll(".card");

    cards.forEach(function(card) {

        card.setAttribute("draggable", "true");

        card.addEventListener("dragstart", function () {
            card.classList.add("arrastando");
        });

        card.addEventListener("dblclick", function () {

            let novoTexto = prompt("Editar tarefa:", card.innerText);

            if (!novoTexto) return;

            card.innerText = novoTexto;

            salvarDados();
        });

    });
}