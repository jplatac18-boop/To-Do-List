// Representa una tarea individual
class Tarea {
  constructor(
    id,
    titulo,
    descripcion,
    fechaInicio,
    fechaFin,
    estaTerminada = false,
    esDestacada = false
  ) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.fechaInicio = fechaInicio; // YYYY-MM-DD
    this.fechaFin = fechaFin;       // YYYY-MM-DD
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
