// Servidor simples: guarda os registros no arquivo dados.json
// Para rodar: node server.js e abrir http://localhost:3000

const http = require("http");
const fs = require("fs");

const PORTA = 3000;
const ARQUIVO = "dados.json";

function lerDados() {
  if (!fs.existsSync(ARQUIVO)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));
}

function salvarDados(registros) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(registros, null, 2));
}

function enviarArquivo(res, nome, tipo) {
  fs.readFile(nome, function (erro, conteudo) {
    if (erro) {
      res.writeHead(404);
      res.end("Arquivo não encontrado");
      return;
    }
    res.writeHead(200, { "Content-Type": tipo });
    res.end(conteudo);
  });
}

function lerCorpo(req, callback) {
  let corpo = "";
  req.on("data", function (pedaco) {
    corpo += pedaco;
  });
  req.on("end", function () {
    try {
      callback(JSON.parse(corpo));
    } catch (e) {
      callback({});
    }
  });
}

const servidor = http.createServer(function (req, res) {
  // páginas do site
  if (req.method == "GET" && req.url == "/") {
    enviarArquivo(res, "index.html", "text/html; charset=utf-8");
  } else if (req.method == "GET" && req.url == "/style.css") {
    enviarArquivo(res, "style.css", "text/css; charset=utf-8");
  } else if (req.method == "GET" && req.url == "/script.js") {
    enviarArquivo(res, "script.js", "text/javascript; charset=utf-8");
  }

  // lista todos os registros
  else if (req.method == "GET" && req.url == "/registros") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lerDados()));
  }

  // cria um registro novo
  else if (req.method == "POST" && req.url == "/registros") {
    lerCorpo(req, function (dados) {
      if (!dados.local || dados.local.trim() == "") {
        res.writeHead(400);
        res.end("Local é obrigatório");
        return;
      }

      let registros = lerDados();
      let registradoEm = new Date();
      let novo = {
        id: Date.now(),
        local: dados.local,
        tipo: dados.tipo || "Outro",
        descricao: dados.descricao || "",
        nome: dados.nome || "Anônimo",
        data: registradoEm.toLocaleDateString("pt-BR"),
        registradoEm: registradoEm.toISOString(),
        resolvido: false,
        resolvidoPor: ""
      };
      registros.push(novo);
      salvarDados(registros);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(novo));
    });
  }

  // marca um registro como descartado corretamente
  else if (req.method == "POST" && req.url.startsWith("/registros/") && req.url.endsWith("/resolver")) {
    let id = Number(req.url.split("/")[2]);

    lerCorpo(req, function (dados) {
      let registros = lerDados();
      let achou = false;

      for (let i = 0; i < registros.length; i++) {
        if (registros[i].id == id) {
          if (!registros[i].resolvido) {
            registros[i].resolvido = true;
            registros[i].resolvidoPor = dados.nome || "Anônimo";
            registros[i].resolvidoEm = new Date().toISOString();
          }
          achou = true;
        }
      }

      if (!achou) {
        res.writeHead(404);
        res.end("Registro não encontrado");
        return;
      }

      salvarDados(registros);
      res.writeHead(200);
      res.end("ok");
    });
  }

  else {
    res.writeHead(404);
    res.end("Página não encontrada");
  }
});

servidor.listen(PORTA, function () {
  console.log("Site rodando em http://localhost:" + PORTA);
});
