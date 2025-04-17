document.addEventListener('DOMContentLoaded', () => {
    const userId = document.getElementById("userId").value;
    console.log("User id: ", userId);

    fetch(`http://127.0.0.1:8000/api/users/${userId}/details/`)
        .then(res => res.json())
        .then(data => {
            console.log("User details: ", data);

            populateUserDetail(data)
        })
        .catch(err => console.error('Failed to fetch user detail:', err));
});

function populateUserDetail(data) {
    document.getElementById('userName').textContent = `${data.full_name}`;
    document.getElementById('userEmail').textContent = data.email;
    document.getElementById('userPhone').textContent = `Phone: ${data.phone || 'N/A'}`;
    document.getElementById('userStatus').innerHTML = `Status: <span class="font-medium">${data.status}</span>`;
    // Clear existing classes
    const userStatusElement = document.getElementById('userStatus').querySelector('span');
    userStatusElement.className = ''; // Clear previous classes

    // Add new classes based on the status
    if (data.status === 'active') {
        userStatusElement.classList.add('bg-green-100', 'text-green-800', 'p-1', 'rounded');
    } else if (data.status === 'disabled') {
        userStatusElement.classList.add('bg-red-100', 'text-red-800', 'p-1', 'rounded');
    } else {
        userStatusElement.classList.add('bg-orange-100', 'text-orange-800', 'p-1', 'rounded');
    }
    document.getElementById('userJoined').innerHTML = `Joined: <span class="text-gray-500">${new Date(data.date_joined).toLocaleDateString()}</span>`;

    const profileImage = document.getElementById('userProfileImage');
    if (data.profile) profileImage.src = data.profile;

    const container = document.getElementById('userRolesContainer');
    container.innerHTML = '';

    data.roles.forEach(role => {
        const div = document.createElement('div');
        div.className = "border p-4 rounded-md bg-white shadow";

        const roleHeader = `
            <h3 class="text-lg font-bold text-gray-800 mb-2">${role.name}</h3>
            <p class="text-sm text-gray-600 mb-3">${role.description || 'No description provided.'}</p>
        `;

        const perms = role.permissions.length
            ? `<ul class="list-disc pl-6 text-sm text-gray-700">${role.permissions.map(p => `<li>${p.name} <span class="text-xs text-gray-400">(${p.code})</span></li>`).join('')}</ul>`
            : `<p class="text-sm text-gray-500 italic">No permissions assigned.</p>`;

        div.innerHTML = roleHeader + perms;
        container.appendChild(div);
    });
}
