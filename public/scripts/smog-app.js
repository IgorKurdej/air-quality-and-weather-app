const arrAllStationInProvince = [];

const avg = (arr) => {
    let counter = 0;
    arr.forEach(el => counter += el);
    return counter / arr.length;
}

const colorMeasurment = (x, dust) => {
    if (dust === 'PM10') {
        if (x <= 20) return 'green';
        if (x > 20 && x <= 50) return 'lightgreen';
        if (x > 50 && x <= 80) return 'yellow';
        if (x > 80 && x <= 110) return 'orange';
        if (x > 110 && x <= 150) return 'red';
        if (x > 150) return 'darkred';
    } else {
        if (x <= 13) return 'green';
        if (x > 13 && x <= 35) return 'lightgreen';
        if (x > 35 && x <= 55) return 'yellow';
        if (x > 55 && x <= 75) return 'orange';
        if (x > 75 && x <= 110) return 'red';
        if (x > 100) return 'darkred';
    }
}

const provinceName = document.getElementById('province-name');
const avgMeasurment = document.getElementById('avg-measurment');
const voivodeships = document.getElementsByClassName('land');
const dustPM10 = document.getElementById('PM10');
const dustPM25 = document.getElementById('PM2-5');
const mapLegendPM25 = document.getElementById("map-legend-PM25")

document.getElementById('form').addEventListener('change', e => {
    e.target.value === 'PM2.5' ? mapLegendPM25.style.zIndex = 3 : mapLegendPM25.style.zIndex = 1; 
});

const arrTwelveHours = [];
const secoundArr = [];
let chartColor = '';
const arrAvgDataForChart = [];

[...voivodeships].forEach(el => el.addEventListener('click', e => {
    arrTwelveHours.length = 0;
    secoundArr.length = 0;
    arrAvgDataForChart.length = 0;
    provinceName.innerText = el.innerHTML;
    avgMeasurment.style.color = 'black';
    avgMeasurment.innerText = ' - ';
    let kindOfDust = dustPM10.checked ? 'PM10' : 'PM2.5';
    
    getMeasuringStations(el.innerHTML.toUpperCase(), arrAllStationInProvince, kindOfDust)
    .then(data => {
            const avgData = avg(data);
            let color = colorMeasurment(avgData, kindOfDust);
            chartColor = color;
            avgMeasurment.innerText = avgData;
            avgMeasurment.style.color = color;
        })
        .then(() => {
            let counter = 0;
            while (counter < 12) {
                const firstArr = [];
                for(let i = 0; i < arrTwelveHours.length; i++) {
                    for (let j = counter; j < arrTwelveHours[i].length; j++) {
                        if (arrTwelveHours[i][j] !== null) {
                            firstArr.push(arrTwelveHours[i][j]);
                        }
                        break;
                    }
                }
                secoundArr.push(firstArr);
                counter++;
            }

            for(const el of secoundArr) {
                arrAvgDataForChart.push(avg(el));
            }

            updateChartData(arrAvgDataForChart, chartColor);
        }).catch(e => console.log(e));
}));

// GET MEASURING STATIONS

const groupByProvinceName = arr => {
    return arr.reduce((prev, curr) => {
        if (prev.has(curr.city.commune.provinceName)) {
            prev.set(curr.city.commune.provinceName, [...prev.get(curr.city.commune.provinceName), curr]);
        } else {
            prev.set(curr.city.commune.provinceName, [curr]);
        }
        return prev;
    }, new Map());
};

const allIdInProvince = async (map, provinceName, arr, dust) => await Promise.all(map.get(provinceName).map(value => getMeasuringStands(value.id, arr, dust)));

const getMeasuringStations = async (provinceName, arr, dust) => {
    const url = 'https://cors.bridged.cc/http://api.gios.gov.pl/pjp-api/rest/station/findAll';

    const json = await fetch(url).then(data => data.json()).catch(e => console.log(e));
    const provinceWithIds = groupByProvinceName(json);
    const result = await allIdInProvince(provinceWithIds, provinceName, arr, dust).catch(e => console.log(e));
    return result.flat();
}

// GET MEASURING STANDS

const getMeasuringStands = async (stationId, arr, dust) => {
    const url = `https://cors.bridged.cc/http://api.gios.gov.pl/pjp-api/rest/station/sensors/${stationId}`;
    const data = await fetch(url).catch(e => console.log(e));
    const json = await data.json().catch(e => console.log(e));
    return (await Promise.all([...json]
        .map(t => getMeasuringData(t.id, arr, dust))))
        .filter(v => v !== undefined && v !== null);
}

// GET MEASURING DATA

const getDataForTwelveHoursFromOneStation = () => {
    if (json.key === dust) {
        const arrOfData = [];
        for(let i = 12; i >= 1; i--) {
            arrOfData.push(json.values[i].value);
        }
        console.log(arrOfData);
    }

    return arrOfData;
}

const getMeasuringData = async (idStand, arr, dust) => {
        const url = `https://cors.bridged.cc/http://api.gios.gov.pl/pjp-api/rest/data/getData/${idStand}`;
        const data = await fetch(url).catch(e => console.log(e));
        const json = await data.json().catch(e => console.log(e));
        
        if (json.key === dust) {
            const arrOfData = [];

            for(let i = 12; i >= 1; i--) {
                arrOfData.push(json.values[i].value);
            }
            arrTwelveHours.push(arrOfData);
        }

        return json.key === dust ? json.values[1].value : undefined;
}

//-----------------------------------------------------------
//----------------------------CHART--------------------------
//-----------------------------------------------------------
const hoursArr = (arr) => {
    const date = new Date;
    let actualHour = date.getHours();
    
    for (let i = 1; i <= 12; i++) {
        if(actualHour === 0) {
            actualHour = 24;
        }
        actualHour -= 1;
        arr.unshift(`${actualHour}:00`);
    }
    return arr;
};

const hoursBackArr = [];

const updateChartData = (newData, color) => {
    smogChart.data.datasets[0].data = newData;
    smogChart.data.datasets[0].borderColor = color;
    smogChart.update();
}

const CHART = document.getElementById('smog-chart');
let smogChart = new Chart(CHART, {
    type: 'line',
    data: {
        labels: hoursArr(hoursBackArr),
        datasets: [
            {
                label: "Air Quality 12 hours",
                fill: true,
                lineTension: 0.1,
                backgroundColor: "black",
                borderColor: 'black',
                data: arrAvgDataForChart,
            }
        ]}
})