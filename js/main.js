// Inicialización
const lista = new ListaDeTareas();
const repositorio = new RepositorioTareas();

// Hacerlo global para que funcione con onclick="gestor...."
window.gestor = new GestorInterfaz(lista, repositorio);
