document.addEventListener('DOMContentLoaded', function() {
    // Get the elements
    const originalText = document.getElementById('originalText');
    const collapsedText = document.getElementById('collapsedText');
    const readMoreBtn = document.getElementById('readMoreBtn');

    // Check if elements exist (they will only exist when there's a message)
    if (originalText && collapsedText && readMoreBtn) {
        // Get the original text content
        const fullText = originalText.textContent;

        // Only apply "Read More" if text is longer than a certain length
        const charLimit = 700; // Adjust this value as needed

        if (fullText.length > charLimit) {
            // Create the collapsed version
            collapsedText.innerHTML = fullText.substring(0, charLimit) + '...';

            // Add fade effect element
            const fadeElement = document.createElement('div');
            fadeElement.className = 'fade-out';
            collapsedText.appendChild(fadeElement);

            // Show collapsed text and hide original
            collapsedText.style.display = 'block';
            originalText.style.display = 'none';
            readMoreBtn.style.display = 'block';

            // Add click event for "Read More" button
            readMoreBtn.addEventListener('click', function() {
                if (collapsedText.classList.contains('expanded')) {
                    // Collapse
                    collapsedText.classList.remove('expanded');
                    collapsedText.innerHTML = fullText.substring(0, charLimit) + '...';

                    // Add fade effect again
                    const fadeElement = document.createElement('div');
                    fadeElement.className = 'fade-out';
                    collapsedText.appendChild(fadeElement);

                    readMoreBtn.textContent = 'Read More';
                } else {
                    // Expand
                    collapsedText.classList.add('expanded');
                    collapsedText.textContent = fullText;
                    readMoreBtn.textContent = 'Read Less';
                }
            });
        } else {
            // If text is short, just show the original content
            collapsedText.innerHTML = fullText;
            collapsedText.style.display = 'block';
            originalText.style.display = 'none';
            readMoreBtn.style.display = 'none';
        }
    }
});



document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('fileInput');
    const videoIcon = document.getElementById('video-icon');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoPreview = document.getElementById('video-preview');
    const thumbnailCanvas = document.getElementById('thumbnail-canvas');
    const fileName = document.getElementById('file-name');
    const uploadText = document.getElementById('upload-text');

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      uploadArea.classList.add('highlight');
    }

    function unhighlight() {
      uploadArea.classList.remove('highlight');
    }

    // Handle file drop
    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0 && files[0].type.startsWith('video/')) {
        fileInput.files = files;
        handleFiles(files);
      }
    }

    // Handle file selection via input
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        handleFiles(this.files);
      }
    });

    // Process the selected video file
    function handleFiles(files) {
      const file = files[0];

      if (file.type.startsWith('video/')) {
        // Display file name
        fileName.textContent = file.name;

        // Create video element for thumbnail generation
        const videoUrl = URL.createObjectURL(file);

        // Method 1: Using poster attribute (fallback)
        videoThumbnail.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23333'/%3E%3Cpath d='M80 55 L80 95 L130 75 Z' fill='%235865F2'/%3E%3C/svg%3E";
        videoThumbnail.style.display = 'block';

        // Method 2: Generate thumbnail from video frame
        videoPreview.src = videoUrl;
        videoPreview.onloadeddata = function() {
          try {
            // Set video current time to get a frame for thumbnail
            videoPreview.currentTime = 2000; // Get frame at 1 second

            videoPreview.onseeked = function() {
              // Create thumbnail from video frame
              const canvas = thumbnailCanvas;
              const ctx = canvas.getContext('2d');

              // Set canvas dimensions to match video
              canvas.width = videoPreview.videoWidth;
              canvas.height = videoPreview.videoHeight;

              // Draw video frame to canvas
              ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);

              // Convert canvas to image
              try {
                const thumbnailUrl = canvas.toDataURL('image/jpeg');
                videoThumbnail.src = thumbnailUrl;
                videoThumbnail.style.display = 'block';
                videoIcon.style.display = 'none';
                uploadText.style.display = 'none';

                // Log success
                console.log('Thumbnail generated successfully');
              } catch (err) {
                console.error('Error creating thumbnail:', err);
              }
            };
          } catch (err) {
            console.error('Error seeking video:', err);
          }
        };

        videoPreview.onerror = function() {
          console.error('Error loading video');
        };
      }
    }
  });