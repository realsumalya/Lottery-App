let rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    let winners = JSON.parse(localStorage.getItem('winners')) || []; // separate winner history

    let participantModal = new bootstrap.Modal(document.getElementById('participantModal'));
    const previewImg = document.getElementById('previewImg');

    // ===== Save Data =====
    function saveData() {
      localStorage.setItem('rooms', JSON.stringify(rooms));
      localStorage.setItem('winners', JSON.stringify(winners));
      renderRooms();
      renderWinners();
    }

    // ===== Create Room =====
    function createRoom() {
      const name = document.getElementById('roomName').value.trim();
      if (!name) return alert("Please enter a room name!");
      if (rooms[name]) return alert("Room already exists!");
      rooms[name] = { participants: [], winner: null, expired: false };
      document.getElementById('roomName').value = '';
      saveData();
    }

    // ===== Delete Room (but keep history if winner exists) =====
    function deleteRoom(roomName) {
      const room = rooms[roomName];
      if (confirm(`Delete "${roomName}"?`)) {
        if (room.winner) {
          // Preserve winner in global history if not already saved
          const alreadySaved = winners.some(w => w.roomName === roomName);
          if (!alreadySaved) {
            winners.push({
              roomName,
              name: room.winner.name,
              phone: room.winner.phone,
              image: room.winner.image
            });
          }
        }
        delete rooms[roomName];
        saveData();
      }
    }

    // ===== Open Modal =====
    function openParticipantModal(roomName) {
      document.getElementById('activeRoomName').value = roomName;
      document.getElementById('participantForm').reset();
      previewImg.style.display = 'none';
      participantModal.show();
    }

    // ===== Image Preview =====
    document.getElementById('pimage').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 80 * 1024) {
        alert("Image size must be less than 80KB!");
        this.value = '';
        previewImg.style.display = 'none';
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        previewImg.src = ev.target.result;
        previewImg.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    });

    // ===== Add Participant =====
    function submitParticipant(event) {
      event.preventDefault();
      const roomName = document.getElementById('activeRoomName').value;
      const name = document.getElementById('pname').value.trim();
      const phone = document.getElementById('pphone').value.trim();
      const file = document.getElementById('pimage').files[0];
      if (!name || !phone || !file) return alert("All fields are required.");

      const reader = new FileReader();
      reader.onload = e => {
        const imgData = e.target.result;
        rooms[roomName].participants.push({ name, phone, image: imgData });
        saveData();
        participantModal.hide();
      };
      reader.readAsDataURL(file);
    }

    // ===== Pick Winner =====
    function pickWinner(roomName) {
      const room = rooms[roomName];
      if (room.expired) return alert("This event is already expired!");
      if (room.participants.length === 0) return alert("No participants yet!");
      const randomIndex = Math.floor(Math.random() * room.participants.length);
      const winner = room.participants[randomIndex];
      room.winner = winner;
      room.expired = true;

      // Save to global history
      winners.push({
        roomName,
        name: winner.name,
        phone: winner.phone,
        image: winner.image
      });

      alert(`🎉 Winner of "${roomName}" is ${winner.name}!`);
      saveData();
    }

    // ===== Render Rooms =====
    function renderRooms() {
      const container = document.getElementById('roomsContainer');
      container.innerHTML = '';
      Object.keys(rooms).forEach(roomName => {
        const room = rooms[roomName];
        let participantsHTML = '';
        room.participants.forEach(p => {
          const isWinner = room.winner && p.name === room.winner.name;
          participantsHTML += `
            <div class="col-12 participant border p-2 rounded d-flex align-items-center gap-3 bg-white ${isWinner ? 'winner' : ''}">
              <img src="${p.image}" alt="${p.name}">
              <div><strong>${p.name}</strong><br><small>${p.phone}</small></div>
            </div>`;
        });
        container.innerHTML += `
          <div class="col-md-6">
            <div class="card shadow ${room.expired ? 'expired' : ''}">
              <div class="card-header d-flex justify-content-between align-items-center">
                <span class="fw-bold">${roomName}</span>
                <div>
                  ${room.expired ? '<span class="badge bg-danger me-2">Expired</span>' : ''}
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteRoom('${roomName}')">🗑 Delete</button>
                </div>
              </div>
              <div class="card-body">
                <div class="row gy-2">${participantsHTML || '<p class="text-muted">No participants yet.</p>'}</div>
                <hr>
                <div class="d-flex justify-content-between">
                  <button class="btn btn-sm btn-outline-primary" onclick="openParticipantModal('${roomName}')">Add Participant</button>
                  <button class="btn btn-sm btn-success" onclick="pickWinner('${roomName}')">Pick Winner</button>
                </div>
              </div>
            </div>
          </div>`;
      });
    }

    // ===== Render Winners =====
    function renderWinners() {
      const list = document.getElementById('winnerList');
      list.innerHTML = '';
      winners.forEach(w => {
        list.innerHTML += `
          <li class="list-group-item d-flex align-items-center gap-3">
            <img src="${w.image}" class="rounded-circle" width="40" height="40">
            <div>
              <strong>${w.name}</strong> (${w.phone})<br>
              <small class="text-muted">${w.roomName}</small>
            </div>
          </li>`;
      });
    }

    // ===== Initial Render =====
    renderRooms();
    renderWinners();