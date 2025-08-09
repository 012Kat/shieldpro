// booking.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      service: form.service.value,
      date: form.datetime.value,
      notes: form.notes.value
    };

    try {
      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Booking successful!');
        form.reset();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  });
});
