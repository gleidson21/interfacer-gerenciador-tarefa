/* eslint-disable no-prototype-builtins */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCcw, CheckCircle, Trash2, Edit2, Loader, X, Save, Search, AlertTriangle, ArrowUp, ArrowDown, Check } from 'lucide-react';

// URL base da sua API Node.js/Express
const API_BASE_URL = 'https://api-gerenciamento-de-tarefa.onrender.com/tasks';

// Mapeamento de Prioridades para Estilos
const PRIORITY_MAP = {
    'High': { label: 'Alta', color: 'text-red-600 border-red-500 bg-red-50', icon: AlertTriangle },
    'Medium': { label: 'Média', color: 'text-orange-600 border-orange-500 bg-orange-50', icon: ArrowUp },
    'Low': { label: 'Baixa', color: 'text-blue-600 border-blue-500 bg-blue-50', icon: ArrowDown },
    'None': { label: 'Nenhuma', color: 'text-gray-500 border-gray-300 bg-gray-100', icon: null },
};

// Ordem numérica para sorting: Alta (3), Média (2), Baixa (1), Nenhuma (0)
const PRIORITY_ORDER = {
    'High': 3,
    'Medium': 2,
    'Low': 1,
    'None': 0,
};

// --------------------------------------------------------------------------
// Componente Auxiliar: Toast Notification
// --------------------------------------------------------------------------

const ToastNotification = ({ message, type, onClose }) => {
    if (!message) return null;

    let icon, bgColor, textColor;

    switch (type) {
        case 'success':
            icon = <Check size={20} />;
            bgColor = 'bg-green-600';
            textColor = 'text-white';
            break;
        case 'error':
            icon = <X size={20} />;
            bgColor = 'bg-red-600';
            textColor = 'text-white';
            break;
        default:
            icon = null;
            bgColor = 'bg-gray-800';
            textColor = 'text-white';
    }

    return (
        <div 
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 transform 
                        ${bgColor} ${textColor} flex items-center space-x-3`}
            role="alert"
        >
            {icon}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className={`ml-4 opacity-75 hover:opacity-100 p-1 rounded-full ${textColor}`}>
                <X size={16} />
            </button>
        </div>
    );
};


// --------------------------------------------------------------------------
// Componente Auxiliar: Botão de Filtro
// --------------------------------------------------------------------------

const FilterButton = ({ current, setFilter, value, label }) => {
    const isActive = current === value;
    return (
        <button
            onClick={() => setFilter(value)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
                isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    );
};

// --------------------------------------------------------------------------
// Componente Auxiliar: TaskItem (Aninhado, Completo e Estilizado)
// --------------------------------------------------------------------------

const TaskItem = ({ task, onToggle, onDelete, onUpdate }) => {
  const taskPriority = task.priority && PRIORITY_ORDER.hasOwnProperty(task.priority) ? task.priority : 'None';
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(taskPriority);
  
  const priorityStyle = PRIORITY_MAP[taskPriority];
  const Icon = priorityStyle.icon;

  const handleSave = async () => {
    if (title.trim() === '') return;
    await onUpdate(task.id, { title, description, priority });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(taskPriority);
      setIsEditing(false);
  };

  useEffect(() => {
      if (task.completed) {
          setIsEditing(false);
      }
  }, [task.completed]);

  return (
    <li
      className={`flex flex-col p-5 mb-3 rounded-2xl shadow-lg transition-all duration-300 border border-gray-100 ${
        task.completed ? 'opacity-60 bg-white border-l-4 border-green-500' : 'bg-white hover:shadow-xl'
      }`}
    >
        {!isEditing ? (
            // Layout de Visualização: Adaptação para mobile
            <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                
                {/* Conteúdo Principal (Título, Descrição, Prioridade) */}
                <div className="flex items-start flex-grow min-w-0 mb-3 sm:mb-0">
                    <button
                        onClick={() => onToggle(task.id, !task.completed)}
                        className={`p-1 rounded-full transition-colors mr-4 mt-1 flex-shrink-0 ${
                            task.completed ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-indigo-600'
                        }`}
                        aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                        <CheckCircle size={24} fill={task.completed ? 'currentColor' : 'none'} />
                    </button>

                    <div className="flex-1 min-w-0 pr-4">
                        <span
                            className={`text-lg font-medium text-gray-800 break-words block ${task.completed ? 'line-through text-gray-500' : ''}`}
                        >
                            {task.title}
                        </span>
                        {task.description && (
                             <p className={`text-sm text-gray-500 break-words mt-1 ${task.completed ? 'line-through' : ''}`}>{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center space-x-2 mt-2">
                             {/* DISPLAY DE PRIORIDADE */}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityStyle.color} flex items-center space-x-1`}>
                                {Icon && <Icon size={14} />}
                                <span>Prioridade: {priorityStyle.label}</span>
                            </span>
                            {/* Data de criação */}
                            {task.createdAt && (
                                <p className="text-xs text-gray-400 mt-1 sm:mt-0">
                                    Criado em: {new Date(task.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botões de Ação (Aparecem no final da linha em desktop e no final do bloco em mobile) */}
                <div className="flex items-center space-x-2 sm:ml-4 flex-shrink-0">
                    {!task.completed && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-300"
                            title="Editar tarefa"
                        >
                            <Edit2 size={20} />
                        </button>
                    )}
                    
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition duration-300"
                        aria-label="Deletar tarefa"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        ) : (
            // MODO DE EDIÇÃO (Já é flex-col, o que é naturalmente responsivo)
            <div className="flex flex-col space-y-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-3 border border-gray-300 rounded-xl text-lg font-medium focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Novo Título"
                />
                 <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-3 border border-gray-300 rounded-xl text-sm h-20 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Nova Descrição (Opcional)"
                />
                
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                    <option value="None">Nenhuma (Padrão)</option>
                    <option value="Low">Baixa</option>
                    <option value="Medium">Média</option>
                    <option value="High">Alta</option>
                </select>

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={handleCancel}
                        className="flex items-center space-x-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                        <X size={18} />
                        <span>Cancelar</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={title.trim() === ''}
                        className="flex items-center space-x-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>Salvar</span>
                    </button>
                </div>
            </div>
        )}
    </li>
  );
};


// --------------------------------------------------------------------------
// Componente Principal da Aplicação
// --------------------------------------------------------------------------

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('None');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' }); 

  const showToast = useCallback((message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast({ message: '', type: '' }), 3000);
  }, []);

  const handleFetchError = useCallback((err, defaultMsg, errorType = 'error') => {
    console.error(defaultMsg, err);
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Não foi possível conectar à API. Verifique se o backend está rodando em http://localhost:3333.');
        showToast('Erro de conexão com o servidor.', 'error');
    } else {
        setError(defaultMsg);
        showToast(defaultMsg, errorType);
    }
  }, [showToast]);


  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Erro ao carregar as tarefas.');
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      handleFetchError(err, 'Erro ao buscar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault(); 
    if (newTaskTitle.trim() === '') return;

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), priority: newTaskPriority }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ? errorData.error[0] || 'Falha ao criar tarefa.' : 'Falha ao criar tarefa.');
      }

      fetchTasks();
      setNewTaskTitle('');
      setNewTaskPriority('None');
      showToast('Tarefa adicionada com sucesso!', 'success');
      
    } catch (err) {
      handleFetchError(err, 'Erro ao adicionar tarefa.');
    }
  };

  const handleToggleComplete = async (id, newCompletedStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompletedStatus }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar status.');

      fetchTasks();
      showToast(`Tarefa marcada como ${newCompletedStatus ? 'Concluída' : 'Pendente'}!`, 'success');

    } catch (err) {
      handleFetchError(err, 'Erro ao atualizar o status da tarefa.');
    }
  };
  
  const handleUpdateTask = async (id, updatedFields) => {
      try {
          const response = await fetch(`${API_BASE_URL}/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedFields),
          });

          if (!response.ok) throw new Error('Falha ao editar a tarefa.');

          fetchTasks(); 
          showToast('Tarefa atualizada com sucesso!', 'success');
          
      } catch (err) {
          handleFetchError(err, 'Erro ao editar a tarefa.');
      }
  };

  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.status !== 204) throw new Error('Falha ao deletar tarefa.');

      setTasks(tasks.filter(t => t.id !== id));
      showToast('Tarefa excluída com sucesso!', 'success');

    } catch (err) {
      handleFetchError(err, 'Erro ao deletar tarefa.');
    }
  };
  
  // --- Lógica de Filtro, Pesquisa e ORDENAÇÃO ---

  const filteredAndSortedTasks = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();

    const filtered = tasks
        .filter(task => {
            const statusMatch = 
                filter === 'all' ||
                (filter === 'pending' && !task.completed) ||
                (filter === 'completed' && task.completed);
            
            const searchMatch = 
                lowerCaseSearch === '' || 
                task.title.toLowerCase().includes(lowerCaseSearch) ||
                (task.description && task.description.toLowerCase().includes(lowerCaseSearch));

            return statusMatch && searchMatch;
        });
        
    return filtered.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        const priorityA = PRIORITY_ORDER[a.priority || 'None'];
        const priorityB = PRIORITY_ORDER[b.priority || 'None'];
        
        if (priorityA !== priorityB) {
            return priorityB - priorityA; 
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [tasks, filter, searchTerm]);

  // --- Renderização ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 sm:py-16 px-4 font-sans">
      
      {/* Componente Toast */}
      <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* Cabeçalho */}
      <header className="w-full max-w-2xl mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 text-center tracking-tight">
          Gestão Profissional de Tarefas 🚀
        </h1>
        <p className="text-center text-gray-500 mt-2 text-sm sm:text-base">Prioridade e Produtividade.</p>
      </header>

      {/* Formulário de Adição */}
      <form onSubmit={handleAddTask} className="w-full max-w-2xl mb-8 sm:mb-10 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-4">
        {/* CORREÇÃO RESPONSIVA: flex-col por padrão, flex-row a partir de sm: */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Adicione um novo item aqui (Título)"
            className="flex-grow p-3 text-gray-700 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
            />
            
            {/* CAMPO SELECT DE PRIORIDADE: Largura mínima apenas em desktop */}
            <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-700 sm:min-w-[120px]"
                disabled={loading}
            >
                <option value="None">Prioridade: Nenhuma</option>
                <option value="Low">Prioridade: Baixa</option>
                <option value="Medium">Prioridade: Média</option>
                <option value="High">Prioridade: Alta</option>
            </select>

            {/* Botão de Adicionar */}
            <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 transition duration-300 disabled:opacity-50 text-lg rounded-lg"
            disabled={loading || newTaskTitle.trim() === ''}
            >
            Adicionar
            </button>
        </div>
      </form>

      {/* Mensagens de Status, Pesquisa e Controles */}
      <div className="w-full max-w-2xl mb-6">
        {error && (
            <div className="p-4 mb-4 text-base text-red-800 bg-red-100 rounded-xl" role="alert">
                {error}
            </div>
        )}
        
        {/* CAMPO DE PESQUISA */}
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="Pesquisar tarefas por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 pl-10 text-gray-700 border border-gray-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </div>

        {/* Filtros e Recarregar - Estilo Limpo */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-md border border-gray-100 space-y-3 sm:space-y-0">
            {/* CORREÇÃO RESPONSIVA: flex-wrap permite que os botões quebrem em telas pequenas */}
            <div className="flex flex-wrap gap-2 sm:space-x-3 w-full sm:w-auto">
                <FilterButton current={filter} setFilter={setFilter} value="all" label="Todas" />
                <FilterButton current={filter} setFilter={setFilter} value="pending" label="Pendentes" />
                <FilterButton current={filter} setFilter={setFilter} value="completed" label="Concluídas" />
            </div>
            <button onClick={fetchTasks} className="p-2 text-gray-400 hover:text-indigo-600 transition duration-200 flex-shrink-0" title="Recarregar Lista">
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>
      
      {/* Lista de Tarefas */}
      <ul className="w-full max-w-2xl space-y-4">
        {loading && filteredAndSortedTasks.length === 0 ? (
             <div className="text-center p-12 text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
                Carregando tarefas...
            </div>
        ) : filteredAndSortedTasks.length === 0 ? (
            <div className="text-center p-12 text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
                🎉 Nenhuma tarefa {filter === 'all' ? 'corresponde aos critérios.' : filter === 'pending' ? 'pendente' : 'concluída'} encontrada.
            </div>
        ) : (
            filteredAndSortedTasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={handleToggleComplete} 
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
              />
            ))
        )}
      </ul>
      
      {/* Footer Simples */}
      <footer className="mt-12 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Gerenciamento de Tarefas. Todos os direitos reservados.
      </footer>
      
    </div>
  );
}

export default App;
