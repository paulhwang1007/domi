document.getElementById('save-page').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const tab = tabs[0];
      // Logic to save page
      document.getElementById('status').innerText = 'Saving...';
      
      // Simulate save
      setTimeout(() => {
          document.getElementById('status').innerText = 'Saved!';
      }, 1000);
    });
  });
  
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
