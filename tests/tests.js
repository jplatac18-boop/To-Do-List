const out = document.getElementById("out");

let passed = 0;
let failed = 0;

function log(line) {
  out.textContent += `\n${line}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function test(name, fn) {
  try {
    fn();
    passed++;
    log(`✅ ${name}`);
  } catch (e) {
    failed++;
    log(`❌ ${name} -> ${e.message}`);
  }
}

// -----------------------
// Tests ListaDeTareas
// -----------------------
out.textContent = "Ejecutando pruebas...\n";

test("Agregar tarea incrementa el total", () => {
  const lista = new ListaDeTareas();
  lista.agregarTarea(new Tarea("1", "Tarea 1", "", "2025-12-13"));
  assert(lista.tareas.length === 1, "Debe haber 1 tarea");
});

test("Buscar tarea retorna la tarea correcta", () => {
  const lista = new ListaDeTareas();
  lista.agregarTarea(new Tarea("1", "Tarea 1", "", "2025-12-13"));
  const encontrada = lista.buscarTarea("1");
  assert(encontrada && encontrada.id === "1", "Debe encontrar la tarea con id=1");
});

test("Eliminar tarea la quita de la lista", () => {
  const lista = new ListaDeTareas();
  lista.agregarTarea(new Tarea("1", "Tarea 1", "", "2025-12-13"));
  lista.eliminarTarea("1");
  assert(lista.tareas.length === 0, "Debe quedar la lista vacía");
});

test("Cambiar estado alterna estaTerminada", () => {
  const lista = new ListaDeTareas();
  lista.agregarTarea(new Tarea("1", "Tarea 1", "", "2025-12-13", false));
  lista.cambiarEstadoTarea("1");
  assert(lista.buscarTarea("1").estaTerminada === true, "Debe quedar terminada");
  lista.cambiarEstadoTarea("1");
  assert(lista.buscarTarea("1").estaTerminada === false, "Debe volver a pendiente");
});

test("Cambiar destacada alterna esDestacada", () => {
  const lista = new ListaDeTareas();
  lista.agregarTarea(new Tarea("1", "Tarea 1", "", "2025-12-13", false, false));
  lista.cambiarDestacadaTarea("1");
  assert(lista.buscarTarea("1").esDestacada === true, "Debe quedar destacada");
  lista.cambiarDestacadaTarea("1");
  assert(lista.buscarTarea("1").esDestacada === false, "Debe volver a no destacada");
});

test("Estadísticas: total, completadas, pendientes", () => {
  const lista = new ListaDeTareas();
  lista.agregarTarea(new Tarea("1", "A", "", "2025-12-13", true));
  lista.agregarTarea(new Tarea("2", "B", "", "2025-12-13", false));
  const stats = lista.obtenerEstadisticas();
  assert(stats.total === 2, "Total debe ser 2");
  assert(stats.completadas === 1, "Completadas debe ser 1");
  assert(stats.pendientes === 1, "Pendientes debe ser 1");
});

log(`\nRESULTADO: ${passed} OK / ${failed} FAIL`);
