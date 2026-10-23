// troca caracteres especiais para ninguém conseguir colocar HTML nos registros
function limpar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function carregarRegistros() {
  fetch("/registros")
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (registros) {
      mostrarRegistros(registros);
    })
    .catch(function () {
      alert("Não foi possível carregar os registros.");
    });
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
  let nome = prompt("Qual é o seu nome?");
  if (nome == null) {
    return; // a pessoa clicou em cancelar
  }

  fetch("/registros/" + id + "/resolver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({nome: nome})
  })
    .then(function () {
      carregarRegistros();
    })
    .catch(function () {
      alert("Não foi possível atualizar o registro.");
    });
}

document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  let novo = {
    local: document.getElementById("local").value,
    tipo: document.getElementById("tipo").value,
    descricao: document.getElementById("descricao").value,
    nome: document.getElementById("nome").value
  };

  fetch("/registros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novo)
  })
    .then(function () {
      document.getElementById("formulario").reset();
      carregarRegistros();
    })
    .catch(function () {
      alert("Não foi possível salvar o registro.");
    });
});

carregarRegistros();
