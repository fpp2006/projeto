const CHAVE_REGISTROS = "lixo-no-lugar-certo-registros-v1";
let registros = null;

// troca caracteres especiais para ninguém conseguir colocar HTML nos registros
function limpar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function carregarRegistros() {
  registros = null;
  document.getElementById("lista").textContent = "Carregando registros...";

  let salvos;
  try {
    salvos = localStorage.getItem(CHAVE_REGISTROS);
    if (salvos !== null) {
      let dados = JSON.parse(salvos);
      if (!Array.isArray(dados)) {
        throw new Error("Lista local inválida");
      }
      registros = dados;
      mostrarRegistros(registros);
      return;
    }
  } catch (erro) {
    document.getElementById("lista").textContent = "Não foi possível ler os dados.";
    alert("Não foi possível ler os registros salvos.");
    return;
  }

  fetch("dados.json", { cache: "no-store" })
    .then(function (resposta) {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar dados.json: " + resposta.status);
      }
      return resposta.json();
    })
    .then(function (dados) {
      if (!Array.isArray(dados)) {
        throw new Error("Lista de registros inválida");
      }
      registros = dados;
      mostrarRegistros(registros);
    })
    .catch(function () {
      document.getElementById("lista").textContent = "Não foi possível carregar os registros.";
      alert("Não foi possível carregar dados.json. Verifique se ele foi publicado junto do site.");
    });
}

function salvarRegistros(novosRegistros) {
  try {
    localStorage.setItem(CHAVE_REGISTROS, JSON.stringify(novosRegistros));
  } catch (erro) {
    alert("Não foi possível salvar. Verifique se o armazenamento está permitido e tem espaço.");
    return false;
  }
  registros = novosRegistros;
  mostrarRegistros(registros);
  return true;
}

function mostrarRegistros(registros) {
  let lista = document.getElementById("lista");
  lista.innerHTML = "";

  if (registros.length == 0) {
    lista.innerHTML = "<p>Nenhum local registrado ainda.</p>";
    return;
  }

  for (let i = registros.length - 1; i >= 0; i--) {
    let r = registros[i];
    let html = "<div class='registro'>";
    html += "<p><b>Local:</b> " + limpar(r.local) + "</p>";
    html += "<p><b>Tipo:</b> " + limpar(r.tipo) + "</p>";
    if (r.descricao != "") {
      html += "<p><b>Descrição:</b> " + limpar(r.descricao) + "</p>";
    }
    html += "<p><b>Registrado por:</b> " + limpar(r.nome) + " em " + r.data;
    if (r.registradoEm) {
      let momentoRegistro = new Date(r.registradoEm);
      let horaRegistro = momentoRegistro.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      html += " às " + horaRegistro;
    }
    html += "</p>";

    if (r.resolvido) {
      html += "<p class='resolvido'>Descartado corretamente por " + limpar(r.resolvidoPor);
      if (r.resolvidoEm) {
        let momento = new Date(r.resolvidoEm);
        let data = momento.toLocaleDateString("pt-BR");
        let hora = momento.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        html += " em " + data + " às " + hora;
      }
      html += "</p>";
    } else {
      html += "<p class='pendente'>Lixo ainda no local</p>";
      html += "<button onclick='marcarResolvido(" + r.id + ")'>Marcar como descartado corretamente</button>";
    }

    html += "</div>";
    lista.innerHTML += html;
  }
}

function marcarResolvido(id) {
  if (registros === null) {
    alert("Carregue os registros antes de marcar um descarte.");
    return;
  }
  let indice = registros.findIndex(function (registro) {
    return registro.id == id;
  });
  if (indice == -1) {
    alert("Registro não encontrado. Atualize a lista.");
    return;
  }
  if (registros[indice].resolvido) {
    return;
  }

  let nome = prompt("Qual é o seu nome?");
  if (nome == null) {
    return; // a pessoa clicou em cancelar
  }

  let atualizados = registros.slice();
  atualizados[indice] = {
    ...registros[indice],
    resolvido: true,
    resolvidoPor: nome.trim() || "Anônimo",
    resolvidoEm: new Date().toISOString()
  };
  salvarRegistros(atualizados);
}

document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  if (registros === null) {
    alert("Carregue os registros antes de cadastrar um local.");
    return;
  }
  let local = document.getElementById("local").value.trim();
  if (local == "") {
    alert("Informe o local.");
    return;
  }

  let momento = new Date();
  let id = Date.now();
  while (registros.some(function (registro) { return registro.id == id; })) {
    id++;
  }
  let novo = {
    id: id,
    local: local,
    tipo: document.getElementById("tipo").value,
    descricao: document.getElementById("descricao").value,
    nome: document.getElementById("nome").value.trim() || "Anônimo",
    data: momento.toLocaleDateString("pt-BR"),
    registradoEm: momento.toISOString(),
    resolvido: false,
    resolvidoPor: ""
  };

  if (salvarRegistros(registros.concat(novo))) {
    document.getElementById("formulario").reset();
  }
});

carregarRegistros();
