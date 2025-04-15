document.addEventListener('DOMContentLoaded', function() {
    const editVideoForm = document.getElementById('editVideoForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const videoNameInput = document.getElementById('videoName');
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const videoDescriptionInput = document.getElementById('videoDescription');
    const videoIdInput = document.getElementById('videoId');
    const playlistIdInput = document.getElementById('playlistId');
    const playlistNameBadge = document.getElementById('playlistNameBadge');
    const videoPreview = document.getElementById('videoPreview');
    const previewBtn = document.getElementById('previewBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Modal de confirmación para eliminar
    const deleteVideoModal = document.getElementById('deleteVideoModal');
    const videoToDeleteName = document.getElementById('videoToDeleteName');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Referencias para el nombre del usuario en la navbar
    const userDisplayName = document.getElementById('userDisplayName');
    
    // Variables para almacenar datos
    let videoData = null;
    let playlistData = null;
    
    // Inicialización
    init();
    
    /**
     * Inicializa la página
     */
    function init() {
        // Mostrar el nombre de usuario en la navbar
        displayUserName();
        
        // Obtener el ID del video de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        
        if (!videoId) {
            window.Notifications.showError('video_not_found');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }
        
        // Establecer el ID del video en el formulario
        videoIdInput.value = videoId;
        
        // Cargar datos del video
        loadVideoData(videoId);
        
        // Configurar event listeners
        setupEventListeners();
    }
    
    /**
     * Muestra el nombre del usuario en la navbar
     */
    function displayUserName() {
        const userName = localStorage.getItem('userName');
        if (userName) {
            userDisplayName.textContent = userName;
        }
    }
    
    /**
     * Configura los event listeners
     */
    function setupEventListeners() {
        // Validación de campos en tiempo real
        videoNameInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        youtubeUrlInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else if (!window.Notifications.validateYouTubeUrl(this.value)) {
                window.Notifications.showFieldError(this, 'validation_youtube_url');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        // Vista previa del video
        previewBtn.addEventListener('click', handlePreview);
        
        // Envío del formulario
        editVideoForm.addEventListener('submit', handleFormSubmit);
        
        // Cancelar y volver a la edición de la playlist
        cancelBtn.addEventListener('click', function() {
            // Si hay un ID de playlist, volver a la edición de esa playlist
            if (playlistIdInput.value) {
                window.location.href = `editPlaylist.html?id=${playlistIdInput.value}`;
            } else {
                window.location.href = 'dashboard.html';
            }
        });
        
        // Configurar botón de eliminar video
        const deleteVideoBtn = document.createElement('button');
        deleteVideoBtn.type = 'button';
        deleteVideoBtn.className = 'btn btn-danger me-md-2';
        deleteVideoBtn.innerHTML = '<i class="bi bi-trash"></i> Eliminar Video';
        deleteVideoBtn.addEventListener('click', function() {
            // Mostrar nombre del video en el modal
            if (videoData) {
                videoToDeleteName.textContent = videoData.name;
            }
            
            // Mostrar modal de confirmación
            const modal = new bootstrap.Modal(deleteVideoModal);
            modal.show();
        });
        
        // Añadir botón de eliminar al formulario
        const actionButtons = document.querySelector('.d-grid.gap-2.d-md-flex.justify-content-md-end');
        if (actionButtons) {
            actionButtons.prepend(deleteVideoBtn);
        }
        
        // Configurar botón de confirmar eliminación
        confirmDeleteBtn.addEventListener('click', handleDeleteVideo);
        
        // Event listener para el botón de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
        
        // Evento para actualizar la vista previa cuando cambia la URL
        youtubeUrlInput.addEventListener('change', function() {
            handlePreview();
        });
    }
    
    /**
     * Carga los datos del video
     * @param {string} videoId - ID del video a editar
     */
    async function loadVideoData(videoId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.Notifications.showError('auth_not_authenticated');
                setTimeout(() => {
                    window.location.href = '../shared/login.html';
                }, 2000);
                return;
            }
            
            // Obtener datos del video
            const videoResponse = await fetch(`http://localhost:3000/api/admin/videos?id=${videoId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!videoResponse.ok) {
                throw new Error('Error al cargar los datos del video');
            }
            
            videoData = await videoResponse.json();
            
            // Obtener datos de la playlist
            const playlistResponse = await fetch(`http://localhost:3000/api/admin/playlists?id=${videoData.playlistId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (playlistResponse.ok) {
                playlistData = await playlistResponse.json();
                
                // Mostrar nombre de la playlist en la insignia
                if (playlistData && playlistData.name) {
                    playlistNameBadge.textContent = playlistData.name;
                }
                
                // Guardar ID de la playlist
                playlistIdInput.value = videoData.playlistId;
            }
            
            // Mostrar datos del video
            displayVideoData(videoData);
            
            // Mostrar vista previa del video
            handlePreview();
            
            // Mostrar el formulario y ocultar el indicador de carga
            loadingIndicator.style.display = 'none';
            editVideoForm.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            window.Notifications.showError('video_not_found');
            
            // Ocultar indicador de carga
            loadingIndicator.style.display = 'none';
            
            // Mostrar mensaje y botón para volver
            const formContainer = document.querySelector('.card-body');
            if (formContainer) {
                formContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudieron cargar los datos del video.
                    </div>
                    <div class="text-center">
                        <a href="dashboard.html" class="btn btn-primary">
                            <i class="bi bi-arrow-left me-2"></i>Volver al Dashboard
                        </a>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Muestra los datos del video en el formulario
     * @param {Object} video - Datos del video
     */
    function displayVideoData(video) {
        videoNameInput.value = video.name;
        youtubeUrlInput.value = video.youtubeUrl;
        videoDescriptionInput.value = video.description || '';
    }
    
    /**
     * Maneja la vista previa del video
     */
    function handlePreview() {
        const youtubeUrl = youtubeUrlInput.value.trim();
        
        if (!youtubeUrl) {
            videoPreview.innerHTML = '<div class="bg-light d-flex align-items-center justify-content-center h-100"><p class="text-muted m-0">Ingresa una URL de YouTube para la vista previa</p></div>';
            return;
        }
        
        // Obtener el ID del video de YouTube desde la URL
        const videoId = extractYouTubeId(youtubeUrl);
        
        if (!videoId) {
            videoPreview.innerHTML = '<div class="bg-light d-flex align-items-center justify-content-center h-100"><p class="text-danger m-0">URL de YouTube inválida</p></div>';
            return;
        }
        
        // Construir iframe para la vista previa
        videoPreview.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    }
    
    /**
     * Extrae el ID de video de una URL de YouTube
     * @param {string} url - URL del video
     * @returns {string|null} - ID del video o null si no es válida
     */
    function extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    /**
     * Maneja el envío del formulario
     * @param {Event} e - Evento de submit
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validar el formulario
        if (!validateForm()) {
            return;
        }
        
        // Activar estado de carga
        window.Notifications.toggleFormLoading(editVideoForm, true, 'Actualizando video...');
        
        // Obtener los valores del formulario
        const videoId = videoIdInput.value;
        const videoName = videoNameInput.value.trim();
        const youtubeUrl = youtubeUrlInput.value.trim();
        const description = videoDescriptionInput.value.trim();
        
        try {
            // Actualizar el video
            await updateVideo(videoId, videoName, youtubeUrl, description);
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('video_update_success');
            
            // Redireccionar a la página de edición de playlist después de un breve retraso
            setTimeout(() => {
                if (playlistIdInput.value) {
                    window.location.href = `editPlaylist.html?id=${playlistIdInput.value}`;
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(editVideoForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('video_update_failed');
        }
    }
    
    /**
     * Valida el formulario antes de enviarlo
     * @returns {boolean} - True si el formulario es válido, false en caso contrario
     */
    function validateForm() {
        let isValid = true;
        
        // Validar nombre del video
        if (videoNameInput.value.trim() === '') {
            window.Notifications.showFieldError(videoNameInput, 'validation_required');
            isValid = false;
        }
        
        // Validar URL de YouTube
        const youtubeUrl = youtubeUrlInput.value.trim();
        if (!youtubeUrl) {
            window.Notifications.showFieldError(youtubeUrlInput, 'validation_required');
            isValid = false;
        } else {
            const videoId = extractYouTubeId(youtubeUrl);
            if (!videoId) {
                window.Notifications.showFieldError(youtubeUrlInput, 'validation_youtube_url');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Actualiza un video en el servidor
     * @param {string} videoId - ID del video
     * @param {string} name - Nombre del video
     * @param {string} youtubeUrl - URL de YouTube
     * @param {string} description - Descripción del video
     */
    async function updateVideo(videoId, name, youtubeUrl, description) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se ha iniciado sesión');
        }
        
        const response = await fetch(`http://localhost:3000/api/admin/videos?id=${videoId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
                youtubeUrl: youtubeUrl,
                description: description
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el video');
        }
        
        return await response.json();
    }
    
    /**
     * Maneja la eliminación de un video
     */
    async function handleDeleteVideo() {
        try {
            const videoId = videoIdInput.value;
            const token = localStorage.getItem('token');
            
            if (!token || !videoId) {
                throw new Error('No se puede eliminar el video');
            }
            
            // Mostrar estado de carga en el botón de eliminar
            confirmDeleteBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...`;
            confirmDeleteBtn.disabled = true;
            
            const response = await fetch(`http://localhost:3000/api/admin/videos?id=${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('No se pudo eliminar el video');
            }
            
            // Cerrar el modal
            const modalEl = document.getElementById('deleteVideoModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('video_delete_success');
            
            // Redireccionar a la página de edición de playlist después de un breve retraso
            setTimeout(() => {
                if (playlistIdInput.value) {
                    window.location.href = `editPlaylist.html?id=${playlistIdInput.value}`;
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            
            // Restaurar estado del botón de eliminar
            confirmDeleteBtn.innerHTML = `Eliminar video`;
            confirmDeleteBtn.disabled = false;
            
            // Cerrar el modal
            const modalEl = document.getElementById('deleteVideoModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Mostrar mensaje de error
            window.Notifications.showError('video_delete_failed');
        }
    }
    
    /**
     * Maneja el cierre de sesión
     */
    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../shared/login.html';
                return;
            }
            
            const response = await fetch('http://localhost:3000/api/session', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Siempre limpiar localStorage y redirigir, sin importar la respuesta del API
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userName');
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('auth_logout_success');
            
            // Redireccionar después de un breve retraso
            setTimeout(() => {
                window.location.href = '../shared/login.html';
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            
            // Incluso si hay error, limpiamos el almacenamiento y redirigimos
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userName');
            window.location.href = '../shared/login.html';
        }
    }
});