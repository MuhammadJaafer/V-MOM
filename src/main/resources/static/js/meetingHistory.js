document.addEventListener('DOMContentLoaded', function() {
    // Initialize the meeting history sidebar
    initializeMeetingHistorySidebar();

    // Setup toggle button functionality
    setupSidebarToggle();
});

function initializeMeetingHistorySidebar() {
    // Load meeting history from database via AJAX
    fetchMeetingHistory();

    // Add click handlers to meeting history items
    setupMeetingHistoryItemClicks();
}

function fetchMeetingHistory() {
    // AJAX call to fetch meeting history
    fetch('/api/meetings/history')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderMeetingHistory(data);
        })
        .catch(error => {
            console.error('Error fetching meeting history:', error);
            // Show error message in history sidebar
            document.getElementById('meeting-history-list').innerHTML =
                '<div class="history-error">Failed to load meeting history</div>';
        });
}

function renderMeetingHistory(meetings) {
    const historyList = document.getElementById('meeting-history-list');

    // Clear existing content
    historyList.innerHTML = '';

    if (meetings.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No previous meetings found</div>';
        return;
    }

    // Generate HTML for each meeting
    meetings.forEach(meeting => {
        const meetingDate = new Date(meeting.meetingDate).toLocaleDateString();
        const meetingTime = new Date(meeting.meetingDate).toLocaleTimeString();

        const meetingItem = document.createElement('div');
        meetingItem.className = 'meeting-history-item';
        meetingItem.dataset.meetingId = meeting.meetingId;

        meetingItem.innerHTML = `
            <div class="meeting-history-title">${meeting.title}</div>
            <div class="meeting-history-date">${meetingDate} - ${meetingTime}</div>
        `;

        historyList.appendChild(meetingItem);
    });
}

function setupMeetingHistoryItemClicks() {
    document.addEventListener('click', function(event) {
        // Check if clicked element is a meeting history item or inside one
        const meetingItem = event.target.closest('.meeting-history-item');
        if (meetingItem) {
            const meetingId = meetingItem.dataset.meetingId;
            loadMeeting(meetingId);
        }
    });
}

function loadMeeting(meetingId) {
    // Navigate to the meeting page with the selected meeting ID
    window.location.href = `/upload?meetingId=${meetingId}`;
}

function setupSidebarToggle() {
    const toggleButton = document.getElementById('history-toggle-btn');
    const sidebar = document.getElementById('meeting-history-sidebar');
    const mainContent = document.querySelector('.main-content');

    toggleButton.addEventListener('click', function() {
        // Toggle sidebar visibility
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-active');

        // Update button icon (using a class to switch between icons)
        toggleButton.classList.toggle('open');

        // Update ARIA attributes for accessibility
        const isExpanded = sidebar.classList.contains('active');
        toggleButton.setAttribute('aria-expanded', isExpanded);
    });
}