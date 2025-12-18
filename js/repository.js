// Repositorio que usa la API REST en Spring Boot
class RepositorioTareas {
  async cargar() {
    if (!CURRENT_USER_ID) return [];
    const respuesta = await fetch(`${API_URL}?userId=${CURRENT_USER_ID}`);
    if (!respuesta.ok) {
      throw new Error("Error al cargar tareas");
    }
    const datos = await respuesta.json();
    return datos.map(
      (t) =>
        new Tarea(
          t.id?.toString(),
          t.description || "Sin título",
          t.longDescription || "",
          t.startDate || "",
          t.endDate || "",
          !!t.completed,
          !!t.starred
        )
    );
  }

  async crearTarea(tarea) {
    const body = {
      userId: CURRENT_USER_ID,
      description: tarea.titulo,
      longDescription: tarea.descripcion,
      completed: tarea.estaTerminada,
      startDate: tarea.fechaInicio,
      endDate: tarea.fechaFin,
      starred: tarea.esDestacada,
    };

    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!respuesta.ok) {
      throw new Error("Error al crear tarea");
    }
    const creada = await respuesta.json();
    tarea.id = creada.id.toString();
    tarea.estaTerminada = !!creada.completed;
    tarea.fechaInicio = creada.startDate || tarea.fechaInicio;
    tarea.fechaFin = creada.endDate || tarea.fechaFin;
    tarea.esDestacada = !!creada.starred;
    return tarea;
  }

  async actualizarTarea(tarea) {
    const body = {
      userId: CURRENT_USER_ID,
      description: tarea.titulo,
      longDescription: tarea.descripcion,
      completed: tarea.estaTerminada,
      startDate: tarea.fechaInicio,
      endDate: tarea.fechaFin,
      starred: tarea.esDestacada,
    };

    const respuesta = await fetch(`${API_URL}/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
