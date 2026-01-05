// Variáveis de estado globais
let participantes = [];
let numeroDePessoas = 0;
let notas = []; // Array para armazenar todas as notas cadastradas
let totalGasto = 0;
let valorPorPessoa = 0;

// ==========================================================
// ETAPA 1: DEFINIR PARTICIPANTES
// ==========================================================

/**
 * Gera os campos de input para os nomes com base no número de participantes.
 */
function gerarCamposParticipantes() {
    numeroDePessoas = parseInt(document.getElementById('pessoas').value);
    const camposNomesDiv = document.getElementById('camposNomes');
    camposNomesDiv.innerHTML = '';

    if (isNaN(numeroDePessoas) || numeroDePessoas <= 0) {
        alert("Por favor, insira um número válido de participantes (mínimo 1).");
        camposNomesDiv.classList.add('hidden');
        return;
    }

    for (let i = 1; i <= numeroDePessoas; i++) {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <label for="nome-${i}">Nome Participante ${i}:</label>
            <input type="text" id="nome-${i}" placeholder="Nome do Participante ${i}" value="Pessoa ${i}" required>
        `;
        camposNomesDiv.appendChild(div);
    }

    // Botão de Confirmação 
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirmar Nomes e Avançar';
    confirmBtn.onclick = confirmarNomes;
    camposNomesDiv.appendChild(confirmBtn);

    camposNomesDiv.classList.remove('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('resultados').classList.add('hidden');
}

/**
 * Coleta os nomes, popula o combo box do pagador da nota e avança para a Etapa 2.
 */
function confirmarNomes() {
    participantes = [];
    const selectPagador = document.getElementById('pagadorAtual');
    selectPagador.innerHTML = '<option value="">-- Selecione o Pagador --</option>';

    let nomesValidos = true;
    for (let i = 1; i <= numeroDePessoas; i++) {
        const nomeInput = document.getElementById(`nome-${i}`);
        let nome = nomeInput ? nomeInput.value.trim() : `Pessoa ${i}`;

        if (!nome) {
            alert(`Por favor, preencha o nome do Participante ${i}.`);
            nomesValidos = false;
            break;
        }

        // Armazena o nome
        participantes.push({ nome: nome });

        // Adiciona a opção ao combo box (dropdown)
        const option = document.createElement('option');
        option.value = nome;
        option.textContent = nome;
        selectPagador.appendChild(option);
    }

    if (!nomesValidos) return;

    // Reseta o estado das notas
    notas = [];
    totalGasto = 0;
    document.getElementById('listaNotasUl').innerHTML = '';
    document.getElementById('totalAcumulado').textContent = 'R$ 0.00';

    // Passa para a Etapa 2
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('resultados').classList.add('hidden');
}

// ==========================================================
// ETAPA 2: REGISTRO DE NOTAS
// ==========================================================

/**
 * Adiciona uma nota à lista de notas (Array 'notas').
 */
function adicionarNota() {
    const valorNota = parseFloat(document.getElementById('valorNotaAtual').value);
    const nomePagador = document.getElementById('pagadorAtual').value;

    if (isNaN(valorNota) || valorNota <= 0 || !nomePagador) {
        alert("Por favor, insira um valor de nota válido e selecione quem pagou.");
        return;
    }

    // 1. Adiciona a nota ao array de notas
    notas.push({
        valor: valorNota,
        pagador: nomePagador
    });

    // 2. Atualiza o total acumulado
    totalGasto += valorNota;

    // 3. Atualiza a exibição na tela
    document.getElementById('totalAcumulado').textContent = `R$ ${totalGasto.toFixed(2)}`;

    const listaNotasUl = document.getElementById('listaNotasUl');
    const li = document.createElement('li');
    li.textContent = `Nota de R$ ${valorNota.toFixed(2)} - Pago por: ${nomePagador}`;
    listaNotasUl.appendChild(li);

    // 4. Limpa os campos para a próxima nota
    document.getElementById('valorNotaAtual').value = '';
    document.getElementById('pagadorAtual').value = '';
}

// ==========================================================
// ETAPA 3: CÁLCULOS FINAIS
// ==========================================================

/**
 * Calcula a divisão igualitária do TOTAL GASTO e as transferências necessárias.
 */
function calcularTransferenciasFinais() {
    if (notas.length === 0) {
        alert("Por favor, adicione pelo menos uma nota fiscal antes de calcular.");
        return;
    }

    // 1. Valor Devido por pessoa
    valorPorPessoa = totalGasto / numeroDePessoas;

    // 2. Cálculo do Total Pago e Saldo para cada pessoa

    // Cria uma cópia com as propriedades de cálculo
    const participantesCalculados = participantes.map(p => ({
        nome: p.nome,
        totalPago: 0,
        saldo: 0
    }));

    // Soma o total pago por cada pessoa
    notas.forEach(nota => {
        const pagador = participantesCalculados.find(p => p.nome === nota.pagador);
        if (pagador) {
            pagador.totalPago += nota.valor;
        }
    });

    // Calcula o saldo final (o que a pessoa tem a receber ou a pagar)
    participantesCalculados.forEach(p => {
        // Saldo = Total Pago - Valor Devido
        p.saldo = p.totalPago - valorPorPessoa;
    });

    // 3. Exibe os resultados gerais
    document.getElementById('totalGasto').textContent = `R$ ${totalGasto.toFixed(2)}`;
    document.getElementById('valorPorPessoa').textContent = `R$ ${valorPorPessoa.toFixed(2)}`;

    // 4. Algoritmo de Settle-Up (quem paga quem)

    // Separa e ordena: devedores (saldo negativo) e credores (saldo positivo)
    const devedores = participantesCalculados
        .filter(p => p.saldo < -0.01) // Margem de erro para evitar problemas de ponto flutuante
        .sort((a, b) => a.saldo - b.saldo); // Maior devedor primeiro

    const credores = participantesCalculados
        .filter(p => p.saldo > 0.01) // Margem de erro
        .sort((a, b) => b.saldo - a.saldo); // Maior credor primeiro

    let transferencias = [];
    let i = 0; // Devedores index
    let j = 0; // Credores index

    // O loop continua enquanto houver devedores e credores
    while (i < devedores.length && j < credores.length) {
        let devedor = devedores[i];
        let credor = credores[j];

        const valorADevido = Math.abs(devedor.saldo);
        const valorAReceber = credor.saldo;

        // Valor a ser transferido é o menor dos dois montantes
        const valorTransferido = Math.min(valorADevido, valorAReceber);

        if (valorTransferido > 0.01) {
            transferencias.push({
                devedor: devedor.nome,
                credor: credor.nome,
                valor: valorTransferido
            });

            // Ajusta os saldos para a próxima iteração
            devedor.saldo += valorTransferido; // O saldo do devedor se aproxima de zero
            credor.saldo -= valorTransferido;  // O saldo do credor se aproxima de zero
        }

        // Avança para o próximo se o saldo foi equilibrado
        if (Math.abs(devedor.saldo) < 0.01) {
            i++;
        }

        if (credor.saldo < 0.01) {
            j++;
        }
    }

    // 5. Exibe o resumo das transferências
    const listaTransferencias = document.getElementById('listaTransferencias');
    listaTransferencias.innerHTML = '';
    document.getElementById('resumoTransferencias').classList.remove('hidden');

    if (transferencias.length === 0) {
        const li = document.createElement('li');
        li.textContent = "🥳 Contas já estão equilibradas! Nenhuma transferência necessária.";
        listaTransferencias.appendChild(li);
    } else {
        transferencias.forEach(t => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${t.devedor}</strong> transfere <strong>R$ ${t.valor.toFixed(2)}</strong> para <strong>${t.credor}</strong>.`;
            listaTransferencias.appendChild(li);
        });
    }

    // 6. Exibe a seção de resultados
    document.getElementById('resultados').classList.remove('hidden');
}