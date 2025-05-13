document.addEventListener('DOMContentLoaded', function() {
    // Handle the original text collapse/expand functionality
    setupReadMoreFunctionality();

    // Handle file upload functionality
    setupFileUploadFunctionality();

    // Parse and render meeting data from the JSON
    parseMeetingData();
});

function setupReadMoreFunctionality() {
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

                    readMoreBtn.textContent = 'Show more';
                } else {
                    // Expand
                    collapsedText.classList.add('expanded');
                    collapsedText.textContent = fullText;
                    readMoreBtn.textContent = 'Show less';
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
}

function setupFileUploadFunctionality() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('fileInput');
    const videoIcon = document.getElementById('video-icon');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoPreview = document.getElementById('video-preview');
    const thumbnailCanvas = document.getElementById('thumbnail-canvas');
    const fileName = document.getElementById('file-name');
    const uploadText = document.getElementById('upload-text');

    if (!uploadArea || !fileInput) return;

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
}

function parseMeetingData() {
     const originalText = document.getElementById('originalText');
        if (!originalText) return;

        try {
            let jsonContent = originalText.textContent;
            // Clean JSON string from markdown syntax
            jsonContent = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();

            const meetingData = JSON.parse(jsonContent);
            renderMeetingInfo(meetingData.meetingInfo);
            renderKeyPoints(meetingData.keyPoints);
            renderActionItems(meetingData.actionItems);
            renderDecisions(meetingData.decisions);
        } catch (error) {
            console.error('Error parsing meeting data:', error);
        }
}

function renderMeetingInfo(meetingInfo) {
    const container = document.getElementById('meetingInfoContainer');
    if (!container || !meetingInfo) return;

    const html = `
        <div class="meeting-header">
            <div class="meetingInfo">
                <div class="meeting-title">${meetingInfo.title || 'Untitled Meeting'}</div>
                <p class="meeting-date">${meetingInfo.date || 'No date specified'}</p>
            </div>
        </div>
        ${meetingInfo.attendees && meetingInfo.attendees.length > 0 ? `
            <div class="attendees-list">
                <h4 class="attendees-title">Attendees:</h4>
                <div class="attendees">
                    ${meetingInfo.attendees.map(attendee => `
                        <div class="attendee">${attendee}</div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    container.innerHTML = html;
}

function renderKeyPoints(keyPoints) {
    const container = document.getElementById('keyPointsContainer');
    if (!container || !keyPoints || keyPoints.length === 0) return;

    const html = keyPoints.map(point => `
        <div class="key-point">${point}</div>
    `).join('');

    container.innerHTML = html;
}

function renderActionItems(actionItems) {
    const container = document.getElementById('actionItemsContainer');
    if (!container || !actionItems || actionItems.length === 0) return;

    const html = actionItems.map(item => `
        <div class="action-item">
            <div class="action-description">${item.description}</div>
            <div class="action-details">
                <div class="action-detail">
                    <span class="detail-label">Owner:</span>
                    <span class="detail-value">${item.owner || 'Not assigned'}</span>
                </div>
                <div class="action-detail">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value">${item.dueDate || 'Not specified'}</span>
                </div>
                <div class="action-detail">
                    <span class="detail-label">Status:</span>
                    <span class="status-tag status-${item.status ? item.status.toLowerCase().replace(/\s+/g, '') : 'pending'}">${item.status || 'Pending'}</span>
                </div>
                <div class="action-detail">
                    <span class="detail-label">Priority:</span>
                    <span class="priority-tag priority-${item.priority ? item.priority.toLowerCase() : 'medium'}">${item.priority || 'Medium'}</span>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function renderDecisions(decisions) {
    const container = document.getElementById('decisionsContainer');
    if (!container || !decisions || decisions.length === 0) return;

    const html = decisions.map(decision => `
        <div class="decision">
            <div class="decision-description">${decision.description}</div>
            <div class="decision-details">
                ${decision.rationale ? `
                <div class="decision-detail">
                    <span class="detail-label">Rationale:</span>
                    <span class="detail-value">${decision.rationale}</span>
                </div>
                ` : ''}
                ${decision.decidedBy ? `
                <div class="decision-detail">
                    <span class="detail-label">Decided By:</span>
                    <span class="detail-value">${decision.decidedBy}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}