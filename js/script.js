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
        {
            id: 1,
            username: "choadmin",
            password: "ChoAdmin123!",
          // roleId: Number(result.roleId), // [FIXED - DISABLED] "result" does not exist here (ReferenceError at load)
            roleId: 1, // [FIXED] CHO Admin role id
            roleName: "City Health Office Admin",
            status: "Active"
        },
        {
            id: 2,
            username: "hospitalstaff",
            password: "Hospital123!",
            roleId: 2,
            roleName: "Hospital Staff",
            status: "Active"
        },
        {
            id: 3,
            username: "bhwgensan",
            password: "BhwGensan123!",
            roleId: 3,
            roleName: "Barangay Health Worker",
            status: "Active"
        },
        {
            id: 4,
            username: "donor_juan",
            password: "123",
            roleId: 4,
            roleName: "Volunteer Blood Donor",
            status: "Active"
        }
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
            barangayId: 7,
            city: "General Santos City",
            region: "Region XII (SOCCSKSARGEN)",
            bloodTypeId: 5,
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
            barangayId: 4,
            city: "General Santos City",
            region: "Region XII (SOCCSKSARGEN)",
            bloodTypeId: 1,
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
            barangayId: 7,
            city: "General Santos City",
            region: "Region XII (SOCCSKSARGEN)",
            bloodTypeId: 5,
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
            bloodTypeId: 5,
            barangayId: 7,
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

    initLocationDropdowns();

    bindFormEvents();
});


// --- HELPER FUNCTIONS ---
function getBarangayName(id) {

    const b =
        db.barangays.find(
            item =>
                item.id ===
                parseInt(id)
        );

    return b
        ? b.name
        : "N/A";
}


function getBloodTypeName(id) {

    const bt =
        db.bloodTypes.find(
            item =>
                item.id ===
                parseInt(id)
        );

    return bt
        ? bt.name
        : "N/A";
}


function getDonorName(donor) {

    if (!donor) {
        return "Unknown Donor";
    }

    return `${donor.firstName} ${
        donor.middleName
            ? donor.middleName + " "
            : ""
    }${donor.lastName}`;
}


// --- LOCATION DROPDOWNS ---
function initLocationDropdowns() {

    const region =
        document.getElementById(
            "region"
        );

    const city =
        document.getElementById(
            "city"
        );

    const barangay =
        document.getElementById(
            "barangay"
        );

    if (
        !region ||
        !city ||
        !barangay
    ) {
        return;
    }

    const mindanaoCities = [

        "Butuan City",
        "Cabadbaran City",
        "Bayugan City",
        "Bislig City",
        "Surigao City",
        "Tandag City",

        "Davao City",
        "Digos City",
        "Mati City",
        "Panabo City",
        "Tagum City",

        "General Santos City",
        "Kidapawan City",
        "Koronadal City",
        "Tacurong City",
        "Cotabato City",

        "Cagayan de Oro City",
        "El Salvador City",
        "Gingoog City",
        "Iligan City",
        "Malaybalay City",
        "Oroquieta City",
        "Ozamiz City",
        "Tangub City",
        "Valencia City",

        "Dapitan City",
        "Dipolog City",
        "Isabela City",
        "Lamitan City",
        "Marawi City"
    ];

    const gensanBarangays =
        db.barangays.map(
            item => ({
                id: item.id,
                name: item.name
            })
        );


    function fillCities() {

        city.innerHTML =
            '<option value="">Select City</option>';

        mindanaoCities.forEach(
            name => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    name;

                option.textContent =
                    name;

                city.appendChild(
                    option
                );
            }
        );

        city.disabled =
            false;

        barangay.innerHTML =
            '<option value="">Select Barangay</option>';

        barangay.disabled =
            true;
    }


    function fillBarangays() {

        barangay.innerHTML =
            '<option value="">Select Barangay</option>';

        if (
            city.value !==
            "General Santos City"
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = "";

            option.textContent =
                "Select General Santos City first";

            barangay.appendChild(
                option
            );

            barangay.disabled =
                true;

            return;
        }


        gensanBarangays.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.name;

                option.textContent =
                    item.name;

                barangay.appendChild(
                    option
                );
            }
        );

        barangay.disabled =
            false;
    }


    region.addEventListener(
        "change",
        fillCities
    );

    city.addEventListener(
        "change",
        fillBarangays
    );


    region.value = "";

    city.innerHTML =
        '<option value="">Select City</option>';

    city.disabled =
        true;

    barangay.innerHTML =
        '<option value="">Select Barangay</option>';

    barangay.disabled =
        true;
}


// --- NAVIGATION & MODALS ---
function initNavigationAndModals() {
    const loginForm = document.getElementById("initialLoginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!validateForm(loginForm)) {
                return;
            }

            const username = document
                .getElementById("initialLoginUsername")
                .value
                .trim();

            const password = document
                .getElementById("initialLoginPassword")
                .value;

            fetch("login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            })
            .then(res => res.json())
            .then(result => {

                console.log("LOGIN RESPONSE:", result);

                if (result.success) {

                    db.currentUser = {
                        id: result.id,
                        username: result.username,
                        roleId: Number(result.roleId),
                        roleName: result.roleName,
                        status: "Active"
                    };

                    loginUserSuccess();

                } else {

                    alert("Login failed: " + result.message);
                }
            })
            .catch(err => {

                console.error("LOGIN ERROR:", err);

                alert(
                    "Something went wrong reaching the server: " +
                    err.message
                );
            });
        });
    }
/* [FIXED - DISABLED] Stray duplicate of the login .then/.catch chain (it was outside any fetch() call and caused "Unexpected token '.'", which stopped the whole script from loading). The working chain is above.
    .then(res => res.json())
    .then(result => {

        if (result.success) {

            db.currentUser = {
                id: result.id,
                username: result.username,
                roleId: Number(result.roleId),
                roleName: result.roleName,
                status: "Active"
            };

            loginUserSuccess();

        } else {

            alert(
                "Login failed: " +
                (result.message || "Invalid username or password.")
            );
        }
    })
    .catch(err => {

        console.error("Login error:", err);

        alert(
            "Something went wrong reaching the server: " +
            err.message
        );
    });
});
*/

    document
        .querySelectorAll(
            ".close-btn"
        )
        .forEach(
            btn => {

                btn.addEventListener(
                    "click",
                    () => {

                        const modalId =
                            btn.getAttribute(
                                "data-close"
                            );

                        if (
                            modalId
                        ) {
                            closeModal(
                                modalId
                            );
                        }
                    }
                );
            }
        );


    /*
     * REGISTER DONOR BUTTON
     *
     * This is the actual button used
     * in the current CHO/BHW interface:
     * btnBhwRegisterDonor
     */
   document
    .getElementById("btnBhwRegisterDonor")
    ?.addEventListener("click", function (event) {

        event.preventDefault();

        const roleId = Number(
            db.currentUser
                ? db.currentUser.roleId
                : 0
        );

        if (
            roleId !== 1 &&
            roleId !== 3
        ) {
            alert(
                "Only the City Health Office Admin and Barangay Health Worker can register blood donors."
            );
            return;
        }

        const form =
            document.getElementById(
                "registerForm"
            );

        if (form) {
            form.reset();
        }

        const accountRole =
            document.getElementById(
                "accountRole"
            );

        if (accountRole) {
            accountRole.value =
                "Volunteer Blood Donor";
        }

        openModal("registerModal");
    });

} // [FIXED - ADDED] closes initNavigationAndModals() (the closing brace was missing, so every function below was swallowed inside it)

// [FIXED - ADDED] openModal() was called all over the script but was never defined
function openModal(modalId) {

    const modal =
        document.getElementById(
            modalId
        );

    if (modal) {

        modal.style.display =
            "block";
    }
}


function closeModal(modalId) {

    const modal =
        document.getElementById(
            modalId
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}


// --- LOGIN & ROLE DASHBOARD SETUP ---
function loginUserSuccess() {

    document
        .getElementById(
            "loginViewSection"
        )
        .style.display =
        "none";


    document
        .getElementById(
            "mainDashboardView"
        )
        .style.display =
        "block";


    const user = db.currentUser;

if (user) {
    user.roleId = Number(user.roleId);
}


    document
        .getElementById(
            "roleBadge"
        )
        .textContent =
        user.roleName;


    document
        .getElementById(
            "welcomeUserMsg"
        )
        .textContent =
        `Maligayang pagbabalik, ${user.username}!`;


    buildSidebarMenu(
        user.roleId
    );


    switchModuleView(
        "viewHome"
    );


    refreshAllTables();

    renderHomeDashboardForUser();
}
// --- SIDEBAR MODULES ---
function buildSidebarMenu(roleId) {

    const sidebar =
        document.getElementById(
            "sidebarMenu"
        );

    if (!sidebar) {
        return;
    }

    sidebar.innerHTML = "";

    const menuItems = [

        // =========================================
        // COMMON MODULE
        // =========================================
        {
            id: "viewHome",
            label: "Dashboard Home",
            roles: [1, 2, 3, 4],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M3 11.5 12 4l9 7.5M5.5 10v9A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-9"/>
                </svg>
            `
        },


        // =========================================
        // CHO ADMIN
        // =========================================
        {
            id: "viewDonors",
            label: "Donor Records",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M8 2.5h8a1 1 0 0 1 1 1V5H7V3.5a1.5 1.5 0 0 1 1-1Z"/>
                    <rect
                        x="5"
                        y="5"
                        width="14"
                        height="16.5"
                        rx="2"
                    />
                    <path d="M9 11h6M9 14.5h6M9 18h4"/>
                </svg>
            `
        },

        {
            id: "viewRequests",
            label: "Emergency Requests",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 3.5 2 20.5h20L12 3.5Z"/>
                    <path d="M12 10v4.2M12 17.2h.01"/>
                </svg>
            `
        },

        {
            id: "viewMatchedDonors",
            label: "Matched Donors Engine",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="5"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="1"
                    />
                </svg>
            `
        },

        {
            id: "viewDrives",
            label: "Blood Drives",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <rect
                        x="4"
                        y="5"
                        width="16"
                        height="16"
                        rx="2"
                    />
                    <path d="M4 9.5h16M8 3v3.5M16 3v3.5"/>
                </svg>
            `
        },

        {
            id: "viewUsers",
            label: "Manage User Accounts",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <circle
                        cx="9"
                        cy="8"
                        r="3.2"
                    />
                    <path d="M3.5 20c.7-3.4 3-5.3 5.5-5.3s4.8 1.9 5.5 5.3"/>
                    <circle
                        cx="17"
                        cy="8.5"
                        r="2.6"
                    />
                    <path d="M15.5 14.9c2.2.3 3.9 2.1 4.5 5.1"/>
                </svg>
            `
        },

        {
            id: "viewReports",
            label: "Reports Generation",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M4 20V10M10 20V4M16 20v-7M20 20H4"/>
                </svg>
            `
        },

        {
            id: "viewManageNotifications",
            label: "Manage Notifications",
            roles: [1],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M18 8a6 6 0 0 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7"/>
                    <path d="M10.5 19a1.7 1.7 0 0 0 3 0"/>
                </svg>
            `
        },


        // =========================================
        // HOSPITAL STAFF
        // =========================================
        {
            id: "viewRequests",
            label: "Emergency Request",
            roles: [2],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 3.5 2 20.5h20L12 3.5Z"/>
                    <path d="M12 10v4.2M12 17.2h.01"/>
                </svg>
            `
        },

        {
            id: "viewMatchedDonors",
            label: "Matched Qualified Donors",
            roles: [2],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="5"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="1"
                    />
                </svg>
            `
        },


        // =========================================
        // BARANGAY HEALTH WORKER
        // =========================================
        {
            id: "viewDonors",
            label: "Donor Status",
            roles: [3],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M8 2.5h8a1 1 0 0 1 1 1V5H7V3.5a1.5 1.5 0 0 1 1-1Z"/>
                    <rect
                        x="5"
                        y="5"
                        width="14"
                        height="16.5"
                        rx="2"
                    />
                    <path d="M9 11h6M9 14.5h6M9 18h4"/>
                </svg>
            `
        },

        {
            id: "viewMatchedDonors",
            label: "View Qualified Donor List",
            roles: [3],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="5"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="1"
                    />
                </svg>
            `
        },

        {
            id: "viewDrives",
            label: "Blood Drive Schedule",
            roles: [3],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <rect
                        x="4"
                        y="5"
                        width="16"
                        height="16"
                        rx="2"
                    />
                    <path d="M4 9.5h16M8 3v3.5M16 3v3.5"/>
                </svg>
            `
        },


        // =========================================
        // VOLUNTEER BLOOD DONOR
        // =========================================
        {
            id: "viewDrives",
            label: "Blood Drive Schedule",
            roles: [4],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <rect
                        x="4"
                        y="5"
                        width="16"
                        height="16"
                        rx="2"
                    />
                    <path d="M4 9.5h16M8 3v3.5M16 3v3.5"/>
                </svg>
            `
        },

        {
            id: "viewMyProfile",
            label: "My Donor Portal",
            roles: [4],

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <circle
                        cx="12"
                        cy="8"
                        r="4"
                    />
                    <path d="M4.5 20c1-4.2 3.8-6.5 7.5-6.5s6.5 2.3 7.5 6.5"/>
                </svg>
            `
        },

        {
            id: "viewSettings",
            label: "Settings",
            // roles: [4], // [FIXED - DISABLED] settings were donor-only
            roles: [1, 2, 3, 4], // [FIXED] Settings now available to CHO Admin, Hospital Staff, BHW and Donor

            icon: `
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/>
                    <path d="m19 13.5 1.2.9-1.8 3.1-1.5-.6a7.7 7.7 0 0 1-1.7 1l-.3 1.6h-3.6L11 17.9a7.7 7.7 0 0 1-1.7-1l-1.5.6L6 14.4l1.2-.9a7.8 7.8 0 0 1 0-2L6 10.6l1.8-3.1 1.5.6a7.7 7.7 0 0 1 1.7-1l.3-1.6h3.6l.3 1.6a7.7 7.7 0 0 1 1.7 1l1.5-.6 1.8 3.1-1.2.9a7.8 7.8 0 0 1 0 2Z"/>
                </svg>
            `
        }
    ];


    menuItems.forEach(
        item => {

            if (
                !item.roles.includes(
                    roleId
                )
            ) {
                return;
            }


            const li =
                document.createElement(
                    "li"
                );


            li.innerHTML = `
                <a
                    href="#"
                    onclick="
                        switchModuleView('${item.id}');
                        return false;
                    "
                >
                    ${item.icon}
                    <span>
                        ${item.label}
                    </span>
                </a>
            `;


            sidebar.appendChild(
                li
            );
        }
    );
}


function switchModuleView(viewId) {

    const roleId = Number(
        db.currentUser
            ? db.currentUser.roleId
            : 0
    );

    const allowedModules = {

        1: [
            "viewHome",
            "viewDonors",
            "viewRequests",
            "viewMatchedDonors",
            "viewDrives",
            "viewUsers",
            "viewReports",
            "viewManageNotifications",
            "viewSettings" // [FIXED - ADDED] Settings for CHO Admin
        ],

        2: [
            "viewHome",
            "viewRequests",
            "viewMatchedDonors",
            "viewSettings" // [FIXED - ADDED] Settings for Hospital Staff
        ],

        3: [
            "viewHome",
            "viewDonors",
            "viewMatchedDonors",
            "viewDrives",
            "viewSettings" // [FIXED - ADDED] Settings for Brgy Health Worker
        ],

        4: [
            "viewHome",
            "viewDrives",
            "viewMyProfile",
            "viewSettings"
        ]
    };

    if (
        !allowedModules[roleId] ||
        !allowedModules[roleId].includes(viewId)
    ) {
        return;
    }

    document
        .querySelectorAll(".module-view")
        .forEach(element => {
            element.style.display = "none";
        });

    const target =
        document.getElementById(viewId);

    if (target) {
        target.style.display = "block";
    }

    const registerButton =
        document.getElementById(
            "btnBhwRegisterDonor"
        );

    if (registerButton) {

        registerButton.style.display =
            (
                roleId === 1 ||
                roleId === 3
            )
                ? "inline-flex"
                : "none";
    }

    const requestButton =
        document.getElementById(
            "btnReqModuleAdd"
        );

    if (requestButton) {

        requestButton.style.display =
            (
                roleId === 1 ||
                roleId === 2
            )
                ? "inline-flex"
                : "none";
    }

    const driveButton =
        document.getElementById(
            "btnDriveModuleAdd"
        );

    if (driveButton) {

        driveButton.style.display =
            (
                roleId === 1 ||
                roleId === 3
            )
                ? "inline-flex"
                : "none";
    }

    if (viewId === "viewHome") {
        renderHomeDashboardForUser();
    }

    if (viewId === "viewMyProfile") {
        renderDonorPortal();
    }

    if (viewId === "viewSettings") {
        renderVolunteerSettings();
    }

    if (viewId === "viewManageNotifications") {
        renderAdminNotifications();
    }

    updateModuleHeadingsForRole(roleId);
}


// --- UPDATE MODULE HEADINGS ---
function updateModuleHeadingsForRole(
    roleId
) {

    const donorHeading =
        document.querySelector(
            "#viewDonors h2"
        );

    const matchedHeading =
        document.querySelector(
            "#viewMatchedDonors h2"
        );

    const driveHeading =
        document.querySelector(
            "#viewDrives h2"
        );

    const requestHeading =
        document.querySelector(
            "#viewRequests h2"
        );


    if (
        donorHeading
    ) {

        const textNode =
            Array.from(
                donorHeading.childNodes
            ).find(
                node =>
                    node.nodeType ===
                    Node.TEXT_NODE
            );

        if (textNode) {

            textNode.textContent =
                roleId === 3
                    ? "Donor Status"
                    : "Donor Records & Verification Status";
        }
    }


    if (
        matchedHeading
    ) {

        const textNode =
            Array.from(
                matchedHeading.childNodes
            ).find(
                node =>
                    node.nodeType ===
                    Node.TEXT_NODE
            );

        if (textNode) {

            textNode.textContent =
                (
                    roleId === 2 ||
                    roleId === 3
                )
                    ? "Qualified Donors"
                    : "Qualified Matched Donors Engine";
        }
    }


    if (
        driveHeading
    ) {

        const textNode =
            Array.from(
                driveHeading.childNodes
            ).find(
                node =>
                    node.nodeType ===
                    Node.TEXT_NODE
            );

        if (textNode) {

            textNode.textContent =
                (
                    roleId === 3 ||
                    roleId === 4
                )
                    ? "Blood Drive Schedule"
                    : "Community Blood Drives";
        }
    }


    if (
        requestHeading &&
        roleId === 2
    ) {

        const textNode =
            Array.from(
                requestHeading.childNodes
            ).find(
                node =>
                    node.nodeType ===
                    Node.TEXT_NODE
            );

        if (textNode) {

            textNode.textContent =
                "Emergency Request";
        }
    }
}


// --- DONOR REGISTRATION ACCESS ---
function openDonorRegistrationForStaff() {

    const roleId =
        db.currentUser
            ? db.currentUser.roleId
            : 0;


    if (
        roleId !== 1 &&
        roleId !== 3
    ) {

        alert(
            "Only the City Health Office Admin and Barangay Health Worker can register blood donors."
        );

        return;
    }


    const form =
        document.getElementById(
            "registerForm"
        );


    if (form) {

        form.reset();


        const accountRole =
            document.getElementById(
                "accountRole"
            );


        if (
            accountRole
        ) {

            accountRole.value =
                "Volunteer Blood Donor";
        }


        document
            .querySelectorAll(
                "#registerForm .input-invalid, #registerForm .input-valid"
            )
            .forEach(
                field => {

                    field.classList.remove(
                        "input-invalid",
                        "input-valid"
                    );
                }
            );


        document
            .querySelectorAll(
                "#registerForm .validation-message"
            )
            .forEach(
                message => {

                    message.textContent =
                        "";

                    message.classList.remove(
                        "show"
                    );
                }
            );
    }


    openModal(
        "registerModal"
    );
}


// --- HOME DASHBOARD ---
function renderHomeDashboardForUser() {

    const statTotalDonors =
        document.getElementById(
            "statTotalDonors"
        );

    const statActiveRequests =
        document.getElementById(
            "statActiveRequests"
        );

    const statVerifiedDonors =
        document.getElementById(
            "statVerifiedDonors"
        );

    const statUpcomingDrives =
        document.getElementById(
            "statUpcomingDrives"
        );


    if (
        statTotalDonors
    ) {

        statTotalDonors.textContent =
            db.donors.length;
    }


    if (
        statActiveRequests
    ) {

        statActiveRequests.textContent =
            db.requests.filter(
                request =>
                    request.status ===
                    "Pending"
            ).length;
    }


    if (
        statVerifiedDonors
    ) {

        statVerifiedDonors.textContent =
            db.donors.filter(
                donor =>
                    donor.verificationStatus ===
                    "Verified"
            ).length;
    }


    if (
        statUpcomingDrives
    ) {

        statUpcomingDrives.textContent =
            db.drives.length;
    }


    const choDashboard =
        document.getElementById(
            "entityDashChoAdmin"
        );

    const hospitalDashboard =
        document.getElementById(
            "entityDashHospital"
        );

    const bhwDashboard =
        document.getElementById(
            "entityDashBhw"
        );

    const donorDashboard =
        document.getElementById(
            "entityDashDonor"
        );


    if (choDashboard) {
        choDashboard.style.display =
            "none";
    }

    if (hospitalDashboard) {
        hospitalDashboard.style.display =
            "none";
    }

    if (bhwDashboard) {
        bhwDashboard.style.display =
            "none";
    }

    if (donorDashboard) {
        donorDashboard.style.display =
            "none";
    }


    const roleId =
        db.currentUser
            ? db.currentUser.roleId
            : 0;


    // =========================================
    // CHO ADMIN DASHBOARD
    // =========================================
    if (
        roleId === 1 &&
        choDashboard
    ) {

        choDashboard.style.display =
            "block";


        const pendingCount =
            db.donors.filter(
                donor =>
                    donor.verificationStatus ===
                    "Pending"
            ).length;


        const pendingElement =
            document.getElementById(
                "choPendingCount"
            );


        if (
            pendingElement
        ) {

            pendingElement.textContent =
                pendingCount;
        }
    }


    // =========================================
    // HOSPITAL STAFF DASHBOARD
    // =========================================
    else if (
        roleId === 2 &&
        hospitalDashboard
    ) {

        hospitalDashboard.style.display =
            "block";


        const activeContainer =
            document.getElementById(
                "hospitalActiveRequestsSummary"
            );


        if (
            activeContainer
        ) {

            const pendingRequests =
                db.requests.filter(
                    request =>
                        request.status ===
                        "Pending"
                );


            if (
                pendingRequests.length ===
                0
            ) {

                activeContainer.innerHTML = `
                    <p
                        style="
                            color:var(--ink-faint);
                            font-size:0.85rem;
                        "
                    >
                        Walang active emergency request sa kasalukuyan.
                    </p>
                `;

            } else {

                let html =
                    `<ul style="list-style:none;">`;


                pendingRequests.forEach(
                    request => {

                        html += `
                            <li
                                style="
                                    padding:8px 0;
                                    border-bottom:1px solid var(--border-color);
                                    font-size:0.88rem;
                                "
                            >
                                <strong>
                                    ${request.patientName}
                                </strong>

                                &middot;

                                Need:

                                <span class="badge badge-blood">
                                    ${getBloodTypeName(
                                        request.bloodTypeId
                                    )}
                                </span>

                                (${request.quantity} bags)
                            </li>
                        `;
                    }
                );


                html +=
                    `</ul>`;


                activeContainer.innerHTML =
                    html;
            }
        }
    }


    // =========================================
    // BHW DASHBOARD
    // =========================================
    else if (
        roleId === 3 &&
        bhwDashboard
    ) {

        bhwDashboard.style.display =
            "block";
    }


    // =========================================
    // VOLUNTEER DONOR DASHBOARD
    // =========================================
    else if (
        roleId === 4 &&
        donorDashboard
    ) {

        donorDashboard.style.display =
            "block";


        const donor =
            db.donors.find(
                item =>
                    item.userId ===
                    db.currentUser.id
            ) ||
            db.donors[0];


        if (!donor) {
            return;
        }


        const bloodBadge =
            document.getElementById(
                "donorPortalBloodTypeBadge"
            );

        if (
            bloodBadge
        ) {

            bloodBadge.textContent =
                getBloodTypeName(
                    donor.bloodTypeId
                );
        }


        const donorName =
            document.getElementById(
                "donorPortalName"
            );

        if (
            donorName
        ) {

            donorName.textContent =
                getDonorName(
                    donor
                );
        }


        const donorLocation =
            document.getElementById(
                "donorPortalLocation"
            );

        if (
            donorLocation
        ) {

            donorLocation.textContent =
                `Barangay ${getBarangayName(
                    donor.barangayId
                )}, General Santos City`;
        }


        const donorVerification =
            document.getElementById(
                "donorPortalVerification"
            );

        if (
            donorVerification
        ) {

            donorVerification.textContent =
                donor.verificationStatus;
        }
    }
}
// --- RENDER TABLES & DATA ---
function refreshAllTables() {

    renderDonorTable();

    renderRequestTable();

    renderDriveTable();

    renderUserAccountTable();

    renderPendingDonations();
}


// --- DONOR TABLE ---
function renderDonorTable() {

    const tbody =
        document.getElementById(
            "donorTableBody"
        );

    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    db.donors.forEach(
        donor => {

            const tr =
                document.createElement(
                    "tr"
                );


            let actionBtn = "";


            if (
                db.currentUser &&
                (
                    db.currentUser.roleId === 1 ||
                    db.currentUser.roleId === 3
                )
            ) {

                if (
                    donor.verificationStatus ===
                    "Pending"
                ) {

                    actionBtn = `
                        <button
                            class="btn-sm btn-success"
                            onclick="verifyDonor(${donor.id})"
                        >
                            Verify
                        </button>
                    `;

                } else {

                    actionBtn = `
                        <button
                            class="btn-sm btn-secondary"
                            onclick="toggleDonorAvailability(${donor.id})"
                        >
                            Toggle Status
                        </button>
                    `;
                }
            }


            tr.innerHTML = `
                <td>
                    #${donor.id}
                </td>

                <td>
                    ${donor.firstName}
                </td>

                <td>
                    ${donor.lastName}
                </td>

                <td>
                    ${donor.sex}
                </td>

                <td>
                    ${donor.phone}
                </td>

                <td>
                    ${donor.email}
                </td>

                <td>
                    ${getBarangayName(
                        donor.barangayId
                    )}
                </td>

                <td>
                    <span class="badge badge-blood">
                        ${getBloodTypeName(
                            donor.bloodTypeId
                        )}
                    </span>
                </td>

                <td>
                    <span
                        class="badge ${
                            donor.verificationStatus ===
                            "Verified"
                                ? "badge-success"
                                : "badge-warning"
                        }"
                    >
                        ${donor.verificationStatus}
                    </span>
                </td>

                <td>
                    <span
                        class="badge ${
                            donor.availability ===
                            "Available"
                                ? "badge-info"
                                : "badge-danger"
                        }"
                    >
                        ${donor.availability}
                    </span>
                </td>

                <td>
                    ${actionBtn}
                </td>
            `;


            tbody.appendChild(
                tr
            );
        }
    );
}


// --- EMERGENCY REQUEST TABLE ---
function renderRequestTable() {

    const tbody =
        document.getElementById(
            "requestTableBody"
        );

    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    db.requests.forEach(
        request => {

            const tr =
                document.createElement(
                    "tr"
                );


            let actionBtn = "";


            if (
                db.currentUser &&
                (
                    db.currentUser.roleId === 1 ||
                    db.currentUser.roleId === 2
                )
            ) {

                actionBtn = `
                    <button
                        class="btn-sm btn-primary"
                        onclick="openMatchEngineForRequest(${request.id})"
                    >
                        Find Matches
                    </button>
                `;
            }


            tr.innerHTML = `
                <td>
                    #${request.id}
                </td>

                <td>
                    ${request.patientName}
                </td>

                <td>
                    ${request.hospitalName}
                </td>

                <td>
                    <span class="badge badge-blood">
                        ${getBloodTypeName(
                            request.bloodTypeId
                        )}
                    </span>
                </td>

                <td>
                    ${getBarangayName(
                        request.barangayId
                    )}
                </td>

                <td>
                    ${request.quantity} bag(s)
                </td>

                <td>
                    ${request.requestDate}
                </td>

                <td>
                    <span
                        class="badge ${
                            request.status ===
                            "Fulfilled"
                                ? "badge-success"
                                : "badge-warning"
                        }"
                    >
                        ${request.status}
                    </span>
                </td>

                <td>
                    ${actionBtn}
                </td>
            `;


            tbody.appendChild(
                tr
            );
        }
    );
}


// --- PENDING DONATIONS ---
function renderPendingDonations() {

    const card =
        document.getElementById(
            "donationConfirmCard"
        );

    const tbody =
        document.getElementById(
            "pendingDonationsBody"
        );


    if (
        !card ||
        !tbody
    ) {
        return;
    }


    if (
        db.currentUser &&
        (
            db.currentUser.roleId === 1 ||
            db.currentUser.roleId === 2
        )
    ) {

        card.style.display =
            "block";

        tbody.innerHTML = "";


        db.donations.forEach(
            donation => {

                const donor =
                    db.donors.find(
                        item =>
                            item.id ===
                            donation.donorId
                    );


                const tr =
                    document.createElement(
                        "tr"
                    );


                let actionBtn = "";


                if (
                    donation.status ===
                    "Awaiting Confirmation"
                ) {

                    actionBtn = `
                        <button
                            class="btn-sm btn-success"
                            onclick="confirmDonation(${donation.id})"
                        >
                            Confirm Donation
                        </button>
                    `;

                } else {

                    actionBtn = `
                        <span class="badge badge-success">
                            Completed
                        </span>
                    `;
                }


                tr.innerHTML = `
                    <td>
                        #${donation.id}
                    </td>

                    <td>
                        ${getDonorName(
                            donor
                        )}
                    </td>

                    <td>
                        <span class="badge badge-blood">
                            ${getBloodTypeName(
                                donation.bloodTypeId
                            )}
                        </span>
                    </td>

                    <td>
                        #${donation.requestId}
                    </td>

                    <td>
                        ${donation.date}
                    </td>

                    <td>
                        <span class="badge badge-warning">
                            ${donation.status}
                        </span>
                    </td>

                    <td>
                        ${actionBtn}
                    </td>
                `;


                tbody.appendChild(
                    tr
                );
            }
        );

    } else {

        card.style.display =
            "none";
    }
}


// --- BLOOD DRIVE TABLE ---
function renderDriveTable() {

    const tbody =
        document.getElementById(
            "driveTableBody"
        );

    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    db.drives.forEach(
        drive => {

            const tr =
                document.createElement(
                    "tr"
                );


            let actionBtn = "";


            if (
                db.currentUser &&
                (
                    db.currentUser.roleId === 1 ||
                    db.currentUser.roleId === 3
                )
            ) {

                actionBtn = `
                    <button
                        class="btn-sm btn-secondary"
                        onclick="openEditDriveModal(${drive.id})"
                    >
                        Edit
                    </button>
                `;
            }


            tr.innerHTML = `
                <td>
                    #${drive.id}
                </td>

                <td>
                    <strong>
                        ${drive.eventName}
                    </strong>
                </td>

                <td>
                    ${drive.venue}
                </td>

                <td>
                    ${drive.scheduleDate}
                </td>

                <td>
                    ${getBarangayName(
                        drive.barangayId
                    )}
                </td>

                <td>
                    <span
                        class="badge ${
                            drive.status ===
                            "Scheduled"
                                ? "badge-success"
                                : "badge-warning"
                        }"
                    >
                        ${drive.status}
                    </span>
                </td>

                <td>
                    ${actionBtn}
                </td>
            `;


            tbody.appendChild(
                tr
            );
        }
    );
}


// --- USER ACCOUNT TABLE ---
function renderUserAccountTable() {

    const tbody =
        document.getElementById(
            "userAccountTableBody"
        );

    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    db.users.forEach(
        user => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `
                <td>
                    #${user.id}
                </td>

                <td>
                    ${user.username}
                </td>

                <td>
                    ${user.roleName}
                </td>

                <td>
                    <span class="badge badge-success">
                        ${user.status}
                    </span>
                </td>

                <td>
                    <button
                        class="btn-sm btn-secondary"
                        onclick="openEditUserModal(${user.id})"
                    >
                        Edit
                    </button>
                </td>
            `;


            tbody.appendChild(
                tr
            );
        }
    );
}


// =====================================================
// MATCHED QUALIFIED DONORS
// =====================================================

function openMatchEngineForRequest(
    requestId
) {

    const module =
        document.getElementById(
            "viewMatchedDonors"
        );


    if (!module) {
        return;
    }


    module.dataset.activeRequestId =
        requestId;


    switchModuleView(
        "viewMatchedDonors"
    );


    renderMatchedDonors(
        parseInt(requestId)
    );
}


function renderMatchedDonors(
    requestId
) {

    const request =
        db.requests.find(
            item =>
                item.id ===
                parseInt(requestId)
        );


    const tbody =
        document.getElementById(
            "matchedDonorTableBody"
        );


    const filter =
        document.getElementById(
            "filterSameBarangay"
        );


    const tag =
        document.getElementById(
            "matchedFilterTag"
        );


    if (
        !request ||
        !tbody
    ) {
        return;
    }


    const sameBarangay =
        filter
            ? filter.checked
            : false;


    if (tag) {

        tag.textContent =
            `Matching Donors for Request #${request.id} (${request.patientName} - Need: ${getBloodTypeName(
                request.bloodTypeId
            )} in ${getBarangayName(
                request.barangayId
            )})`;
    }


    let matchedDonors =
        db.donors.filter(
            donor =>
                donor.bloodTypeId ===
                    request.bloodTypeId &&

                donor.verificationStatus ===
                    "Verified" &&

                donor.availability ===
                    "Available"
        );


    if (
        sameBarangay
    ) {

        matchedDonors =
            matchedDonors.filter(
                donor =>
                    donor.barangayId ===
                    request.barangayId
            );
    }


    tbody.innerHTML = "";


    if (
        matchedDonors.length ===
        0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="
                        text-align:center;
                        color:var(--ink-faint);
                    "
                >
                    Walang nahanap na kwalipikadong donor na tugma sa pamantayan.
                </td>
            </tr>
        `;

        return;
    }


    matchedDonors.forEach(
        donor => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `
                <td>
                    #${donor.id}
                </td>

                <td>
                    ${getDonorName(
                        donor
                    )}
                </td>

                <td>
                    ${donor.sex}
                </td>

                <td>
                    <span class="badge badge-blood">
                        ${getBloodTypeName(
                            donor.bloodTypeId
                        )}
                    </span>
                </td>

                <td>
                    ${donor.address},
                    Brgy.
                    ${getBarangayName(
                        donor.barangayId
                    )}
                </td>

                <td>
                    ${donor.phone}
                </td>

                <td>
                    <span class="badge badge-success">
                        ${donor.availability}
                    </span>
                </td>

                <td>
                    <button
                        class="btn-sm btn-alert"
                        onclick="notifyDonorForEmergency(${donor.id}, ${request.id})"
                    >
                        Alert Donor
                    </button>
                </td>
            `;


            tbody.appendChild(
                tr
            );
        }
    );
}


function notifyDonorForEmergency(
    donorId,
    requestId
) {

    alert(
        `Emergency alert sent successfully to Donor #${donorId} for Request #${requestId}!`
    );
}


// =====================================================
// DONOR ACTIONS
// =====================================================

function verifyDonor(
    donorId
) {

    const donor =
        db.donors.find(
            item =>
                item.id ===
                donorId
        );


    if (!donor) {
        return;
    }


    donor.verificationStatus =
        "Verified";


    alert(
        `Donor ${getDonorName(
            donor
        )} is now VERIFIED.`
    );


    refreshAllTables();

    renderHomeDashboardForUser();
}


function toggleDonorAvailability(
    donorId
) {

    const donor =
        db.donors.find(
            item =>
                item.id ===
                donorId
        );


    if (!donor) {
        return;
    }


    donor.availability =
        donor.availability ===
            "Available"
            ? "Unavailable"
            : "Available";


    refreshAllTables();
}


function confirmDonation(
    donationId
) {

    const donation =
        db.donations.find(
            item =>
                item.id ===
                donationId
        );


    if (!donation) {
        return;
    }


    donation.status =
        "Confirmed";


    const request =
        db.requests.find(
            item =>
                item.id ===
                donation.requestId
        );


    if (request) {

        request.status =
            "Fulfilled";
    }


    alert(
        "Donation confirmed successfully!"
    );


    refreshAllTables();

    renderHomeDashboardForUser();
}


// =====================================================
// VOLUNTEER DONOR PORTAL
// =====================================================

function renderDonorPortal() {

    const profile =
        document.getElementById(
            "myProfileContent"
        );


    const notifications =
        document.getElementById(
            "donorNotificationsContainer"
        );


    if (
        !db.currentUser
    ) {
        return;
    }


    const currentDonor =
        db.donors.find(
            donor =>
                donor.userId ===
                db.currentUser.id
        ) ||
        db.donors[0];


    if (!currentDonor) {
        return;
    }


    if (profile) {

        profile.innerHTML = `
            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(220px, 1fr)
                        );
                    gap:15px;
                "
            >

                <div>
                    <strong>
                        Full Name:
                    </strong>

                    ${getDonorName(
                        currentDonor
                    )}
                </div>


                <div>
                    <strong>
                        Sex:
                    </strong>

                    ${currentDonor.sex}
                </div>


                <div>
                    <strong>
                        Blood Type:
                    </strong>

                    <span class="badge badge-blood">
                        ${getBloodTypeName(
                            currentDonor.bloodTypeId
                        )}
                    </span>
                </div>


                <div>
                    <strong>
                        Phone:
                    </strong>

                    ${currentDonor.phone}
                </div>


                <div>
                    <strong>
                        Email:
                    </strong>

                    ${currentDonor.email}
                </div>


                <div>
                    <strong>
                        Status:
                    </strong>

                    <span class="badge badge-success">
                        ${currentDonor.verificationStatus}
                    </span>
                </div>


                <div
                    style="
                        grid-column:1 / -1;
                    "
                >
                    <strong>
                        Complete Address:
                    </strong>

                    ${currentDonor.address},
                    Brgy.
                    ${getBarangayName(
                        currentDonor.barangayId
                    )},
                    ${currentDonor.city},
                    ${currentDonor.region}
                </div>

            </div>
        `;
    }


    if (notifications) {

        notifications.innerHTML = `
            <div
                style="
                    background:var(--light-red);
                    border-left:4px solid var(--garnet);
                    padding:14px;
                    margin-bottom:10px;
                    border-radius:8px;
                "
            >

                <strong
                    style="
                        color:var(--garnet);
                    "
                >
                    Emergency Call for Blood Donation!
                </strong>


                <p
                    style="
                        margin:6px 0;
                        font-size:0.9rem;
                    "
                >
                    Patient at General Santos Doctors Hospital needs
                    ${getBloodTypeName(
                        currentDonor.bloodTypeId
                    )}
                    blood.

                    Please confirm if you can donate.
                </p>


                <button
                    class="btn-sm btn-alert"
                    style="margin-top:6px;"
                    onclick="respondToEmergencyCall(${currentDonor.id})"
                >
                    I Can Donate Now
                </button>

            </div>
        `;
    }
}


function respondToEmergencyCall(
    donorId
) {

    const donor =
        db.donors.find(
            item =>
                item.id ===
                donorId
        );


    if (!donor) {
        return;
    }


    db.donations.push({

        id:
            Date.now(),

        donorId:
            donorId,

        requestId:
            501,

        bloodTypeId:
            donor.bloodTypeId,

        date:
            new Date()
                .toISOString()
                .split("T")[0],

        status:
            "Awaiting Confirmation"
    });


    saveRecords(); // [TASK 7 - ADDED] keep the donor's response saved
    alert(
        "Thank you for responding! Hospital staff will confirm your arrival."
    );
}


// =====================================================
// ADMIN NOTIFICATIONS
// =====================================================

function renderAdminNotifications() {

    const container =
        document.getElementById(
            "adminNotificationsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <ul
            style="
                list-style:none;
                padding:0;
            "
        >

            <li
                style="
                    padding:12px;
                    border-bottom:
                        1px solid
                        var(--border-color);
                "
            >

                <strong>
                    New Emergency Request:
                </strong>

                2 bags of O+ blood requested
                by General Santos Doctors Hospital.

            </li>


            <li
                style="
                    padding:12px;
                    border-bottom:
                        1px solid
                        var(--border-color);
                "
            >

                <strong>
                    Pending Verification:
                </strong>

                Donor Maria Clara Santos
                requires verification.

            </li>

        </ul>
    `;
}
// =========================================================
// FORM EVENT BINDINGS
// =========================================================

function bindFormEvents() {

    // =====================================================
    // 1. INLINE EMERGENCY BLOOD REQUEST
    // =====================================================

    document
        .getElementById(
            "inlineRequestForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "inlineRequestForm"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const newRequest = {

                    id:
                        Date.now(),

                    patientName:
                        document
                            .getElementById(
                                "inlineReqPatient"
                            )
                            .value
                            .trim(),

                    hospitalId:
                        2,

                    hospitalName:
                        "General Santos Doctors Hospital",

                    bloodTypeId:
                        parseInt(
                            document
                                .getElementById(
                                    "inlineReqBloodType"
                                )
                                .value
                        ),

                    barangayId:
                        7,

                    quantity:
                        parseInt(
                            document
                                .getElementById(
                                    "inlineReqQty"
                                )
                                .value
                        ),

                    requestDate:
                        document
                            .getElementById(
                                "inlineReqDate"
                            )
                            .value,

                    status:
                        "Pending"
                };


                db.requests.push(
                    newRequest
                );


                form.reset();


                refreshAllTables();

                renderHomeDashboardForUser();


                alert(
                    `Emergency Blood Request #${newRequest.id} added successfully!`
                );
            }
        );


    // =====================================================
    // 2. INLINE BLOOD DRIVE
    // =====================================================

    document
        .getElementById(
            "inlineDriveForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "inlineDriveForm"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const newDrive = {

                    id:
                        Date.now(),

                    eventName:
                        document
                            .getElementById(
                                "inlineDriveEvent"
                            )
                            .value
                            .trim(),

                    venue:
                        document
                            .getElementById(
                                "inlineDriveVenue"
                            )
                            .value
                            .trim(),

                    scheduleDate:
                        document
                            .getElementById(
                                "inlineDriveDate"
                            )
                            .value,

                    barangayId:
                        parseInt(
                            document
                                .getElementById(
                                    "inlineDriveBarangay"
                                )
                                .value
                        ),

                    status:
                        "Scheduled"
                };


                db.drives.push(
                    newDrive
                );


                form.reset();


                refreshAllTables();

                renderHomeDashboardForUser();


                alert(
                    `Blood Drive "${newDrive.eventName}" successfully scheduled!`
                );
            }
        );


    // =====================================================
    // 3. STAFF ACCOUNT REGISTRATION
    // =====================================================
    // Kept optional so it will not break if the old
    // staff-registration interface is not present.
    // =====================================================

    document
        .getElementById(
            "formStaffRegister"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "formStaffRegister"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const roleField =
                    document.getElementById(
                        "staffRegRole"
                    );

                const usernameField =
                    document.getElementById(
                        "staffRegUser"
                    );

                const passwordField =
                    document.getElementById(
                        "staffRegPass"
                    );


                if (
                    !roleField ||
                    !usernameField ||
                    !passwordField
                ) {
                    return;
                }


                const roleId =
                    parseInt(
                        roleField.value
                    );


                const username =
                    usernameField.value.trim();


                const password =
                    passwordField.value.trim();


                if (
                    !roleId ||
                    !username ||
                    !password
                ) {

                    alert(
                        "Please complete the required account information."
                    );

                    return;
                }


                const payload = {

                    roleId:
                        roleId,

                    username:
                        username,

                    password:
                        password
                };


                const getFieldValue =
                    id => {

                        const field =
                            document.getElementById(
                                id
                            );

                        return field
                            ? field.value.trim()
                            : "";
                    };


                payload.choFirName =
                    getFieldValue(
                        "choFirName"
                    );

                payload.choLstName =
                    getFieldValue(
                        "choLstName"
                    );

                payload.hospName =
                    getFieldValue(
                        "hospName"
                    );

                payload.hospCttNumber =
                    getFieldValue(
                        "hospCttNumber"
                    );

                payload.hospAdd =
                    getFieldValue(
                        "hospAdd"
                    );

                payload.bhwFirName =
                    getFieldValue(
                        "bhwFirName"
                    );

                payload.bhwLstName =
                    getFieldValue(
                        "bhwLstName"
                    );

                payload.bhwCttNumber =
                    getFieldValue(
                        "bhwCttNumber"
                    );


                fetch(
                    "register_staff.php",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                )

                .then(
                    response =>
                        response.json()
                )

                .then(
                    result => {

                        if (
                            result.success
                        ) {

                            alert(
                                `Account registration successful! You can now log in using username: ${result.username}`
                            );


                            closeModal(
                                "staffRegisterModal"
                            );


                            form.reset();


                            if (
                                typeof toggleRoleFormFields ===
                                "function"
                            ) {

                                toggleRoleFormFields();
                            }


                            refreshAllTables();

                        } else {

                            alert(
                                "Registration failed: " +
                                result.message
                            );
                        }
                    }
                )

                .catch(
                    error => {

                        alert(
                            "Something went wrong reaching the server: " +
                            error.message
                        );
                    }
                );
            }
        );


    // =====================================================
    // 4. REGISTER BLOOD DONOR
    // =====================================================

    document
        .getElementById(
            "registerForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const roleId =
                    db.currentUser
                        ? db.currentUser.roleId
                        : 0;


                // Only CHO Admin and BHW
                if (
                    roleId !== 1 &&
                    roleId !== 3
                ) {

                    alert(
                        "Only the City Health Office Admin and Barangay Health Worker can register blood donors."
                    );

                    return;
                }


                const form =
                    document.getElementById(
                        "registerForm"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const accountRole =
                    document.getElementById(
                        "accountRole"
                    );


                /*
                 * The form is for DONOR registration.
                 * Even when accountRole is a hidden field,
                 * force it to Volunteer Blood Donor.
                 */
                if (
                    accountRole
                ) {

                    accountRole.value =
                        "Volunteer Blood Donor";
                }


                const firstName =
                    document
                        .getElementById(
                            "firstName"
                        )
                        .value
                        .trim();


                const middleName =
                    document
                        .getElementById(
                            "middleName"
                        )
                        .value
                        .trim();


                const lastName =
                    document
                        .getElementById(
                            "lastName"
                        )
                        .value
                        .trim();


                const sex =
                    document
                        .getElementById(
                            "sex"
                        )
                        .value;


                const birthDate =
                    document
                        .getElementById(
                            "birthDate"
                        )
                        .value;


                const bloodType =
                    document
                        .getElementById(
                            "bloodType"
                        )
                        .value;


                const phone =
                    document
                        .getElementById(
                            "phone"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "email"
                        )
                        .value
                        .trim();


                const address =
                    document
                        .getElementById(
                            "address"
                        )
                        .value
                        .trim();


                const barangay =
                    document
                        .getElementById(
                            "barangay"
                        )
                        .value;


                const city =
                    document
                        .getElementById(
                            "city"
                        )
                        .value;


                const region =
                    document
                        .getElementById(
                            "region"
                        )
                        .value;


                /*
                 * Extra protection:
                 * make sure the account is always
                 * registered as a Volunteer Blood Donor.
                 */
                const payload = {

                    accountRole:
                        "Volunteer Blood Donor",

                    firstName:
                        firstName,

                    middleName:
                        middleName,

                    lastName:
                        lastName,

                    sex:
                        sex,

                    birthDate:
                        birthDate,

                    bloodType:
                        bloodType,

                    phone:
                        phone,

                    email:
                        email,

                    address:
                        address,

                    barangay:
                        barangay,

                    city:
                        city,

                    region:
                        region,

                    registrarRoleId:
                        roleId
                };


                fetch(
                    "register_account.php",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                )

                .then(
                    response =>
                        response.json()
                )

                .then(
                    result => {

                        if (
                            result.success
                        ) {

                            alert(
                                `Donor registration successful! Generated Username: ${result.username || "Created by system"}`
                            );


                            closeModal(
                                "registerModal"
                            );


                            form.reset();


                            /*
                             * Restore donor role
                             * after resetting the form.
                             */
                            if (
                                accountRole
                            ) {

                                accountRole.value =
                                    "Volunteer Blood Donor";
                            }


                            addRegisteredDonorToRecords(payload, result); // [TASK 7 - ADDED] new donor appears in the tables immediately and is saved
                            refreshAllTables();

                            renderHomeDashboardForUser();

                        } else {

                            alert(
                                "Registration failed: " +
                                result.message
                            );
                        }
                    }
                )

                .catch(
                    error => {

                        alert(
                            "Something went wrong reaching the server: " +
                            error.message
                        );
                    }
                );
            }
        );


    // =====================================================
    // 5. EMERGENCY REQUEST MODAL
    // =====================================================

    document
        .getElementById(
            "formEmergencyRequest"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "formEmergencyRequest"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const newRequest = {

                    id:
                        Date.now(),

                    patientName:
                        document
                            .getElementById(
                                "reqPatient"
                            )
                            .value
                            .trim(),

                    hospitalId:
                        2,

                    hospitalName:
                        "General Santos Doctors Hospital",

                    bloodTypeId:
                        parseInt(
                            document
                                .getElementById(
                                    "reqBloodType"
                                )
                                .value
                        ),

                    barangayId:
                        7,

                    quantity:
                        parseInt(
                            document
                                .getElementById(
                                    "reqQty"
                                )
                                .value
                        ),

                    requestDate:
                        document
                            .getElementById(
                                "reqDate"
                            )
                            .value,

                    status:
                        "Pending"
                };


                db.requests.push(
                    newRequest
                );


                form.reset();


                closeModal(
                    "requestModal"
                );


                refreshAllTables();

                renderHomeDashboardForUser();


                if (
                    db.currentUser &&
                    (
                        db.currentUser.roleId === 1 ||
                        db.currentUser.roleId === 2
                    )
                ) {

                    openMatchEngineForRequest(
                        newRequest.id
                    );
                }
            }
        );


    // =====================================================
    // 6. BLOOD DRIVE MODAL
    // =====================================================

    document
        .getElementById(
            "formBloodDrive"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "formBloodDrive"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const newDrive = {

                    id:
                        Date.now(),

                    eventName:
                        document
                            .getElementById(
                                "driveEvent"
                            )
                            .value
                            .trim(),

                    venue:
                        document
                            .getElementById(
                                "driveVenue"
                            )
                            .value
                            .trim(),

                    scheduleDate:
                        document
                            .getElementById(
                                "driveDate"
                            )
                            .value,

                    barangayId:
                        parseInt(
                            document
                                .getElementById(
                                    "driveBarangay"
                                )
                                .value
                        ),

                    status:
                        "Scheduled"
                };


                db.drives.push(
                    newDrive
                );


                form.reset();


                closeModal(
                    "driveModal"
                );


                refreshAllTables();

                renderHomeDashboardForUser();


                alert(
                    `Blood Drive "${newDrive.eventName}" successfully scheduled!`
                );
            }
        );


    // =====================================================
    // 7. EDIT USER
    // =====================================================

    document
        .getElementById(
            "formEditUser"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "formEditUser"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const userId =
                    parseInt(
                        document
                            .getElementById(
                                "editUserId"
                            )
                            .value
                    );


                const user =
                    db.users.find(
                        item =>
                            item.id ===
                            userId
                    );


                if (!user) {
                    return;
                }


                user.username =
                    document
                        .getElementById(
                            "editUserUsername"
                        )
                        .value
                        .trim();


                alert(
                    "User account updated successfully!"
                );


                closeModal(
                    "editUserModal"
                );


                refreshAllTables();
            }
        );


    // =====================================================
    // 8. EDIT BLOOD DRIVE
    // =====================================================

    document
        .getElementById(
            "formEditDrive"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "formEditDrive"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                const driveId =
                    parseInt(
                        document
                            .getElementById(
                                "editDriveId"
                            )
                            .value
                    );


                const drive =
                    db.drives.find(
                        item =>
                            item.id ===
                            driveId
                    );


                if (!drive) {
                    return;
                }


                drive.eventName =
                    document
                        .getElementById(
                            "editDriveEvent"
                        )
                        .value
                        .trim();


                drive.venue =
                    document
                        .getElementById(
                            "editDriveVenue"
                        )
                        .value
                        .trim();


                drive.scheduleDate =
                    document
                        .getElementById(
                            "editDriveDate"
                        )
                        .value;


                drive.barangayId =
                    parseInt(
                        document
                            .getElementById(
                                "editDriveBarangay"
                            )
                            .value
                    );


                drive.status =
                    document
                        .getElementById(
                            "editDriveStatus"
                        )
                        .value;


                alert(
                    "Blood drive updated successfully!"
                );


                closeModal(
                    "editDriveModal"
                );


                refreshAllTables();

                renderHomeDashboardForUser();
            }
        );


    // =====================================================
    // 9. EDIT DONOR PROFILE
    // =====================================================

    document
        .getElementById(
            "formEditDonorProfile"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    document.getElementById(
                        "formEditDonorProfile"
                    );


                if (
                    !validateForm(
                        form
                    )
                ) {
                    return;
                }


                if (
                    !db.currentUser
                ) {
                    return;
                }


                const donor =
                    db.donors.find(
                        item =>
                            item.userId ===
                            db.currentUser.id
                    ) ||
                    db.donors[0];


                if (!donor) {
                    return;
                }


                donor.firstName =
                    document
                        .getElementById(
                            "editProfileFirName"
                        )
                        .value
                        .trim();


                donor.middleName =
                    document
                        .getElementById(
                            "editProfileMidName"
                        )
                        .value
                        .trim();


                donor.lastName =
                    document
                        .getElementById(
                            "editProfileLstName"
                        )
                        .value
                        .trim();


                donor.phone =
                    document
                        .getElementById(
                            "editProfilePhone"
                        )
                        .value
                        .trim();


                donor.email =
                    document
                        .getElementById(
                            "editProfileEmail"
                        )
                        .value
                        .trim();


                donor.address =
                    document
                        .getElementById(
                            "editProfileAdd"
                        )
                        .value
                        .trim();


                donor.barangayId =
                    parseInt(
                        document
                            .getElementById(
                                "editProfileBarangay"
                            )
                            .value
                    );


                donor.city =
                    document
                        .getElementById(
                            "editProfileCity"
                        )
                        .value
                        .trim();


                donor.region =
                    document
                        .getElementById(
                            "editProfileRegion"
                        )
                        .value
                        .trim();


                alert(
                    "Profile updated successfully!"
                );


                closeModal(
                    "editDonorProfileModal"
                );


                renderDonorPortal();

                refreshAllTables();
            }
        );
}


// =========================================================
// LOCATION DATA
// =========================================================

const PH_REGION_OPTIONS = [

    {
        value:
            "National Capital Region (NCR)",

        text:
            "National Capital Region (NCR)"
    },

    {
        value:
            "Cordillera Administrative Region (CAR)",

        text:
            "Cordillera Administrative Region (CAR)"
    },

    {
        value:
            "Region I - Ilocos Region",

        text:
            "Region I - Ilocos Region"
    },

    {
        value:
            "Region II - Cagayan Valley",

        text:
            "Region II - Cagayan Valley"
    },

    {
        value:
            "Region III - Central Luzon",

        text:
            "Region III - Central Luzon"
    },

    {
        value:
            "Region IV-A - CALABARZON",

        text:
            "Region IV-A - CALABARZON"
    },

    {
        value:
            "MIMAROPA Region",

        text:
            "MIMAROPA Region"
    },

    {
        value:
            "Region V - Bicol Region",

        text:
            "Region V - Bicol Region"
    },

    {
        value:
            "Region VI - Western Visayas",

        text:
            "Region VI - Western Visayas"
    },

    {
        value:
            "Negros Island Region (NIR)",

        text:
            "Negros Island Region (NIR)"
    },

    {
        value:
            "Region VII - Central Visayas",

        text:
            "Region VII - Central Visayas"
    },

    {
        value:
            "Region VIII - Eastern Visayas",

        text:
            "Region VIII - Eastern Visayas"
    },

    {
        value:
            "Region IX - Zamboanga Peninsula",

        text:
            "Region IX - Zamboanga Peninsula"
    },

    {
        value:
            "Region X - Northern Mindanao",

        text:
            "Region X - Northern Mindanao"
    },

    {
        value:
            "Region XI - Davao Region",

        text:
            "Region XI - Davao Region"
    },

    {
        value:
            "Region XII - SOCCSKSARGEN",

        text:
            "Region XII - SOCCSKSARGEN"
    },

    {
        value:
            "Region XIII - Caraga",

        text:
            "Region XIII - Caraga"
    },

    {
        value:
            "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",

        text:
            "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
    }
];


const MINDANAO_CITIES = {

    "Region IX - Zamboanga Peninsula": [

        "Dapitan City",
        "Dipolog City",
        "Pagadian City",
        "Zamboanga City",
        "Isabela City"
    ],


    "Region X - Northern Mindanao": [

        "Cagayan de Oro City",
        "El Salvador City",
        "Gingoog City",
        "Iligan City",
        "Malaybalay City",
        "Oroquieta City",
        "Ozamiz City",
        "Tangub City",
        "Valencia City"
    ],


    "Region XI - Davao Region": [

        "Davao City",
        "Digos City",
        "Mati City",
        "Panabo City",
        "Samal City",
        "Tagum City"
    ],


    "Region XII - SOCCSKSARGEN": [

        "General Santos City",
        "Kidapawan City",
        "Koronadal City",
        "Tacurong City"
    ],


    "Region XIII - Caraga": [

        "Bayugan City",
        "Bislig City",
        "Butuan City",
        "Cabadbaran City",
        "Surigao City",
        "Tandag City"
    ],


    "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": [

        "Cotabato City",
        "Lamitan City",
        "Marawi City"
    ]
};


const GENSAN_BARANGAYS = [

    "Apopong",
    "Baluan",
    "Batomelong",
    "Bula",
    "Buayan",
    "Calumpang",
    "City Heights",
    "Conel",
    "Dadiangas East",
    "Dadiangas North",
    "Dadiangas South",
    "Dadiangas West",
    "Fatima",
    "Katangawan",
    "Labangal",
    "Lagao",
    "Ligaya",
    "Mabuhay",
    "Olympog",
    "San Isidro",
    "San Jose",
    "Siguel",
    "Sinawal",
    "Tambler",
    "Tinagacan",
    "Upper Labay"
];


function populateRegionSelect(
    select
) {

    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Select Region</option>';


    PH_REGION_OPTIONS.forEach(
        region => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                region.value;


            option.textContent =
                region.text;


            select.appendChild(
                option
            );
        }
    );
}


function populateCitySelect(
    regionSelect,
    citySelect
) {

    if (
        !regionSelect ||
        !citySelect
    ) {
        return;
    }


    citySelect.innerHTML =
        '<option value="">Select City</option>';


    citySelect.disabled =
        true;


    const cities =
        MINDANAO_CITIES[
            regionSelect.value
        ] || [];


    cities.forEach(
        city => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                city;


            option.textContent =
                city;


            citySelect.appendChild(
                option
            );
        }
    );


    if (
        cities.length > 0
    ) {

        citySelect.disabled =
            false;
    }
}


function populateGensanBarangays(
    citySelect,
    barangaySelect
) {

    if (
        !citySelect ||
        !barangaySelect
    ) {
        return;
    }


    barangaySelect.innerHTML =
        '<option value="">Select Barangay</option>';


    barangaySelect.disabled =
        true;


    if (
        citySelect.value !==
        "General Santos City"
    ) {

        return;
    }


    GENSAN_BARANGAYS.forEach(
        barangay => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                barangay;


            option.textContent =
                barangay;


            barangaySelect.appendChild(
                option
            );
        }
    );


    barangaySelect.disabled =
        false;
}
// =========================================================
// VALIDATION FUNCTIONS
// =========================================================

function addValidationMessage(field) {

    if (
        !field ||
        !field.parentElement
    ) {
        return null;
    }

    let message =
        field.parentElement.querySelector(
            ".validation-message"
        );

    if (!message) {

        message =
            document.createElement(
                "small"
            );

        message.className =
            "validation-message";

        field.parentElement.appendChild(
            message
        );
    }

    return message;
}


// =========================================================
// SHOW VALIDATION ERROR
// =========================================================

function showValidationError(
    field,
    message
) {

    if (!field) {
        return false;
    }

    field.classList.add(
        "input-invalid"
    );

    field.classList.remove(
        "input-valid"
    );

    const validationMessage =
        addValidationMessage(
            field
        );

    if (validationMessage) {

        validationMessage.textContent =
            message;

        validationMessage.classList.add(
            "show"
        );
    }

    return false;
}


// =========================================================
// CLEAR VALIDATION ERROR
// =========================================================

function clearValidationError(
    field
) {

    if (!field) {
        return;
    }

    field.classList.remove(
        "input-invalid"
    );

    field.classList.remove(
        "input-valid"
    );

    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }
}


// =========================================================
// NAME VALIDATION
// =========================================================

function validateNameField(
    field,
    required = false
) {

    if (!field) {
        return true;
    }


    const value =
        field.value.trim();


    if (value === "") {

        if (required) {

            return showValidationError(
                field,
                "This field is required."
            );
        }

        clearValidationError(
            field
        );

        return true;
    }


    /*
     * Numbers are NOT allowed.
     */
    if (
        /[0-9]/.test(value)
    ) {

        return showValidationError(
            field,
            "Name must contain letters only. Numbers are not allowed."
        );
    }


    /*
     * Allow:
     * letters
     * spaces
     * apostrophe
     * period
     * hyphen
     */
    if (
        !/^[A-Za-zÀ-ÿ .'-]+$/.test(
            value
        )
    ) {

        return showValidationError(
            field,
            "Name must contain letters only."
        );
    }


        /*
     * [FIXED - ADDED] Enforce the minimum length from the HTML minlength attribute
     * (names must have at least 2 characters).
     */
    if (
        field.minLength > 0 &&
        value.length < field.minLength
    ) {
        return showValidationError(
            field,
            `Name must be at least ${field.minLength} characters.`
        );
    }

    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }


    return true;
}


// =========================================================
// PHONE VALIDATION
// =========================================================

function normalizePhilippinePhone(
    field
) {

    if (!field) {
        return;
    }


    let digits =
        field.value.replace(
            /\D/g,
            ""
        );


    /*
     * Remove country code if typed.
     */
    if (
        digits.startsWith(
            "63"
        )
    ) {

        digits =
            digits.substring(
                2
            );
    }


    /*
     * Remove old 0 prefix.
     */
    if (
        digits.startsWith(
            "0"
        )
    ) {

        digits =
            digits.substring(
                1
            );
    }


    /*
     * Maximum 10 digits after +63.
     */
    digits =
        digits.substring(
            0,
            10
        );


    field.value =
        "+63" +
        digits;
}


function validatePhoneField(
    field
) {

    if (!field) {
        return true;
    }


    normalizePhilippinePhone(
        field
    );


    const value =
        field.value.trim();


    if (
        value ===
        "+63"
    ) {

        return showValidationError(
            field,
            "Please enter your Philippine phone number after +63."
        );
    }


    /*
     * Philippine mobile number:
     * +63 + 10 digits
     * Example:
     * +639123456789
     */
    if (
        !/^\+639\d{9}$/.test(
            value
        )
    ) {

        return showValidationError(
            field,
            "Please enter a valid Philippine phone number using +63. Example: +639123456789"
        );
    }


    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }


    return true;
}


// =========================================================
// GMAIL VALIDATION
// =========================================================

function validateGmailField(
    field
) {

    if (!field) {
        return true;
    }


    const value =
        field.value.trim();


    if (
        value === ""
    ) {

        if (
            field.required
        ) {

            return showValidationError(
                field,
                "Gmail address is required."
            );
        }


        clearValidationError(
            field
        );

        return true;
    }


    /*
     * IMPORTANT:
     *
     * The field remains RED while typing:
     *
     * rex
     * rex@
     * rex@gmail
     * rex@gmail.
     *
     * It becomes GREEN only when:
     *
     * rex@gmail.com
     */
    const gmailPattern =
        /^[A-Za-z0-9._%+-]+@gmail\.com$/i;


    if (
        !gmailPattern.test(
            value
        )
    ) {

        return showValidationError(
            field,
            "Please finish typing a valid Gmail address ending with @gmail.com."
        );
    }


    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }


    return true;
}


// =========================================================
// STRONG PASSWORD VALIDATION
// =========================================================

function validateStrongPassword(
    field
) {

    if (!field) {
        return true;
    }


    const value =
        field.value;


    if (
        value === ""
    ) {

        return showValidationError(
            field,
            "Password is required."
        );
    }


    const hasUpper =
        /[A-Z]/.test(
            value
        );

    const hasLower =
        /[a-z]/.test(
            value
        );

    const hasNumber =
        /[0-9]/.test(
            value
        );

    const hasSpecial =
        /[^A-Za-z0-9]/.test(
            value
        );


    if (
        value.length < 8 ||
        !hasUpper ||
        !hasLower ||
        !hasNumber ||
        !hasSpecial
    ) {

        return showValidationError(
            field,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        );
    }


    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }


    return true;
}


// =========================================================
// USERNAME CHECK
// =========================================================

function usernameExists(
    username
) {

    const value =
        username
            .trim()
            .toLowerCase();


    return db.users.some(
        user =>
            String(
                user.username ||
                ""
            )
            .trim()
            .toLowerCase() ===
            value
    );
}


function validateUsernameField(
    field
) {

    if (!field) {
        return true;
    }


    const value =
        field.value.trim();


    if (
        value === ""
    ) {

        if (
            field.required
        ) {

            return showValidationError(
                field,
                "Username is required."
            );
        }

        return true;
    }


    if (
        !/^[A-Za-z0-9._-]{3,30}$/.test(
            value
        )
    ) {

        return showValidationError(
            field,
            "Username must be 3-30 characters and may contain only letters, numbers, dots, underscores, or hyphens."
        );
    }


    /*
     * Do not allow duplicate usernames.
     *
     * During editing, allow the current user's
     * existing username.
     */
    let currentUserId = // [FIXED] was const
        db.currentUser
            ? db.currentUser.id
            : null;

    // [FIXED - ADDED] In the Edit User modal the account being edited is NOT the logged-in admin,
    // so ignore THAT account when checking for duplicates (and catch clashes with the admin's own username).
    if (field.id === "editUserUsername") {
        const editedId = parseInt(
            (document.getElementById("editUserId") || {}).value
        );
        if (!isNaN(editedId)) {
            currentUserId = editedId;
        }
    }


    const duplicate =
        db.users.some(
            user =>
                user.id !==
                    currentUserId &&
                String(
                    user.username ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                value.toLowerCase()
        );


    if (duplicate) {

        return showValidationError(
            field,
            "Username already exists. Please choose another username."
        );
    }


    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }


    return true;
}


// =========================================================
// EMAIL DUPLICATE CHECK
// =========================================================

function emailExists(
    email
) {

    const value =
        email
            .trim()
            .toLowerCase();


    const donorExists =
        db.donors.some(
            donor =>
                // [FIXED - ADDED] a donor updating their OWN profile must not be blocked by their own saved email
                !(
                    db.currentUser &&
                    Number(db.currentUser.roleId) === 4 &&
                    donor.userId === db.currentUser.id
                ) &&
                String(
                    donor.email ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                value
        );


    return donorExists;
}


function validateUniqueEmail(
    field
) {

    if (!field) {
        return true;
    }


    if (
        !validateGmailField(
            field
        )
    ) {

        return false;
    }


    const value =
        field.value.trim();


    if (
        value !== "" &&
        emailExists(
            value
        )
    ) {

        return showValidationError(
            field,
            "Email already exists. Please use another Gmail account."
        );
    }


    /*
     * Keep it green after the complete
     * Gmail address is valid and unique.
     */
    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    return true;
}


// =========================================================
// GENERIC FIELD VALIDATION
// =========================================================

function getValidationMessage(
    field
) {
    // [FIXED - ADDED] clear message for the donor age limit
    if (
        field &&
        field.id === "birthDate" &&
        (field.validity.rangeOverflow || field.validity.rangeUnderflow)
    ) {
        return "Donor must be 18 to 65 years old. Please check the birth date.";
    }


    if (!field) {
        return "Please check this field.";
    }


    if (
        field.validity.valueMissing
    ) {

        return "This field is required. Please enter or select a value.";
    }


    if (
        field.validity.tooShort
    ) {

        return `Please enter at least ${field.minLength} characters.`;
    }


    if (
        field.validity.tooLong
    ) {

        return `Please enter no more than ${field.maxLength} characters.`;
    }


    if (
        field.validity.rangeUnderflow
    ) {

        return `Please enter a value of at least ${field.min}.`;
    }


    if (
        field.validity.rangeOverflow
    ) {

        return `Please enter a value no greater than ${field.max}.`;
    }


    if (
        field.validity.patternMismatch
    ) {

        return "Please enter the information in the correct format.";
    }


    return "Please check this field and try again.";
}


// =========================================================
// SHOW GENERIC FIELD VALIDATION
// =========================================================

function showFieldValidation(
    field
) {

    if (
        !field ||
        field.type ===
            "hidden"
    ) {
        return true;
    }


    if (
        field.disabled
    ) {

        clearValidationError(
            field
        );

        return true;
    }


    /*
     * Hidden fields are skipped.
     */
    if (
        field.offsetParent ===
        null
    ) {

        clearValidationError(
            field
        );

        return true;
    }


    if (
        field.value.trim() ===
        ""
    ) {

        if (
            field.required
        ) {

            return showValidationError(
                field,
                "This field is required."
            );
        }


        clearValidationError(
            field
        );

        return true;
    }


    if (
        !field.checkValidity()
    ) {

        return showValidationError(
            field,
            getValidationMessage(
                field
            )
        );
    }


    field.classList.remove(
        "input-invalid"
    );

    field.classList.add(
        "input-valid"
    );


    const validationMessage =
        field.parentElement
            ?.querySelector(
                ".validation-message"
            );

    if (validationMessage) {

        validationMessage.textContent =
            "";

        validationMessage.classList.remove(
            "show"
        );
    }


    return true;
}


// =========================================================
// COMPLETE FORM VALIDATION
// =========================================================

function validateForm(
    form
) {

    if (!form) {
        return false;
    }


    let valid = true;


    const fields =
        form.querySelectorAll(
            "input, select, textarea"
        );


    fields.forEach(
        field => {

            if (
                field.type ===
                    "hidden" ||
                field.disabled ||
                field.offsetParent ===
                    null
            ) {
                return;
            }


            let fieldValid =
                true;


            // -----------------------------
            // NAME FIELDS
            // -----------------------------
            if (
                [
                    "firstName",
                    "middleName",
                    "lastName",
                    "editProfileFirName",
                    "editProfileMidName",
                    "editProfileLstName"
                ].includes(
                    field.id
                )
            ) {

                fieldValid =
                    validateNameField(
                        field,
                        field.required
                    );


            // -----------------------------
            // PHONE FIELDS
            // -----------------------------
            } else if (
                [
                    "phone",
                    "editProfilePhone",
                    "selfDonorPhone",
                    "hospCttNumber",
                    "bhwCttNumber"
                ].includes(
                    field.id
                )
            ) {

                fieldValid =
                    validatePhoneField(
                        field
                    );


            // -----------------------------
            // GMAIL FIELDS
            // -----------------------------
            } else if (
                [
                    "email",
                    "editProfileEmail",
                    "selfDonorEmail"
                ].includes(
                    field.id
                )
            ) {

                fieldValid =
                    validateUniqueEmail(
                        field
                    );


            // -----------------------------
            // PASSWORD FIELDS
            // -----------------------------
            } else if (
                [
                    "staffRegPass",
                    "newPassword"
                ].includes(
                    field.id
                )
            ) {

                fieldValid =
                    validateStrongPassword(
                        field
                    );


            // -----------------------------
            // USERNAME FIELDS
            // -----------------------------
            } else if (
                [
                    "staffRegUser",
                    "changeUsername",
                    "editUserUsername", // [FIXED - ADDED] Edit User modal now uses the full username check (format + duplicate)
                    "settingsNewUsername"
                ].includes(
                    field.id
                )
            ) {

                fieldValid =
                    validateUsernameField(
                        field
                    );


            // -----------------------------
            // ALL OTHER FIELDS
            // -----------------------------
            } else {

                fieldValid =
                    showFieldValidation(
                        field
                    );
            }


            if (
                !fieldValid
            ) {

                valid =
                    false;
            }
        }
    );


    // =====================================================
    // DONOR REGISTRATION ORDER
    // =====================================================

    if (
        form.id ===
        "registerForm"
    ) {

        const firstName =
            document.getElementById(
                "firstName"
            );

        const middleName =
            document.getElementById(
                "middleName"
            );

        const lastName =
            document.getElementById(
                "lastName"
            );


        if (
            firstName &&
            middleName &&
            lastName
        ) {

            /*
             * First Name must be entered
             * before Middle Name or Last Name.
             */
            if (
                firstName.value.trim() ===
                ""
            ) {

                if (
                    middleName.value.trim() !==
                    ""
                ) {

                    showValidationError(
                        middleName,
                        "Please enter First Name before Middle Name."
                    );

                    valid =
                        false;
                }


                if (
                    lastName.value.trim() !==
                    ""
                ) {

                    showValidationError(
                        lastName,
                        "Please enter First Name before Last Name."
                    );

                    valid =
                        false;
                }
            }


            /*
             * Last Name cannot be entered
             * before First Name.
             */
            if (
                lastName.value.trim() !==
                    "" &&
                firstName.value.trim() ===
                    ""
            ) {

                showValidationError(
                    firstName,
                    "Please enter First Name first."
                );

                valid =
                    false;
            }
        }


        // -----------------------------
        // REGION
        // -----------------------------
        const region =
            document.getElementById(
                "region"
            );


        if (
            region &&
            region.value ===
                ""
        ) {

            showValidationError(
                region,
                "Please select a region."
            );

            valid =
                false;
        }


        // -----------------------------
        // CITY
        // -----------------------------
        const city =
            document.getElementById(
                "city"
            );


        if (
            city &&
            city.value ===
                ""
        ) {

            showValidationError(
                city,
                "Please select a city."
            );

            valid =
                false;
        }


        // -----------------------------
        // BARANGAY
        // -----------------------------
        const barangay =
            document.getElementById(
                "barangay"
            );


        if (
            barangay &&
            barangay.value ===
                ""
        ) {

            showValidationError(
                barangay,
                "Please select a barangay."
            );

            valid =
                false;
        }
    }


    // =====================================================
    // FIND FIRST INVALID FIELD
    // =====================================================

    if (!valid) {

        const firstInvalid =
            form.querySelector(
                ".input-invalid"
            );


        if (
            firstInvalid
        ) {

            firstInvalid.focus();
        }
    }


    return valid;
}
// =========================================================
// ROLE FORM TOGGLE
// =========================================================

function toggleRoleFormFields() {

    const roleSelect =
        document.getElementById(
            "staffRegRole"
        );


    if (!roleSelect) {
        return;
    }


    const choFields =
        document.getElementById(
            "choFieldsGroup"
        );

    const hospitalFields =
        document.getElementById(
            "hospitalFieldsGroup"
        );

    const bhwFields =
        document.getElementById(
            "bhwFieldsGroup"
        );

    const donorFields =
        document.getElementById(
            "donorFieldsGroup"
        );


    const groups = [
        choFields,
        hospitalFields,
        bhwFields,
        donorFields
    ];


    groups.forEach(
        group => {

            if (!group) {
                return;
            }

            group.style.display =
                "none";
        }
    );


    switch (
        roleSelect.value
    ) {

        case "1":

            if (choFields) {

                choFields.style.display =
                    "grid";
            }

            break;


        case "2":

            if (hospitalFields) {

                hospitalFields.style.display =
                    "grid";
            }

            break;


        case "3":

            if (bhwFields) {

                bhwFields.style.display =
                    "grid";
            }

            break;


        case "4":

            if (donorFields) {

                donorFields.style.display =
                    "grid";
            }

            break;
    }
}


// =========================================================
// EDIT USER MODAL
// =========================================================

function openEditUserModal(
    userId
) {

    const user =
        db.users.find(
            item =>
                item.id ===
                parseInt(userId)
        );


    if (!user) {
        return;
    }


    const idField =
        document.getElementById(
            "editUserId"
        );

    const usernameField =
        document.getElementById(
            "editUserUsername"
        );


    if (idField) {

        idField.value =
            user.id;
    }


    if (usernameField) {

        usernameField.value =
            user.username;
    }


    openModal(
        "editUserModal"
    );
}


// =========================================================
// EDIT BLOOD DRIVE MODAL
// =========================================================

function openEditDriveModal(
    driveId
) {

    const drive =
        db.drives.find(
            item =>
                item.id ===
                parseInt(driveId)
        );


    if (!drive) {
        return;
    }


    const idField =
        document.getElementById(
            "editDriveId"
        );

    const eventField =
        document.getElementById(
            "editDriveEvent"
        );

    const venueField =
        document.getElementById(
            "editDriveVenue"
        );

    const dateField =
        document.getElementById(
            "editDriveDate"
        );

    const barangayField =
        document.getElementById(
            "editDriveBarangay"
        );

    const statusField =
        document.getElementById(
            "editDriveStatus"
        );


    if (idField) {

        idField.value =
            drive.id;
    }


    if (eventField) {

        eventField.value =
            drive.eventName;
    }


    if (venueField) {

        venueField.value =
            drive.venue;
    }


    if (dateField) {

        dateField.value =
            drive.scheduleDate;
    }


    if (barangayField) {

        barangayField.value =
            drive.barangayId;
    }


    if (statusField) {

        statusField.value =
            drive.status ||
            "Scheduled";
    }


    openModal(
        "editDriveModal"
    );
}


// =========================================================
// LOAD VOLUNTEER DONOR PROFILE FOR EDITING
// =========================================================

function loadDonorProfileEditForm() {

    if (
        !db.currentUser ||
        db.currentUser.roleId !== 4
    ) {
        return;
    }


    const donor =
        db.donors.find(
            item =>
                item.userId ===
                db.currentUser.id
        );


    if (!donor) {
        return;
    }


    const firstName =
        document.getElementById(
            "editProfileFirName"
        );

    const middleName =
        document.getElementById(
            "editProfileMidName"
        );

    const lastName =
        document.getElementById(
            "editProfileLstName"
        );

    const phone =
        document.getElementById(
            "editProfilePhone"
        );

    const email =
        document.getElementById(
            "editProfileEmail"
        );

    const address =
        document.getElementById(
            "editProfileAdd"
        );

    const barangay =
        document.getElementById(
            "editProfileBarangay"
        );

    const city =
        document.getElementById(
            "editProfileCity"
        );

    const region =
        document.getElementById(
            "editProfileRegion"
        );


    if (firstName) {

        firstName.value =
            donor.firstName ||
            "";
    }


    if (middleName) {

        middleName.value =
            donor.middleName ||
            "";
    }


    if (lastName) {

        lastName.value =
            donor.lastName ||
            "";
    }


    /*
     * Convert old 09xxxxxxxxx
     * number to +639xxxxxxxxx.
     */
    if (phone) {

        let rawPhone =
            String(
                donor.phone ||
                ""
            ).trim();


        if (
            rawPhone.startsWith(
                "+63"
            )
        ) {

            let digits =
                rawPhone
                    .substring(3)
                    .replace(
                        /\D/g,
                        ""
                    );


            digits =
                digits.substring(
                    0,
                    10
                );


            phone.value =
                "+63" +
                digits;

        } else {

            let digits =
                rawPhone.replace(
                    /\D/g,
                    ""
                );


            if (
                digits.startsWith(
                    "63"
                )
            ) {

                digits =
                    digits.substring(
                        2
                    );
            }


            if (
                digits.startsWith(
                    "0"
                )
            ) {

                digits =
                    digits.substring(
                        1
                    );
            }


            digits =
                digits.substring(
                    0,
                    10
                );


            phone.value =
                "+63" +
                digits;
        }
    }


    if (email) {

        email.value =
            donor.email ||
            "";
    }


    if (address) {

        address.value =
            donor.address ||
            "";
    }


    if (barangay) {

        barangay.value =
            donor.barangayId ||
            "";
    }


    if (city) {

        city.value =
            donor.city ||
            "";
    }


    if (region) {

        region.value =
            donor.region ||
            "";
    }


    /*
     * Clear old validation styling
     * when opening the edit form.
     */
    document
        .querySelectorAll(
            "#editDonorProfileModal .input-invalid, #editDonorProfileModal .input-valid"
        )
        .forEach(
            field => {

                field.classList.remove(
                    "input-invalid",
                    "input-valid"
                );
            }
        );


    document
        .querySelectorAll(
            "#editDonorProfileModal .validation-message"
        )
        .forEach(
            message => {

                message.textContent =
                    "";

                message.classList.remove(
                    "show"
                );
            }
        );
}


// =========================================================
// VOLUNTEER SETTINGS
// =========================================================

function renderVolunteerSettings() {

    if (
        !db.currentUser ||
        false /* [FIXED] settings now open to every role (was: db.currentUser.roleId !== 4) */
    ) {
        return;
    }


    const usernameInput =
        (document.getElementById("changeUsername") || document.getElementById("settingsNewUsername"));


    if (usernameInput) {

        usernameInput.value =
            db.currentUser.username ||
            "";
    }


    const usernameDisplay =
        (document.getElementById("currentUsernameDisplay") || document.getElementById("settingsCurrentUsername"));


    if (usernameDisplay) {

        usernameDisplay.textContent =
            db.currentUser.username ||
            "";
    }
}


// =========================================================
// CHANGE VOLUNTEER USERNAME
// =========================================================

function changeVolunteerUsername(
    event
) {

    if (event) {

        event.preventDefault();
    }


    if (
        !db.currentUser ||
        false /* [FIXED] settings now open to every role (was: db.currentUser.roleId !== 4) */
    ) {

        alert(
            "Settings are available only to Volunteer Blood Donor accounts."
        );

        return;
    }


    const input =
        (document.getElementById("changeUsername") || document.getElementById("settingsNewUsername"));


    if (!input) {
        return;
    }


    if (
        !validateUsernameField(
            input
        )
    ) {
        return;
    }


    const newUsername =
        input.value.trim();


    const currentUsername =
        db.currentUser.username
            ? db.currentUser.username
                .trim()
                .toLowerCase()
            : "";


    if (
        newUsername.toLowerCase() ===
        currentUsername
    ) {

        alert(
            "Please enter a different username."
        );

        return;
    }


    fetch(
        "account_settings.php",
        {
            method:
                "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    action:
                        "update_username",

                    userId:
                        db.currentUser.id,

                    newUsername:
                        newUsername
                })
        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if (
                result.success
            ) {

                db.currentUser.username =
                    result.username ||
                    newUsername;


                const user =
                    db.users.find(
                        item =>
                            item.id ===
                            db.currentUser.id
                    );


                if (user) {

                    user.username =
                        db.currentUser.username;
                }


                const welcome =
                    document.getElementById(
                        "welcomeUserMsg"
                    );


                if (welcome) {

                    welcome.textContent =
                        `Maligayang pagbabalik, ${db.currentUser.username}!`;
                }


                saveRecords(); // [TASK 7 - ADDED]
                renderVolunteerSettings();


                alert(
                    "Username changed successfully."
                );

            } else {

                alert(
                    "Unable to change username: " +
                    result.message
                );
            }
        }
    )

    .catch(
        error => {

            alert(
                "Something went wrong reaching the server: " +
                error.message
            );
        }
    );
}


// =========================================================
// CHANGE VOLUNTEER PASSWORD
// =========================================================

function changeVolunteerPassword(
    event
) {

    if (event) {

        event.preventDefault();
    }


    if (
        !db.currentUser ||
        false /* [FIXED] settings now open to every role (was: db.currentUser.roleId !== 4) */
    ) {

        alert(
            "Settings are available only to Volunteer Blood Donor accounts."
        );

        return;
    }


    const currentPassword =
        (document.getElementById("currentPassword") || document.getElementById("settingsCurrentPassword"))?.value || "";


    const newPassword =
        (document.getElementById("newPassword") || document.getElementById("settingsNewPassword"))?.value || "";


    const confirmPassword =
        (document.getElementById("confirmPassword") || document.getElementById("settingsConfirmPassword"))?.value || "";


    if (
        currentPassword === "" ||
        newPassword === "" ||
        confirmPassword === ""
    ) {

        alert(
            "Please complete all password fields."
        );

        return;
    }


    if (
        newPassword !==
        confirmPassword
    ) {

        alert(
            "New password and confirmation password do not match."
        );

        return;
    }


    const temporaryField =
        document.createElement(
            "input"
        );

    temporaryField.type =
        "password";

    temporaryField.value =
        newPassword;


    if (
        !validateStrongPassword(
            temporaryField
        )
    ) {

        alert(
            "New password must contain an uppercase letter, lowercase letter, number, special character, and be at least 8 characters long."
        );

        return;
    }


    fetch(
        "account_settings.php",
        {
            method:
                "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    action:
                        "update_password",

                    userId:
                        db.currentUser.id,

                    currentPassword:
                        currentPassword,

                    newPassword:
                        newPassword
                })
        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if (
                result.success
            ) {

                const user =
                    db.users.find(
                        item =>
                            item.id ===
                            db.currentUser.id
                    );


                if (user) {

                    user.password =
                        newPassword;
                }


                const passwordForm =
                    document.getElementById(
                        "formChangePassword"
                    );


                if (
                    passwordForm
                ) {

                    passwordForm.reset();
                }


                alert(
                    "Password changed successfully."
                );

            } else {

                alert(
                    "Unable to change password: " +
                    result.message
                );
            }
        }
    )

    .catch(
        error => {

            alert(
                "Something went wrong reaching the server: " +
                error.message
            );
        }
    );
}


// =========================================================
// REPORT GENERATION
// =========================================================

function generateReport(
    type
) {

    const container =
        document.getElementById(
            "reportOutputContainer"
        );


    if (!container) {
        return;
    }


    if (
        type ===
        "Donor"
    ) {

        container.innerHTML = `
            <h3>
                Donor Report Generated
            </h3>

            <p>
                Total Registered Donors:
                ${db.donors.length}
            </p>
        `;

    } else if (
        type ===
        "Emergency"
    ) {

        container.innerHTML = `
            <h3>
                Emergency Request Report Generated
            </h3>

            <p>
                Total Requests:
                ${db.requests.length}
            </p>
        `;

    } else if (
        type ===
        "Donation"
    ) {

        container.innerHTML = `
            <h3>
                Donation Report Generated
            </h3>

            <p>
                Total Donations:
                ${db.donations.length}
            </p>
        `;
    }
}


// =========================================================
// FINAL VALIDATION INITIALIZATION
// =========================================================

function setupNameValidation() {

    const nameIds = [

        "firstName",
        "middleName",
        "lastName",

        "editProfileFirName",
        "editProfileMidName",
        "editProfileLstName",

        "choFirName",
        "choLstName",

        "bhwFirName",
        "bhwLstName",

        "selfDonorFirName",
        "selfDonorMidName",
        "selfDonorLstName"
    ];


    nameIds.forEach(
        id => {

            const field =
                document.getElementById(
                    id
                );


            if (!field) {
                return;
            }


            /*
             * Prevent numbers from being entered.
             */
            field.addEventListener(
                "beforeinput",
                event => {

                    if (
                        typeof event.data ===
                        "string" &&
                        /[0-9]/.test(
                            event.data
                        )
                    ) {

                        event.preventDefault();
                    }
                }
            );


            field.addEventListener(
                "input",
                () => {

                    if (
                        /[0-9]/.test(
                            field.value
                        )
                    ) {

                        field.value =
                            field.value.replace(
                                /[0-9]/g,
                                ""
                            );
                    }


                    validateNameField(
                        field,
                        field.required
                    );
                }
            );


            field.addEventListener(
                "blur",
                () => {

                    validateNameField(
                        field,
                        field.required
                    );
                }
            );
        }
    );
}


// =========================================================
// PHONE INPUT PROTECTION
// =========================================================

function setupPhoneValidation() {

    const phoneIds = [

        "phone",
        "editProfilePhone",
        "selfDonorPhone",
        "hospCttNumber",
        "bhwCttNumber"
    ];


    phoneIds.forEach(
        id => {

            const field =
                document.getElementById(
                    id
                );


            if (!field) {
                return;
            }


            /*
             * Always start with +63.
             */
            if (
                !field.value.startsWith(
                    "+63"
                )
            ) {

                field.value =
                    "+63";
            }


            field.addEventListener(
                "focus",
                () => {

                    if (
                        !field.value.startsWith(
                            "+63"
                        )
                    ) {

                        field.value =
                            "+63";
                    }


                    if (
                        field.value ===
                        "+63"
                    ) {

                        try {

                            field.setSelectionRange(
                                3,
                                3
                            );

                        } catch (
                            error
                        ) {
                            // Ignore selection errors.
                        }
                    }
                }
            );


            field.addEventListener(
                "input",
                () => {

                    normalizePhilippinePhone(
                        field
                    );

                    validatePhoneField(
                        field
                    );
                }
            );


            field.addEventListener(
                "keydown",
                event => {

                    /*
                     * Protect the +63 prefix
                     * from Backspace/Delete.
                     */
                    if (
                        (
                            event.key ===
                                "Backspace" ||
                            event.key ===
                                "Delete"
                        ) &&
                        field.selectionStart <=
                            3
                    ) {

                        event.preventDefault();
                    }
                }
            );


            field.addEventListener(
                "blur",
                () => {

                    validatePhoneField(
                        field
                    );
                }
            );
        }
    );
}


// =========================================================
// GMAIL INPUT VALIDATION
// =========================================================

function setupGmailValidation() {

    const emailIds = [

        "email",
        "editProfileEmail",
        "selfDonorEmail"
    ];


    emailIds.forEach(
        id => {

            const field =
                document.getElementById(
                    id
                );


            if (!field) {
                return;
            }


            field.addEventListener(
                "input",
                () => {

                    /*
                     * This means Gmail stays RED
                     * until @gmail.com is complete.
                     */
                    validateGmailField(
                        field
                    );
                }
            );


            field.addEventListener(
                "blur",
                () => {

                    validateUniqueEmail(
                        field
                    );
                }
            );
        }
    );
}


// =========================================================
// INITIALIZE ALL VALIDATION
// =========================================================

function initializeAllValidation() {

    setupNameValidation();

    setupPhoneValidation();

    setupGmailValidation();


    /*
     * Generic validation for other fields.
     */
    document
        .querySelectorAll(
            "input, select, textarea"
        )
        .forEach(
            field => {

                const specialField =
                    [
                        "firstName",
                        "middleName",
                        "lastName",
                        "editProfileFirName",
                        "editProfileMidName",
                        "editProfileLstName",

                        "phone",
                        "editProfilePhone",
                        "selfDonorPhone",
                        "hospCttNumber",
                        "bhwCttNumber",

                        "email",
                        "editProfileEmail",
                        "selfDonorEmail"
                    ].includes(
                        field.id
                    );


                if (
                    specialField
                ) {
                    return;
                }


                field.addEventListener(
                    "input",
                    () => {

                        showFieldValidation(
                            field
                        );
                    }
                );


                field.addEventListener(
                    "change",
                    () => {

                        showFieldValidation(
                            field
                        );
                    }
                );


                field.addEventListener(
                    "blur",
                    () => {

                        showFieldValidation(
                            field
                        );
                    }
                );
            }
        );


    /*
     * Date restrictions.
     */
    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const dateIds = [

        "inlineReqDate",
        "reqDate",
        "inlineDriveDate",
        "driveDate",
        "editDriveDate"
    ];


    dateIds.forEach(
        id => {

            const field =
                document.getElementById(
                    id
                );


            if (field) {

                field.min =
                    today;
            }
        }
    );


    const birthDate =
        document.getElementById(
            "birthDate"
        );


    if (birthDate) {

        birthDate.max =
            today;
    }

    // [FIXED - ADDED] Donor age limit: 18 to 65 years old (change these two numbers if your rules differ)
    if (birthDate) {
        const limitYoungest = new Date();
        limitYoungest.setFullYear(limitYoungest.getFullYear() - 18);
        const limitOldest = new Date();
        limitOldest.setFullYear(limitOldest.getFullYear() - 65);
        birthDate.max = limitYoungest.toISOString().split("T")[0];
        birthDate.min = limitOldest.toISOString().split("T")[0];
    }


    /*
     * Staff role selector.
     */
    const roleSelect =
        document.getElementById(
            "staffRegRole"
        );


    if (roleSelect) {

        roleSelect.addEventListener(
            "change",
            () => {

                toggleRoleFormFields();
            }
        );


        toggleRoleFormFields();
    }
}


// =========================================================
// RUN VALIDATION SETUP SAFELY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeAllValidation();
    }
);


// =========================================================
// [FIXED - ADDED] RESTORED HANDLERS
// These buttons/forms exist in index.html but had no code
// attached to them, so clicking them did nothing.
// Nothing above this line was removed or changed in logic.
// =========================================================

// --- LOGOUT ---
function logoutCurrentUser() {

    db.currentUser = null;

    // close any open modal
    document
        .querySelectorAll(".modal")
        .forEach(modal => {
            modal.style.display = "none";
        });

    const dashboard =
        document.getElementById("mainDashboardView");

    if (dashboard) {
        dashboard.style.display = "none";
    }

    const loginSection =
        document.getElementById("loginViewSection");

    if (loginSection) {
        loginSection.style.display = "flex";
    }

    const loginForm =
        document.getElementById("initialLoginForm");

    if (loginForm) {
        loginForm.reset();

        loginForm
            .querySelectorAll(".input-invalid, .input-valid")
            .forEach(field => {
                field.classList.remove("input-invalid", "input-valid");
            });

        loginForm
            .querySelectorAll(".validation-message")
            .forEach(message => {
                message.textContent = "";
                message.classList.remove("show");
            });
    }

    const sidebar =
        document.getElementById("sidebarMenu");

    if (sidebar) {
        sidebar.innerHTML = "";
    }
}


function bindRestoredHandlers() {

    function bind(id, eventName, handler) {

        const element =
            document.getElementById(id);

        if (element) {
            element.addEventListener(eventName, handler);
        }
    }

    // Logout button (top right)
    bind("btnLogoutNav", "click", event => {
        event.preventDefault();
        logoutCurrentUser();
    });

    // "Register Donor" button in Manage System Users (CHO Admin)
    bind("btnAdminCreateAccount", "click", event => {
        event.preventDefault();
        openDonorRegistrationForStaff();
    });

    // "Submit Emergency Request Modal" button
    bind("btnReqModuleAdd", "click", event => {
        event.preventDefault();
        openModal("requestModal");
    });

    // "Schedule Blood Drive Modal" button
    bind("btnDriveModuleAdd", "click", event => {
        event.preventDefault();
        openModal("driveModal");
    });

    // Donor "Update Personal Details" button
    bind("btnEditDonorProfile", "click", event => {
        event.preventDefault();

        if (typeof loadDonorProfileEditForm === "function") {
            loadDonorProfileEditForm();
        }

        openModal("editDonorProfileModal");
    });

    // "Same barangay only" filter in the matching engine
    bind("filterSameBarangay", "change", () => {

        const matchModule =
            document.getElementById("viewMatchedDonors");

        if (
            matchModule &&
            matchModule.dataset.activeRequestId
        ) {
            renderMatchedDonors(
                parseInt(matchModule.dataset.activeRequestId)
            );
        }
    });

    // Settings: change username / change password (all roles)
    bind("formChangeUsername", "submit", changeVolunteerUsername);
    bind("formChangePassword", "submit", changeVolunteerPassword);

    // Click on the dark backdrop closes a modal
    window.addEventListener("click", event => {

        if (
            event.target &&
            event.target.classList &&
            event.target.classList.contains("modal")
        ) {
            closeModal(event.target.id);
        }
    });
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bindRestoredHandlers();
    }
);


// =========================================================
// [TASK 7 - ADDED] DATA STORAGE AND RECORD MANAGEMENT
// ---------------------------------------------------------
// - Records live in the JavaScript arrays (db.donors, db.requests ...).
// - Every time the tables refresh, the arrays are ALSO saved in the
//   browser's Local Storage, so they are still there after a page refresh.
// - Only records that passed validation ever reach the arrays, so only
//   valid records are saved.
// - Nothing above this line was removed or changed in logic.
// =========================================================

const RECORDS_STORAGE_KEY = "bloodDonorSystemRecords_v1";

// which arrays in db are stored
const RECORD_COLLECTIONS = [
    "users",
    "donors",
    "requests",
    "donations",
    "drives"
];


// --- SAVE: copy the arrays into Local Storage ---
function saveRecords() {

    try {

        const snapshot = {
            savedAt: new Date().toISOString()
        };

        RECORD_COLLECTIONS.forEach(name => {

            snapshot[name] = db[name].map(item => {

                // never store passwords in the browser
                if (name === "users") {
                    const copy = Object.assign({}, item);
                    delete copy.password;
                    return copy;
                }

                return item;
            });
        });

        localStorage.setItem(
            RECORDS_STORAGE_KEY,
            JSON.stringify(snapshot)
        );

        return true;

    } catch (error) {

        console.warn("Could not save records:", error);
        return false;
    }
}


// --- LOAD: put the saved records back into the arrays ---
function loadRecords() {

    try {

        const raw =
            localStorage.getItem(RECORDS_STORAGE_KEY);

        if (!raw) {
            return false;
        }

        const snapshot = JSON.parse(raw);

        RECORD_COLLECTIONS.forEach(name => {

            if (!Array.isArray(snapshot[name])) {
                return;
            }

            if (name === "users") {

                // passwords are not stored, so keep the sample ones
                const samplePasswords = {};

                db.users.forEach(user => {
                    samplePasswords[user.id] = user.password;
                });

                snapshot.users.forEach(user => {
                    if (
                        user.password === undefined &&
                        samplePasswords[user.id] !== undefined
                    ) {
                        user.password = samplePasswords[user.id];
                    }
                });
            }

            db[name].splice(
                0,
                db[name].length,
                ...snapshot[name]
            );
        });

        return true;

    } catch (error) {

        console.warn("Could not load saved records:", error);
        return false;
    }
}


// --- RESET: delete saved records and go back to the sample data ---
function resetSavedRecords() {

    const sure = confirm(
        "This will erase all records saved in this browser and restore the original sample data.\n\nContinue?"
    );

    if (!sure) {
        return;
    }

    try {
        localStorage.removeItem(RECORDS_STORAGE_KEY);
    } catch (error) {
        console.warn(error);
    }

    alert("Sample data restored. The page will reload - please log in again.");

    location.reload();
}


// --- every table refresh also saves the records ---
const originalRefreshAllTables = refreshAllTables;

refreshAllTables = function () {

    originalRefreshAllTables.apply(this, arguments);

    saveRecords();
};


// --- a newly registered donor must show up in the tables and be saved ---
function addRegisteredDonorToRecords(payload, result) {

    if (!payload) {
        return;
    }

    result = result || {};

    const email =
        String(payload.email || "").trim().toLowerCase();

    // do not add the same donor twice
    if (
        email &&
        db.donors.some(
            donor =>
                String(donor.email || "").toLowerCase() === email
        )
    ) {
        return;
    }

    const barangay =
        db.barangays.find(
            item => item.name === payload.barangay
        );

    const bloodType =
        db.bloodTypes.find(
            item => item.name === payload.bloodType
        );

    const nextDonorId =
        db.donors.reduce(
            (max, donor) => Math.max(max, Number(donor.id) || 0),
            100
        ) + 1;

    // user id: use the one from the server if it does not clash with a sample account
    let newUserId =
        result.userId ?? result.userID ?? result.UserID ?? result.id ?? null;

    if (
        newUserId === null ||
        db.users.some(user => user.id === newUserId)
    ) {
        newUserId =
            db.users.reduce(
                (max, user) => Math.max(max, Number(user.id) || 0),
                100
            ) + 1;
    }

    if (result.username) {

        db.users.push({
            id: newUserId,
            username: result.username,
            roleId: 4,
            roleName: "Volunteer Blood Donor",
            status: "Active"
        });
    }

    db.donors.push({
        id: nextDonorId,
        userId: result.username ? newUserId : null,
        firstName: payload.firstName,
        middleName: payload.middleName || "",
        lastName: payload.lastName,
        sex: payload.sex,
        birthDate: payload.birthDate,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        barangayId: barangay ? barangay.id : null,
        city: payload.city,
        region: payload.region,
        bloodTypeId: bloodType ? bloodType.id : null,
        verificationStatus: "Pending",
        availability: "Available"
    });
}


// --- "Saved Records" box in Settings (CHO Admin only) ---
function updateStorageCard() {

    const card =
        document.getElementById("settingsStorageCard");

    if (!card) {
        return;
    }

    const isAdmin =
        db.currentUser &&
        Number(db.currentUser.roleId) === 1;

    card.style.display =
        isAdmin ? "" : "none";

    if (!isAdmin) {
        return;
    }

    const summary =
        document.getElementById("storageSummary");

    if (summary) {
        summary.textContent =
            `Saved in this browser: ${db.donors.length} donors, ` +
            `${db.requests.length} emergency requests, ` +
            `${db.drives.length} blood drives, ` +
            `${db.users.length} user accounts, ` +
            `${db.donations.length} donation responses.`;
    }

    const stamp =
        document.getElementById("storageLastSaved");

    if (stamp) {

        let text = "Nothing saved yet.";

        try {
            const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
            if (raw) {
                text =
                    "Last saved: " +
                    new Date(JSON.parse(raw).savedAt).toLocaleString();
            }
        } catch (error) {
            text = "";
        }

        stamp.textContent = text;
    }
}

const originalRenderVolunteerSettings = renderVolunteerSettings;

renderVolunteerSettings = function () {

    originalRenderVolunteerSettings.apply(this, arguments);

    updateStorageCard();
};

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const resetButton =
            document.getElementById("btnResetSavedRecords");

        if (resetButton) {
            resetButton.addEventListener(
                "click",
                resetSavedRecords
            );
        }
    }
);


// --- LOAD saved records as soon as the script starts (before anything is shown) ---
loadRecords();