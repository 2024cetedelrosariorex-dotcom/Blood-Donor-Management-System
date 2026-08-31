/* ==========================================================================
   MAIN SCRIPT FILE - WITH DYNAMIC USER LOGIN & GRID FORM LOGIC
   ========================================================================== */

// --- MOCK DATABASE / STATE STORE ---
const db = {
    currentUser: null,
    barangays: [
        { id: 1, name: "Apopong" },
        { id: 2, name: "Baluan" },
        { id: 3, name: "Bula" },
        { id: 4, name: "Calumpang" },
        { id: 5, name: "City Heights" },
        { id: 6, name: "Labangal" },
        { id: 7, name: "Lagao" },
        { id: 8, name: "San Isidro" }
    ],
    bloodTypes: [
        { id: 1, name: "A+" },
        { id: 2, name: "A-" },
        { id: 3, name: "B+" },
        { id: 4, name: "B-" },
        { id: 5, name: "O+" },
        { id: 6, name: "O-" },
        { id: 7, name: "AB+" },
        { id: 8, name: "AB-" }
    ],
    users: [
        { id: 1, username: "cho_admin", password: "123", roleId: 1, roleName: "City Health Office Admin", status: "Active" },
        { id: 2, username: "gensan_med", password: "123", roleId: 2, roleName: "Hospital Staff", status: "Active" },
        { id: 3, username: "bhw_lagao", password: "123", roleId: 3, roleName: "Barangay Health Worker", status: "Active" },
        { id: 4, username: "donor_juan", password: "123", roleId: 4, roleName: "Volunteer Blood Donor", status: "Active" }
    ],
    donors: [
        {
            id: 101,
            userId: 4,
            firstName: "Juan",
            middleName: "Protacio",
            lastName: "Dela Cruz",
            sex: "Male",
            birthDate: "1995-06-12",
            phone: "09171234567",
            email: "juan.delacruz@gmail.com",
            address: "123 Mabini St.",
            barangayId: 7, // Lagao
            city: "General Santos City",
            region: "Region XII (SOCCSKSARGEN)",
            bloodTypeId: 5, // O+
            verificationStatus: "Verified",
            availability: "Available"
        },
        {
            id: 102,
            userId: null,
            firstName: "Maria",
            middleName: "Clara",
            lastName: "Santos",
            sex: "Female",
            birthDate: "1998-03-25",
            phone: "09189876543",
            email: "maria.santos@gmail.com",
            address: "Block 4 Lot 12 Sunshine Village",
            barangayId: 4, // Calumpang
            city: "General Santos City",
            region: "Region XII (SOCCSKSARGEN)",
            bloodTypeId: 1, // A+
            verificationStatus: "Pending",
            availability: "Available"
        },
        {
            id: 103,
            userId: null,
            firstName: "Pedro",
            middleName: "Penduko",
            lastName: "Reyes",
            sex: "Male",
            birthDate: "1992-11-05",
            phone: "09223334444",
            email: "pedro.reyes@yahoo.com",
            address: "Purok 5 San Cruz",
            barangayId: 7, // Lagao
            city: "General Santos City",
            region: "Region XII (SOCCSKSARGEN)",
            bloodTypeId: 5, // O+
            verificationStatus: "Verified",
            availability: "Available"
        }
    ],
    requests: [
        {
            id: 501,
            patientName: "Ramon Magsaysay",
            hospitalId: 2,
            hospitalName: "General Santos Doctors Hospital",
            bloodTypeId: 5, // O+
            barangayId: 7, // Lagao
            quantity: 2,
            requestDate: "2026-05-20",
            status: "Pending"
        }
    ],
    donations: [
        {
            id: 901,
            donorId: 101,
            requestId: 501,
            bloodTypeId: 5,
            date: "2026-05-21",
            status: "Awaiting Confirmation"
        }
    ],
    drives: [
        {
            id: 301,
            eventName: "Dugo Mo, Buhay Ko Drive",
            venue: "Lagao Barangay Gym",
            scheduleDate: "2026-06-15",
            barangayId: 7,
            status: "Scheduled"
        }
    ]
};

// --- DOM INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initNavigationAndModals();
    bindFormEvents();
});

// --- HELPER FUNCTIONS ---
function getBarangayName(id) {
    const b = db.barangays.find(item => item.id === parseInt(id));
    return b ? b.name : "N/A";
}

function getBloodTypeName(id) {
    const bt = db.bloodTypes.find(item => item.id === parseInt(id));
    return bt ? bt.name : "N/A";
}

function getDonorName(donor) {
    if (!donor) return "Unknown Donor";
    return `${donor.firstName} ${donor.middleName ? donor.middleName + ' ' : ''}${donor.lastName}`;
}

// --- NAVIGATION & MODALS ---
function initNavigationAndModals() {
    const loginForm = document.getElementById("initialLoginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const roleId = parseInt(document.getElementById("initialLoginRole").value);
            const username = document.getElementById("initialLoginUsername").value.trim();
            const password = document.getElementById("initialLoginPassword").value.trim();

            // DYNAMIC LOGIN CHECK AGAINST CREATED ACCOUNTS IN DB.USERS
            let user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.roleId === roleId);

            if (!user) {
                // If user is newly registered or dynamic entry, register state directly
                user = {
                    id: Date.now(),
                    username: username || "User",
                    password: password,
                    roleId: roleId,
                    roleName: getRoleNameById(roleId),
                    status: "Active"
                };
                db.users.push(user);
            }

            db.currentUser = user;
            loginUserSuccess();
        });
    }

    document.querySelectorAll(".close-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.getAttribute("data-close");
            if (modalId) closeModal(modalId);
        });
    });

    document.getElementById("linkOpenStaffRegister")?.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("staffRegisterModal");
        toggleRoleFormFields();
    });

    document.getElementById("btnBhwRegisterDonor")?.addEventListener("click", () => openModal("registerModal"));
    document.getElementById("btnReqModuleAdd")?.addEventListener("click", () => openModal("requestModal"));
    document.getElementById("btnDriveModuleAdd")?.addEventListener("click", () => openModal("driveModal"));

    document.getElementById("btnAdminCreateAccount")?.addEventListener("click", () => {
        openModal("staffRegisterModal");
        toggleRoleFormFields();
    });

    document.getElementById("btnEditDonorProfile")?.addEventListener("click", () => {
        loadDonorProfileEditForm();
        openModal("editDonorProfileModal");
    });

    document.getElementById("btnLogoutNav")?.addEventListener("click", () => {
        db.currentUser = null;
        document.getElementById("mainDashboardView").style.display = "none";
        document.getElementById("loginViewSection").style.display = "flex";
    });

    document.getElementById("filterSameBarangay")?.addEventListener("change", () => {
        const reqId = document.getElementById("viewMatchedDonors").dataset.activeRequestId;
        if (reqId) renderMatchedDonors(parseInt(reqId));
    });
}

function getRoleNameById(roleId) {
    switch (roleId) {
        case 1: return "City Health Office Admin";
        case 2: return "Hospital Staff";
        case 3: return "Barangay Health Worker";
        case 4: return "Volunteer Blood Donor";
        default: return "Guest";
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// --- LOGIN & ROLE DASHBOARD SETUP ---
function loginUserSuccess() {
    document.getElementById("loginViewSection").style.display = "none";
    document.getElementById("mainDashboardView").style.display = "block";

    const user = db.currentUser;
    document.getElementById("roleBadge").textContent = user.roleName;
    document.getElementById("welcomeUserMsg").textContent = `Maligayang pagbabalik, ${user.username}!`;

    buildSidebarMenu(user.roleId);
    switchModuleView("viewHome");
    refreshAllTables();
    renderHomeDashboardForUser();
}

function buildSidebarMenu(roleId) {
    const sidebar = document.getElementById("sidebarMenu");
    sidebar.innerHTML = "";

    const menuItems = [
        { id: "viewHome", label: "Dashboard Home", icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10v9A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-9"/></svg>`, roles: [1, 2, 3, 4] },
        { id: "viewDonors", label: "Donor Records", icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M8 2.5h8a1 1 0 0 1 1 1V5H7V3.5a1 1 0 0 1 1-1Z"/><rect x="5" y="5" width="14" height="16.5" rx="2"/><path d="M9 11h6M9 14.5h6M9 18h4"/></svg>`, roles: [1, 2, 3] },
        { id: "viewRequests", label: "Emergency Requests", icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>`, roles: [1, 2, 3] },
        { id: "viewMatchedDonors", label: "Matched Donors Engine", icon: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>`, roles: [1, 2] },
        { id: "viewDrives", label: "Blood Drives", icon: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5"/></svg>`, roles: [1, 2, 3, 4] },
        { id: "viewUsers", label: "Manage User Accounts", icon: `<svg class="icon" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.7-3.4 3-5.3 5.5-5.3s4.8 1.9 5.5 5.3"/><circle cx="17" cy="8.5" r="2.6"/><path d="M15.5 14.9c2.2.3 3.9 2.1 4.5 5.1"/></svg>`, roles: [1] },
        { id: "viewReports", label: "Reports Generation", icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M20 20H4"/></svg>`, roles: [1] },
        { id: "viewManageNotifications", label: "Manage Notifications", icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7"/><path d="M10.5 19a1.7 1.7 0 0 0 3 0"/></svg>`, roles: [1] },
        { id: "viewMyProfile", label: "My Donor Portal", icon: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c1-4.2 3.8-6.5 7.5-6.5s6.5 2.3 7.5 6.5"/></svg>`, roles: [4] }
    ];

    menuItems.forEach(item => {
        if (item.roles.includes(roleId)) {
            const li = document.createElement("li");
            li.innerHTML = `<a href="#" onclick="switchModuleView('${item.id}'); return false;">${item.icon} <span>${item.label}</span></a>`;
            sidebar.appendChild(li);
        }
    });
}

function switchModuleView(viewId) {
    document.querySelectorAll(".module-view").forEach(el => el.style.display = "none");
    const target = document.getElementById(viewId);
    if (target) target.style.display = "block";

    const roleId = db.currentUser ? db.currentUser.roleId : 0;
    if (document.getElementById("btnBhwRegisterDonor")) {
        document.getElementById("btnBhwRegisterDonor").style.display = (roleId === 3 || roleId === 1) ? "inline-flex" : "none";
    }
    if (document.getElementById("btnReqModuleAdd")) {
        document.getElementById("btnReqModuleAdd").style.display = (roleId === 2 || roleId === 1) ? "inline-flex" : "none";
    }
    if (document.getElementById("btnDriveModuleAdd")) {
        document.getElementById("btnDriveModuleAdd").style.display = (roleId === 1 || roleId === 3) ? "inline-flex" : "none";
    }

    if (viewId === "viewHome") renderHomeDashboardForUser();
    if (viewId === "viewMyProfile") renderDonorPortal();
    if (viewId === "viewManageNotifications") renderAdminNotifications();
}

// --- RENDER DYNAMIC DASHBOARD & METRICS ---
function renderHomeDashboardForUser() {
    // Update live metrics inside center box
    document.getElementById("statTotalDonors").textContent = db.donors.length;
    document.getElementById("statActiveRequests").textContent = db.requests.filter(r => r.status === "Pending").length;
    document.getElementById("statVerifiedDonors").textContent = db.donors.filter(d => d.verificationStatus === "Verified").length;
    document.getElementById("statUpcomingDrives").textContent = db.drives.length;

    // Show/Hide role specific dashboard panel
    document.getElementById("entityDashChoAdmin").style.display = "none";
    document.getElementById("entityDashHospital").style.display = "none";
    document.getElementById("entityDashBhw").style.display = "none";
    document.getElementById("entityDashDonor").style.display = "none";

    const roleId = db.currentUser ? db.currentUser.roleId : 1;

    if (roleId === 1) {
        document.getElementById("entityDashChoAdmin").style.display = "block";
        const pendingCount = db.donors.filter(d => d.verificationStatus === "Pending").length;
        document.getElementById("choPendingCount").textContent = pendingCount;
    } else if (roleId === 2) {
        document.getElementById("entityDashHospital").style.display = "block";
        const activeContainer = document.getElementById("hospitalActiveRequestsSummary");
        const pendingReqs = db.requests.filter(r => r.status === "Pending");
        if (pendingReqs.length === 0) {
            activeContainer.innerHTML = `<p style="color:var(--ink-faint); font-size:0.85rem;">Walang active emergency request sa kasalukuyan.</p>`;
        } else {
            let html = `<ul style="list-style:none;">`;
            pendingReqs.forEach(r => {
                html += `<li style="padding:8px 0; border-bottom:1px solid var(--border-color); font-size:0.88rem;">
                    <strong>${r.patientName}</strong> &middot; Need: <span class="badge badge-blood">${getBloodTypeName(r.bloodTypeId)}</span> (${r.quantity} bags)
                </li>`;
            });
            html += `</ul>`;
            activeContainer.innerHTML = html;
        }
    } else if (roleId === 3) {
        document.getElementById("entityDashBhw").style.display = "block";
    } else if (roleId === 4) {
        document.getElementById("entityDashDonor").style.display = "block";
        const donor = db.donors.find(d => d.userId === db.currentUser.id) || db.donors[0];
        document.getElementById("donorPortalBloodTypeBadge").textContent = getBloodTypeName(donor.bloodTypeId);
        document.getElementById("donorPortalName").textContent = getDonorName(donor);
        document.getElementById("donorPortalLocation").textContent = `Barangay ${getBarangayName(donor.barangayId)}, General Santos City`;
        document.getElementById("donorPortalVerification").textContent = donor.verificationStatus;
    }
}

// --- DYNAMIC ROLE FORMS TOGGLE ---
function toggleRoleFormFields() {
    const roleVal = document.getElementById("staffRegRole").value;
    document.getElementById("choFieldsGroup").style.display = "none";
    document.getElementById("hospitalFieldsGroup").style.display = "none";
    document.getElementById("bhwFieldsGroup").style.display = "none";
    document.getElementById("donorFieldsGroup").style.display = "none";

    if (roleVal === "1") document.getElementById("choFieldsGroup").style.display = "grid";
    else if (roleVal === "2") document.getElementById("hospitalFieldsGroup").style.display = "grid";
    else if (roleVal === "3") document.getElementById("bhwFieldsGroup").style.display = "grid";
    else if (roleVal === "4") document.getElementById("donorFieldsGroup").style.display = "grid";
}

// --- RENDER TABLES & DATA ---
function refreshAllTables() {
    renderDonorTable();
    renderRequestTable();
    renderDriveTable();
    renderUserAccountTable();
    renderPendingDonations();
}

function renderDonorTable() {
    const tbody = document.getElementById("donorTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    db.donors.forEach(donor => {
        const tr = document.createElement("tr");
        let actionBtn = "";

        if (db.currentUser && (db.currentUser.roleId === 1 || db.currentUser.roleId === 3)) {
            if (donor.verificationStatus === "Pending") {
                actionBtn = `<button class="btn-sm btn-success" onclick="verifyDonor(${donor.id})">Verify</button>`;
            } else {
                actionBtn = `<button class="btn-sm btn-secondary" onclick="toggleDonorAvailability(${donor.id})">Toggle Status</button>`;
            }
        }

        tr.innerHTML = `
            <td>#${donor.id}</td>
            <td>${donor.firstName}</td>
            <td>${donor.lastName}</td>
            <td>${donor.sex}</td>
            <td>${donor.phone}</td>
            <td>${donor.email}</td>
            <td>${getBarangayName(donor.barangayId)}</td>
            <td><span class="badge badge-blood">${getBloodTypeName(donor.bloodTypeId)}</span></td>
            <td><span class="badge ${donor.verificationStatus === 'Verified' ? 'badge-success' : 'badge-warning'}">${donor.verificationStatus}</span></td>
            <td><span class="badge ${donor.availability === 'Available' ? 'badge-info' : 'badge-danger'}">${donor.availability}</span></td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderRequestTable() {
    const tbody = document.getElementById("requestTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    db.requests.forEach(req => {
        const tr = document.createElement("tr");
        let actionBtn = "";

        if (db.currentUser && (db.currentUser.roleId === 1 || db.currentUser.roleId === 2)) {
            actionBtn = `<button class="btn-sm btn-primary" onclick="openMatchEngineForRequest(${req.id})">Find Matches</button>`;
        }

        tr.innerHTML = `
            <td>#${req.id}</td>
            <td>${req.patientName}</td>
            <td>${req.hospitalName}</td>
            <td><span class="badge badge-blood">${getBloodTypeName(req.bloodTypeId)}</span></td>
            <td>${getBarangayName(req.barangayId)}</td>
            <td>${req.quantity} bag(s)</td>
            <td>${req.requestDate}</td>
            <td><span class="badge ${req.status === 'Fulfilled' ? 'badge-success' : 'badge-warning'}">${req.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPendingDonations() {
    const card = document.getElementById("donationConfirmCard");
    const tbody = document.getElementById("pendingDonationsBody");
    if (!card || !tbody) return;

    if (db.currentUser && (db.currentUser.roleId === 1 || db.currentUser.roleId === 2)) {
        card.style.display = "block";
        tbody.innerHTML = "";

        db.donations.forEach(don => {
            const donor = db.donors.find(d => d.id === don.donorId);
            const tr = document.createElement("tr");

            let actionBtn = don.status === "Awaiting Confirmation"
                ? `<button class="btn-sm btn-success" onclick="confirmDonation(${don.id})">Confirm Donation</button>`
                : `<span class="badge badge-success">Completed</span>`;

            tr.innerHTML = `
                <td>#${don.id}</td>
                <td>${getDonorName(donor)}</td>
                <td><span class="badge badge-blood">${getBloodTypeName(don.bloodTypeId)}</span></td>
                <td>#${don.requestId}</td>
                <td>${don.date}</td>
                <td><span class="badge badge-warning">${don.status}</span></td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        card.style.display = "none";
    }
}

function renderDriveTable() {
    const tbody = document.getElementById("driveTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    db.drives.forEach(drive => {
        const tr = document.createElement("tr");
        let actionBtn = "";

        if (db.currentUser && (db.currentUser.roleId === 1 || db.currentUser.roleId === 3)) {
            actionBtn = `<button class="btn-sm btn-secondary" onclick="openEditDriveModal(${drive.id})">Edit</button>`;
        }

        tr.innerHTML = `
            <td>#${drive.id}</td>
            <td><strong>${drive.eventName}</strong></td>
            <td>${drive.venue}</td>
            <td>${drive.scheduleDate}</td>
            <td>${getBarangayName(drive.barangayId)}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUserAccountTable() {
    const tbody = document.getElementById("userAccountTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    db.users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${u.id}</td>
            <td>${u.username}</td>
            <td>${u.roleName}</td>
            <td><span class="badge badge-success">${u.status}</span></td>
            <td><button class="btn-sm btn-secondary" onclick="openEditUserModal(${u.id})">Edit</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MATCH ENGINE LOGIC ---
function openMatchEngineForRequest(reqId) {
    document.getElementById("viewMatchedDonors").dataset.activeRequestId = reqId;
    switchModuleView("viewMatchedDonors");
    renderMatchedDonors(reqId);
}

function renderMatchedDonors(reqId) {
    const req = db.requests.find(r => r.id === reqId);
    const tbody = document.getElementById("matchedDonorTableBody");
    const tag = document.getElementById("matchedFilterTag");
    if (!req || !tbody) return;

    const filterSameBarangay = document.getElementById("filterSameBarangay").checked;

    tag.textContent = `Matching Donors for Request #${req.id} (${req.patientName} - Need: ${getBloodTypeName(req.bloodTypeId)} in ${getBarangayName(req.barangayId)})`;

    let matched = db.donors.filter(d =>
        d.bloodTypeId === req.bloodTypeId &&
        d.verificationStatus === "Verified" &&
        d.availability === "Available"
    );

    if (filterSameBarangay) {
        matched = matched.filter(d => d.barangayId === req.barangayId);
    }

    tbody.innerHTML = "";
    if (matched.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--ink-faint);">Walang nahanap na kwalipikadong donor na tugma sa pamantayan.</td></tr>`;
        return;
    }

    matched.forEach(donor => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${donor.id}</td>
            <td>${getDonorName(donor)}</td>
            <td>${donor.sex}</td>
            <td><span class="badge badge-blood">${getBloodTypeName(donor.bloodTypeId)}</span></td>
            <td>${donor.address}, Brgy. ${getBarangayName(donor.barangayId)}</td>
            <td>${donor.phone}</td>
            <td><span class="badge badge-success">${donor.availability}</span></td>
            <td>
                <button class="btn-sm btn-alert" onclick="notifyDonorForEmergency(${donor.id}, ${req.id})">Alert Donor</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function notifyDonorForEmergency(donorId, reqId) {
    alert(`Emergency alert sent successfully to Donor #${donorId}!`);
}

// --- ACTIONS & VERIFICATIONS ---
function verifyDonor(donorId) {
    const donor = db.donors.find(d => d.id === donorId);
    if (donor) {
        donor.verificationStatus = "Verified";
        alert(`Donor ${getDonorName(donor)} is now VERIFIED.`);
        refreshAllTables();
        renderHomeDashboardForUser();
    }
}

function toggleDonorAvailability(donorId) {
    const donor = db.donors.find(d => d.id === donorId);
    if (donor) {
        donor.availability = donor.availability === "Available" ? "Unavailable" : "Available";
        refreshAllTables();
    }
}

function confirmDonation(donationId) {
    const don = db.donations.find(d => d.id === donationId);
    if (don) {
        don.status = "Confirmed";
        const req = db.requests.find(r => r.id === don.requestId);
        if (req) req.status = "Fulfilled";
        alert("Donation confirmed successfully!");
        refreshAllTables();
        renderHomeDashboardForUser();
    }
}

// --- DONOR PORTAL VIEW ---
function renderDonorPortal() {
    const myProfileContent = document.getElementById("myProfileContent");
    const notificationsContainer = document.getElementById("donorNotificationsContainer");

    const currentDonor = db.donors.find(d => d.userId === db.currentUser.id) || db.donors[0];

    if (myProfileContent) {
        myProfileContent.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                <div><strong>Full Name:</strong> ${getDonorName(currentDonor)}</div>
                <div><strong>Sex:</strong> ${currentDonor.sex}</div>
                <div><strong>Blood Type:</strong> <span class="badge badge-blood">${getBloodTypeName(currentDonor.bloodTypeId)}</span></div>
                <div><strong>Phone:</strong> ${currentDonor.phone}</div>
                <div><strong>Email:</strong> ${currentDonor.email}</div>
                <div><strong>Status:</strong> <span class="badge badge-success">${currentDonor.verificationStatus}</span></div>
                <div style="grid-column: 1 / -1;">
                    <strong>Complete Address:</strong> ${currentDonor.address}, Brgy. ${getBarangayName(currentDonor.barangayId)}, ${currentDonor.city}, ${currentDonor.region}
                </div>
            </div>
        `;
    }

    if (notificationsContainer) {
        notificationsContainer.innerHTML = `
            <div style="background: var(--light-red); border-left: 4px solid var(--garnet); padding: 14px; margin-bottom: 10px; border-radius: 8px;">
                <strong style="color:var(--garnet);">Emergency Call for Blood Donation!</strong>
                <p style="margin: 6px 0; font-size: 0.9rem;">
                    Patient at General Santos Doctors Hospital needs ${getBloodTypeName(currentDonor.bloodTypeId)} blood. Please confirm if you can donate.
                </p>
                <button class="btn-sm btn-alert" style="margin-top: 6px;" onclick="respondToEmergencyCall(${currentDonor.id})">I Can Donate Now</button>
            </div>
        `;
    }
}

function respondToEmergencyCall(donorId) {
    db.donations.push({
        id: Date.now(),
        donorId: donorId,
        requestId: 501,
        bloodTypeId: 5,
        date: new Date().toISOString().split('T')[0],
        status: "Awaiting Confirmation"
    });
    alert("Thank you for responding! Hospital staff will confirm your arrival.");
}

function renderAdminNotifications() {
    const container = document.getElementById("adminNotificationsContainer");
    if (!container) return;

    container.innerHTML = `
        <ul style="list-style: none; padding: 0;">
            <li style="padding: 12px; border-bottom: 1px solid var(--border-color);">
                <strong>New Emergency Request:</strong> 2 bags of O+ blood requested by General Santos Doctors Hospital.
            </li>
            <li style="padding: 12px; border-bottom: 1px solid var(--border-color);">
                <strong>Pending Verification:</strong> Donor Maria Clara Santos requires verification.
            </li>
        </ul>
    `;
}

// --- FORM EVENT BINDINGS ---
function bindFormEvents() {
    // 1. INLINE INTERACTIVE FORM: EMERGENCY BLOOD REQUEST
    document.getElementById("inlineRequestForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newReq = {
            id: Date.now(),
            patientName: document.getElementById("inlineReqPatient").value.trim(),
            hospitalId: 2,
            hospitalName: "General Santos Doctors Hospital",
            bloodTypeId: parseInt(document.getElementById("inlineReqBloodType").value),
            barangayId: 7, // Lagao
            quantity: parseInt(document.getElementById("inlineReqQty").value),
            requestDate: document.getElementById("inlineReqDate").value,
            status: "Pending"
        };
        db.requests.push(newReq);
        document.getElementById("inlineRequestForm").reset();
        refreshAllTables();
        renderHomeDashboardForUser();
        alert(`Emergency Blood Request #${newReq.id} added and appended to the table!`);
    });

    // 2. INLINE INTERACTIVE FORM: COMMUNITY BLOOD DRIVE
    document.getElementById("inlineDriveForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newDrive = {
            id: Date.now(),
            eventName: document.getElementById("inlineDriveEvent").value.trim(),
            venue: document.getElementById("inlineDriveVenue").value.trim(),
            scheduleDate: document.getElementById("inlineDriveDate").value,
            barangayId: parseInt(document.getElementById("inlineDriveBarangay").value),
            status: "Scheduled"
        };
        db.drives.push(newDrive);
        document.getElementById("inlineDriveForm").reset();
        refreshAllTables();
        renderHomeDashboardForUser();
        alert(`Blood Drive "${newDrive.eventName}" successfully scheduled and added to table!`);
    });

    document.getElementById("formStaffRegister")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const roleId = parseInt(document.getElementById("staffRegRole").value);
        const username = document.getElementById("staffRegUser").value.trim();
        const password = document.getElementById("staffRegPass").value.trim();

        const newUserId = Date.now();

        if (roleId === 4) {
            const newDonor = {
                id: Date.now(),
                userId: newUserId,
                firstName: document.getElementById("selfDonorFirName").value,
                middleName: document.getElementById("selfDonorMidName").value,
                lastName: document.getElementById("selfDonorLstName").value,
                sex: document.getElementById("selfDonorSex").value,
                birthDate: document.getElementById("selfDonorBth").value,
                phone: document.getElementById("selfDonorPhone").value,
                email: document.getElementById("selfDonorEmail").value,
                address: document.getElementById("selfDonorAdd").value,
                barangayId: parseInt(document.getElementById("selfDonorBarangay").value),
                city: document.getElementById("selfDonorCity").value,
                region: document.getElementById("selfDonorRegion").value,
                bloodTypeId: parseInt(document.getElementById("selfDonorBloodType").value),
                verificationStatus: "Pending",
                availability: "Available"
            };
            db.donors.push(newDonor);
        }

        // PUSH CREATED USER ACCOUNT TO DB.USERS FOR LOGIN FUNCTIONALITY
        db.users.push({
            id: newUserId,
            username: username,
            password: password,
            roleId: roleId,
            roleName: getRoleNameById(roleId),
            status: "Active"
        });

        alert(`Account registration successful! You can now log in using username: ${username}`);
        closeModal("staffRegisterModal");
        refreshAllTables();
    });

    document.getElementById("registerForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const roleName = document.getElementById("accountRole").value;
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const username = (firstName.toLowerCase() + "_" + lastName.toLowerCase()).replace(/\s+/g, '');
        
        let roleId = 4;
        if (roleName === "Barangay Health Worker") roleId = 3;
        else if (roleName === "Hospital Staff") roleId = 2;
        else if (roleName === "CHO Admin") roleId = 1;

        const newUserId = Date.now();

        const newDonor = {
            id: Date.now(),
            userId: newUserId,
            firstName: firstName,
            middleName: document.getElementById("middleName").value,
            lastName: lastName,
            sex: document.getElementById("sex").value,
            birthDate: document.getElementById("birthDate").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value,
            address: document.getElementById("address").value,
            barangayId: 7,
            city: document.getElementById("city").value,
            region: document.getElementById("region").value,
            bloodTypeId: 1,
            verificationStatus: "Verified",
            availability: "Available"
        };
        db.donors.push(newDonor);

        // SAVE CREATED ACCOUNT IN DB.USERS
        db.users.push({
            id: newUserId,
            username: username,
            password: "123",
            roleId: roleId,
            roleName: roleName,
            status: "Active"
        });

        alert(`Account registered successfully! Generated Username for login: ${username}`);
        closeModal("registerModal");
        refreshAllTables();
    });

    document.getElementById("formEmergencyRequest")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newReq = {
            id: Date.now(),
            patientName: document.getElementById("reqPatient").value,
            hospitalId: 2,
            hospitalName: "General Santos Doctors Hospital",
            bloodTypeId: parseInt(document.getElementById("reqBloodType").value),
            barangayId: 7,
            quantity: parseInt(document.getElementById("reqQty").value),
            requestDate: document.getElementById("reqDate").value,
            status: "Pending"
        };
        db.requests.push(newReq);
        closeModal("requestModal");
        refreshAllTables();
        renderHomeDashboardForUser();
        openMatchEngineForRequest(newReq.id);
    });

    document.getElementById("formBloodDrive")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newDrive = {
            id: Date.now(),
            eventName: document.getElementById("driveEvent").value,
            venue: document.getElementById("driveVenue").value,
            scheduleDate: document.getElementById("driveDate").value,
            barangayId: parseInt(document.getElementById("driveBarangay").value),
            status: "Scheduled"
        };
        db.drives.push(newDrive);
        closeModal("driveModal");
        refreshAllTables();
        renderHomeDashboardForUser();
    });

    document.getElementById("formEditUser")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const userId = parseInt(document.getElementById("editUserId").value);
        const user = db.users.find(u => u.id === userId);
        if (user) {
            user.username = document.getElementById("editUserUsername").value.trim();
            alert("User updated successfully!");
            closeModal("editUserModal");
            refreshAllTables();
        }
    });

    document.getElementById("formEditDrive")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const driveId = parseInt(document.getElementById("editDriveId").value);
        const drive = db.drives.find(d => d.id === driveId);
        if (drive) {
            drive.eventName = document.getElementById("editDriveEvent").value.trim();
            drive.venue = document.getElementById("editDriveVenue").value.trim();
            drive.scheduleDate = document.getElementById("editDriveDate").value;
            drive.barangayId = parseInt(document.getElementById("editDriveBarangay").value);
            drive.status = document.getElementById("editDriveStatus").value;
            alert("Blood drive updated successfully!");
            closeModal("editDriveModal");
            refreshAllTables();
        }
    });

    document.getElementById("formEditDonorProfile")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const donor = db.donors.find(d => d.userId === db.currentUser.id) || db.donors[0];
        if (donor) {
            donor.firstName = document.getElementById("editProfileFirName").value.trim();
            donor.middleName = document.getElementById("editProfileMidName").value.trim();
            donor.lastName = document.getElementById("editProfileLstName").value.trim();
            donor.phone = document.getElementById("editProfilePhone").value.trim();
            donor.email = document.getElementById("editProfileEmail").value.trim();
            donor.address = document.getElementById("editProfileAdd").value.trim();
            donor.barangayId = parseInt(document.getElementById("editProfileBarangay").value);
            donor.city = document.getElementById("editProfileCity").value.trim();
            donor.region = document.getElementById("editProfileRegion").value.trim();

            alert("Profile updated successfully!");
            closeModal("editDonorProfileModal");
            renderDonorPortal();
            refreshAllTables();
        }
    });
}

function openEditUserModal(userId) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        document.getElementById("editUserId").value = user.id;
        document.getElementById("editUserUsername").value = user.username;
        openModal("editUserModal");
    }
}

function openEditDriveModal(driveId) {
    const drive = db.drives.find(d => d.id === driveId);
    if (drive) {
        document.getElementById("editDriveId").value = drive.id;
        document.getElementById("editDriveEvent").value = drive.eventName;
        document.getElementById("editDriveVenue").value = drive.venue;
        document.getElementById("editDriveDate").value = drive.scheduleDate;
        document.getElementById("editDriveBarangay").value = drive.barangayId;
        document.getElementById("editDriveStatus").value = drive.status || "Scheduled";
        openModal("editDriveModal");
    }
}

function loadDonorProfileEditForm() {
    const donor = db.donors.find(d => d.userId === db.currentUser.id) || db.donors[0];
    if (donor) {
        document.getElementById("editProfileFirName").value = donor.firstName;
        document.getElementById("editProfileMidName").value = donor.middleName || "";
        document.getElementById("editProfileLstName").value = donor.lastName;
        document.getElementById("editProfilePhone").value = donor.phone;
        document.getElementById("editProfileEmail").value = donor.email;
        document.getElementById("editProfileAdd").value = donor.address;
        document.getElementById("editProfileBarangay").value = donor.barangayId;
        document.getElementById("editProfileCity").value = donor.city;
        document.getElementById("editProfileRegion").value = donor.region;
    }
}

function generateReport(type) {
    const container = document.getElementById("reportOutputContainer");
    if (!container) return;

    if (type === 'Donor') {
        container.innerHTML = `<h3>Donor Report Generated</h3><p>Total Registered Donors: ${db.donors.length}</p>`;
    } else if (type === 'Emergency') {
        container.innerHTML = `<h3>Emergency Request Report Generated</h3><p>Total Requests: ${db.requests.length}</p>`;
    } else if (type === 'Donation') {
        container.innerHTML = `<h3>Donation Report Generated</h3><p>Total Confirmations: ${db.donations.length}</p>`;
    }
}