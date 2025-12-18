// auth.js
const API_BASE = "http://localhost:8080/api/auth"; // ajusta si usas otro puerto

function saveUserAndGoHome(data) {
  // data: { id, name, email, token }
  localStorage.setItem("currentUser", JSON.stringify(data));
  window.location.href = "index.html";
}

function showError(message) {
  alert(message || "Ocurrió un error. Inténtalo de nuevo.");
}

// Registro
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      name: document.getElementById("regName").value.trim(),
      email: document.getElementById("regEmail").value.trim(),
      password: document.getElementById("regPassword").value,
    };

    if (!body.name || !body.email || !body.password) {
      showError("Completa todos los campos de registro.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        showError(error.message || "No se pudo registrar el usuario.");
        return;
      }

      const data = await res.json();
      saveUserAndGoHome(data);
    } catch (err) {
      console.error(err);
      showError("No se pudo conectar con el servidor de registro.");
    }
  });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      email: document.getElementById("logEmail").value.trim(),
      password: document.getElementById("logPassword").value,
    };

    if (!body.email || !body.password) {
      showError("Completa correo y contraseña para iniciar sesión.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        showError(error.message || "Correo o contraseña incorrectos.");
        return;
      }

      const data = await res.json();
      saveUserAndGoHome(data);
    } catch (err) {
      console.error(err);
      showError("No se pudo conectar con el servidor de inicio de sesión.");
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target; // "login" o "signup"

      // Cambiar tab activa
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Mostrar solo el formulario correspondiente
      forms.forEach((form) => {
        if (form.dataset.form === target) {
          form.classList.add("auth-form-active");
        } else {
          form.classList.remove("auth-form-active");
        }
      });
    });
  });
});

