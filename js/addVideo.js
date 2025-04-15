document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const addVideoForm = document.getElementById('addVideoForm');
    const videoNameInput = document.getElementById('videoName');
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const videoDescriptionInput = document.getElementById('videoDescription');
    const playlistIdInput = document.getElementById('playlistId');
    const playlistNameBadge = document.getElementById('playlistNameBadge');
    const videoPreviewContainer = document.getElementById('videoPreviewContainer');
    const videoPreview = document.getElementById('videoPreview');
    const previewBtn = document.getElementById('previewBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Referencias para el nombre del usuario en la navbar
    const userDisplayName = document.getElementById('userDisplayName');
    
    // Variables globales
    let currentPlaylistName = '';
    
    init();
    
    function init() {

        displayUserName();
        
        // Obtener el ID de la playlist de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const playlistId = urlParams.get('playlistId');
        
        if (!playlistId) {
            window.Notifications.showError('playlist_not_found', 'Playlist no identificada');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }
        
        // Establecer el ID de la playlist en el formulario
        playlistIdInput.value = playlistId;
        
        // Cargar información de la playlist
        loadPlaylistInfo(playlistId);
        
        // Configurar event listeners
        setupEventListeners();
    }
    
    function displayUserName() {
        const userName = localStorage.getItem('userName');
        if (userName) {
            userDisplayName.textContent = userName;
        }
    }
    
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
        
        // Cancelar y volver al dashboard o a la edición de playlist
        cancelBtn.addEventListener('click', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const playlistId = urlParams.get('playlistId');
            
            if (playlistId) {
                window.location.href = `editPlaylist.html?id=${playlistId}`;
            } else {
                window.location.href = 'dashboard.html';
            }
        });
        
        // Envío del formulario
        addVideoForm.addEventListener('submit', handleFormSubmit);
        
        // Event listener para el botón de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
        
        // Evento para actualizar la vista previa cuando cambia la URL
        youtubeUrlInput.addEventListener('input', function() {
            // Ocultar la vista previa cuando se está editando la URL
            videoPreviewContainer.style.display = 'none';
        });
    }
    
    /**
     * Carga la información de la playlist
     * @param {string} playlistId - ID de la playlist
     */
    async function loadPlaylistInfo(playlistId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.Notifications.showError('auth_not_authenticated');
                setTimeout(() => {
                    window.location.href = '../shared/login.html';
                }, 2000);
                return;
            }
            
            const response = await fetch(`http://localhost:3000/api/admin/playlists?id=${playlistId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar la información de la playlist');
            }
            
            const playlistData = await response.json();
            currentPlaylistName = playlistData.name;
            
            // Mostrar el nombre de la playlist en la insignia
            playlistNameBadge.textContent = currentPlaylistName;
            
        } catch (error) {
            console.error('Error:', error);
            window.Notifications.showError('playlist_not_found', 'Playlist no encontrada');
            
            // Añadir botón para volver al dashboard
            playlistNameBadge.innerHTML = `
                <span class="badge bg-danger">Error: Playlist no encontrada</span>
            `;
        }
    }
    
    /**
     * Maneja la vista previa del video
     */
    function handlePreview() {
        const youtubeUrl = youtubeUrlInput.value.trim();
        
        if (!youtubeUrl) {
            window.Notifications.showFieldError(youtubeUrlInput, 'validation_required');
            return;
        }
        
        // Obtener el ID del video de YouTube desde la URL
        const videoId = extractYouTubeId(youtubeUrl);
        
        if (!videoId) {
            window.Notifications.showFieldError(youtubeUrlInput, 'validation_youtube_url');
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
        
        // Mostrar el contenedor de vista previa
        videoPreviewContainer.style.display = 'block';
        
        // Limpiar cualquier error en la URL
        window.Notifications.clearFieldError(youtubeUrlInput);
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
        window.Notifications.toggleFormLoading(addVideoForm, true, 'Añadiendo video...');
        
        // Obtener los valores del formulario
        const videoName = videoNameInput.value.trim();
        const youtubeUrl = youtubeUrlInput.value.trim();
        const description = videoDescriptionInput.value.trim();
        const playlistId = playlistIdInput.value;
        
        try {
            // Crear el video
            const videoData = await addVideoToPlaylist(videoName, youtubeUrl, description, playlistId);
            
            if (videoData && videoData._id) {
                // Mostrar mensaje de éxito
                window.Notifications.showSuccess('video_add_success');
                
                // Redireccionar a la página de edición de playlist después de un breve retraso
                setTimeout(() => {
                    window.location.href = `editPlaylist.html?id=${playlistId}`;
                }, 1500);
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(addVideoForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('video_create_failed');
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
     * Añade un video a una playlist en el servidor
     * @param {string} name - Nombre del video
     * @param {string} youtubeUrl - URL de YouTube
     * @param {string} description - Descripción del video
     * @param {string} playlistId - ID de la playlist
     * @returns {Promise<Object>} - Datos del video creado
     */
    async function addVideoToPlaylist(name, youtubeUrl, description, playlistId) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se ha iniciado sesión');
        }
        
        const response = await fetch('http://localhost:3000/api/admin/videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
                youtubeUrl: youtubeUrl,
                description: description,
                playlistId: playlistId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al añadir el video');
        }
        
        return await response.json();
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
            
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userName');
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('auth_logout_success', 'Sesión cerrada');
            
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