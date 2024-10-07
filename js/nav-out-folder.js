fetch('https://jy-eggroll.github.io/my-page/html/navigation-out-folder.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navigation-out-folder').innerHTML = data;
    })
    .catch(error => console.log('Error loading HTML:', error));