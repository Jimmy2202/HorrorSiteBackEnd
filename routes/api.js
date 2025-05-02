import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const router = express.Router();
const google_key = process.env.GOOGLE_TOKEN;
const CX = "52c35f6db65164e54";
const openai = new OpenAI({ apiKey: process.env.GPT_TOKEN });

router.get("/movies", async (req, res) => {
  try {
    const apiKey = process.env.MOVIE_TOKEN; // ou coloque direto
    const pagesToFetch = [1, 2, 3, 4];
    const allMovies = [];

    for (const page of pagesToFetch) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=pt-BR&page=${page}&sort_by=popularity.desc&with_genres=27`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const data = await response.json();
      const filtered = data.results.map((item) => ({
        title: item.title,
        overview: item.overview,
        poster_path: item.poster_path,
      }));
      allMovies.push(...filtered);
    }

    res.json(allMovies); // envia tudo junto pro frontend
  } catch (error) {
    console.error("Erro ao buscar filmes:", error);
    res.status(500).json({ error: "Erro ao buscar filmes" });
  }
});

// Função que pede ao GPT palavras-chave para busca de imagem
async function generateKeywordsFromVillain(vilain) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Crie uma lista curta de palavras-chave separadas por espaço para buscar imagens do vilão "${vilain}".
          Pode incluir outros nomes que ele tenha, os filmes que participou e etc.
          A resposta deve ser apenas uma linha de palavras-chave, sem aspas e sem pontuação.`,
        },
      ],
    });

    const keywords = completion.choices[0].message.content.trim();
    return keywords;
  } catch (error) {
    console.error("Erro ao gerar palavras-chave com GPT:", error);
    return vilain; // fallback simples
  }
}

const fetchPrompt = async (prompt) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `GPT, com base no User Response de cada pergunta, retorne um vilão de filme ou série de horror/terror/suspense que o usuário parece e o motivo. 
        Responda apenas no formato JSON, exatamente assim: 
        {"vilao": "Nome do vilao","motivo": "Explicação do motivo com base nas respostas. Capriche bem no motivo por favor.","imagem": "Link direto de uma imagem pública estática representando visualmente esse vilão. Pode ser de sites como Wikipedia, Imgur, Wikimedia ou Fandom. Nunca retorne imagens genéricas nem links quebrados. O link deve abrir diretamente a imagem."}
        Quando for explicar o motivo, sempre se refira cao usuário de forma direta com pronomes como você, sua, seu, etc, e de preferência, de maneira descolada e um pouco informal, mas explicando bem os motivos.
        Na escolha do vilão, você pode sair do clichê.Escolha o vilão exatamente ideal, sendo mais ou menos conhecido. Dê preferencia a filmes mas pode ser series, jogos, etc, mas sempre um vilão específico, e não generalizado.
        Se não conseguir achar uma resposta por campos vazios, devolva: 
        {"vilao": "null","motivo": "null","imagem": "null"} 
        Não responda com aspas antes do JSON, nem absolutamente nada escrito, pois vou precisar utilizar esse json.
        Retorne apenas esse JSON, apenas as chaves e o conteúdo dentro dela sem nenhum texto antes ou depois. Por favor, não retorne nenhum texto antes do json ou depois, apenas o JSON puro e limpo.
        Respostas e Perguntas: ${prompt}`,
      },
    ],
    model: "gpt-4o",
  });
  return completion.choices[0];
};

async function fetchImage(query) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${google_key}&cx=${CX}&searchType=image&q=${query}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data.items?.[0]?.link;
  } catch (error) {
    console.error(error);
  }
}

router.post("/image", async (req, res) => {
  const { vilain } = req.body;

  try {
    const keywords = await generateKeywordsFromVillain(vilain);
    console.log(keywords);
    const image = await fetchImage(keywords); // busca usando as palavras-chave
    res.json(image);
  } catch (error) {
    console.error("Erro ao buscar imagem:", error);
    res.status(500).json({ error: "Erro ao buscar imagem com base no vilão." });
  }
});

router.post("/analyzeresponse", async (req, res) => {
  const { formated_responses } = req.body;
  const prompt = formated_responses
    .map((response) => {
      return response;
    })
    .join("\n\n");
  const response = await fetchPrompt(prompt);
  console.log(response);
  res.json(response);
});

export default router;
