const toggleTheme = document.getElementById('toogle-theme');
const body = document.body;
const wrapper = document.querySelector('.wrapper');

// Toogle tema gelap atau terang
toggleTheme.addEventListener('change', () => {
    body.classList.toggle('dark', toggleTheme.checked);
    wrapper.classList.toggle('dark', toggleTheme.checked);
});

// Deklarasi variabel untuk tambah task
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
let taskCount = 0;
let database;

// Mengatur penyimpanan data todo menggunakan IndexedDB
const request = indexedDB.open('BlackMambaDatabase', 1);
request.onupgradeneeded = function(event) {
    database = event.target.result;
    const objectStore = database.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('text', 'text', { unique: false });
    objectStore.createIndex('completed', 'completed', { unique: false });
};

request.onsuccess = function(event) {
  database = event.target.result;
  loadTasks();
};

request.onerror = function(event) {
  console.error("Database error: ", event.target.errorCode);
};

// Fungsi untuk menambah task
function addTask(taskText, completed = false, id = null) {
    // Validasi input
    taskText = taskText || todoInput.value.trim();
    if (taskText === '') {
      return;
    }
    
    const task = { text: taskText, completed: completed };
    
    // Buat elemen list
    const li = document.createElement('li');
    const taskSpan = document.createElement('span');
    taskSpan.textContent = `${++taskCount}. ${taskText}`;
  
    // Tombol Hapus
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Hapus';
    deleteButton.className = 'delete-btn';
    deleteButton.onclick = function() {
      todoList.removeChild(li);
      deleteTask(id); // Hapus dari database
      updateTaskNumbers(); // Perbarui nomor urut
    };
  
    // Tombol Selesai
    const completeButton = document.createElement('button');
    completeButton.textContent = 'Selesai';
    completeButton.onclick = function() {
      li.classList.toggle('completed');
      updateTaskCompletion(id, li.classList.contains('completed'));
    };
  
    li.appendChild(taskSpan);
    li.appendChild(completeButton);
    li.appendChild(deleteButton);
    if (completed) li.classList.add('completed');
    todoList.appendChild(li);
  
    // Simpan task ke database jika `id` tidak ada
    if (!id) {
      saveTask(task);
    }
  
    // Reset input
    todoInput.value = '';
}

// Fungsi menyimpan task ke IndexedDB
function saveTask(task) {
    const transaction = database.transaction(['tasks'], 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    const request = objectStore.add(task);
    
    request.onsuccess = function(event) {
      task.id = event.target.result; // Menyimpan `id` yang diberikan oleh IndexedDB
    };
}

// Fungsi memuat semua task dari IndexedDB
function loadTasks() {
    const transaction = database.transaction(['tasks'], 'readonly');
    const objectStore = transaction.objectStore('tasks');
    const request = objectStore.openCursor();
    
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        const task = cursor.value;
        addTask(task.text, task.completed, task.id);
        cursor.continue();
      }
    };
}

// Fungsi menghapus task dari IndexedDB
function deleteTask(id) {
    const transaction = database.transaction(['tasks'], 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    objectStore.delete(id);
}

// Fungsi memperbarui status selesai task
function updateTaskCompletion(id, completed) {
    const transaction = database.transaction(['tasks'], 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    const request = objectStore.get(id);
    
    request.onsuccess = function() {
      const data = request.result;
      data.completed = completed;
      objectStore.put(data);
    };
}

// Fungsi memperbarui nomor urut setelah penghapusan
function updateTaskNumbers() {
    const tasks = todoList.querySelectorAll('li');
    taskCount = 0;
    
    tasks.forEach((task) => {
      taskCount++;
      task.firstChild.textContent = `${taskCount}. ${task.firstChild.textContent.split('. ')[1]}`;
    });
}

// Menambahkan event listener ke tombol tambah
addButton.addEventListener('click', function() {
    const taskText = todoInput.value.trim();
    if (taskText !== '') {
      addTask(taskText);
    }
});

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    document.getElementById('current-date').innerText = dateString;
    document.getElementById('current-time').innerText = timeString;

    displayWeekDates(now);
}

function displayWeekDates(currentDate) {
    const weekStart = new Date(currentDate);
    const weekDates = [];
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
        const weekDate = new Date(weekStart);
        weekDate.setDate(weekStart.getDate() + i);
        weekDates.push(weekDate.getDate());
    }

    for (let i = 0; i < weekDates.length; i++) {
        document.getElementById(`date${i}`).innerText = weekDates[i];
    }
}

setInterval(updateDateTime, 1000);
updateDateTime();
