const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get('id');
console.log(myParam)
async function getData() {
    const url = "/api/project?id=" + myParam;
    console.log(url);
    try {
        console.log('test')
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        document.title = json.name;
        document.getElementById("name").innerHTML ='<h1>' + json.name + '</h1>';
        let table = '<table><tr><th>Nazwa produktu</th><th>Ilosć</th><th>Cena</th></tr>';
        console.log('items: ', json.items);
        json.items.forEach((item) => {
            table += '<tr><td>' + item.name + '</td>' + '<td>' + item.number + '</td>' + '<td>' + item.price + ' ' + item.currency + '</td></tr>';
        })
        table += '</table>';
        document.getElementById("table").innerHTML = table;

        const client = json.client
        document.getElementById('name').innerHTML += '<span id="clientName">' + client.name + '</span><br><span>' + client.street + ' ' + client.street_number + '</span><br><span>' + client.post_code + ' ' + client.city + '</span>'
        document.getElementById('numbers').innerHTML += '<span>Numer Zamówienia: ' + client.project_id + '</span><br><span>Data zamówienia: ' + client.date + '</span>'

    } catch (error) {
        console.error(error.message);
    }

}
getData();

async function pricingList() {
    const url = "/api/pricingList?id=" + myParam ;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);

        let select = '<select id="pricingListSelect">'
        json.forEach((element) => {
            if(element.id === element.inUse) select += '<option selected value="' + element.id + '">' + element.id + ' - ' + element.date + '</option>';
            else select += '<option value="' + element.id + '">' + element.id + ' - ' + element.date + '</option>';
        })
        document.getElementById('selection').innerHTML = select;
        document.getElementById('pricingListSelect').addEventListener('change', async (event) => {
            await fetch('/api/setPricingList', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({projectID: myParam, pricingList: document.getElementById('pricingListSelect').value}),
            })
            console.log('reload')
            location.reload();
        })
    } catch (error) {
        console.error(error.message);
    }
}