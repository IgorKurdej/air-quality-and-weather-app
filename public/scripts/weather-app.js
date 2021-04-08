const btn = document.querySelector('.btn-submit');

btn.addEventListener('click', () => {
    const place = document.querySelector('.text').value;
  
    if (place == null) return
    fetch('/weather', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            place: place
        })
    }).then(res => res.json()).then(data => setWeatherData(data, place)); 
    // WYLAPAC BLAD
})

const locationName = document.querySelector('.location');
const weatherImg = document.querySelector('.weather-img');
const temp = document.querySelector('.temp');
const maxTemp = document.querySelector('.max-temp');
const minTemp = document.querySelector('.min-temp');
const inputText = document.querySelector('.text');  

const setWeatherData = (data, placeName) => {
    const convertKelvinsToCelsius = (kelvinsTemp) => Math.round(kelvinsTemp - 273.15);

    const imgUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    placeName = `${data.name}, ${data.sys.country}`;
    locationName.innerHTML = placeName;
    weatherImg.src = imgUrl;
    temp.innerHTML = convertKelvinsToCelsius(data.main.temp);
    maxTemp.innerHTML = convertKelvinsToCelsius(data.main.temp_max);
    minTemp.innerHTML = convertKelvinsToCelsius(data.main.temp_min);
    inputText.value = '';
}