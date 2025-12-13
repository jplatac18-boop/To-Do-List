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
    document
      .getElementById("addBtn")
      .addEventListener("click", () => this.abrirModal());

    document
      .getElementById("searchInput")
      .addEventListener("input", (evento) =>
        this.filtrarTareas(evento.target.value)
      );

    document
      .getElementById("cancelModalBtn")
      .addEventListener("click", () => this.cerrarModal());

    document
      .getElementById("saveTaskBtn")
      .addEventListener("click", async () => {
        try {
          await this.crearTareaDesdeModal();
        } catch (e) {
          console.error("Error al guardar tarea:", e);
        }
      });

    // Filtros barra lateral
    document
      .getElementById("filter-all")
      .addEventListener("click", () => this.cambiarFiltroEstado("all"));
    document
      .getElementById("filter-pending")
      .addEventListener("click", () => this.cambiarFiltroEstado("pending"));
    document
      .getElementById("filter-completed")
      .addEventListener("click", () => this.cambiarFiltroEstado("completed"));
    document
      .getElementById("filter-starred")
      .addEventListener("click", () => this.cambiarFiltroEstado("starred"));

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

    const inputTitulo = document.getElementById("taskTitle");
    const inputDescripcion = document.getElementById("taskDescription");
    const inputFecha = document.getElementById("taskDate");
    const modalTitle = document.getElementById("modalTitle");

    if (tarea) {
      this.modoEdicion = true;
      this.idTareaEnEdicion = tarea.id;
      modalTitle.textContent = "Editar tarea";
      inputTitulo.value = tarea.titulo;
      inputDescripcion.value = tarea.descripcion || "";
      inputFecha.value = tarea.fechaCreacion || "";
    } else {
      this.modoEdicion = false;
      this.idTareaEnEdicion = null;
      modalTitle.textContent = "Nueva tarea";
      inputTitulo.value = "";
      inputDescripcion.value = "";
      inputFecha.valueAsDate = new Date();
    }
  }

  cerrarModal() {
    const modal = document.getElementById("taskModal");
    modal.classList.add("hidden");
    this.modoEdicion = false;
    this.idTareaEnEdicion = null;
  }

  async crearTareaDesdeModal() {
    const titulo = document.getElementById("taskTitle").value.trim();
    const descripcion = document.getElementById("taskDescription").value.trim();
    const fecha = document.getElementById("taskDate").value;

    if (!titulo) {
      alert("El título no puede estar vacío.");
      return;
    }

    if (descripcion.length > MAXIMO_CARACTERES_TAREA) {
      alert(`La descripción supera el límite de ${MAXIMO_CARACTERES_TAREA} caracteres.`);
      return;
    }

    if (this.modoEdicion && this.idTareaEnEdicion) {
      const tarea = this.listaDeTareas.buscarTarea(this.idTareaEnEdicion);
      if (tarea) {
        tarea.titulo = titulo;
        tarea.descripcion = descripcion;
        tarea.fechaCreacion =
          fecha || tarea.fechaCreacion || new Date().toISOString().split("T")[0];
        await this.repositorio.actualizarTarea(tarea);
      }
    } else {
      const nuevaTarea = new Tarea(
        Date.now().toString(),
        titulo,
        descripcion,
        fecha || new Date().toISOString().split("T")[0]
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
            <span
              class="icon-star ${tarea.esDestacada ? "" : "inactive"}"
              title="Destacar"
              onclick="gestor.cambiarDestacadaDesdeUI('${tarea.id}')"
            >
              ★
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
        ${tarea.descripcion ? `<p class="task-description">${tarea.descripcion}</p>` : ""}
        ${tarea.fechaCreacion ? `<p class="task-date">Creada: ${tarea.fechaCreacion}</p>` : ""}
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
    const { total, completadas, pendientes } = this.listaDeTareas.obtenerEstadisticas();
    const destacadas = this.listaDeTareas.tareas.filter((t) => t.esDestacada).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pendientes;
    document.getElementById("completedTasks").textContent = completadas;

    document.getElementById("count-all").textContent = total;
    document.getElementById("count-pending").textContent = pendientes;
    document.getElementById("count-completed").textContent = completadas;
    document.getElementById("count-starred").textContent = destacadas;
  }

  actualizarInterfaz() {
    this.dibujarTareas();
  }
}
