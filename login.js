// Hardcoded "database" of user credentials
const usersDatabase = [
    {
        email: "user1@example.com",
        password: "password123"
    },
    {
        email: "user2@example.com",
        password: "mypassword456"
    }
];

function validateLogin() {
    const email = document.getElementById("logemail").value;
    const password = document.getElementById("logpass").value;

    // Check if the provided credentials match the ones in the database
    const user = usersDatabase.find(user => user.email === email && user.password === password);

    if (user) {
        // If credentials are correct, redirect to homepage
        window.location.href = "homepage.html";
    } else {
        // If credentials are incorrect, show an alert
        alert("Invalid email or password. Please try again.");
    }
} 