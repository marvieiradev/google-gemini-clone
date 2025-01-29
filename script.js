const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const sugestionsItens = document.querySelector(".suggests__item");

const themeToggleButton = document.querySelector("themeToggler");
const clearChatButton = document.querySelector("deleteButton");

//Variáveis de estado
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "apikey";
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`;

//Carregar os dados salvos no localStorage
const loadSavedChatStory = () => {
  const savedConversations =
    JSON.parse(localStorage.getItem("saved-api-chats")) || [];

  const isLightTheme = localStorage.getItem("theme-color") === "light_mode";

  document.body.classList.toggle("light_mode", isLightTheme);
  themeToggleButton.innerHTML = isLightTheme
    ? '<i class="bx bx-moon"></i>'
    : '<i class="bx bx-sun"></i>';

  chatHistoryContainer.innerHTML = "";
  //Iterar através do histórico de conversas salvas e exibir mensagem
  savedConversations.forEach((conversation) => {
    //Display a mensagem do usuário
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
    //Mostrar a respose da API
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

    //Mostra os chats salvos sem o efeito "escrita"
    showTypingEffect(
      rawApiResponse,
      parsedApiResponse,
      messageTextElement,
      incomingMessageElement,
      true
    ); // 'true' pula o efeito "escrever"
  });

  document.body.classList.toggle("hide-header", savedConversations.length > 0);
};
