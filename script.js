const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

//Variáveis de estado
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "googleApi";
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`;

//Carregar os dados salvos no localStorage
const loadSavedChatHistory = () => {
  const savedConversations =
    JSON.parse(localStorage.getItem("saved-api-chats")) || [];

  const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

  document.body.classList.toggle("light_mode", isLightTheme);
  themeToggleButton.innerHTML = isLightTheme
    ? '<i class="bx bx-moon"></i>'
    : '<i class="bx bx-sun"></i>';

  chatHistoryContainer.innerHTML = "";
  //Iterar através do histórico de conversas salvas e exibir mensagem
  savedConversations.forEach((conversation) => {
    //Mostra a mensagem do usuário
    const userMessageHtml = `
    <div class="message__conntent">
        <img class="message__avatar" src="assets/profile.png" alt="User avatar">
        <p class="message__text">${conversation.userMessage}</p>
    </div>
    `;

    const outgoingMessageElement = createChatMessageElement(
      userMessageHtml,
      "message--outgoing"
    );
    chatHistoryContainer.appendChild(outgoingMessageElement);
    //Mostrar a resposta da API
    const responseText =
      conversation.apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
    //Converter para HTML
    const parsedApiResponse = marked.parse(responseText);
    //Versão texto normal
    const rawApiResponse = responseText;

    const responseHtml = `
    <div class="message__content">
      <img
        class="message__avatar"
        src="assets/gemini.svg"
        alt="Gemini avatar"
      />
      <p class="message__text"></p>
      <div class="message__loading-indicator hide">
        <div class="message__loading-bar"></div>
        <div class="message__loading-bar"></div>
        <div class="message__loading-bar"></div>
      </div>
    </div>
    <span onclick="copyMessageToClipBoard(this)" class="message__icon hide">
        <i class="bx bx-copy-alt"></i>
    </span>
    `;

    const incomingMessageElement = createChatMessageElement(
      responseHtml,
      "message--incoming"
    );
    chatHistoryContainer.appendChild(incomingMessageElement);

    const messageTextElement =
      incomingMessageElement.querySelector(".message__text");

    //Mostra os chats salvos sem o efeito "maquina de escrever"
    showTypingEffect(
      rawApiResponse,
      parsedApiResponse,
      messageTextElement,
      incomingMessageElement,
      true
    ); // 'true' pula o efeito "maquina de escrever"
  });

  document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

//Cria um novo elemento mensagem
const createChatMessageElement = (htmlContent, ...cssClasses) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", ...cssClasses);
  messageElement.innerHTML = htmlContent;
  return messageElement;
};

//Mostra o efeito de digitação
const showTypingEffect = (
  rawText,
  htmlText,
  messageElement,
  incomingMessageElement,
  skipEffect = false
) => {
  const copyIconElement =
    incomingMessageElement.querySelector(".message__icon");
  copyIconElement.classList.add("hide"); //Inicialmente esconde o botão copiar
  if (skipEffect) {
    //Exibe o conteúdo diretamente sem a animação "digitar"
    messageElement.innerHTML = htmlText;
    hljs.highlightAll();
    addCopyButtonToCodeBlocks();
    copyIconElement.classList.remove("hide"); //Mostra o botão copiar
    isGeneratingResponse = false;
    return;
  }

  const wordsArray = rawText.split(" ");
  let wordIndex = 0;

  const typingInterval = setInterval(() => {
    messageElement.innerHTML +=
      (wordIndex === 0 ? "" : " ") + wordsArray[wordIndex++];
    if (wordIndex === wordsArray.length) {
      clearInterval(typingInterval);
      isGeneratingResponse = false;
      messageElement.innerHTML = htmlText;
      hljs.highlightAll();
      addCopyButtonToCodeBlocks();
      copyIconElement.classList.remove("hide");
      fetc;
    }
  }, 75);
};

//Busca a resposta da API com base na entrada do usuário
const requestApiResponse = async (incomingMessageElement) => {
  const messageTextElement =
    incomingMessageElement.querySelector(".message__text");

  try {
    const response = await fetch(API_REQUEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: currentUserMessage }] }],
      }),
    });

    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error.message);

    const responseText =
      responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("Invalid API response.");

    const parsedApiResponse = marked.parse(responseText);
    const rawApiResponse = responseText;

    showTypingEffect(
      rawApiResponse,
      parsedApiResponse,
      messageTextElement,
      incomingMessageElement
    );

    //Salva a conversa no armazenamento local
    let savedConversations =
      JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    savedConversations.push({
      userMessage: currentUserMessage,
      apiResponse: responseData,
    });
    localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
  } catch (error) {
    isGeneratingResponse = false;
    messageTextElement.innerText = error.message;
    messageTextElement.closest(".message").classList.add("message--error");
  } finally {
    incomingMessageElement.classList.remove("message--loading");
  }
};

//Adiciona botão de copiar aos blocos de código
const addCopyButtonToCodeBlocks = () => {
  const codeBlocks = document.querySelectorAll("pre");
  codeBlocks.forEach((block) => {
    const codeElement = block.querySelector("code");
    let language =
      [...codeElement.classList]
        .find((cls) => cls.startsWith("language-"))
        ?.replace("language-", "") || "Text";

    const languageLabel = document.createElement("div");
    languageLabel.innerText =
      language.charAt(0).toUpperCase() + language.slice(1);
    languageLabel.classList.add("code__language-label");
    block.appendChild(languageLabel);

    const copyButton = document.createElement("button");
    copyButton.innerHTML = `<i class='bx bx-copy'></i>`;
    copyButton.classList.add("code__copy-btn");
    block.appendChild(copyButton);

    copyButton.addEventListener("click", () => {
      navigator.clipboard
        .writeText(codeElement.innerText)
        .then(() => {
          copyButton.innerHTML = `<i class='bx bx-check'></i>`;
          setTimeout(
            () => (copyButton.innerHTML = `<i class='bx bx-copy'></i>`),
            2000
          );
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          alert("Unable to copy text!");
        });
    });
  });
};

//Mostra animação de carregamento durante solicitação de API
const displayLoadingAnimation = () => {
  const loadingHtml = `

        <div class="message__content">
            <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
            <p class="message__text"></p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
        <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    
    `;

  const loadingMessageElement = createChatMessageElement(
    loadingHtml,
    "message--incoming",
    "message--loading"
  );
  chatHistoryContainer.appendChild(loadingMessageElement);

  requestApiResponse(loadingMessageElement);
};

//Copia a mensagem para a área de transferência
const copyMessageToClipboard = (copyButton) => {
  const messageContent =
    copyButton.parentElement.querySelector(".message__text").innerText;

  navigator.clipboard.writeText(messageContent);
  copyButton.innerHTML = `<i class='bx bx-check'></i>`; // Icone de confirmação
  setTimeout(
    () => (copyButton.innerHTML = `<i class='bx bx-copy-alt'></i>`),
    1000
  ); // Reverte ícone após 1 segundo
};

// Lida com o envio de mensagens de chat
const handleOutgoingMessage = () => {
  currentUserMessage =
    messageForm.querySelector(".prompt__form-input").value.trim() ||
    currentUserMessage;
  if (!currentUserMessage || isGeneratingResponse) return; // Sai se não houver mensagem ou já estiver gerando resposta

  isGeneratingResponse = true;

  const outgoingMessageHtml = `
    
        <div class="message__content">
            <img class="message__avatar" src="assets/profile.png" alt="User avatar">
            <p class="message__text"></p>
        </div>

    `;

  const outgoingMessageElement = createChatMessageElement(
    outgoingMessageHtml,
    "message--outgoing"
  );
  outgoingMessageElement.querySelector(".message__text").innerText =
    currentUserMessage;
  chatHistoryContainer.appendChild(outgoingMessageElement);

  messageForm.reset(); //Limpa o campo de entrada
  document.body.classList.add("hide-header");
  setTimeout(displayLoadingAnimation, 500); //Mostra animação de carregamento após atraso
};

// Alterna entre temas claros e escuros
themeToggleButton.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

  //Atualiza o ícone com base no tema
  const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
  themeToggleButton.querySelector("i").className = newIconClass;
});

//Limpa todo o histórico de bate-papo
clearChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all chat history?")) {
    localStorage.removeItem("saved-api-chats");

    // Recarrega o histórico do chat para refletir as alterações
    loadSavedChatHistory();

    currentUserMessage = null;
    isGeneratingResponse = false;
  }
});

// Lida com cliques nos itens de sugestão
suggestionItems.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    currentUserMessage = suggestion.querySelector(
      ".suggests__item-text"
    ).innerText;
    handleOutgoingMessage();
  });
});

// Evita o envio padrão e trata a mensagem de saída
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingMessage();
});

// Carrega o histórico de bate-papo salvo no carregamento da páginad
loadSavedChatHistory();
