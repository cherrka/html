document.addEventListener("DOMContentLoaded", () => {
  const itemsContainer = document.getElementById("items");
  const filterButtons = document.querySelectorAll("nav button");
  const modal = document.getElementById("modal");
  const openFormBtn = document.getElementById("openForm");
  const closeModalBtn = document.getElementById("closeModal");
  const form = document.getElementById("feedbackForm");
  const formMessage = document.getElementById("formMessage");

  const itemsData = [
    { id: 1, title: "Товар 1", category: "A", description: "Описание 1" },
    { id: 2, title: "Товар 2", category: "B", description: "Описание 2" },
    { id: 3, title: "Товар 3", category: "A", description: "Описание 3" },
    { id: 4, title: "Товар 4", category: "B", description: "Описание 4" }
  ];

  renderItems(itemsData);

  function renderItems(items) {
    itemsContainer.innerHTML = items.map(item => `
      <div class="item-card">
        <h3>${item.title}</h3>
        <p><strong>Категория:</strong> ${item.category}</p>
        <p>${item.description}</p>
      </div>
    `).join('');
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const filteredItems = filter === "all"
        ? itemsData
        : itemsData.filter(item => item.category === filter);

      renderItems(filteredItems);
    });
  });

  openFormBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    clearForm();
  });

  window.addEventListener("click", e => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      clearForm();
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    };

    localStorage.setItem("feedback", JSON.stringify(data));
    formMessage.textContent = "Спасибо за отзыв!";
    form.reset();

    setTimeout(() => {
      modal.classList.add("hidden");
      formMessage.textContent = "";
    }, 2000);
  });

  function clearForm() {
    form.reset();
    formMessage.textContent = "";
  }
});