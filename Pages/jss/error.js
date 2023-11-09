
    // Function to add error class to an input field
    function markInputAsError(inputElement) {
        inputElement.classList.add('error-input');
    }

    // Function to remove error class from an input field
    function clearInputError(inputElement) {
        inputElement.classList.remove('error-input');
    }

    // Function to validate the form inputs
    function validateForm() {
        const id = document.getElementById('id');
        // Add your validation logic here for other fields

        // Example: Check if fullname is empty
        if (id.value.trim() === '') {
            markInputAsError(id);
            // You can also display an error message if needed
            // document.getElementById('error-message').textContent = 'Fullname cannot be empty';
            return false; // Prevent form submission
        } else {
            clearInputError(id);
        }

        // Add similar validation logic for other fields

        return true; // Allow form submission
    }

    // Attach the validateForm function to the form's submit event
    document.querySelector('form').addEventListener('submit', function (e) {
        if (!validateForm()) {
            e.preventDefault(); // Prevent form submission if validation fails
        }
    });
