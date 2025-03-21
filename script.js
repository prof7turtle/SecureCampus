document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    // Face Recognition Elements
    const scanButton = document.getElementById('scanButton');
    const stopButton = document.getElementById('stopCamera');
    const video = document.getElementById('videoElement');
    const cameraContainer = document.getElementById('cameraContainer');
    const resultBox = document.getElementById('resultBox');
    const studentDetails = document.getElementById('studentDetails');

    let stream = null;
    let recognitionInterval = null;

    // Start camera when scan button is clicked
    scanButton.addEventListener('click', async function() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            video.srcObject = stream;
            
            // Show camera container and hide other elements
            cameraContainer.style.display = 'block';
            resultBox.style.display = 'none';
            studentDetails.style.display = 'none';
            scanButton.style.display = 'none';
            
            // Wait for video to be ready
            video.onloadedmetadata = function() {
                video.play();
                startFaceRecognition();
            };
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera. Please make sure you have granted camera permissions.');
        }
    });

    // Stop camera when stop button is clicked
    stopButton.addEventListener('click', function() {
        stopFaceRecognition();
        cameraContainer.style.display = 'none';
        scanButton.style.display = 'block';
    });

    function startFaceRecognition() {
        recognitionInterval = setInterval(captureAndRecognize, 1000);
    }

    function stopFaceRecognition() {
        if (recognitionInterval) {
            clearInterval(recognitionInterval);
            recognitionInterval = null;
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        video.srcObject = null;
    }

    async function captureAndRecognize() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
    
        const imageData = canvas.toDataURL('image/jpeg');
    
        try {
            const response = await fetch('http://localhost:5000/recognize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData })
            });
    
            const result = await response.json();
            displayResult(result);
        } catch (err) {
            console.error('Error sending image to server:', err);
        }
    }

    function displayResult(result) {
        const resultDiv = document.getElementById('recognitionResult');
        resultBox.style.display = 'block';
        
        if (result.success) {
            resultDiv.innerHTML = `
                <p class="verified">Face Verified!</p>
                <p>User ID: ${result.user_id}</p>
                <p>Confidence: ${(result.confidence * 100).toFixed(2)}%</p>
            `;
            
            // Show student details
            const student = getStudentDetails(result.user_id);
            if (student) {
                studentDetails.style.display = 'block';
                document.getElementById('studentPhoto').src = student.photo;
                document.getElementById('studentName').textContent = student.name;
                document.getElementById('studentId').textContent = student.id;
                document.getElementById('studentDepartment').textContent = student.department;
                document.getElementById('studentYear').textContent = student.year;
                document.getElementById('entryTime').textContent = new Date().toLocaleTimeString();
            }
        } else if (result.face_detected) {
            resultDiv.innerHTML = `
                <p class="not-verified">Face Detected but Not Verified</p>
                <p>Confidence: ${(result.confidence * 100).toFixed(2)}%</p>
            `;
        } else {
            resultDiv.innerHTML = `
                <p class="not-verified">No Face Detected</p>
            `;
        }
    }

    // Mock student data (replace with actual database in production)
    function getStudentDetails(userId) {
        const students = {
            1: {
                name: "John Doe",
                id: "STU001",
                department: "Computer Science",
                year: "3rd Year",
                photo: "Images/profile.jpg"
            },
            2: {
                name: "Harshil Bohra",
                id: "SIT10",
                department: "Information Technology",
                year: "2nd Year",
                photo: "Images/profile.jpg"
            }
        };
        return students[userId];
    }

    // Login validation function
    function validateLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Hardcoded user database (replace with actual database in production)
        const users = [
            { email: 'user@example.com', password: 'password123' },
            { email: 'admin@example.com', password: 'admin123' }
        ];
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Redirect to homepage on successful login
            window.location.href = 'homepage.html';
        } else {
            alert('Invalid email or password. Please try again.');
        }
    }

    function showStudentDetails() {
        studentDetails.style.display = 'block';
        const studentPhoto = document.getElementById('studentPhoto');
        if (studentPhoto) {
            studentPhoto.src = 'Images/profile.jpg';  // Updated photo path
        }
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        entryTimeElement.textContent = timeString;
    }
});