// Global variables
var searchHistory = [];
var weatherApiRootUrl = "https://api.openweathermap.org";
var weatherApiKey = "d91f911bcf2c0f925fb6535547a5ddc9";

// DOM element references
var searchForm = document.querySelector("#search-form");
var searchInput = document.querySelector("#search-input");
var todayContainer = document.querySelector("#today");
var forecastContainer = document.querySelector("#forecast");
var searchHistoryContainer = document.querySelector("#history");

// Fetches weather data for given location from the Weather Geolocation
// endpoint; then, calls functions to display current and forecast weather data.

// Add timezone plugins to day.js
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

var saveSearch = function () {
  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
};

function fetchCityCoords(cityName) {
  var geoCodeAPIURL = `${weatherApiRootUrl}/geo/1.0/direct?q=${cityName}, US&appid=${weatherApiKey}`;

  fetch(geoCodeAPIURL)
    .then(function (res) {
      return res.json();
    })
    .then(function (geoCodeData) {
      console.log("GEOCODE", geoCodeData);
      var [cityData] = geoCodeData;
      fetchWeather({
        lat: cityData.lat,
        lon: cityData.lon,
        name: cityData.name,
      });
    })
    .catch(function (err) {
      console.error(err);
    });
}
var todayForecast;
var timezone;

function fetchWeather(location) {
  var { lat, lon } = location;
  var city = location.name;
  var apiUrl = `${weatherApiRootUrl}/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      todayForecast = data.daily[0];
      timezone = data.timezone;
      console.log("DATA", data);
      renderItems(city, data);
      renderCurrentWeather(city, todayForecast, timezone);
    })
    .catch(function (err) {
      console.error(err);
    });
}

initSearchHistory();

function renderItems(city, data) {
  renderCurrentWeather(city, data.todayForecast, data.timezone);
  renderForecast(data.daily, data.timezone);
}

// Add Button Event Listener
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  var city = searchInput.value;

  fetchCityCoords(city);
});

// Function to display the search history list.
function renderSearchHistory() {
  searchHistoryContainer.innerHTML = "";

  // Start at end of history array and count down to show the most recent at the top.
  for (var i = searchHistory.length - 1; i >= 0; i--) {
    var btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-controls", "today forecast");
    btn.classList.add("history-btn", "btn-history");

    // `data-search` allows access to city name when click handler is invoked
    btn.setAttribute("data-search", searchHistory[i]);
    btn.textContent = searchHistory[i];
    searchHistoryContainer.append(btn);
  }
}

// Function to update history in local storage then updates displayed history.
function appendToHistory(search) {
  // If there is no search term return the function
  if (searchHistory.indexOf(search) !== -1) {
    return;
  }
  searchHistory.push(search);

  localStorage.setItem("search-history", JSON.stringify(searchHistory));
  renderSearchHistory();
}

function initSearchHistory() {
  var storedHistory = localStorage.getItem("search-history");
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}

function renderCurrentWeather(city, todayForecast, timezone) {
  //  API Variables
  var currentDt = Date.now;
  var todayContainer = document.createElement("div");

  var top = document.createElement("div");

  todayContainer.innerHTML = "";
  todayContainer.append(top);

  top.setAttribute("class", "col-lg-9 pb-3");

  todayContainer.innerHTML = "";
  todayContainer.append(top);
  if ((currentDt = todayForecast)) {
    renderTodayCard(city, todayForecast, timezone);
  }
}

function renderTodayCard(city, todayForecast, timezone) {
  var currentLocation = city;
  var unixTs = todayForecast.dt;
  var topTitle = document.createElement("h1");
  var topDate = document.createElement("h3");
  var iconUrl = `https://openweathermap.org/img/w/${todayForecast.weather[0].icon}.png`;
  var iconDescription = todayForecast.weather[0].description;
  var tempF = todayForecast.temp.day;
  var { humidity } = todayForecast;
  var windMph = todayForecast.wind_speed;

  var topInside = document.createElement("div");
  var topBody = document.createElement("div");
  var weatherIcon = document.createElement("img");
  var tempEl = document.createElement("p");
  var windEl = document.createElement("p");
  var humidityEl = document.createElement("p");

  topTitle.textContent = currentLocation;
  topDate.textContent = dayjs.unix(unixTs).tz(timezone).format("M/D/YYYY");
  weatherIcon.setAttribute("src", iconUrl);
  weatherIcon.setAttribute("alt", iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  topInside.append(topBody);
  topBody.append(topTitle, topDate, weatherIcon, tempEl, windEl, humidityEl);

  todayContainer.append(topBody);
}

// Function to display 5 day forecast.
function renderForecast(dailyForecast, timezone) {
  // Create unix timestamps for start and end of 5 day forecast
  var startDt = dayjs().tz(timezone).add(1, "day").startOf("day").unix();
  var endDt = dayjs().tz(timezone).add(6, "day").startOf("day").unix();

  var headingCol = document.createElement("div");
  var heading = document.createElement("h4");

  headingCol.setAttribute("class", "col-12");
  heading.textContent = "5-Day Forecast:";
  headingCol.append(heading);

  forecastContainer.innerHTML = "";
  forecastContainer.append(headingCol);
  for (var i = 0; i < dailyForecast.length; i++) {
    // The api returns forecast data which may include 12pm on the same day and
    // always includes the next 7 days. The api documentation does not provide
    // information on the behavior for including the same day. Results may have
    // 7 or 8 items.
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
      renderForecastCard(dailyForecast[i], timezone);
    }
  }
}

function renderForecastCard(forecast, timezone) {
  // variables for data from api
  var unixTs = forecast.dt;
  var iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  var iconDescription = forecast.weather[0].description;
  var tempF = forecast.temp.day;
  var { humidity } = forecast;
  var windMph = forecast.wind_speed;

  // Create elements for a card
  var col = document.createElement("div");
  var card = document.createElement("div");
  var cardBody = document.createElement("div");
  var cardTitle = document.createElement("h5");
  var weatherIcon = document.createElement("img");
  var tempEl = document.createElement("p");
  var windEl = document.createElement("p");
  var humidityEl = document.createElement("p");

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.setAttribute("class", "col-md");
  col.classList.add("five-day-card");
  card.setAttribute("class", "card bg-primary h-100 text-white");
  cardBody.setAttribute("class", "card-body p-2");
  cardTitle.setAttribute("class", "card-title");
  tempEl.setAttribute("class", "card-text");
  windEl.setAttribute("class", "card-text");
  humidityEl.setAttribute("class", "card-text");

  // Add content to elements
  cardTitle.textContent = dayjs.unix(unixTs).tz(timezone).format("M/D/YYYY");
  weatherIcon.setAttribute("src", iconUrl);
  weatherIcon.setAttribute("alt", iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastContainer.append(col);
}
