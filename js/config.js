// Constantes de configuración
const MAXIMO_CARACTERES_TAREA = 200;

// URL base de tareas del backend
const API_URL = "http://localhost:8080/api/tasks";

// Usuario actual (desde localStorage)
const storedUserApp = localStorage.getItem("currentUser");
const currentUser = storedUserApp ? JSON.parse(storedUserApp) : null;
let CURRENT_USER_ID = currentUser ? currentUser.id : null;
