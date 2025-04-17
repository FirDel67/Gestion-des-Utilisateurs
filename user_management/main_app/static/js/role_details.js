document.addEventListener('DOMContentLoaded', () => {
    const roleId = document.getElementById("roleId").value;

    fetch(`http://127.0.0.1:8000/api/roles/${roleId}/details/`)
        .then(res => res.json())
        .then(data => {
            populateRoleDetails(data);
        })
        .catch(err => {
            console.error("Error fetching role details:", err);
            alert("Failed to load role details.");
        });
});

function populateRoleDetails(data) {
    document.getElementById('roleName').textContent = data.name;
    document.getElementById('roleDescription').textContent = data.description || 'No description provided.';

    const container = document.getElementById('rolePermissionsContainer');
    container.innerHTML = '';

    if (data.permissions.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic">No permissions assigned.</p>`;
        return;
    }

    data.permissions.forEach(perm => {
        const item = document.createElement('div');
        item.className = "px-4 py-2 bg-gray-50 border rounded text-sm text-gray-800 flex flex-col";

        item.innerHTML = `
        <div class="flex justify-between items-center">
            <span>${perm.name}</span>
            <span class="text-xs text-gray-400">(${perm.code})</span>
        </div>
        <span class="text-xs text-gray-500">${perm.description}</span>
    `;

        container.appendChild(item);
    });
}
