
  // Function to calculate age based on the birthdate
  function calculateAge(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    const age = today.getFullYear() - birthDate.getFullYear();

    // Check if the birthdate for this year has occurred or not
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--; // Subtract 1 from the age if the birthdate hasn't occurred this year yet
    }

    return age;
  }

  // Get the "birthday" and "age" input elements
  const birthdayInput = document.getElementById('birthday');
  const ageInput = document.getElementById('age');

  // Add an event listener to the "birthday" input to calculate and autofill the "age"
  birthdayInput.addEventListener('change', function () {
    const birthday = birthdayInput.value;
    if (birthday) {
      // Convert the input date format to "YYYY-MM-DD"
      const parts = birthday.split('/');
      const formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
      const age = calculateAge(formattedDate);
      ageInput.value = age;
    } else {
      ageInput.value = ''; // Clear the age input if no birthday is entered
    }
  });
