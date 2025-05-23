const API_URL = 'http://localhost:3000/api';
const GRAPHQL_URL = 'http://localhost:4000/graphql';

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
    
    // Referencias para búsqueda de YouTube
    const searchQuery = document.getElementById('searchQuery');
    const searchYoutubeBtn = document.getElementById('searchYoutubeBtn');
    const searchResults = document.getElementById('searchResults');
    const searchLoadingIndicator = document.getElementById('searchLoadingIndicator');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const selectedVideoForm = document.getElementById('selectedVideoForm');
    const selectedVideoPreview = document.getElementById('selectedVideoPreview');
    const selectedVideoName = document.getElementById('selectedVideoName');
    const selectedVideoDescription = document.getElementById('selectedVideoDescription');
    const selectedVideoUrl = document.getElementById('selectedVideoUrl');
    const cancelSelectedBtn = document.getElementById('cancelSelectedBtn');
    
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
        
        // Event listener para búsqueda en YouTube
        searchYoutubeBtn.addEventListener('click', handleYoutubeSearch);
        
        // Event listener para presionar Enter en el campo de búsqueda
        searchQuery.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleYoutubeSearch();
            }
        });
        
        // Event listener para cancelar la selección de video
        cancelSelectedBtn.addEventListener('click', function() {
            selectedVideoForm.style.display = 'none';
        });
        
        // Event listener para enviar el formulario de video seleccionado
        selectedVideoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSelectedVideoSubmit();
        });
    }
    
    /**
     * Carga la información de la playlist usando GraphQL
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
            
            // Consulta GraphQL para obtener datos de la playlist
            const graphqlQuery = `
                query GetPlaylist($id: ID!) {
                    playlist(id: $id) {
                        _id
                        name
                        associatedProfiles
                        adminId
                        createdAt
                        videoCount
                    }
                }
            `;
            
            // Realizar la consulta GraphQL
            const response = await fetch(GRAPHQL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: {
                        id: playlistId
                    }
                })
            });
            
            const result = await response.json();
            
            // Verificar errores en la respuesta GraphQL
            if (result.errors) {
                throw new Error(result.errors[0].message || 'Error al obtener datos de la playlist');
            }
            
            // Obtener la playlist de la respuesta
            const playlistData = result.data.playlist;
            currentPlaylistName = playlistData.name;
            
            // Mostrar el nombre de la playlist en la insignia
            playlistNameBadge.textContent = currentPlaylistName;
            
        } catch (error) {
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
        
        const response = await fetch(`${API_URL}/admin/videos`, {
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
     * Maneja la búsqueda de videos en YouTube
     */
    async function handleYoutubeSearch() {
        const query = searchQuery.value.trim();
        
        if (!query) {
            window.Notifications.showFieldError(searchQuery, 'validation_required');
            return;
        }
        
        // Mostrar indicador de carga
        searchLoadingIndicator.style.display = 'block';
        searchResults.style.display = 'none';
        noResultsMessage.style.display = 'none';
        selectedVideoForm.style.display = 'none';
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se ha iniciado sesión');
            }
            
            // Realizar la búsqueda usando la API de YouTube integrada en el backend
            const response = await fetch(`${API_URL}/youtube/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al realizar la búsqueda en YouTube');
            }
            
            const videos = await response.json();
            
            // Ocultar indicador de carga
            searchLoadingIndicator.style.display = 'none';
            
            // Mostrar resultados o mensaje de no resultados
            if (videos && videos.length > 0) {
                displaySearchResults(videos);
                searchResults.style.display = 'flex';
            } else {
                noResultsMessage.style.display = 'block';
            }
            
        } catch (error) {
            // Ocultar indicador de carga
            searchLoadingIndicator.style.display = 'none';
            
            // Mostrar mensaje de error
            window.Notifications.showError('search_error', 'Error al buscar videos en YouTube');
        }
    }
    
    /**
     * Muestra los resultados de la búsqueda
     * @param {Array} videos - Lista de videos encontrados
     */
    function displaySearchResults(videos) {
        // Limpiar resultados anteriores
        searchResults.innerHTML = '';
        
        // Mostrar cada video encontrado
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'col-md-6 mb-3';
            videoCard.innerHTML = `
                <div class="card h-100 youtube-result-card" data-video-id="${video.id}" data-video-url="${video.youtubeUrl}" data-video-title="${video.title}" data-video-description="${video.description || ''}">
                    <div class="card-img-top youtube-thumbnail">
                        <img src="${video.thumbnail}" alt="${video.title}" class="img-fluid">
                        <div class="play-overlay">
                            <i class="bi bi-play-circle-fill"></i>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text text-muted">${video.channelTitle}</p>
                        <p class="card-text small description-truncate">${video.description || 'Sin descripción'}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary w-100 select-video-btn">
                            <i class="bi bi-plus-circle"></i> Seleccionar
                        </button>
                    </div>
                </div>
            `;
            
            // Añadir evento para seleccionar el video
            const selectBtn = videoCard.querySelector('.select-video-btn');
            selectBtn.addEventListener('click', function() {
                const card = this.closest('.youtube-result-card');
                selectVideo(card);
            });
            
            // Añadir evento para previsualizar el video
            const thumbnailContainer = videoCard.querySelector('.youtube-thumbnail');
            thumbnailContainer.addEventListener('click', function() {
                const card = this.closest('.youtube-result-card');
                previewYoutubeVideo(card.getAttribute('data-video-id'));
            });
            
            searchResults.appendChild(videoCard);
        });
    }
    
    /**
     * Previsualiza un video de YouTube en una ventana modal
     * @param {string} videoId - ID del video a previsualizar
     */
    function previewYoutubeVideo(videoId) {
        // Crear un modal dinámico para la vista previa
        const previewModal = document.createElement('div');
        previewModal.className = 'modal fade';
        previewModal.id = 'youtubePreviewModal';
        previewModal.setAttribute('tabindex', '-1');
        previewModal.setAttribute('aria-hidden', 'true');
        
        previewModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Vista previa del video</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div class="ratio ratio-16x9">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                title="YouTube video player" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir el modal al DOM
        document.body.appendChild(previewModal);
        
        // Mostrar el modal
        const bsModal = new bootstrap.Modal(previewModal);
        bsModal.show();
        
        // Eliminar el modal del DOM cuando se cierre
        previewModal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(previewModal);
        });
    }
    
    /**
     * Selecciona un video de los resultados de búsqueda
     * @param {HTMLElement} card - Tarjeta del video seleccionado
     */
    function selectVideo(card) {
        const videoId = card.getAttribute('data-video-id');
        const videoUrl = card.getAttribute('data-video-url');
        const videoTitle = card.getAttribute('data-video-title');
        const videoDescription = card.getAttribute('data-video-description') || '';
        
        // Rellenar el formulario de video seleccionado
        selectedVideoName.value = videoTitle;
        selectedVideoDescription.value = videoDescription;
        selectedVideoUrl.value = videoUrl;
        
        // Mostrar la vista previa del video seleccionado
        selectedVideoPreview.innerHTML = `
            <div class="selected-video-card">
                <div class="ratio ratio-16x9 mb-3">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
        
        // Mostrar el formulario de video seleccionado
        selectedVideoForm.style.display = 'block';
        
        // Desplazarse hasta el formulario
        selectedVideoForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Maneja el envío del formulario de video seleccionado
     */
    async function handleSelectedVideoSubmit() {
        // Validar el formulario
        if (selectedVideoName.value.trim() === '') {
            window.Notifications.showFieldError(selectedVideoName, 'validation_required');
            return;
        }
        
        // Activar estado de carga
        window.Notifications.toggleFormLoading(selectedVideoForm, true, 'Añadiendo video...');
        
        // Obtener los valores del formulario
        const videoName = selectedVideoName.value.trim();
        const youtubeUrl = selectedVideoUrl.value.trim();
        const description = selectedVideoDescription.value.trim();
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
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(selectedVideoForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('video_create_failed');
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
            
            const response = await fetch(`${API_URL}/session`, {
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
            // Incluso si hay error, limpiamos el almacenamiento y redirigimos
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userName');
            window.location.href = '../shared/login.html';
        }
    }
});