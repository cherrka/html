const bookList = document.getElementById("book-list");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const closeButton = document.querySelector(".close-button");

let books = [];

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();

  if (!query) return;

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
    );
    if (!res.ok) throw new Error("Ошибка при загрузке данных");
    const data = await res.json();
    books = data.docs || [];
    renderBooks(books);
  } catch (err) {
    bookList.innerHTML = `<p style="color:red;">Ошибка: ${err.message}</p>`;
  }
});

sortSelect.addEventListener("change", () => {
  if (!books.length) return;
  const sorted = [...books];
  const value = sortSelect.value;

  if (value === "title") {
    sorted.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
  } else if (value === "year") {
    sorted.sort((a, b) =>
      (a.first_publish_year || 0) - (b.first_publish_year || 0)
    );
  }

  renderBooks(sorted);
});

function renderBooks(bookArray) {
  bookList.innerHTML = "";

  if (!bookArray.length) {
    bookList.innerHTML = "<p>Книги не найдены.</p>";
    return;
  }

  bookArray.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";

    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : "https://via.placeholder.com/128x190?text=Нет+обложки";

    card.innerHTML = `
      <img src="${coverUrl}" alt="Обложка книги" class="book-cover">
      <h3>${book.title}</h3>
      <p><strong>Автор:</strong> ${book.author_name?.join(", ") || "Неизвестно"}</p>
      <p><strong>Год:</strong> ${book.first_publish_year || "?"}</p>
    `;

    card.addEventListener("click", () => openModal(book));
    bookList.appendChild(card);
  });
}

// --- Новый код ---

function openModal(book) {
  // Описание и доп. инфо: для подробного описания нужно отдельный запрос
  fetch(`https://openlibrary.org${book.key}.json`)
    .then(res => {
      if (!res.ok) throw new Error("Ошибка при загрузке деталей книги");
      return res.json();
    })
    .then(details => {
      // Получаем описание (если есть)
      let description = "";
      if (details.description) {
        description = typeof details.description === "string" 
          ? details.description 
          : details.description.value || "";
      }

      // Количество страниц
      const pages = details.number_of_pages || "?";
      // ISBN (может быть массив)
      const isbn = details.isbn_10 ? details.isbn_10.join(", ") : "?";

      // Формируем контент модалки
      modalBody.innerHTML = `
        <h2>${book.title}</h2>
        <p><strong>Автор(ы):</strong> ${book.author_name?.join(", ") || "Неизвестно"}</p>
        <p><strong>Год публикации:</strong> ${book.first_publish_year || "?"}</p>
        <p><strong>Издательства:</strong> ${book.publisher?.join(", ") || "?"}</p>
        <p><strong>Язык:</strong> ${book.language?.join(", ") || "?"}</p>
        <p><strong>Страниц:</strong> ${pages}</p>
        <p><strong>ISBN:</strong> ${isbn}</p>
        <p><strong>Описание:</strong> ${description || "Нет описания"}</p>
        <hr>

        <h3>Отзывы</h3>
        <div id="reviews-list"></div>
        <form id="review-form">
          <textarea id="review-text" rows="3" placeholder="Оставьте отзыв" required></textarea>
          <button type="submit">Добавить отзыв</button>
        </form>
        <hr>

        <h3>Рекомендации по автору</h3>
        <div id="recommendations"></div>
      `;

      // Отобразить отзывы
      showReviews(book.key);
      // Обработчик формы отзывов
      const reviewForm = document.getElementById("review-form");
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = document.getElementById("review-text").value.trim();
        if (text) {
          addReview(book.key, text);
          document.getElementById("review-text").value = "";
        }
      });

      // Загрузить рекомендации
      loadRecommendations(book);
      modal.classList.remove("hidden");

      localStorage.setItem("lastViewedBook", JSON.stringify(book));
    })
    .catch(err => {
      modalBody.innerHTML = `<p style="color:red;">Ошибка загрузки данных книги: ${err.message}</p>`;
      modal.classList.remove("hidden");
    });
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // Разрешаем прокрутку страницы
}

// --- Работа с отзывами ---

function getReviews(bookKey) {
  const allReviews = JSON.parse(localStorage.getItem("bookReviews") || "{}");
  return allReviews[bookKey] || [];
}

function saveReviews(bookKey, reviews) {
  const allReviews = JSON.parse(localStorage.getItem("bookReviews") || "{}");
  allReviews[bookKey] = reviews;
  localStorage.setItem("bookReviews", JSON.stringify(allReviews));
}

function showReviews(bookKey) {
  const reviewsList = document.getElementById("reviews-list");
  if (!reviewsList) return;

  const reviews = getReviews(bookKey);
  if (reviews.length === 0) {
    reviewsList.innerHTML = "<p>Пока нет отзывов.</p>";
    return;
  }

  reviewsList.innerHTML = reviews
    .map(r => `<p>– ${r}</p>`)
    .join("");
}

function addReview(bookKey, text) {
  const reviews = getReviews(bookKey);
  reviews.push(text);
  saveReviews(bookKey, reviews);
  showReviews(bookKey);
}

// --- Рекомендации ---

function loadRecommendations(book) {
  const recContainer = document.getElementById("recommendations");
  if (!recContainer) return;

  // Фильтруем книги по тому же автору, исключая текущую
  const author = book.author_name?.[0];
  if (!author) {
    recContainer.innerHTML = "<p>Нет рекомендаций.</p>";
    return;
  }

  const recs = books.filter(b =>
    b.author_name?.includes(author) && b.key !== book.key
  ).slice(0, 3);

  if (recs.length === 0) {
    recContainer.innerHTML = "<p>Нет рекомендаций.</p>";
    return;
  }

  recContainer.innerHTML = "";

  recs.forEach(b => {
    const coverUrl = b.cover_i
      ? `https://covers.openlibrary.org/b/id/${b.cover_i}-S.jpg`
      : "https://via.placeholder.com/64x90?text=Нет+обложки";

    const div = document.createElement("div");
    div.className = "rec-item";
    div.innerHTML = `
      <img src="${coverUrl}" alt="Обложка" class="rec-cover" />
      <p class="rec-title">${b.title}</p>
    `;
    div.addEventListener("click", () => openModal(b));
    recContainer.appendChild(div);
  });
}

// Закрытие модалки
closeButton?.addEventListener("click", () => {
  modal.classList.add("hidden");
});
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});
function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // Разрешаем прокрутку страницы
}