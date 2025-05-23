document.addEventListener('DOMContentLoaded', function() {
    // Handle file upload functionality
    setupFileUploadFunctionality();
    // Set up File submission
    setupFileSubmission();
    // Check for existing meeting
    checkForExistingMeeting();
});


function checkForExistingMeeting() {
    const summaryTextElement = document.getElementById('summaryText');
    if (summaryTextElement && summaryTextElement.textContent.trim()) {
        console.log("Found existing meeting summary, parsing...");
        parseMeetingData(summaryTextElement.textContent);

        const welcome = document.querySelector('.welcome-container');
        if (welcome) {
            welcome.classList.add('hidden');
            welcome.classList.remove('visible');
        }

        const minutes = document.querySelector('.minutes-container');
        if (minutes) {
            minutes.classList.remove('hidden');
            minutes.classList.add('visible');
        }

        const btnContainer = document.querySelector('.button-container');
        if (btnContainer) {
            btnContainer.classList.remove('hidden');
            btnContainer.classList.add('visible');
        }

        const mainTitle = document.querySelector('h1');
        if (mainTitle) {
            mainTitle.classList.remove('hidden');
            mainTitle.classList.add('visible');
        }

        setTimeout(() => {
            const originalTextElement = document.getElementById('originalText');
            if (originalTextElement && originalTextElement.textContent.trim()) {
                console.log("Original text found, setting up read more functionality");
                setupReadMoreFunctionality();
            } else {
                console.warn('Original text is not available yet for existing meeting');
                loadOriginalText();
            }
        }, 100);
    }
}
function loadOriginalText() {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meetingId');

    if (meetingId) {
        console.log("Fetching original text for meeting ID:", meetingId);

        fetch(`/api/meetings/${meetingId}/transcript`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch transcript');
                }
                return response.text();
            })
            .then(text => {
                console.log("Received transcript text");
                const originalTextElement = document.getElementById('originalText');
                if (originalTextElement) {
                    originalTextElement.textContent = text;
                    setupReadMoreFunctionality();
                }
            })
            .catch(error => {
                console.error('Error fetching transcript:', error);
            });
    }
}

function setupReadMoreFunctionality() {
    // Get the elements
    const originalText = document.getElementById('originalText');
    const collapsedText = document.getElementById('collapsedText');
    const readMoreBtn = document.getElementById('readMoreBtn');

    // Check if elements exist (they will only exist when there's a message)
    if (originalText && collapsedText && readMoreBtn) {
        // Get the original text content
        const fullText = originalText.textContent || originalText.innerText;

        if (!fullText || fullText.trim() === '') {
            console.warn('Original text is empty, cannot setup read more functionality');
            return;
        }

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
            readMoreBtn.replaceWith(readMoreBtn.cloneNode(true));
            const newReadMoreBtn = document.getElementById('readMoreBtn');
            // Add click event for "Read More" button
            newReadMoreBtn.addEventListener('click', function() {
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
    } else {
        console.warn('One or more elements required for read more functionality not found');
    }
}

// Helper function to format time remaining
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return "Processing...";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}, ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
    } else {
        return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
    }
}

function setupFileSubmission() {
    const fileInput = document.getElementById('fileInput');
    const submitButton = document.getElementById('submit-button');
    const mainContent = document.querySelector('.main-content');

    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    if (fileInput && submitButton) {
        submitButton.addEventListener('click', async function () {
        let lastEta = null;
        let lastEtaTime = null;
            if (fileInput.files.length === 0) {
                console.error('No file selected for submission.');
                return;
            }

            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);

            // Show loading UI
            // First hide any existing content containers
            const welcomeContainer = document.querySelector('.welcome-container');
            const minutesContainer = document.querySelector('.minutes-container');
            const buttonContainer = document.querySelector('.button-container');

            if (welcomeContainer) {
                welcomeContainer.classList.add('hidden');
                welcomeContainer.classList.remove('visible');
            }

            if (minutesContainer) {
                minutesContainer.classList.add('hidden');
                minutesContainer.classList.remove('visible');
            }

            if (buttonContainer) {
                buttonContainer.classList.add('hidden');
                buttonContainer.classList.remove('visible');
            }

            // Create progress container
            let progressContainer = document.querySelector('.progress-container');

            // If progress container doesn't exist, create it
            if (!progressContainer) {
                progressContainer = document.createElement('div');
                progressContainer.className = 'progress-container';
                progressContainer.innerHTML = `
                    <div class="progress-header">
                        <h2>Processing Your Meeting</h2>
                        <p>Please wait while we analyze your video</p>
                    </div>
                    <div class="progress-animation">
                        <div class="progress-circle"></div>
                    </div>
                    <div class="progress-steps">
                        <div class="progress-step active" id="step-uploading">
                            <div class="step-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                            <div class="step-text">Uploading</div>
                        </div>
                        <div class="progress-step" id="step-transcribing">
                            <div class="step-icon"><i class="fas fa-file-alt"></i></div>
                            <div class="step-text">Transcribing</div>
                        </div>
                        <div class="progress-step" id="step-analyzing">
                            <div class="step-icon"><i class="fas fa-brain"></i></div>
                            <div class="step-text">Analyzing</div>
                        </div>
                        <div class="progress-step" id="step-summarizing">
                            <div class="step-icon"><i class="fas fa-list-alt"></i></div>
                            <div class="step-text">Summarizing</div>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="progress-bar"></div>
                    </div>
                    <div class="progress-percentage" id="progress-percentage">0%</div>
                    <div class="progress-message" id="progress-message">Starting upload...</div>
                    <div class="time-remaining" id="time-remaining"></div>
                `;

                // Append progress container to main content
                mainContent.appendChild(progressContainer);
            } else {
                // If progress container exists, make it visible
                progressContainer.style.display = 'block';
            }

            // Initialize progress bar
            const progressBar = document.getElementById('progress-bar');
            const progressPercentage = document.getElementById('progress-percentage');
            const progressMessage = document.getElementById('progress-message');
            const timeRemaining = document.getElementById('time-remaining');

            // Activate first step
            updateProgressStep('uploading');

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        [csrfHeader]: csrfToken
                    }
                });

                if (!response.ok) {
                    throw new Error("Upload failed with status " + response.status);
                }

                const uuid = await response.text(); // the UUID returned from server
                console.log("Upload successful, UUID:", uuid);

                // Update progress UI after successful upload
                updateProgressStep('transcribing');
                document.getElementById('progress-message').innerText = "Processing audio from video...";
                document.getElementById('progress-bar').style.width = "10%";
                document.getElementById('progress-percentage').innerText = "10%";

                const interval = setInterval(() => {
                    fetch(`/poll-summary?uuid=${uuid}`)
                        .then(res => res.json())
                        .then(data => {
                           if (data.status === "done") {
                                   clearInterval(interval);
                                   console.log("Summary:", data.summary);
                                   console.log("Original Text:", data.originalText);

                                   // Show completion animation
                                   document.getElementById('progress-bar').style.width = "100%";
                                   document.getElementById('progress-percentage').innerText = "100%";
                                   document.getElementById('progress-message').innerText = "Processing complete!";
                                   if (timeRemaining) {
                                       timeRemaining.innerText = "";
                                   }
                                   updateProgressStep('completed');

                                   // Hide progress container
                                   const progressContainer = document.querySelector('.progress-container');
                                   if (progressContainer) {
                                       progressContainer.style.display = 'none';
                                   }

                                   // Show minutes container
                                   const minutesContainer = document.querySelector('.minutes-container');
                                   const btnContainer = document.querySelector('.button-container');
                                   const mainTitle = document.querySelector('h1');

                                   if (minutesContainer) {
                                       minutesContainer.classList.remove('hidden');
                                       minutesContainer.classList.add('visible');
                                   }

                                   if (btnContainer) {
                                       btnContainer.classList.remove('hidden');
                                       btnContainer.classList.add('visible');
                                   }

                                   if (mainTitle) {
                                       mainTitle.classList.remove('hidden');
                                       mainTitle.classList.add('visible');
                                   }

                                   // Parse data once
                                   parseMeetingData(data.summary);

                                   // Set the original text
                                   const originalTextElement = document.getElementById('originalText');
                                   if (originalTextElement) {
                                       originalTextElement.textContent = data.originalText;
                                       // Make sure it's not hidden
                                       originalTextElement.style.display = 'block';
                                   }

                                   // Re-initialize the read more functionality
                                   setupReadMoreFunctionality();
                                }
                             else if (data.status === "processing") {
                                // Update progress based on server response
                                const progress = data.progress || 0;
                                console.log("Progress:", progress + "%");
                                console.log("Eta: ", data.eta + " seconds ");

                                // Update progress bar and percentage
                                document.getElementById('progress-bar').style.width = progress + "%";
                                document.getElementById('progress-percentage').innerText = Math.round(progress) + "%";
  const currentTime = Date.now();
                let displayEta = data.eta;

                if (data.eta !== undefined) {
                    if (lastEta === null || data.eta !== lastEta) {
                        // Reset our tracking when we get a new ETA value
                        lastEta = data.eta;
                        lastEtaTime = currentTime;
                        displayEta = data.eta;
                    } else {
                        // Calculate time elapsed since last ETA update
                        const elapsedSeconds = Math.floor((currentTime - lastEtaTime) / 1000);
                        displayEta = Math.max(lastEta - elapsedSeconds, 0);
                    }
                }
                                // Update time remaining display
                                if (timeRemaining && data.eta !== undefined) {
                                    timeRemaining.innerText = formatTimeRemaining(displayEta);
                                }

                                // Update step based on progress
                                if (progress < 70) {
                                    updateProgressStep('transcribing');
                                    document.getElementById('progress-message').innerText = "Transcribing audio...";
                                } else if (progress < 80) {
                                    updateProgressStep('analyzing');
                                    document.getElementById('progress-message').innerText = "Analyzing meeting content...";
                                } else {
                                    updateProgressStep('summarizing');
                                    document.getElementById('progress-message').innerText = "Creating meeting summary...";
                                }
                            } else if (data.status === "not_found") {
                                clearInterval(interval);
                                console.log("Summary not found or expired.");
                                document.getElementById('progress-message').innerText = "Error: Processing failed.";
                                if (timeRemaining) {
                                    timeRemaining.innerText = "";
                                }
                            }
                        })
                        .catch(err => {
                            clearInterval(interval);
                            console.error("Polling error", err);
                            document.getElementById('progress-message').innerText = "Error: " + err.message;
                            if (timeRemaining) {
                                timeRemaining.innerText = "";
                            }
                        });
                }, 500);

            } catch (error) {
                console.error('Error during upload:', error);
                document.getElementById('progress-message').innerText = "Error: " + error.message;
                if (timeRemaining) {
                    timeRemaining.innerText = "";
                }
            }
        });
    }
}

function updateProgressStep(step) {
    const steps = ['uploading', 'transcribing', 'analyzing', 'summarizing'];
    const stepTexts = {
        'uploading': { active: 'Uploading', completed: 'Uploaded' },
        'transcribing': { active: 'Transcribing', completed: 'Transcribed' },
        'analyzing': { active: 'Analyzing', completed: 'Analyzed' },
        'summarizing': { active: 'Summarizing', completed: 'Summarized' }
    };

    const currentIndex = steps.indexOf(step);

    document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active', 'completed'));

    for (let i = 0; i < steps.length; i++) {
        const stepEl = document.getElementById('step-' + steps[i]);
        const stepTextEl = stepEl.querySelector('.step-text');

        if (i < currentIndex) {
            stepEl.classList.add('completed');
            stepTextEl.textContent = stepTexts[steps[i]].completed;
        } else if (i === currentIndex) {
            stepEl.classList.add('active');
            stepTextEl.textContent = stepTexts[steps[i]].active;
        } else {
            stepTextEl.textContent = stepTexts[steps[i]].active;
        }
    }

    if (step === 'completed') {
        for (let i = 0; i < steps.length; i++) {
            const stepEl = document.getElementById('step-' + steps[i]);
            const stepTextEl = stepEl.querySelector('.step-text');
            stepEl.classList.add('completed');
            stepTextEl.textContent = stepTexts[steps[i]].completed;
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

function parseMeetingData(data) {
        if (!data) return;

        try {
            // Clean JSON string from markdown syntax
            const jsonContent = data.replace(/```json/g, '').replace(/```/g, '').trim();

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