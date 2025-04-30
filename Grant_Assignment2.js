// quote and onload /////////////////////////////////////////////
window.onload = function () {
    fetch('https://zenquotes.io/api/random')
      .then((response) => response.json())
      .then((data) => {
        document.getElementById('quote').innerText = data[0]['q'] + " -" + data[0]['a'];
      })
      .catch((error) => {
        document.getElementById('quote').innerText = 'Failed to load quote.';
        console.error('Error fetching quote:', error);
      });
  
    if (document.getElementById('redditStocks')) loadRedditStocks();
    if (document.getElementById('carousel')) loadRandomDogs();
    if (document.getElementById('breed-buttons')) loadDogBreeds();

    addVoiceCommands();
  };
  
  // Dog carousel //////////////////////////////////////////////
  async function loadRandomDogs() {
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random/10');
      const data = await response.json();
  
      const carousel = document.getElementById('carousel');
      carousel.innerHTML = '';
  
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'slider-container simple-slider'; 
  
      data.message.forEach(imgUrl => {
        const slide = document.createElement('div');
        slide.className = 'slider-item';
  
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = 'Cute dog';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '10px';
  
        slide.appendChild(img);
        sliderContainer.appendChild(slide);
      });
  
      carousel.appendChild(sliderContainer);
  
      new SimpleSlider('.simple-slider', {
        interval: 3000,
        transition: 1000
      });
    } catch (error) {
      console.error('Error loading dog images:', error);
    }
  }
  
  // Dog breeds //////////////////////////////////////////////
  async function loadDogBreeds() {
    try {
      const response = await fetch('https://api.thedogapi.com/v1/breeds');
      const breeds = await response.json();
      const container = document.getElementById('breed-buttons');
      container.innerHTML = ''; 
  
      for (let i = breeds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [breeds[i], breeds[j]] = [breeds[j], breeds[i]];
      }
  
      // Take 10 random breeds
      const randomBreeds = breeds.slice(0, 10);
  
      randomBreeds.forEach(breed => {
        const button = document.createElement('button');
        button.innerText = breed.name;
        button.className = 'breed-button';
        button.setAttribute('data-breed-id', breed.id);
        button.addEventListener('click', () => showBreedInfo(breed));
        container.appendChild(button);
      });
    } catch (error) {
      console.error('Error loading dog breeds:', error);
    }
  }

//////breed info////////////////////
  function showBreedInfo(breed) {
    const infoContainer = document.getElementById('breed-info');
  
    if (!infoContainer) {
      console.warn('Missing element with id "breed-info" to display breed details.');
      return;
    }
  
    const lifeSpanMatch = breed.life_span.match(/(\d+)\s*-\s*(\d+)/);
    let minLife = '', maxLife = '';
    if (lifeSpanMatch) {
      minLife = lifeSpanMatch[1];
      maxLife = lifeSpanMatch[2];
    }
  
    infoContainer.innerHTML = `
      <h3>${breed.name}</h3>
      <p><strong>Description:</strong> ${breed.temperament || 'N/A'}</p>
      <p><strong>Life Expectancy:</strong> ${minLife ? `${minLife} to ${maxLife} years` : breed.life_span}</p>
    `;
  }

  // Voice commands //////////////////////////////////////////////
  function startListening() {
    if (annyang) annyang.start();
  }
  
  function stopListening() {
    if (annyang) annyang.abort();
  }
  
  function addVoiceCommands() {
    if (!annyang) return;
  
    const commands = {
      'hello': () => alert('Hello world!'),
      'change the color to *color': (color) => document.body.style.backgroundColor = color,
      'navigate to home': () => window.location.href = 'Assignment2.html',
      'navigate to stocks': () => window.location.href = 'Grant_Assignment2_stocks.html',
      'navigate to dogs': () => window.location.href = 'Grant_Assignment2_dogs.html',
      'load dog breed *breed': async (breedName) => {
        const response = await fetch('https://api.thedogapi.com/v1/breeds');
        const breeds = await response.json();
        const breed = breeds.find(b => b.name.toLowerCase() === breedName.toLowerCase());
        if (breed) showBreedInfo(breed);
        else alert('Breed not found.');
      },

      'lookup *stock': function(stock) {
        if (!document.getElementById('tickerInput')) return;
        document.getElementById('tickerInput').value = stock.toUpperCase();
        document.getElementById('dateRange').value = '30';
        fetchStockData();
      }
    };
  
    annyang.addCommands(commands);
    annyang.start();
  }
  
  // Stocks //////////////////////////////////////////////
  const apiKey = 'POOI2Sw531Kg1pzaQantxgcBzcYG0jhX';
  
  async function fetchStockData() {
    const ticker = document.getElementById('tickerInput').value.toUpperCase();
    const days = parseInt(document.getElementById('dateRange').value);
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
  
    const formatDate = (date) => date.toISOString().split('T')[0];
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${formatDate(fromDate)}/${formatDate(toDate)}?adjusted=true&sort=asc&limit=120&apiKey=${apiKey}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        alert("No data found. Please enter a valid stock.");
        return;
      }
  
      const dates = data.results.map(d => new Date(d.t).toLocaleDateString());
      const prices = data.results.map(d => d.c);
      const ctx = document.getElementById('stockChart').getContext('2d');
      if (window.chartInstance) window.chartInstance.destroy();
  
      window.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: `${ticker} Closing Prices`,
            data: prices,
            borderColor: 'blue',
            fill: false
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: { maxTicksLimit: 10 }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
      alert('Error fetching stock data.');
    }
  }
  
  // Reddit stocks //////////////////////////////////////////////
  async function loadRedditStocks() {
    try {
        const response = await fetch('https://tradestie.com/api/v1/apps/reddit?date=2022-04-03');
        const data = await response.json();
        const top5 = data.slice(0, 5);
        const tbody = document.querySelector('#redditStocks tbody');
        tbody.innerHTML = '';

        top5.forEach(stock => {
            const row = document.createElement('tr');
            const icon = stock.sentiment === 'Bullish' ? '\u{1F4C8}' : '\u{1F4C9}';
            row.innerHTML = `
                <td><a href="https://finance.yahoo.com/quote/${stock.ticker}" target="_blank">${stock.ticker}</a></td>
                <td>${stock.no_of_comments}</td>
                <td>${icon}</td>  <!-- Display only the emoji -->
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading Reddit stocks:', error);
    }
}
  