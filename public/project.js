const urlParams = new URLSearchParams(window.location.search);
const projectID = urlParams.get('id');
let productsDisplay, searchBar
console.log(projectID)
async function getData() {
    const url = "/api/project?id=" + projectID;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        document.title = json.name;
        displayProducts(json.items)
        document.getElementById("name").innerHTML ='<h1>' + json.name + '</h1>';
        // let table = '<table><tr><th>Nazwa produktu</th><th>Ilosć</th><th>Cena</th></tr>';
        // console.log('items: ', json.items);
        // json.items.forEach((item) => {
        //     table += '<tr><td>' + item.name + '</td>' + '<td>' + item.number + '</td>' + '<td>' + item.price + ' ' + item.currency + ' <img alt="edit" class="edit" src="edit_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg"></td></tr>';
        // })
        // table += '<tr><td><button onclick="addElement()">Add element</button><div id="adder"></div></td></tr></table>';
        //
        // document.getElementById("table").innerHTML = table;

        const client = json.client
        document.getElementById('name').innerHTML += '<span id="clientName">' + client.name + '</span><br><span>' + client.street + ' ' + client.street_number + '</span><br><span>' + client.post_code + ' ' + client.city + '</span>'
        document.getElementById('numbers').innerHTML += '<span>Numer Zamówienia: ' + client.project_id + '</span><br><span>Data zamówienia: ' + client.date + '</span>'



    } catch (error) {
        console.error(error.message);
    }

}
getData();
let productslist = []
function displayProducts(products) {
    const table =  document.createElement('table');
    const rowH = document.createElement('tr')
    const nameH = document.createElement('th')
    nameH.textContent = 'Nazwa produktu';
    const amountH = document.createElement('th')
    amountH.textContent = 'Ilość';
    const priceH = document.createElement('th')
    priceH.textContent = 'Cena';
    table.appendChild(rowH);
    table.appendChild(nameH);
    table.appendChild(amountH);
    table.appendChild(priceH);
     productslist = products.map(item => {
         const tr = document.createElement('tr');
         const name = document.createElement('td');
         name.textContent = item.name;
         const number = document.createElement('td');
         number.textContent = item.number;
         const price = document.createElement('td');
         price.textContent = item.price + ' ' + item.currency
         price.innerHTML += '<img alt="edit" class="edit" src="edit_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg">'
         tr.appendChild(name);
         tr.appendChild(number);
         tr.appendChild(price);
         table.appendChild(tr);
         return {name: item.name, id: item.id,  element: tr};
    })
    table.innerHTML += '<tr><td><button onclick="addElement()">Add element</button><div id="adder"></div></td></tr>'
    document.getElementById("table").appendChild(table)
    console.log(productslist)
}

async function pricingList() {
    const url = "/api/project/pricingList?id=" + projectID ;
    
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
            await fetch('/api/project/setPricingList', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({projectID: projectID, pricingList: document.getElementById('pricingListSelect').value}),
            })
            console.log('reload')
            location.reload();
        })
    } catch (error) {
        console.error(error.message);
    }
}
function addElement() {
    const adder = document.getElementById('adder');
    adder.innerHTML = '<div id="search">\n' +
        '    <label for="searchBar">Wybierz produkt</label><br>\n' +
        '    <input type="text" id="searchBar">\n' +
        '    <label for="searchBarNumber">Iość</label> <input type="number" id="searchBarNumber"> ' +
        '    <button onclick="submitNewelement()">Dodaj</button> ' +
        '</div>\n' +
        '<div id="productsDisplay">';
    searchBar = document.getElementById('searchBar');
    productsDisplay = document.getElementById('productsDisplay');
    showProducts();
    searchBar.addEventListener('click', (event) => {
        showProducts();
        console.log('clicked');
    })
    newProducts.forEach(product => {
        if (product.inUse) product.element.style.color = 'gray'
        product.element.style.display = 'block'
        product.element.addEventListener('click', (event) => {
            console.log(product);
            searchBar.value = product.name;
            selectedProduct = response.find(o => o.name === product.name).id;
            productsDisplay.style.display = 'none'
        })
    })
}
let selectedProduct

let newProducts

let response
async function fetchNewProducts() {
    const url = "/api/products";

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Response status: ${res.status}`);
        }
        const json = await res.json();
        response = json;
    } catch (error) {
        console.error(error.message);
    }
}

fetchNewProducts()



function showProducts() {

    const ul = document.createElement('ul');
    ul.style.padding = '0px'
    newProducts = response.map(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.style.display = 'none'
        li.className = 'product';
        ul.appendChild(li);
        return {name: item.name, element: li, inUse: item.inUse};
    })
    productsDisplay.appendChild(ul)
    productsDisplay.style.display = 'block'

    searchBar.addEventListener('input', (event) => {
        const value = event.target.value.toLowerCase();
        newProducts.forEach(product => {
            if (product.name.toLowerCase().includes(value)) {
                if (product.inUse) product.element.style.color = 'gray'
                product.element.style.display = 'block'
            } else product.element.style.display = 'none';
        });
    });
}

async function submitNewelement() {
    const name = document.getElementById('searchBar').value;
    const amount = document.getElementById('searchBarNumber').value;
    await fetch('/api/project/addNewelement', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            projectID: projectID,
            productID: selectedProduct,
            amount: amount
        })
    })
    location.reload()
}