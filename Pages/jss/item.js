// Function to handle the response from the server
function handleRequestResponse(response) {
    if (response.success) {
        opensuccessmodal(response.message);
    } else {
        openFailureModal(response.message);
    }
}

// Function to open the modal with a success message
function opensuccessmodal(message) {
    successMessage.innerText = message;
    failureMessage.innerText = ''; // Clear failure message
    modal.style.display = 'block';
}

// Function to open the modal with a failure message
function openFailureModal(message) {
    failureMessage.innerText = message;
    successMessage.innerText = ''; // Clear success message
    modal.style.display = 'block';
}

// Function to close the modal when clicking the close button
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Function to close the modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Example of how to fetch data from the server
document.querySelector('.request').addEventListener('click', async () => {
    try {
        const response = await fetch('/request', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            // Include your request data here (if needed)
        });
        const data = await response.json();
        handleRequestResponse(data); // Handle the response
    } catch (error) {
        console.error('Error:', error);
        // Handle network errors or other issues here
    }
});
