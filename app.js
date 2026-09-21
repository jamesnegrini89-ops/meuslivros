let textoAtual = "";
let synth = window.speechSynthesis;
let apiKey = localStorage.getItem("gemini_api_key");

// Carrega as vozes do sistema assim que o app abre
let vozesDisponiveis = [];
synth.onvoiceschanged = () => {
    vozesDisponiveis = synth.getVoices();
};

if(apiKey) document.getElementById("api-key").value = apiKey;

function salvarChave() {
    apiKey = document.getElementById("api-key").value;
    localStorage.setItem("gemini_api_key", apiKey);
    alert("Chave salva!");
}

async function chamarGemini(promptTexto) {
    if (!apiKey) { alert("Salve a chave API primeiro."); return; }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptTexto }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) { return "Erro na conexão com o Gemini."; }
}

async function iniciarEstudo() {
    const ref = document.getElementById("referencia").value;
    if(!ref) return;
    document.getElementById("leitura-area").style.display = "block";
    document.getElementById("texto-exibicao").innerText = "Buscando...";

    const prompt = `Traga o texto exato da Bíblia (King James Atualizada) da referência: ${ref}. Abaixo, dê uma explicação simples do contexto e uso prático.`;
    textoAtual = await chamarGemini(prompt);
    
    document.getElementById("texto-exibicao").innerText = textoAtual;
    falar(textoAtual);
}

function falar(texto) {
    synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(texto);
    utterThis.lang = 'pt-BR';
    
    // A MÁGICA DO PLANO A / PLANO B:
    // Tenta encontrar a voz de alta qualidade do Google (Plano A)
    const vozGoogle = vozesDisponiveis.find(voz => voz.name.includes('Google') && voz.lang === 'pt-BR');
    
    if (vozGoogle) {
        utterThis.voice = vozGoogle; // Usa a IA do Google
    } else {
        // Se não achar, procura qualquer outra voz em Português do aparelho (Plano B)
        const vozLocal = vozesDisponiveis.find(voz => voz.lang === 'pt-BR' || voz.lang === 'pt-PT');
        if(vozLocal) utterThis.voice = vozLocal;
    }

    synth.speak(utterThis);
}

function pausarLeitura() { synth.pause(); }
function retomarLeitura() { synth.resume(); }

async function tirarDuvida() {
    pausarLeitura();
    const duvida = document.getElementById("duvida-input").value;
    if(!duvida) return;
    
    document.getElementById("texto-exibicao").innerText = "Pensando...";
    const prompt = `O usuário lê: "${textoAtual}". Dúvida: "${duvida}". Responda de forma curta, direta e com exemplo prático.`;
    const resposta = await chamarGemini(prompt);
    
    document.getElementById("texto-exibicao").innerText = "RESPOSTA:\n" + resposta + "\n\n--- TEXTO ORIGINAL ---\n" + textoAtual;
    falar(resposta);
}
