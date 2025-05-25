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

                                // Update time remaining display
                                if (timeRemaining && data.eta !== undefined) {
                                    timeRemaining.innerText = formatTimeRemaining(data.eta);
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



// Export Modal Functions
function showExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('show');
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

function hideExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = 'auto';
    }
}





function showExportSuccess(format) {
    // Create temporary success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background-color: #43b581;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-size: 1.4rem;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    successMsg.innerHTML = `<i class="fas fa-check"></i> Exported to ${format} successfully!`;

    document.body.appendChild(successMsg);

    // Remove after 3 seconds
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.remove();
        }
    }, 3000);
}

function showExportError(format) {
    // Create temporary error message
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background-color: #f04747;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-size: 1.4rem;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed to export to ${format}`;

    document.body.appendChild(errorMsg);

    // Remove after 4 seconds
    setTimeout(() => {
        if (errorMsg.parentNode) {
            errorMsg.remove();
        }
    }, 4000);
}

// Helper function to get current meeting data
function getMeetingData() {
    // Extract data from the current page
    const meetingTitle = document.querySelector('.meeting-title')?.textContent || 'Meeting Minutes';
    const meetingDate = document.querySelector('.meeting-date')?.textContent || new Date().toLocaleDateString();

    // Extract attendees
    const attendees = Array.from(document.querySelectorAll('.attendee')).map(el => el.textContent);

    // Extract key points
    const keyPoints = Array.from(document.querySelectorAll('.key-point')).map(el => el.textContent);

    // Extract action items
    const actionItems = Array.from(document.querySelectorAll('.action-item')).map(item => {
        const description = item.querySelector('.action-description')?.textContent || '';
        const owner = item.querySelector('.detail-value')?.textContent || '';
        return { description, owner };
    });

    // Extract decisions
    const decisions = Array.from(document.querySelectorAll('.decision')).map(item => {
        const description = item.querySelector('.decision-description')?.textContent || '';
        return { description };
    });

    // Extract original text
    const originalText = document.getElementById('originalText')?.textContent || '';

    return {
        title: meetingTitle,
        date: meetingDate,
        attendees,
        keyPoints,
        actionItems,
        decisions,
        originalText
    };
}

// Initialize export modal event listeners
function initializeExportModal() {
    // Close modal when clicking outside
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideExportModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('exportModal');
            if (modal && modal.classList.contains('show')) {
                hideExportModal();
            }
        }
    });

    // Add event listener to existing Export button
    const existingExportBtn = document.querySelector('.button-container .button');
    if (existingExportBtn) {
        existingExportBtn.addEventListener('click', showExportModal);
    }
}

// Add slide in animation styles
function addExportAnimationStyles() {
    if (!document.getElementById('export-animations')) {
        const style = document.createElement('style');
        style.id = 'export-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export to Word function
function exportToWord() {
    const option = document.querySelector('.export-option.word');

    if (option) {
        // Add loading state
        option.classList.add('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            // Extract data from HTML
            const meetingData = extractMeetingDataFromHTML();

            // Generate Word document content
            generateWordDocument(meetingData, option);

        } catch (error) {
            console.error('Word Export error:', error);
            showExportError('Word');

            // Reset loading state
            option.classList.remove('loading');
            option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-word"></i>';
        }
    }
}

function generateWordDocument(meetingData, option) {
    try {
        // Create HTML content for Word document
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${meetingData.title}</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #5865F2;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .title {
                        font-size: 28px;
                        font-weight: bold;
                        color: #5865F2;
                        margin-bottom: 10px;
                    }
                    .date {
                        font-size: 16px;
                        color: #666;
                    }
                    .section {
                        margin-bottom: 25px;
                    }
                    .section-title {
                        font-size: 20px;
                        font-weight: bold;
                        color: #5865F2;
                        border-bottom: 2px solid #e0e0e0;
                        padding-bottom: 5px;
                        margin-bottom: 15px;
                    }
                    .attendees {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                    }
                    .attendee {
                        background-color: #f0f2ff;
                        padding: 5px 12px;
                        border-radius: 15px;
                        font-size: 14px;
                        color: #5865F2;
                        font-weight: 500;
                    }
                    .key-point {
                        background-color: #f8f9fa;
                        padding: 12px;
                        margin-bottom: 8px;
                        border-left: 4px solid #5865F2;
                        border-radius: 4px;
                    }
                    .action-item, .decision {
                        background-color: #fff;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .action-description, .decision-description {
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #333;
                    }
                    .action-details {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 8px;
                        font-size: 14px;
                    }
                    .action-detail {
                        display: flex;
                        align-items: center;
                    }
                    .detail-label {
                        font-weight: 600;
                        margin-right: 8px;
                        color: #666;
                    }
                    .status-tag, .priority-tag {
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .status-tag { background-color: #fff3cd; color: #856404; }
                    .priority-high { background-color: #f8d7da; color: #721c24; }
                    .priority-medium { background-color: #fff3cd; color: #856404; }
                    .priority-low { background-color: #d1ecf1; color: #0c5460; }
                    .original-text {
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.5;
                        white-space: pre-wrap;
                        max-height: 400px;
                        overflow-y: auto;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">${meetingData.title}</div>
                    <div class="date">${meetingData.date}</div>
                </div>
        `;

        // Add attendees section
        if (meetingData.attendees && meetingData.attendees.length > 0) {
            htmlContent += `
                <div class="section">
                    <div class="section-title">Attendees</div>
                    <div class="attendees">
                        ${meetingData.attendees.map(attendee => `<div class="attendee">${attendee}</div>`).join('')}
                    </div>
                </div>
            `;
        }

        // Add key points section
        if (meetingData.keyPoints && meetingData.keyPoints.length > 0) {
            htmlContent += `
                <div class="section">
                    <div class="section-title">Key Points</div>
                    ${meetingData.keyPoints.map((point, index) =>
                        `<div class="key-point">${index + 1}. ${point}</div>`
                    ).join('')}
                </div>
            `;
        }

        // Add action items section
        if (meetingData.actionItems && meetingData.actionItems.length > 0) {
            htmlContent += `
                <div class="section">
                    <div class="section-title">Action Items</div>
                    ${meetingData.actionItems.map((item, index) => `
                        <div class="action-item">
                            <div class="action-description">${index + 1}. ${item.description}</div>
                            <div class="action-details">
                                <div class="action-detail">
                                    <span class="detail-label">Owner:</span>
                                    <span>${item.owner}</span>
                                </div>
                                <div class="action-detail">
                                    <span class="detail-label">Due Date:</span>
                                    <span>${item.dueDate}</span>
                                </div>
                                <div class="action-detail">
                                    <span class="detail-label">Status:</span>
                                    <span class="status-tag">${item.status}</span>
                                </div>
                                <div class="action-detail">
                                    <span class="detail-label">Priority:</span>
                                    <span class="priority-tag priority-${item.priority.toLowerCase()}">${item.priority}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Add decisions section
        if (meetingData.decisions && meetingData.decisions.length > 0) {
            htmlContent += `
                <div class="section">
                    <div class="section-title">Decisions</div>
                    ${meetingData.decisions.map((decision, index) => `
                        <div class="decision">
                            <div class="decision-description">${index + 1}. ${decision.description}</div>
                            ${decision.rationale ? `<div><strong>Rationale:</strong> ${decision.rationale}</div>` : ''}
                            ${decision.decidedBy ? `<div><strong>Decided by:</strong> ${decision.decidedBy}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Add original text section
        if (meetingData.originalText) {
            htmlContent += `
                <div class="section">
                    <div class="section-title">Original Transcript</div>
                    <div class="original-text">${meetingData.originalText}</div>
                </div>
            `;
        }

        htmlContent += `
            </body>
            </html>
        `;

        // Create and download the file
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meetingData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_minutes.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Reset loading state
        option.classList.remove('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-word"></i>';

        // Hide modal and show success
        hideExportModal();
        showExportSuccess('Word');

    } catch (error) {
        console.error('Word generation error:', error);
        showExportError('Word');

        // Reset loading state
        option.classList.remove('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-word"></i>';
    }
}


//function generateRTFDocument(option) {
//    try {
//        const meetingData = extractMeetingDataFromHTML();
//
//        let rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}`;
//        rtfContent += `\\f0\\fs24`;
//
//        rtfContent += `\\qc\\b\\fs32\\cf1 ${meetingData.title}\\b0\\fs24\\cf0\\par\\par`;
//        rtfContent += `\\qc\\fs20 ${meetingData.date}\\fs24\\par\\par`;
//        rtfContent += `\\ql\\line\\line`;
//
//        if (meetingData.attendees && meetingData.attendees.length > 0) {
//            rtfContent += `\\b\\fs28\\cf1 Attendees:\\b0\\fs24\\cf0\\par`;
//            rtfContent += `${meetingData.attendees.join(', ')}\\par\\par`;
//        }
//
//        if (meetingData.keyPoints && meetingData.keyPoints.length > 0) {
//            rtfContent += `\\b\\fs28\\cf1 Key Points:\\b0\\fs24\\cf0\\par`;
//            meetingData.keyPoints.forEach((point, index) => {
//                rtfContent += `${index + 1}. ${point}\\par`;
//            });
//            rtfContent += `\\par`;
//        }
//
//        if (meetingData.actionItems && meetingData.actionItems.length > 0) {
//            rtfContent += `\\b\\fs28\\cf1 Action Items:\\b0\\fs24\\cf0\\par`;
//            meetingData.actionItems.forEach((item, index) => {
//                rtfContent += `\\b ${index + 1}. ${item.description}\\b0\\par`;
//                rtfContent += `\\tab Owner: ${item.owner}\\par`;
//                rtfContent += `\\tab Due Date: ${item.dueDate}\\par`;
//                rtfContent += `\\tab Status: ${item.status}\\par`;
//                rtfContent += `\\tab Priority: ${item.priority}\\par\\par`;
//            });
//        }
//
//        if (meetingData.decisions && meetingData.decisions.length > 0) {
//            rtfContent += `\\b\\fs28\\cf1 Decisions:\\b0\\fs24\\cf0\\par`;
//            meetingData.decisions.forEach((decision, index) => {
//                rtfContent += `\\b ${index + 1}. ${decision.description}\\b0\\par`;
//                if (decision.rationale) {
//                    rtfContent += `\\tab Rationale: ${decision.rationale}\\par`;
//                }
//                if (decision.decidedBy) {
//                    rtfContent += `\\tab Decided by: ${decision.decidedBy}\\par`;
//                }
//                rtfContent += `\\par`;
//            });
//        }
//
//        rtfContent += `}`;
//
//        const blob = new Blob([rtfContent], { type: 'application/rtf' });
//        const url = URL.createObjectURL(blob);
//        const a = document.createElement('a');
//        a.href = url;
//        a.download = `${meetingData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_minutes.rtf`;
//        document.body.appendChild(a);
//        a.click();
//        document.body.removeChild(a);
//        URL.revokeObjectURL(url);
//
//        // Reset loading state
//        option.classList.remove('loading');
//        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-word"></i>';
//        hideExportModal();
//        showExportSuccess('Word (RTF format)');
//
//    } catch (error) {
//        console.error('RTF generation error:', error);
//        showExportError('Word');
//
//        option.classList.remove('loading');
//        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-word"></i>';
//    }
//}


function exportToPDF() {
    const option = document.querySelector('.export-option.pdf');

    if (option) {
        // Add loading state
        option.classList.add('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            if (typeof window.jsPDF === 'undefined') {
                loadPDFLibraries().then(() => {
                    generatePDFDocument(option);
                }).catch(error => {
                    console.error('Failed to load PDF libraries:', error);
                    generateSimplePDF(option);
                });
            } else {
                generatePDFDocument(option);
            }

        } catch (error) {
            console.error('PDF Export error:', error);
            generateSimplePDF(option);
        }
    }
}
function loadPDFLibraries() {
    return new Promise((resolve, reject) => {
        const jsPDFScript = document.createElement('script');
        jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

        jsPDFScript.onload = () => {
            const html2canvasScript = document.createElement('script');
            html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

            html2canvasScript.onload = resolve;
            html2canvasScript.onerror = reject;
            document.head.appendChild(html2canvasScript);
        };

        jsPDFScript.onerror = reject;
        document.head.appendChild(jsPDFScript);
    });
}

function generatePDFDocument(option) {
    try {
        const meetingData = extractMeetingDataFromHTML();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont("helvetica");
        let yPosition = 30;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);

        function addText(text, fontSize, isBold = false, color = [0, 0, 0], align = 'left') {
            doc.setFontSize(fontSize);
            doc.setTextColor(color[0], color[1], color[2]);

            if (isBold) {
                doc.setFont("helvetica", "bold");
            } else {
                doc.setFont("helvetica", "normal");
            }

            const lines = doc.splitTextToSize(text, maxWidth);

            if (align === 'center') {
                lines.forEach(line => {
                    const textWidth = doc.getTextWidth(line);
                    const x = (pageWidth - textWidth) / 2;
                    doc.text(line, x, yPosition);
                    yPosition += fontSize * 0.4;
                });
            } else {
                doc.text(lines, margin, yPosition);
                yPosition += lines.length * fontSize * 0.4;
            }

            yPosition += 5;
        }

        function checkNewPage(neededSpace = 30) {
            if (yPosition > doc.internal.pageSize.height - neededSpace) {
                doc.addPage();
                yPosition = 30;
            }
        }

        addText(meetingData.title, 24, true, [88, 101, 242], 'center');
        addText(meetingData.date, 12, false, [102, 102, 102], 'center');

        yPosition += 10;
        doc.setDrawColor(88, 101, 242);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 20;

        if (meetingData.attendees && meetingData.attendees.length > 0) {
            checkNewPage();
            addText("Attendees", 16, true, [88, 101, 242]);
            addText(meetingData.attendees.join(", "), 11);
            yPosition += 10;
        }

        if (meetingData.keyPoints && meetingData.keyPoints.length > 0) {
            checkNewPage();
            addText("Key Points", 16, true, [88, 101, 242]);
            meetingData.keyPoints.forEach((point, index) => {
                checkNewPage();
                addText(`${index + 1}. ${point}`, 11);
            });
            yPosition += 10;
        }

        if (meetingData.actionItems && meetingData.actionItems.length > 0) {
            checkNewPage();
            addText("Action Items", 16, true, [88, 101, 242]);
            meetingData.actionItems.forEach((item, index) => {
                checkNewPage(50);
                addText(`${index + 1}. ${item.description}`, 12, true);
                addText(`   Owner: ${item.owner}`, 10);
                addText(`   Due Date: ${item.dueDate}`, 10);
                addText(`   Status: ${item.status}`, 10);
                addText(`   Priority: ${item.priority}`, 10);
                yPosition += 5;
            });
            yPosition += 10;
        }

        if (meetingData.decisions && meetingData.decisions.length > 0) {
            checkNewPage();
            addText("Decisions", 16, true, [88, 101, 242]);
            meetingData.decisions.forEach((decision, index) => {
                checkNewPage(40);
                addText(`${index + 1}. ${decision.description}`, 12, true);
                if (decision.rationale) {
                    addText(`   Rationale: ${decision.rationale}`, 10);
                }
                if (decision.decidedBy) {
                    addText(`   Decided by: ${decision.decidedBy}`, 10);
                }
                yPosition += 5;
            });
        }

        doc.save(`${meetingData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_minutes.pdf`);

        // Reset loading state
        option.classList.remove('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-pdf"></i>';
        hideExportModal();
        showExportSuccess('PDF');

    } catch (error) {
        console.error('PDF generation error:', error);

    }
}
function generateSimplePDF(option) {
    try {
        const meetingData = extractMeetingDataFromHTML();

        const printContent = createPrintableHTML(meetingData);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };

        // Reset loading state
        option.classList.remove('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-pdf"></i>';
        hideExportModal();
        showExportSuccess('PDF (Print)');

    } catch (error) {
        console.error('Simple PDF generation error:', error);
        showExportError('PDF');

        option.classList.remove('loading');
        option.querySelector('.export-option-icon').innerHTML = '<i class="fas fa-file-pdf"></i>';
    }
}

// Helper function to get priority color
//function getPriorityColor(priority) {
//    const priorityLower = priority.toLowerCase();
//    switch(priorityLower) {
//        case 'high': return '#f8d7da; color: #721c24';
//        case 'medium': return '#fff3cd; color: #856404';
//        case 'low': return '#d1ecf1; color: #0c5460';
//        default: return '#fff3cd; color: #856404';
//    }
//}

function extractMeetingDataFromHTML() {
    const data = {};

    // Extract meeting title
    const titleEl = document.querySelector('.meeting-title');
    data.title = titleEl ? titleEl.textContent.trim() : 'Meeting Minutes';

    // Extract meeting date
    const dateEl = document.querySelector('.meeting-date');
    data.date = dateEl ? dateEl.textContent.trim() : new Date().toLocaleDateString();

    // Extract attendees
    const attendeeElements = document.querySelectorAll('.attendee');
    data.attendees = Array.from(attendeeElements).map(el => el.textContent.trim());

    // Extract key points
    const keyPointElements = document.querySelectorAll('.key-point');
    data.keyPoints = Array.from(keyPointElements).map(el => el.textContent.trim());

    // Extract action items
    const actionItemElements = document.querySelectorAll('.action-item');
    data.actionItems = Array.from(actionItemElements).map(item => {
        const description = item.querySelector('.action-description')?.textContent.trim() || '';
        const owner = item.querySelector('.detail-value')?.textContent.trim() || 'Not assigned';
        const dueDate = item.querySelectorAll('.detail-value')[1]?.textContent.trim() || 'Not specified';
        const status = item.querySelector('.status-tag')?.textContent.trim() || 'Pending';
        const priority = item.querySelector('.priority-tag')?.textContent.trim() || 'Medium';

        return {
            description,
            owner,
            dueDate,
            status,
            priority
        };
    });

    // Extract decisions
    const decisionElements = document.querySelectorAll('.decision');
    data.decisions = Array.from(decisionElements).map(item => {
        const description = item.querySelector('.decision-description')?.textContent.trim() || '';
        const rationale = item.querySelector('.detail-value')?.textContent.trim() || '';
        const decidedBy = item.querySelectorAll('.detail-value')[1]?.textContent.trim() || '';

        return {
            description,
            rationale,
            decidedBy
        };
    });


    return data;
}
//function createPrintableHTML(meetingData) {
//    return `
//        <!DOCTYPE html>
//        <html>
//        <head>
//            <title>${meetingData.title}</title>
//            <style>
//                @media print {
//                    body { margin: 0; }
//                    .no-print { display: none; }
//                }
//                body {
//                    font-family: Arial, sans-serif;
//                    line-height: 1.6;
//                    max-width: 800px;
//                    margin: 0 auto;
//                    padding: 20px;
//                    color: #333;
//                }
//                .header {
//                    text-align: center;
//                    border-bottom: 3px solid #5865F2;
//                    padding-bottom: 20px;
//                    margin-bottom: 30px;
//                }
//                .title {
//                    font-size: 28px;
//                    font-weight: bold;
//                    color: #5865F2;
//                    margin-bottom: 10px;
//                }
//                .date {
//                    font-size: 16px;
//                    color: #666;
//                }
//                .section {
//                    margin-bottom: 25px;
//                    page-break-inside: avoid;
//                }
//                .section-title {
//                    font-size: 20px;
//                    font-weight: bold;
//                    color: #5865F2;
//                    border-bottom: 2px solid #e0e0e0;
//                    padding-bottom: 5px;
//                    margin-bottom: 15px;
//                }
//                .attendees { margin-bottom: 10px; }
//                .attendee {
//                    display: inline-block;
//                    background-color: #f0f2ff;
//                    padding: 5px 12px;
//                    margin: 2px;
//                    border-radius: 15px;
//                    font-size: 14px;
//                    color: #5865F2;
//                }
//                .key-point, .action-item, .decision {
//                    background-color: #f8f9fa;
//                    padding: 12px;
//                    margin-bottom: 8px;
//                    border-left: 4px solid #5865F2;
//                    border-radius: 4px;
//                    page-break-inside: avoid;
//                }
//                .action-description, .decision-description {
//                    font-weight: bold;
//                    margin-bottom: 5px;
//                }
//                .action-details {
//                    font-size: 14px;
//                    color: #666;
//                }
//            </style>
//        </head>
//        <body>
//            <div class="header">
//                <div class="title">${meetingData.title}</div>
//                <div class="date">${meetingData.date}</div>
//            </div>
//
//            ${meetingData.attendees && meetingData.attendees.length > 0 ? `
//                <div class="section">
//                    <div class="section-title">Attendees</div>
//                    <div class="attendees">
//                        ${meetingData.attendees.map(attendee => `<span class="attendee">${attendee}</span>`).join('')}
//                    </div>
//                </div>
//            ` : ''}
//
//            ${meetingData.keyPoints && meetingData.keyPoints.length > 0 ? `
//                <div class="section">
//                    <div class="section-title">Key Points</div>
//                    ${meetingData.keyPoints.map((point, index) =>
//                        `<div class="key-point">${index + 1}. ${point}</div>`
//                    ).join('')}
//                </div>
//            ` : ''}
//
//            ${meetingData.actionItems && meetingData.actionItems.length > 0 ? `
//                <div class="section">
//                    <div class="section-title">Action Items</div>
//                    ${meetingData.actionItems.map((item, index) => `
//                        <div class="action-item">
//                            <div class="action-description">${index + 1}. ${item.description}</div>
//                            <div class="action-details">
//                                Owner: ${item.owner}<br>
//                                Due Date: ${item.dueDate}<br>
//                                Status: ${item.status}<br>
//                                Priority: ${item.priority}
//                            </div>
//                        </div>
//                    `).join('')}
//                </div>
//            ` : ''}
//
//            ${meetingData.decisions && meetingData.decisions.length > 0 ? `
//                <div class="section">
//                    <div class="section-title">Decisions</div>
//                    ${meetingData.decisions.map((decision, index) => `
//                        <div class="decision">
//                            <div class="decision-description">${index + 1}. ${decision.description}</div>
//                            ${decision.rationale ? `<div>Rationale: ${decision.rationale}</div>` : ''}
//                            ${decision.decidedBy ? `<div>Decided by: ${decision.decidedBy}</div>` : ''}
//                        </div>
//                    `).join('')}
//                </div>
//            ` : ''}
//
//            <button class="no-print" onclick="window.print()">Print this document</button>
//        </body>
//        </html>
//    `;
//}






// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeExportModal();
    addExportAnimationStyles();
});