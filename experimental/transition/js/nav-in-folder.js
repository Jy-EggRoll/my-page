fetch('navigation-in-folder.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navigation-in-folder').innerHTML = data;
    })
    .catch(error => console.log('Error loading HTML:', error));