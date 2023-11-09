//const section = document.querySelector("section"),
       // overlay = document.querySelector(".overlay"),
       // showBtn = document.querySelector(".request"),
       // closeBtn = document.querySelector(".close-btn");

     // showBtn.addEventListener("click", () => section.classList.add("active"));

     // overlay.addEventListener("click", () =>
        //section.classList.remove("active")
     // );

     // closeBtn.addEventListener("click", () =>
       // section.classList.remove("active")
    //  );

    // Add an event listener to the "Request Now" button

    document.querySelector('.request').addEventListener('click', async (event) => {
        event.preventDefault();
    
        try {
            // Prepare the request data
    
            // Format the date as "MM/DD/YYYY, h:mm A"
            const formattedDate = new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            });
    
            const requestData = {
                userId: document.querySelector('input[name="userId"]').value,
                bookId: document.querySelector('input[name="bookId"]').value,
                userName: document.querySelector('input[name="userName"]').value,
                idNumber: document.querySelector('input[name="idNumber"]').value,
                title: document.querySelector('input[name="title"]').value,
                author: document.querySelector('input[name="author"]').value,
                callNumber: document.querySelector('input[name="callNumber"]').value,
                dateRequested: formattedDate,
                requestStatus: document.querySelector('input[name="requestStatus"]').value,
                image: document.querySelector('input[name="image"]').value,
            };
    
            // Send an HTTP POST request to your server
            const response = await fetch('/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
    
            if (response.ok) {
                // Request was successful
                const data = await response.json();
    
                // Update the modal content based on success
                document.getElementById('modalTitle').textContent = "Completed";
                document.getElementById('modalMessage').textContent = data.message;
                document.getElementById('successIcon').style.display = "inline-block";
                document.getElementById('errorIcon').style.display = "none";
            } else {
                // Request failed
                const data = await response.json();
    
                // Update the modal content based on failure
                document.getElementById('modalTitle').textContent = "Failed";
                document.getElementById('modalMessage').textContent = data.error;
                document.getElementById('successIcon').style.display = "none";
                document.getElementById('errorIcon').style.display = "inline-block";
            }
    
            // Show the modal
            document.getElementById('myModal').style.display = 'block';
        } catch (error) {
            console.error("Error:", error);
            // Handle errors here
        }
    });
    
    document.getElementById('closeModal').addEventListener('click', () => {
      // Hide the modal
      window.location.href = "/home";
    });
    
    // Add an event listener to the "View Reserved" button
    document.getElementById('viewReserved').addEventListener('click', () => {
      // Redirect to the "/myreserved" page
      window.location.href = "/myreserved";
    });
    