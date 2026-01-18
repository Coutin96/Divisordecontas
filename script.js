// Variáveis de estado globais
let participantes = [];
let numeroDePessoas = 0;
let notas = []; // Array para armazenar todas as notas cadastradas
let totalGasto = 0;

// ==========================================================
// ETAPA 1: DEFINIR PARTICIPANTES
// ==========================================================

/**
 * Gera os campos de input para os nomes com base no número de participantes.
 */
function gerarCamposParticipantes() {
    numeroDePessoas = parseInt(document.getElementById('pessoas').value);
    const camposNomesDiv = document.getElementById('camposNomes');
    camposNomesDiv.innerHTML = ''; // Limpa campos anteriores

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
 * Coleta os nomes, popula os campos e avança para a Etapa 2.
 */
function confirmarNomes() {
    participantes = [];
    const selectPagador = document.getElementById('pagadorAtual');
    const participantesContainer = document.getElementById('participantesNotaContainer'); // NOVO

    selectPagador.innerHTML = '<option value="">-- Selecione o Pagador --</option>';
    participantesContainer.innerHTML = ''; // NOVO: Limpa checkboxes antigos

    let nomesValidos = true;
    for (let i = 1; i <= numeroDePessoas; i++) {
        const nomeInput = document.getElementById(`nome-${i}`);
        let nome = nomeInput ? nomeInput.value.trim() : `Pessoa ${i}`;

        if (!nome) {
            alert(`Por favor, preencha o nome do Participante ${i}.`);
            nomesValidos = false;
            break;
        }

        participantes.push({ nome: nome });

        // Adiciona a opção ao combo box do pagador
        const optionPagador = document.createElement('option');
        optionPagador.value = nome;
        optionPagador.textContent = nome;
        selectPagador.appendChild(optionPagador);

        // NOVO: Cria e adiciona o checkbox para o participante
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `participante-${nome}`;
        checkbox.value = nome;
        checkbox.checked = true; // Selecionado por padrão

        const label = document.createElement('label');
        label.htmlFor = `participante-${nome}`;
        label.textContent = nome;

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        participantesContainer.appendChild(checkboxItem);
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

    // NOVO: Coleta os participantes selecionados dos checkboxes
    const checkboxesSelecionados = document.querySelectorAll('#participantesNotaContainer input[type="checkbox"]:checked');
    const participantesSelecionados = Array.from(checkboxesSelecionados).map(cb => cb.value);

    if (isNaN(valorNota) || valorNota <= 0 || !nomePagador || participantesSelecionados.length === 0) {
        alert("Por favor, insira um valor de nota válido, selecione quem pagou e ao menos um participante.");
        return;
    }

    // Verifica se o pagador está na lista de participantes
    if (!participantesSelecionados.includes(nomePagador)) {
        alert("O pagador deve estar incluído na lista de participantes da nota.");
        return;
    }

    // 1. Adiciona a nota ao array de notas com os participantes
    notas.push({
        valor: valorNota,
        pagador: nomePagador,
        participantes: participantesSelecionados
    });

    // 2. Atualiza o total acumulado
    totalGasto += valorNota;

    // 3. Atualiza a exibição na tela
    document.getElementById('totalAcumulado').textContent = `R$ ${totalGasto.toFixed(2)}`;

    const listaNotasUl = document.getElementById('listaNotasUl');
    const li = document.createElement('li');
    li.textContent = `R$ ${valorNota.toFixed(2)} (Pago por: ${nomePagador}) - Part.: ${participantesSelecionados.join(', ')}`;
    listaNotasUl.appendChild(li);

    // 4. Limpa os campos para a próxima nota
    document.getElementById('valorNotaAtual').value = '';
    document.getElementById('pagadorAtual').value = '';

    // NOVO: Reseta a seleção de participantes para todos
    const todosCheckboxes = document.querySelectorAll('#participantesNotaContainer input[type="checkbox"]');
    todosCheckboxes.forEach(cb => cb.checked = true);
}

// ==========================================================
// ETAPA 3: CÁLCULOS FINAIS
// ==========================================================

/**
 * Calcula a divisão e as transferências necessárias.
 */
function calcularTransferenciasFinais() {
    if (notas.length === 0) {
        alert("Por favor, adicione pelo menos uma nota fiscal antes de calcular.");
        return;
    }

    // 1. Inicializa o objeto de cálculo para cada participante
    const participantesCalculados = participantes.map(p => ({
        nome: p.nome,
        totalPago: 0,
        valorDevido: 0,
        saldo: 0 // Saldo = Total Pago - Valor Devido
    }));

    // 2. Calcula o total pago por cada um e o valor devido por cada nota
    notas.forEach(nota => {
        const valorPorParticipante = nota.valor / nota.participantes.length;

        // Adiciona o valor pago ao pagador
        const pagadorIndex = participantesCalculados.findIndex(p => p.nome === nota.pagador);
        if (pagadorIndex !== -1) {
            participantesCalculados[pagadorIndex].totalPago += nota.valor;
        }

        // Divide o valor da nota entre os participantes
        nota.participantes.forEach(participanteNome => {
            const participanteIndex = participantesCalculados.findIndex(p => p.nome === participanteNome);
            if (participanteIndex !== -1) {
                participantesCalculados[participanteIndex].valorDevido += valorPorParticipante;
            }
        });
    });

    // 3. Calcula o saldo final de cada pessoa
    participantesCalculados.forEach(p => {
        p.saldo = p.totalPago - p.valorDevido;
    });

    // 4. Exibe os resultados gerais
    document.getElementById('totalGasto').textContent = `R$ ${totalGasto.toFixed(2)}`;

    // 5. Popula a tabela de resumo individual
    const corpoTabela = document.getElementById('corpoTabelaResumo');
    corpoTabela.innerHTML = ''; // Limpa resultados anteriores

    participantesCalculados.forEach(p => {
        const tr = document.createElement('tr');

        let saldoClass = '';
        let saldoTexto = `R$ ${Math.abs(p.saldo).toFixed(2)}`;

        if (p.saldo < -0.01) { // Devedor
            saldoClass = 'saldo-negativo';
            saldoTexto = `deve ${saldoTexto}`;
        } else if (p.saldo > 0.01) { // Credor
            saldoClass = 'saldo-positivo';
            saldoTexto = `recebe ${saldoTexto}`;
        } else { // Equilibrado
            saldoTexto = `R$ 0.00`;
        }

        tr.innerHTML = `
            <td>${p.nome}</td>
            <td>R$ ${p.totalPago.toFixed(2)}</td>
            <td>R$ ${p.valorDevido.toFixed(2)}</td>
            <td class="${saldoClass}">${saldoTexto}</td>
        `;
        corpoTabela.appendChild(tr);
    });

    // 6. Algoritmo de Settle-Up (quem paga quem)
    const devedores = participantesCalculados
        .filter(p => p.saldo < -0.01)
        .sort((a, b) => a.saldo - b.saldo);

    const credores = participantesCalculados
        .filter(p => p.saldo > 0.01)
        .sort((a, b) => b.saldo - a.saldo);

    let transferencias = [];
    let i = 0;
    let j = 0;

    while (i < devedores.length && j < credores.length) {
        let devedor = devedores[i];
        let credor = credores[j];

        const valorADevido = Math.abs(devedor.saldo);
        const valorAReceber = credor.saldo;
        const valorTransferido = Math.min(valorADevido, valorAReceber);

        if (valorTransferido > 0.01) {
            transferencias.push({
                devedor: devedor.nome,
                credor: credor.nome,
                valor: valorTransferido
            });

            devedor.saldo += valorTransferido;
            credor.saldo -= valorTransferido;
        }

        if (Math.abs(devedor.saldo) < 0.01) i++;
        if (credor.saldo < 0.01) j++;
    }

    // 7. Exibe o resumo das transferências
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

    // 8. Exibe a seção de resultados
    document.getElementById('resultados').classList.remove('hidden');
}