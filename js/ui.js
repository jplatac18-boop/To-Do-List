// ui.js

// Referencias para el modal de confirmación
let taskIdToDelete = null;
const confirmModal = document.getElementById("confirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const acceptConfirmBtn = document.getElementById("acceptConfirmBtn");

// Manejo de la interfaz (DOM + eventos)
class GestorInterfaz {
  constructor(listaDeTareas, repositorio) {
    this.listaDeTareas = listaDeTareas;
    this.repositorio = repositorio;
    this.filtroTextoActual = "";
    this.filtroEstado = "all"; // all | pending | completed | starred
    this.modoEdicion = false;
    this.idTareaEnEdicion = null;
    this.iniciar();
  }

  async iniciar() {
    try {
      await this.cargarDesdeBackend();
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar las tareas del servidor.");
    }
    this.configurarEventos();
    this.actualizarInterfaz();
  }

  configurarEventos() {
    // Botón agregar (botón flotante)
    const addBtn = document.getElementById("addTaskBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => this.abrirModal());
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (evento) =>
        this.filtrarTareas(evento.target.value)
      );
    }

    const cancelModalBtn = document.getElementById("cancelModalBtn");
    if (cancelModalBtn) {
      cancelModalBtn.addEventListener("click", () => this.cerrarModal());
    }

    const saveTaskBtn = document.getElementById("saveTaskBtn");
    if (saveTaskBtn) {
      saveTaskBtn.addEventListener("click", async () => {
        try {
          await this.crearTareaDesdeModal();
        } catch (e) {
          console.error("Error al guardar tarea:", e);
        }
      });
    }

    // Filtros barra lateral por data-filter
    const filterAll = document.querySelector('li[data-filter="all"]');
    const filterPending = document.querySelector('li[data-filter="pending"]');
    const filterCompleted = document.querySelector('li[data-filter="completed"]');
    const filterStarred = document.querySelector('li[data-filter="starred"]');

    if (filterAll) filterAll.addEventListener("click", () => this.cambiarFiltroEstado("all"));
    if (filterPending) filterPending.addEventListener("click", () => this.cambiarFiltroEstado("pending"));
    if (filterCompleted) filterCompleted.addEventListener("click", () => this.cambiarFiltroEstado("completed"));
    if (filterStarred) filterStarred.addEventListener("click", () => this.cambiarFiltroEstado("starred"));

    // Eventos del modal de confirmación
    if (cancelConfirmBtn) {
      cancelConfirmBtn.addEventListener("click", () => this.cerrarConfirmModal());
    }
    if (acceptConfirmBtn) {
      acceptConfirmBtn.addEventListener("click", () => this.confirmarEliminacion());
    }
  }

  async cargarDesdeBackend() {
    const tareasGuardadas = await this.repositorio.cargar();
    tareasGuardadas.forEach((tarea) => this.listaDeTareas.agregarTarea(tarea));
  }

  // Modal de tarea
  abrirModal(tarea = null) {
    const modal = document.getElementById("taskModal");
    modal.classList.remove("hidden");

    const inputTitulo = document.getElementById("taskTitleInput");
    const inputDescripcion = document.getElementById("taskDescriptionInput");
    const inputInicio = document.getElementById("taskStartDateInput");
    const inputFin = document.getElementById("taskEndDateInput");
    const modalTitle = document.getElementById("modalTitle");
    const starredInput = document.getElementById("taskStarredInput");

    if (tarea) {
      this.modoEdicion = true;
      this.idTareaEnEdicion = tarea.id;
      modalTitle.textContent = "Editar tarea";
      inputTitulo.value = tarea.titulo;
      inputDescripcion.value = tarea.descripcion || "";
      if (inputInicio) inputInicio.value = tarea.fechaInicio || "";
      if (inputFin) inputFin.value = tarea.fechaFin || "";
      if (starredInput) starredInput.checked = !!tarea.esDestacada;
    } else {
      this.modoEdicion = false;
      this.idTareaEnEdicion = null;
      modalTitle.textContent = "Nueva tarea";
      inputTitulo.value = "";
      inputDescripcion.value = "";
      if (inputInicio) inputInicio.valueAsDate = new Date();
      if (inputFin) inputFin.value = "";
      if (starredInput) starredInput.checked = false;
    }
  }

  cerrarModal() {
    const modal = document.getElementById("taskModal");
    modal.classList.add("hidden");
    this.modoEdicion = false;
    this.idTareaEnEdicion = null;
  }

  async crearTareaDesdeModal() {
    const titulo = document.getElementById("taskTitleInput").value.trim();
    const descripcion = document
      .getElementById("taskDescriptionInput")
      .value.trim();
    const inputInicio = document.getElementById("taskStartDateInput");
    const inputFin = document.getElementById("taskEndDateInput");
    const starredInput = document.getElementById("taskStarredInput");

    const fechaInicio = inputInicio ? inputInicio.value : "";
    const fechaFin = inputFin ? inputFin.value : "";
    const esDestacada = starredInput ? starredInput.checked : false;

    if (!titulo) {
      alert("El título no puede estar vacío.");
      return;
    }

    if (descripcion.length > MAXIMO_CARACTERES_TAREA) {
      alert(
        `La descripción supera el límite de ${MAXIMO_CARACTERES_TAREA} caracteres.`
      );
      return;
    }

    if (!fechaInicio) {
      alert("Selecciona una fecha de inicio.");
      return;
    }

    if (fechaFin && fechaFin < fechaInicio) {
      alert("La fecha fin no puede ser anterior a la fecha inicio.");
      return;
    }

    if (this.modoEdicion && this.idTareaEnEdicion) {
      const tarea = this.listaDeTareas.buscarTarea(this.idTareaEnEdicion);
      if (tarea) {
        tarea.titulo = titulo;
        tarea.descripcion = descripcion;
        tarea.fechaInicio = fechaInicio;
        tarea.fechaFin = fechaFin;
        tarea.esDestacada = esDestacada;
        await this.repositorio.actualizarTarea(tarea);
      }
    } else {
      const nuevaTarea = new Tarea(
        Date.now().toString(),
        titulo,
        descripcion,
        fechaInicio,
        fechaFin,
        false,
        esDestacada
      );
      this.listaDeTareas.agregarTarea(nuevaTarea);
      await this.repositorio.crearTarea(nuevaTarea);
    }

    this.actualizarInterfaz();
    this.cerrarModal();
  }

  filtrarTareas(texto) {
    this.filtroTextoActual = texto.toLowerCase();
    this.dibujarTareas();
  }

  cambiarFiltroEstado(estado) {
    this.filtroEstado = estado;
    this.dibujarTareas();
  }

  dibujarTareas() {
    const contenedor = document.getElementById("tasksList");
    const termino = this.filtroTextoActual;

    let tareasFiltradas = this.listaDeTareas.tareas;

    if (termino) {
      tareasFiltradas = tareasFiltradas.filter(
        (t) =>
          t.titulo.toLowerCase().includes(termino) ||
          (t.descripcion && t.descripcion.toLowerCase().includes(termino))
      );
    }

    if (this.filtroEstado === "pending") {
      tareasFiltradas = tareasFiltradas.filter((t) => !t.estaTerminada);
    } else if (this.filtroEstado === "completed") {
      tareasFiltradas = tareasFiltradas.filter((t) => t.estaTerminada);
    } else if (this.filtroEstado === "starred") {
      tareasFiltradas = tareasFiltradas.filter((t) => t.esDestacada);
    }

    contenedor.innerHTML = tareasFiltradas
      .map(
        (tarea) => `
      <article class="task-card">
        <div class="task-header">
          <input
            type="checkbox"
            ${tarea.estaTerminada ? "checked" : ""}
            onchange="gestor.cambiarEstadoTareaDesdeUI('${tarea.id}')"
          />
          <h3 class="${tarea.estaTerminada ? "completada" : ""}">
            ${tarea.titulo}
          </h3>
          <div class="task-actions">
            </span>
            <span
              class="icon-edit"
              title="Editar"
              onclick="gestor.editarTareaDesdeUI('${tarea.id}')"
            >
              ✏️
            </span>
            <span
              class="icon-delete"
              title="Eliminar"
              onclick="gestor.eliminarTareaDesdeUI('${tarea.id}')"
            >
              🗑
            </span>
          </div>
        </div>
        ${
          tarea.descripcion
            ? `<p class="task-description">${tarea.descripcion}</p>`
            : ""
        }
        ${
          tarea.fechaInicio || tarea.fechaFin
            ? `<p class="task-date">
                 ${tarea.fechaInicio ? `Inicio: ${tarea.fechaInicio}` : ""}
                 ${tarea.fechaFin ? ` | Fin: ${tarea.fechaFin}` : ""}
               </p>`
            : ""
        }
      </article>
    `
      )
      .join("");

    this.actualizarEstadisticas();
  }

  async cambiarEstadoTareaDesdeUI(idTarea) {
    this.listaDeTareas.cambiarEstadoTarea(idTarea);
    const tarea = this.listaDeTareas.buscarTarea(idTarea);
    try {
      await this.repositorio.actualizarTarea(tarea);
    } catch (e) {
      console.error("Error al actualizar tarea:", e);
    }
    this.dibujarTareas();
  }

  cambiarDestacadaDesdeUI(idTarea) {
    this.listaDeTareas.cambiarDestacadaTarea(idTarea);
    this.dibujarTareas();
  }

  async eliminarTareaDesdeUI(idTarea) {
    // Mostrar modal de confirmación
    taskIdToDelete = idTarea;
    if (confirmModal) {
      confirmModal.classList.remove("hidden");
    }
  }

  cerrarConfirmModal() {
    if (confirmModal) {
      confirmModal.classList.add("hidden");
    }
    taskIdToDelete = null;
  }

  async confirmarEliminacion() {
    if (!taskIdToDelete) {
      this.cerrarConfirmModal();
      return;
    }

    const idTarea = taskIdToDelete;
    this.listaDeTareas.eliminarTarea(idTarea);
    try {
      await this.repositorio.eliminarTarea(idTarea);
    } catch (e) {
      console.error("Error al eliminar tarea:", e);
    }
    this.actualizarInterfaz();
    this.cerrarConfirmModal();
  }

  editarTareaDesdeUI(idTarea) {
    const tarea = this.listaDeTareas.buscarTarea(idTarea);
    if (!tarea) return;
    this.abrirModal(tarea);
  }

  actualizarEstadisticas() {
    const { total, completadas, pendientes } =
      this.listaDeTareas.obtenerEstadisticas();
    const destacadas = this.listaDeTareas.tareas.filter(
      (t) => t.esDestacada
    ).length;

    const statTotal = document.getElementById("stat-total");
    const statPending = document.getElementById("stat-pending");
    const statCompleted = document.getElementById("stat-completed");
    const countAll = document.getElementById("count-all");
    const countPending = document.getElementById("count-pending");
    const countCompleted = document.getElementById("count-completed");
    const countStarred = document.getElementById("count-starred");

    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pendientes;
    if (statCompleted) statCompleted.textContent = completadas;

    if (countAll) countAll.textContent = total;
    if (countPending) countPending.textContent = pendientes;
    if (countCompleted) countCompleted.textContent = completadas;
    if (countStarred) countStarred.textContent = destacadas;
  }

  actualizarInterfaz() {
    this.dibujarTareas();
  }
}

// Saludo y menú usuario en sidebar
document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("currentUser");
  const saludoEl = document.getElementById("userGreeting");
  const menuToggle = document.getElementById("userMenuToggle");
  const menu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  if (raw && saludoEl) {
    try {
      const user = JSON.parse(raw);
      const nombre = user.name || user.nombre || "";
      saludoEl.textContent = nombre ? `Hola, ${nombre}` : "Hola";
    } catch (e) {
      console.error("Error parseando currentUser:", e);
    }
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      menu.classList.toggle("hidden");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "auth.html";
    });
  }
});
