// Constantes de configuración
const MAXIMO_CARACTERES_TAREA = 200;
const API_URL = "http://localhost:8080/api/tasks";

// Representa una tarea individual
class Tarea {
  constructor(
    id,
    titulo,
    descripcion,
    fechaCreacion,
    estaTerminada = false,
    esDestacada = false
  ) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.fechaCreacion = fechaCreacion;
    this.estaTerminada = estaTerminada;
    this.esDestacada = esDestacada;
  }

  cambiarEstado() {
    this.estaTerminada = !this.estaTerminada;
  }

  cambiarDestacada() {
    this.esDestacada = !this.esDestacada;
  }

  actualizarDescripcion(nuevaDescripcion) {
    if (nuevaDescripcion.length <= MAXIMO_CARACTERES_TAREA) {
      this.descripcion = nuevaDescripcion;
      return true;
    }
    return false;
  }
}

// Maneja la lista de tareas en memoria
class ListaDeTareas {
  constructor() {
    this.tareas = [];
  }

  agregarTarea(tarea) {
    this.tareas.push(tarea);
  }

  eliminarTarea(idTarea) {
    this.tareas = this.tareas.filter((tarea) => tarea.id !== idTarea);
  }

  cambiarEstadoTarea(idTarea) {
    const tarea = this.buscarTarea(idTarea);
    if (tarea) {
      tarea.cambiarEstado();
    }
  }

  cambiarDestacadaTarea(idTarea) {
    const tarea = this.buscarTarea(idTarea);
    if (tarea) {
      tarea.cambiarDestacada();
    }
  }

  buscarTarea(idTarea) {
    return this.tareas.find((tarea) => tarea.id === idTarea);
  }

  obtenerEstadisticas() {
    const total = this.tareas.length;
    const completadas = this.tareas.filter((t) => t.estaTerminada).length;
    const pendientes = total - completadas;
    return { total, completadas, pendientes };
  }
}

// Repositorio que usa la API REST en Spring Boot
class RepositorioTareas {
  async cargar() {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) {
      throw new Error("Error al cargar tareas");
    }
    const datos = await respuesta.json();
    return datos.map(
      (t) =>
        new Tarea(
          t.id.toString(),
          t.description || "Sin título",
          "", // descripción larga (solo frontend)
          "", // fecha (solo frontend)
          !!t.completed,
          false
        )
    );
  }

  async crearTarea(tarea) {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: tarea.titulo }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al crear tarea");
    }
    const creada = await respuesta.json();
    tarea.id = creada.id.toString();
    tarea.estaTerminada = !!creada.completed;
    return tarea;
  }

  async actualizarTarea(tarea) {
    const respuesta = await fetch(`${API_URL}/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: tarea.titulo,
        completed: tarea.estaTerminada,
      }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al actualizar tarea");
    }
  }

  async eliminarTarea(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) {
      throw new Error("Error al eliminar tarea");
    }
  }
}

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
      .addEventListener("click", () =>
        this.cambiarFiltroEstado("completed")
      );
    document
      .getElementById("filter-starred")
      .addEventListener("click", () => this.cambiarFiltroEstado("starred"));
  }

  async cargarDesdeBackend() {
    const tareasGuardadas = await this.repositorio.cargar();
    tareasGuardadas.forEach((tarea) => this.listaDeTareas.agregarTarea(tarea));
  }

  // Modal
  abrirModal(tarea = null) {
    const modal = document.getElementById("taskModal");
    modal.classList.remove("hidden");

    const inputTitulo = document.getElementById("taskTitle");
    const inputDescripcion = document.getElementById("taskDescription");
    const inputFecha = document.getElementById("taskDate");
    const modalTitle = document.getElementById("modalTitle");

    if (tarea) {
      // Modo edición
      this.modoEdicion = true;
      this.idTareaEnEdicion = tarea.id;
      modalTitle.textContent = "Editar tarea";
      inputTitulo.value = tarea.titulo;
      inputDescripcion.value = tarea.descripcion || "";
      inputFecha.value = tarea.fechaCreacion || "";
    } else {
      // Nuevo
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
    const descripcion = document
      .getElementById("taskDescription")
      .value.trim();
    const fecha = document.getElementById("taskDate").value;

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

    if (this.modoEdicion && this.idTareaEnEdicion) {
      // Editar existente
      const tarea = this.listaDeTareas.buscarTarea(this.idTareaEnEdicion);
      if (tarea) {
        tarea.titulo = titulo;
        tarea.descripcion = descripcion;
        tarea.fechaCreacion =
          fecha || tarea.fechaCreacion || new Date().toISOString().split("T")[0];
        await this.repositorio.actualizarTarea(tarea);
      }
    } else {
      // Crear nueva
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

  // Filtro por texto
  filtrarTareas(texto) {
    this.filtroTextoActual = texto.toLowerCase();
    this.dibujarTareas();
  }

  // Filtro por estado
  cambiarFiltroEstado(estado) {
    this.filtroEstado = estado; // all | pending | completed | starred
    this.dibujarTareas();
  }

  // Dibuja las tareas en el contenedor
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
        ${
          tarea.descripcion
            ? `<p class="task-description">${tarea.descripcion}</p>`
            : ""
        }
        ${
          tarea.fechaCreacion
            ? `<p class="task-date">Creada: ${tarea.fechaCreacion}</p>`
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
    // destacado solo existe en frontend
    this.dibujarTareas();
  }

  async eliminarTareaDesdeUI(idTarea) {
    if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    this.listaDeTareas.eliminarTarea(idTarea);
    try {
      await this.repositorio.eliminarTarea(idTarea);
    } catch (e) {
      console.error("Error al eliminar tarea:", e);
    }
    this.actualizarInterfaz();
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

// Inicialización
const lista = new ListaDeTareas();
const repositorio = new RepositorioTareas();
const gestor = new GestorInterfaz(lista, repositorio);
