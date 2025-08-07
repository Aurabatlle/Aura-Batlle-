document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Tab navigation
    document.getElementById('dashboard-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('dashboard');
    });

    document.getElementById('create-match-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('create-match');
    });

    document.getElementById('upcoming-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('upcoming');
        loadUpcomingMatches();
    });

    document.getElementById('ongoing-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('ongoing');
        loadOngoingMatches();
    });

    document.getElementById('completed-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('completed');
        loadCompletedMatches();
    });

    document.getElementById('match-survey-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('match-survey');
    });

    function showTab(tabName) {
        // Hide all content divs
        document.querySelectorAll('.main-content > div').forEach(div => {
            div.style.display = 'none';
        });

        // Show selected content div
        document.getElementById(tabName + '-content').style.display = 'block';

        // Update active tab in sidebar
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(tabName + '-tab').classList.add('active');

        // Update page title
        document.title = document.getElementById(tabName + '-content').querySelector('h1').textContent + ' | Tournament Admin Panel';
    }

    // Generate a random 6-digit alphanumeric match ID
    function generateMatchId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Create match form submission
    document.getElementById('create-match-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('match-title').value;
        const map = document.getElementById('match-map').value;
        const slots = parseInt(document.getElementById('match-slots').value);
        const mode = document.getElementById('match-mode').value;
        const prize = parseFloat(document.getElementById('match-prize').value);
        const date = document.getElementById('match-date').value;
        const time = document.getElementById('match-time').value;
        const distribution = document.querySelector('input[name="distribution"]:checked').value;
        
        const matchId = generateMatchId();
        const dateTime = new Date(`${date}T${time}`);
        
        const newMatch = {
            id: matchId,
            title: title || `Match ${matchId}`,
            map: map,
            slots: slots,
            mode: mode,
            prizePool: prize,
            dateTime: dateTime.toISOString(),
            distribution: distribution,
            status: 'upcoming',
            joinedPlayers: [],
            roomId: '',
            roomPassword: '',
            results: []
        };
        
        // Save to local storage
        saveMatch(newMatch);
        
        // Reset form
        this.reset();
        
        // Show success message
        alert(`Match created successfully! Match ID: ${matchId}`);
        
        // Update dashboard counts
        updateDashboardCounts();
        
        // Load upcoming matches if on that tab
        if (document.getElementById('upcoming-content').style.display !== 'none') {
            loadUpcomingMatches();
        }
    });

    // Save match to local storage
    function saveMatch(match) {
        let matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        matches.push(match);
        localStorage.setItem('tournamentMatches', JSON.stringify(matches));
    }

    // Update match in local storage
    function updateMatch(updatedMatch) {
        let matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        const index = matches.findIndex(m => m.id === updatedMatch.id);
        if (index !== -1) {
            matches[index] = updatedMatch;
            localStorage.setItem('tournamentMatches', JSON.stringify(matches));
        }
    }

    // Get matches by status
    function getMatchesByStatus(status) {
        const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        return matches.filter(match => match.status === status);
    }

    // Get all matches
    function getAllMatches() {
        return JSON.parse(localStorage.getItem('tournamentMatches')) || [];
    }

    // Get match by ID
    function getMatchById(matchId) {
        const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        return matches.find(match => match.id === matchId);
    }

    // Update dashboard counts
    function updateDashboardCounts() {
        const upcomingCount = getMatchesByStatus('upcoming').length;
        const ongoingCount = getMatchesByStatus('ongoing').length;
        const completedCount = getMatchesByStatus('completed').length;
        
        document.getElementById('upcoming-count').textContent = upcomingCount;
        document.getElementById('ongoing-count').textContent = ongoingCount;
        document.getElementById('completed-count').textContent = completedCount;
        
        // Load recent matches
        loadRecentMatches();
    }

    // Load recent matches for dashboard
    function loadRecentMatches() {
        const matches = getAllMatches();
        // Sort by date (newest first)
        matches.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        const tbody = document.getElementById('recent-matches');
        tbody.innerHTML = '';
        
        // Show only the 5 most recent matches
        const recentMatches = matches.slice(0, 5);
        
        recentMatches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            let statusBadge;
            if (match.status === 'upcoming') {
                statusBadge = '<span class="badge upcoming">Upcoming</span>';
            } else if (match.status === 'ongoing') {
                statusBadge = '<span class="badge ongoing">Ongoing</span>';
            } else {
                statusBadge = '<span class="badge completed">Completed</span>';
            }
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    }

    // Load upcoming matches
    function loadUpcomingMatches(filterDate = null, filterTime = null) {
        let matches = getMatchesByStatus('upcoming');
        
        // Apply filters if provided
        if (filterDate) {
            const filterDateStr = new Date(filterDate).toDateString();
            matches = matches.filter(match => {
                const matchDateStr = new Date(match.dateTime).toDateString();
                return matchDateStr === filterDateStr;
            });
            
            if (filterTime) {
                const filterTimeStr = new Date(`1970-01-01T${filterTime}`).toTimeString().substring(0, 5);
                matches = matches.filter(match => {
                    const matchTimeStr = new Date(match.dateTime).toTimeString().substring(0, 5);
                    return matchTimeStr === filterTimeStr;
                });
            }
        }
        
        // Sort by date (earliest first)
        matches.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        const tbody = document.getElementById('upcoming-matches-list');
        tbody.innerHTML = '';
        
        matches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${match.slots}</td>
                <td>${match.joinedPlayers.length}/${match.slots}</td>
                <td>
                    <button class="btn btn-sm btn-success start-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('upcoming-total').textContent = `${matches.length} matches`;
        
        // Add event listeners to start buttons
        document.querySelectorAll('.start-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                document.getElementById('start-match-id').value = matchId;
                const modal = new bootstrap.Modal(document.getElementById('startMatchModal'));
                modal.show();
            });
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    }

    // Load ongoing matches
    function loadOngoingMatches(filterDate = null, filterTime = null) {
        let matches = getMatchesByStatus('ongoing');
        
        // Apply filters if provided
        if (filterDate) {
            const filterDateStr = new Date(filterDate).toDateString();
            matches = matches.filter(match => {
                const matchDateStr = new Date(match.dateTime).toDateString();
                return matchDateStr === filterDateStr;
            });
            
            if (filterTime) {
                const filterTimeStr = new Date(`1970-01-01T${filterTime}`).toTimeString().substring(0, 5);
                matches = matches.filter(match => {
                    const matchTimeStr = new Date(match.dateTime).toTimeString().substring(0, 5);
                    return matchTimeStr === filterTimeStr;
                });
            }
        }
        
        const tbody = document.getElementById('ongoing-matches-list');
        tbody.innerHTML = '';
        
        matches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${match.roomId}</td>
                <td>${match.joinedPlayers.length}/${match.slots}</td>
                <td>
                    <button class="btn btn-sm btn-danger end-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-stop"></i> End
                    </button>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('ongoing-total').textContent = `${matches.length} matches`;
        
        // Add event listeners to end buttons
        document.querySelectorAll('.end-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                document.getElementById('end-match-id').value = matchId;
                
                // Get the match to check distribution type
                const match = getMatchById(matchId);
                document.getElementById('results-distribution-type').value = match.distribution;
                document.getElementById('results-match-id').value = matchId;
                
                // Prepare the results table based on distribution type
                if (match.distribution === 'rank') {
                    document.getElementById('rank-wise-results').style.display = 'block';
                    document.getElementById('kill-wise-results').style.display = 'none';
                    
                    const tbody = document.getElementById('rank-results-table');
                    tbody.innerHTML = '';
                    
                    match.joinedPlayers.forEach((player, index) => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${player.name} (${player.id})</td>
                            <td><input type="number" class="form-control form-control-sm rank-input" min="1" value="${index + 1}"></td>
                            <td><input type="number" class="form-control form-control-sm kill-input" min="0" value="0"></td>
                        `;
                        tbody.appendChild(row);
                    });
                } else {
                    document.getElementById('rank-wise-results').style.display = 'none';
                    document.getElementById('kill-wise-results').style.display = 'block';
                    
                    const tbody = document.getElementById('kill-results-table');
                    tbody.innerHTML = '';
                    
                    match.joinedPlayers.forEach(player => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${player.name} (${player.id})</td>
                            <td><input type="number" class="form-control form-control-sm kill-input" min="0" value="0"></td>
                        `;
                        tbody.appendChild(row);
                    });
                }
                
                const modal = new bootstrap.Modal(document.getElementById('endMatchModal'));
                modal.show();
            });
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    }

    // Load completed matches
    function loadCompletedMatches(filterDate = null, filterTime = null) {
        let matches = getMatchesByStatus('completed');
        
        // Apply filters if provided
        if (filterDate) {
            const filterDateStr = new Date(filterDate).toDateString();
            matches = matches.filter(match => {
                const matchDateStr = new Date(match.dateTime).toDateString();
                return matchDateStr === filterDateStr;
            });
            
            if (filterTime) {
                const filterTimeStr = new Date(`1970-01-01T${filterTime}`).toTimeString().substring(0, 5);
                matches = matches.filter(match => {
                    const matchTimeStr = new Date(match.dateTime).toTimeString().substring(0, 5);
                    return matchTimeStr === filterTimeStr;
                });
            }
        }
        
        // Sort by date (newest first)
        matches.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        const tbody = document.getElementById('completed-matches-list');
        tbody.innerHTML = '';
        
        matches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Calculate total prize distributed
            let totalPrize = 0;
            if (match.results && match.results.length > 0) {
                totalPrize = match.results.reduce((sum, result) => sum + (result.prize || 0), 0);
            }
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${match.joinedPlayers.length}</td>
                <td>${totalPrize.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('completed-total').textContent = `${matches.length} matches`;
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    }

    // Start match confirmation
    document.getElementById('confirm-start-match').addEventListener('click', function() {
        const matchId = document.getElementById('start-match-id').value;
        const roomId = document.getElementById('room-id').value;
        const roomPassword = document.getElementById('room-password').value;
        
        if (!roomId || !roomPassword) {
            alert('Please enter both Room ID and Password');
            return;
        }
        
        // Get the match
        const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        const matchIndex = matches.findIndex(m => m.id === matchId);
        
        if (matchIndex !== -1) {
            // Update match status and room details
            matches[matchIndex].status = 'ongoing';
            matches[matchIndex].roomId = roomId;
            matches[matchIndex].roomPassword = roomPassword;
            
            // Save back to local storage
            localStorage.setItem('tournamentMatches', JSON.stringify(matches));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('startMatchModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('start-match-form').reset();
            
            // Reload matches
            if (document.getElementById('upcoming-content').style.display !== 'none') {
                loadUpcomingMatches();
            }
            if (document.getElementById('ongoing-content').style.display !== 'none') {
                loadOngoingMatches();
            }
            
            // Update dashboard
            updateDashboardCounts();
            
            alert('Match started successfully!');
        }
    });

    // End match confirmation
    document.getElementById('confirm-end-match').addEventListener('click', function() {
        const matchId = document.getElementById('end-match-id').value;
        
        // Get the match
        const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        const matchIndex = matches.findIndex(m => m.id === matchId);
        
        if (matchIndex !== -1) {
            // Update match status to completed
            matches[matchIndex].status = 'completed';
            
            // Save back to local storage
            localStorage.setItem('tournamentMatches', JSON.stringify(matches));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('endMatchModal'));
            modal.hide();
            
            // Show set results modal
            const resultsModal = new bootstrap.Modal(document.getElementById('setResultsModal'));
            resultsModal.show();
        }
    });

    // Set results confirmation
    document.getElementById('confirm-set-results').addEventListener('click', function() {
        const matchId = document.getElementById('results-match-id').value;
        const distributionType = document.getElementById('results-distribution-type').value;
        
        // Get the match
        const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
        const matchIndex = matches.findIndex(m => m.id === matchId);
        
        if (matchIndex !== -1) {
            const match = matches[matchIndex];
            
            if (distributionType === 'rank') {
                // Process rank-wise results
                const rankRows = document.querySelectorAll('#rank-results-table tr');
                match.results = [];
                
                rankRows.forEach(row => {
                    const playerId = row.cells[0].textContent.match(/\(([^)]+)\)/)[1];
                    const rank = parseInt(row.querySelector('.rank-input').value);
                    const kills = parseInt(row.querySelector('.kill-input').value);
                    
                    // Calculate prize based on rank (example logic)
                    let prize = 0;
                    if (rank === 1) prize = match.prizePool * 0.5;
                    else if (rank === 2) prize = match.prizePool * 0.3;
                    else if (rank === 3) prize = match.prizePool * 0.2;
                    
                    match.results.push({
                        playerId: playerId,
                        rank: rank,
                        kills: kills,
                        prize: prize
                    });
                });
            } else {
                // Process kill-wise results
                const killRows = document.querySelectorAll('#kill-results-table tr');
                match.results = [];
                
                // First collect all kills
                const killsData = [];
                let totalKills = 0;
                
                killRows.forEach(row => {
                    const playerId = row.cells[0].textContent.match(/\(([^)]+)\)/)[1];
                    const kills = parseInt(row.querySelector('.kill-input').value);
                    killsData.push({ playerId, kills });
                    totalKills += kills;
                });
                
                // Calculate prize for each player based on kills
                killsData.forEach(data => {
                    const killPercentage = totalKills > 0 ? data.kills / totalKills : 0;
                    const prize = match.prizePool * killPercentage;
                    
                    match.results.push({
                        playerId: data.playerId,
                        kills: data.kills,
                        prize: prize
                    });
                });
            }
            
            // Save back to local storage
            localStorage.setItem('tournamentMatches', JSON.stringify(matches));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('setResultsModal'));
            modal.hide();
            
            // Reload matches
            if (document.getElementById('ongoing-content').style.display !== 'none') {
                loadOngoingMatches();
            }
            if (document.getElementById('completed-content').style.display !== 'none') {
                loadCompletedMatches();
            }
            
            // Update dashboard
            updateDashboardCounts();
            
            alert('Results submitted successfully!');
        }
    });

    // Show match details
    function showMatchDetails(matchId) {
        const match = getMatchById(matchId);
        if (!match) {
            alert('Match not found!');
            return;
        }
        
        const modalContent = document.getElementById('match-details-content');
        const dateTime = new Date(match.dateTime);
        const formattedDate = dateTime.toLocaleDateString();
        const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let statusBadge;
        if (match.status === 'upcoming') {
            statusBadge = '<span class="badge upcoming">Upcoming</span>';
        } else if (match.status === 'ongoing') {
            statusBadge = '<span class="badge ongoing">Ongoing</span>';
        } else {
            statusBadge = '<span class="badge completed">Completed</span>';
        }
        
        let detailsHtml = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Match Information</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Match ID:</th>
                            <td><span class="match-id">${match.id}</span></td>
                        </tr>
                        <tr>
                            <th>Title:</th>
                            <td>${match.title}</td>
                        </tr>
                        <tr>
                            <th>Status:</th>
                            <td>${statusBadge}</td>
                        </tr>
                        <tr>
                            <th>Date & Time:</th>
                            <td>${formattedDate} ${formattedTime}</td>
                        </tr>
                        <tr>
                            <th>Map:</th>
                            <td>${match.map}</td>
                        </tr>
                        <tr>
                            <th>Mode:</th>
                            <td>${match.mode}</td>
                        </tr>
                        <tr>
                            <th>Slots:</th>
                            <td>${match.slots}</td>
                        </tr>
                        <tr>
                            <th>Joined Players:</th>
                            <td>${match.joinedPlayers.length}</td>
                        </tr>
                        <tr>
                            <th>Prize Pool:</th>
                            <td>${match.prizePool.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <th>Distribution:</th>
                            <td>${match.distribution === 'rank' ? 'Rank Wise' : 'Kill Wise'}</td>
                        </tr>
        `;
        
        if (match.status !== 'upcoming') {
            detailsHtml += `
                        <tr>
                            <th>Room ID:</th>
                            <td>${match.roomId || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Room Password:</th>
                            <td>${match.roomPassword || 'N/A'}</td>
                        </tr>
            `;
        }
        
        detailsHtml += `
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Participants</h6>
        `;
        
        if (match.joinedPlayers.length > 0) {
            detailsHtml += `
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Player ID</th>
                                    <th>Name</th>
                                    <th>Joined At</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            match.joinedPlayers.forEach(player => {
                const joinedAt = new Date(player.joinedAt);
                const joinedTime = joinedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                detailsHtml += `
                                <tr>
                                    <td>${player.id}</td>
                                    <td>${player.name}</td>
                                    <td>${joinedTime}</td>
                                </tr>
                `;
            });
            
            detailsHtml += `
                            </tbody>
                        </table>
                    </div>
            `;
        } else {
            detailsHtml += '<p>No participants yet.</p>';
        }
        
        if (match.status === 'completed' && match.results && match.results.length > 0) {
            detailsHtml += `
                    <h6 class="mt-3">Results</h6>
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Player</th>
            `;
            
            if (match.distribution === 'rank') {
                detailsHtml += '<th>Rank</th>';
            }
            
            detailsHtml += `
                                    <th>Kills</th>
                                    <th>Prize</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Sort results by rank or kills
            const sortedResults = [...match.results];
            if (match.distribution === 'rank') {
                sortedResults.sort((a, b) => a.rank - b.rank);
            } else {
                sortedResults.sort((a, b) => b.kills - a.kills);
            }
            
            sortedResults.forEach(result => {
                const player = match.joinedPlayers.find(p => p.id === result.playerId);
                const playerName = player ? player.name : 'Unknown';
                
                detailsHtml += `
                                <tr>
                                    <td>${playerName} (${result.playerId})</td>
                `;
                
                if (match.distribution === 'rank') {
                    detailsHtml += `<td>${result.rank}</td>`;
                }
                
                detailsHtml += `
                                    <td>${result.kills}</td>
                                    <td>${result.prize.toFixed(2)}</td>
                                </tr>
                `;
            });
            
            detailsHtml += `
                            </tbody>
                        </table>
                    </div>
            `;
        }
        
        detailsHtml += `
                </div>
            </div>
        `;
        
        modalContent.innerHTML = detailsHtml;
        const modal = new bootstrap.Modal(document.getElementById('viewMatchModal'));
        modal.show();
    }

    // Upcoming matches filter
    document.getElementById('upcoming-filter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const filterDate = document.getElementById('upcoming-filter-date').value;
        const filterTime = document.getElementById('upcoming-filter-time').value;
        loadUpcomingMatches(filterDate, filterTime);
    });

    // Ongoing matches filter
    document.getElementById('ongoing-filter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const filterDate = document.getElementById('ongoing-filter-date').value;
        const filterTime = document.getElementById('ongoing-filter-time').value;
        loadOngoingMatches(filterDate, filterTime);
    });

    // Completed matches filter
    document.getElementById('completed-filter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const filterDate = document.getElementById('completed-filter-date').value;
        const filterTime = document.getElementById('completed-filter-time').value;
        loadCompletedMatches(filterDate, filterTime);
    });

    // Upcoming matches search
    document.getElementById('upcoming-search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('upcoming-search').value.trim().toUpperCase();
        if (!searchTerm) {
            loadUpcomingMatches();
            return;
        }
        
        const matches = getMatchesByStatus('upcoming');
        const filteredMatches = matches.filter(match => match.id.includes(searchTerm));
        
        const tbody = document.getElementById('upcoming-matches-list');
        tbody.innerHTML = '';
        
        if (filteredMatches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No matches found</td></tr>';
            document.getElementById('upcoming-total').textContent = '0 matches';
            return;
        }
        
        filteredMatches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${match.slots}</td>
                <td>${match.joinedPlayers.length}/${match.slots}</td>
                <td>
                    <button class="btn btn-sm btn-success start-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('upcoming-total').textContent = `${filteredMatches.length} matches`;
        
        // Add event listeners to start buttons
        document.querySelectorAll('.start-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                document.getElementById('start-match-id').value = matchId;
                const modal = new bootstrap.Modal(document.getElementById('startMatchModal'));
                modal.show();
            });
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    });

    // Ongoing matches search
    document.getElementById('ongoing-search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('ongoing-search').value.trim().toUpperCase();
        if (!searchTerm) {
            loadOngoingMatches();
            return;
        }
        
        const matches = getMatchesByStatus('ongoing');
        const filteredMatches = matches.filter(match => match.id.includes(searchTerm));
        
        const tbody = document.getElementById('ongoing-matches-list');
        tbody.innerHTML = '';
        
        if (filteredMatches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No matches found</td></tr>';
            document.getElementById('ongoing-total').textContent = '0 matches';
            return;
        }
        
        filteredMatches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${match.roomId}</td>
                <td>${match.joinedPlayers.length}/${match.slots}</td>
                <td>
                    <button class="btn btn-sm btn-danger end-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-stop"></i> End
                    </button>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('ongoing-total').textContent = `${filteredMatches.length} matches`;
        
        // Add event listeners to end buttons
        document.querySelectorAll('.end-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                document.getElementById('end-match-id').value = matchId;
                
                // Get the match to check distribution type
                const match = getMatchById(matchId);
                document.getElementById('results-distribution-type').value = match.distribution;
                document.getElementById('results-match-id').value = matchId;
                
                // Prepare the results table based on distribution type
                if (match.distribution === 'rank') {
                    document.getElementById('rank-wise-results').style.display = 'block';
                    document.getElementById('kill-wise-results').style.display = 'none';
                    
                    const tbody = document.getElementById('rank-results-table');
                    tbody.innerHTML = '';
                    
                    match.joinedPlayers.forEach((player, index) => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${player.name} (${player.id})</td>
                            <td><input type="number" class="form-control form-control-sm rank-input" min="1" value="${index + 1}"></td>
                            <td><input type="number" class="form-control form-control-sm kill-input" min="0" value="0"></td>
                        `;
                        tbody.appendChild(row);
                    });
                } else {
                    document.getElementById('rank-wise-results').style.display = 'none';
                    document.getElementById('kill-wise-results').style.display = 'block';
                    
                    const tbody = document.getElementById('kill-results-table');
                    tbody.innerHTML = '';
                    
                    match.joinedPlayers.forEach(player => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${player.name} (${player.id})</td>
                            <td><input type="number" class="form-control form-control-sm kill-input" min="0" value="0"></td>
                        `;
                        tbody.appendChild(row);
                    });
                }
                
                const modal = new bootstrap.Modal(document.getElementById('endMatchModal'));
                modal.show();
            });
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    });

    // Completed matches search
    document.getElementById('completed-search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('completed-search').value.trim().toUpperCase();
        if (!searchTerm) {
            loadCompletedMatches();
            return;
        }
        
        const matches = getMatchesByStatus('completed');
        const filteredMatches = matches.filter(match => match.id.includes(searchTerm));
        
        const tbody = document.getElementById('completed-matches-list');
        tbody.innerHTML = '';
        
        if (filteredMatches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No matches found</td></tr>';
            document.getElementById('completed-total').textContent = '0 matches';
            return;
        }
        
        filteredMatches.forEach(match => {
            const row = document.createElement('tr');
            
            const dateTime = new Date(match.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Calculate total prize distributed
            let totalPrize = 0;
            if (match.results && match.results.length > 0) {
                totalPrize = match.results.reduce((sum, result) => sum + (result.prize || 0), 0);
            }
            
            row.innerHTML = `
                <td><span class="match-id">${match.id}</span></td>
                <td>${match.title}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>${match.joinedPlayers.length}</td>
                <td>${totalPrize.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('completed-total').textContent = `${filteredMatches.length} matches`;
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
    });

    // Match survey form
    document.getElementById('match-survey-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const matchId = document.getElementById('survey-match-id').value.trim().toUpperCase();
        
        if (!matchId) {
            alert('Please enter a Match ID');
            return;
        }
        
        const match = getMatchById(matchId);
        if (!match) {
            document.getElementById('match-survey-results').innerHTML = `
                <div class="alert alert-danger">
                    No match found with ID: ${matchId}
                </div>
            `;
            return;
        }
        
        showSurveyMatchDetails(match);
    });

    // Match survey filter
    document.getElementById('survey-filter-btn').addEventListener('click', function() {
        const filterDate = document.getElementById('survey-filter-date').value;
        const filterTime = document.getElementById('survey-filter-time').value;
        
        if (!filterDate) {
            alert('Please select a date');
            return;
        }
        
        let matches = getAllMatches();
        
        // Filter by date
        const filterDateStr = new Date(filterDate).toDateString();
        matches = matches.filter(match => {
            const matchDateStr = new Date(match.dateTime).toDateString();
            return matchDateStr === filterDateStr;
        });
        
        // Filter by time if provided
        if (filterTime) {
            const filterTimeStr = new Date(`1970-01-01T${filterTime}`).toTimeString().substring(0, 5);
            matches = matches.filter(match => {
                const matchTimeStr = new Date(match.dateTime).toTimeString().substring(0, 5);
                return matchTimeStr === filterTimeStr;
            });
        }
        
        // Sort by date (newest first)
        matches.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        if (matches.length === 0) {
            document.getElementById('match-survey-results').innerHTML = `
                <div class="alert alert-warning">
                    No matches found for the selected date${filterTime ? ' and time' : ''}
                </div>
            `;
            return;
        }
        
        let resultsHtml = `
            <h6>Matches on ${new Date(filterDate).toLocaleDateString()}${filterTime ? ' at ' + filterTime : ''}</h6>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Match ID</th>
                            <th>Title</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        matches.forEach(match => {
            const dateTime = new Date(match.dateTime);
            const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            let statusBadge;
            if (match.status === 'upcoming') {
                statusBadge = '<span class="badge upcoming">Upcoming</span>';
            } else if (match.status === 'ongoing') {
                statusBadge = '<span class="badge ongoing">Ongoing</span>';
            } else {
                statusBadge = '<span class="badge completed">Completed</span>';
            }
            
            resultsHtml += `
                        <tr>
                            <td><span class="match-id">${match.id}</span></td>
                            <td>${match.title}</td>
                            <td>${formattedTime}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-survey-match-btn" data-match-id="${match.id}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
            `;
        });
        
        resultsHtml += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('match-survey-results').innerHTML = resultsHtml;
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-survey-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                const match = getMatchById(matchId);
                showSurveyMatchDetails(match);
            });
        });
    });

    // Show match details in survey
    function showSurveyMatchDetails(match) {
        const dateTime = new Date(match.dateTime);
        const formattedDate = dateTime.toLocaleDateString();
        const formattedTime = dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let statusBadge;
        if (match.status === 'upcoming') {
            statusBadge = '<span class="badge upcoming">Upcoming</span>';
        } else if (match.status === 'ongoing') {
            statusBadge = '<span class="badge ongoing">Ongoing</span>';
        } else {
            statusBadge = '<span class="badge completed">Completed</span>';
        }
        
        let detailsHtml = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Match Information</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Match ID:</th>
                            <td><span class="match-id">${match.id}</span></td>
                        </tr>
                        <tr>
                            <th>Title:</th>
                            <td>${match.title}</td>
                        </tr>
                        <tr>
                            <th>Status:</th>
                            <td>${statusBadge}</td>
                        </tr>
                        <tr>
                            <th>Date & Time:</th>
                            <td>${formattedDate} ${formattedTime}</td>
                        </tr>
                        <tr>
                            <th>Map:</th>
                            <td>${match.map}</td>
                        </tr>
                        <tr>
                            <th>Mode:</th>
                            <td>${match.mode}</td>
                        </tr>
                        <tr>
                            <th>Slots:</th>
                            <td>${match.slots}</td>
                        </tr>
                        <tr>
                            <th>Joined Players:</th>
                            <td>${match.joinedPlayers.length}</td>
                        </tr>
                        <tr>
                            <th>Prize Pool:</th>
                            <td>${match.prizePool.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <th>Distribution:</th>
                            <td>${match.distribution === 'rank' ? 'Rank Wise' : 'Kill Wise'}</td>
                        </tr>
        `;
        
        if (match.status !== 'upcoming') {
            detailsHtml += `
                        <tr>
                            <th>Room ID:</th>
                            <td>${match.roomId || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Room Password:</th>
                            <td>${match.roomPassword || 'N/A'}</td>
                        </tr>
            `;
        }
        
        detailsHtml += `
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Participants</h6>
        `;
        
        if (match.joinedPlayers.length > 0) {
            detailsHtml += `
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Player ID</th>
                                    <th>Name</th>
                                    <th>Joined At</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            match.joinedPlayers.forEach(player => {
                const joinedAt = new Date(player.joinedAt);
                const joinedTime = joinedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                detailsHtml += `
                                <tr>
                                    <td>${player.id}</td>
                                    <td>${player.name}</td>
                                    <td>${joinedTime}</td>
                                </tr>
                `;
            });
            
            detailsHtml += `
                            </tbody>
                        </table>
                    </div>
            `;
        } else {
            detailsHtml += '<p>No participants yet.</p>';
        }
        
        if (match.status === 'completed' && match.results && match.results.length > 0) {
            detailsHtml += `
                    <h6 class="mt-3">Results</h6>
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Player</th>
            `;
            
            if (match.distribution === 'rank') {
                detailsHtml += '<th>Rank</th>';
            }
            
            detailsHtml += `
                                    <th>Kills</th>
                                    <th>Prize</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Sort results by rank or kills
            const sortedResults = [...match.results];
            if (match.distribution === 'rank') {
                sortedResults.sort((a, b) => a.rank - b.rank);
            } else {
                sortedResults.sort((a, b) => b.kills - a.kills);
            }
            
            sortedResults.forEach(result => {
                const player = match.joinedPlayers.find(p => p.id === result.playerId);
                const playerName = player ? player.name : 'Unknown';
                
                detailsHtml += `
                                <tr>
                                    <td>${playerName} (${result.playerId})</td>
                `;
                
                if (match.distribution === 'rank') {
                    detailsHtml += `<td>${result.rank}</td>`;
                }
                
                detailsHtml += `
                                    <td>${result.kills}</td>
                                    <td>${result.prize.toFixed(2)}</td>
                                </tr>
                `;
            });
            
            detailsHtml += `
                            </tbody>
                        </table>
                    </div>
            `;
        }
        
        detailsHtml += `
                </div>
            </div>
        `;
        
        document.getElementById('match-survey-results').innerHTML = detailsHtml;
    }

    // Initialize the app
    function initApp() {
        // Check if we need to seed some sample data
        if (localStorage.getItem('tournamentMatches') === null) {
            // Seed some sample matches
            const now = new Date();
            const sampleMatches = [
                {
                    id: 'A1B2C3',
                    title: 'Weekend Tournament',
                    map: 'Erangel',
                    slots: 50,
                    mode: 'Squad',
                    prizePool: 1000,
                    dateTime: new Date(now.getTime() + 86400000).toISOString(), // Tomorrow
                    distribution: 'rank',
                    status: 'upcoming',
                    joinedPlayers: [
                        { id: 'P001', name: 'Player One', joinedAt: new Date().toISOString() },
                        { id: 'P002', name: 'Player Two', joinedAt: new Date().toISOString() }
                    ],
                    roomId: '',
                    roomPassword: '',
                    results: []
                },
                {
                    id: 'X9Y8Z7',
                    title: 'Daily Duo Challenge',
                    map: 'Sanhok',
                    slots: 40,
                    mode: 'Duo',
                    prizePool: 500,
                    dateTime: new Date().toISOString(), // Now
                    distribution: 'kill',
                    status: 'ongoing',
                    joinedPlayers: [
                        { id: 'P003', name: 'Player Three', joinedAt: new Date().toISOString() },
                        { id: 'P004', name: 'Player Four', joinedAt: new Date().toISOString() },
                        { id: 'P005', name: 'Player Five', joinedAt: new Date().toISOString() }
                    ],
                    roomId: '123456',
                    roomPassword: 'duo123',
                    results: []
                },
                {
                    id: 'M5N6O7',
                    title: 'Solo Showdown',
                    map: 'Miramar',
                    slots: 100,
                    mode: 'Solo',
                    prizePool: 1500,
                    dateTime: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
                    distribution: 'rank',
                    status: 'completed',
                    joinedPlayers: [
                        { id: 'P006', name: 'Player Six', joinedAt: new Date().toISOString() },
                        { id: 'P007', name: 'Player Seven', joinedAt: new Date().toISOString() },
                        { id: 'P008', name: 'Player Eight', joinedAt: new Date().toISOString() },
                        { id: 'P009', name: 'Player Nine', joinedAt: new Date().toISOString() }
                    ],
                    roomId: '789012',
                    roomPassword: 'solo456',
                    results: [
                        { playerId: 'P006', rank: 1, kills: 8, prize: 750 },
                        { playerId: 'P007', rank: 2, kills: 5, prize: 450 },
                        { playerId: 'P008', rank: 3, kills: 3, prize: 300 },
                        { playerId: 'P009', rank: 4, kills: 2, prize: 0 }
                    ]
                }
            ];
            
            localStorage.setItem('tournamentMatches', JSON.stringify(sampleMatches));
        }
        
        // Update dashboard counts and show dashboard
        updateDashboardCounts();
        showTab('dashboard');
    }

    // Initialize the app when DOM is loaded
    initApp();
});