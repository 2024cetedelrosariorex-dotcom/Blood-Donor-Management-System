// Interactive scripts for prototype interface
document.addEventListener('DOMContentLoaded', () => {

    const getStartedBtn = document.getElementById('getStartedBtn');
    const loginHeaderBtn = document.getElementById('loginHeaderBtn');
    const learnMoreBtn = document.getElementById('learnMoreBtn');

    // Button Click Event Listeners (Prototype Interaction)
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            alert('Welcome to the Community-Based Blood Donor System! (System Prototype Only)');
        });
    }

    if (loginHeaderBtn) {
        loginHeaderBtn.addEventListener('click', () => {
            alert('Redirecting to Portal Login Page... (Prototype Interface)');
        });
    }

    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            alert('This system connects volunteer blood donors with Barangay Health Centers and the City Health Office of General Santos City.');
        });
    }
});