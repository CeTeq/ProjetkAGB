const urlParams = new URLSearchParams(window.location.search);
const projectID = urlParams.get('id');
let productsDisplay, searchBar
let editting = false;
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
        document.getElementById('numbers').innerHTML = ''
        document.getElementById('numbers').innerHTML += '<span>Numer Zamówienia: ' + client.project_id + '</span><br><span>Data zamówienia: ' + client.date + '</span>'



    } catch (error) {
        console.error(error.message);
    }

}
getData();
let productslist = []
async function displayProducts(products) {
    const table =  document.createElement('table');
    const rowH = document.createElement('tr')
    const nameH = document.createElement('th')
    nameH.textContent = 'Nazwa produktu';
    const amountH = document.createElement('th')
    amountH.textContent = 'Ilość';
    const priceH = document.createElement('th')

    const edit = document.createElement('th')
    edit.style.maxWidth = '25px'
    priceH.textContent = 'Cena';
    table.appendChild(rowH);
    table.appendChild(nameH);
    table.appendChild(amountH);
    table.appendChild(priceH);
    table.appendChild(edit);
     productslist = products.map(item => {
         const tr = document.createElement('tr');
         const name = document.createElement('td');
         name.textContent = item.name;
         const number = document.createElement('td');
         number.textContent = item.number;
         const price = document.createElement('td');
         price.textContent = item.price + ' ' + item.currency
         const edit = document.createElement('td');
         const img = document.createElement('img');
         img.alt = 'Delete'
         img.className = 'edit';
         img.src = 'edit.svg'
         edit.className = 'editTD';
         edit.appendChild(img);
         tr.appendChild(name);
         tr.appendChild(number);
         tr.appendChild(price);
         tr.append(edit)
         return {name: item.name, id: item.id, number: number, price: price,  element: tr, edit: img };
    })
    // table.innerHTML += '<tr><td><button onclick="addElement()">Add element</button><div id="adder"></div></td></tr>';
    productslist.forEach((item => {
        item.edit.addEventListener('click', (e) => {
            if(!editting) {
                item.edit.scrollIntoView()
                editting = true;
                console.log('delete: ', item.id)
                const remove = document.createElement('img')
                remove.src = 'delete_forever.svg'
                remove.className = 'hoverPointer'
                const apply = document.createElement('img')
                apply.src = 'confirmG.svg'
                apply.className = 'hoverPointer'
                const amountValue = document.createElement('input')
                amountValue.type = 'number'
                amountValue.id = item.id;
                amountValue.value = item.number.innerText;
                console.log(item)
                item.edit.style.display = 'none'
                item.element.children[3].style.minWidth = '48px'
                item.element.children[3].appendChild(remove)
                item.element.children[3].appendChild(apply)

                const amount = item.element.children[1]
                amount.innerText = '';
                amount.appendChild(amountValue)

                remove.addEventListener('click', async (e) => {
                    await deleteItem(item.id)
                    editting = false
                })
                apply.addEventListener('click', async (e) => {
                    await updateItem(item.id, amountValue.value)
                    editting = false
                })

            }
        })
        table.appendChild(item.element);
    }))
    const add = document.createElement('tr');
    const td = document.createElement('td');
    add.id = 'adderTD'
    const button = document.createElement('button');
    const adder = document.createElement('div')
    adder.id = 'adder';
    button.textContent = 'Add Element';
    button.onclick = addElement;
    td.appendChild(button);
    add.appendChild(td);
    table.appendChild(add);
    document.getElementById("table").appendChild(table)
    document.getElementById('table').appendChild(adder);
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
    document.querySelector('#adder').style.display = 'block';
    adder.innerHTML = '<fomr id="addNewProduct"><div id="searchBarDiv"><label for="searchBar">Wybierz produkt</label>\n' +
        '    <input type="text" id="searchBar" required><div id="productsDisplay"></div></div>\n' +
        '    <div id="searchBarNumberDiv"><label for="searchBarNumber">Iość</label><div style="display: flex; align-items: flex-start"><input type="number" id="searchBarNumber">' +
        '    <button onclick="submitNewelement()">Dodaj</button><img id="abortADD" class="hoverPointer" src="close.svg" alt="abort"></div></div>' +
        ' </fomr>\n'
    searchBar = document.getElementById('searchBar');
    productsDisplay = document.getElementById('productsDisplay');
    showProducts();
    document.querySelector('#abortADD').addEventListener('click', (event) => {
        document.querySelector('#adder').style.display = 'none';
    })
    searchBar.addEventListener('click', (event) => {
        showProducts(true);
        console.log('clicked');
    })
    newProducts.forEach(product => {
        if (product.inUse) {
            product.element.style.color = 'gray'
        } else {
            product.element.addEventListener('click', (event) => {
                    console.log(product);
                    searchBar.value = product.name;
                    selectedProduct = response.find(o => o.name === product.name).id;
                    productsDisplay.style.display = 'none'
            })
        }
        product.element.style.display = 'block'
    })
    document.querySelector('#adder').scrollIntoView()
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



function showProducts(again) {

    const ul = document.createElement('ul');
    ul.style.padding = '0px'
    if(!again) {
        productsDisplay.innerHTML = '';
        newProducts = response.map(item => {
            const li = document.createElement('li');
            li.textContent = item.name;
            li.style.display = 'none'
            li.classList.add('product')
            li.classList.add('productEnabled');
            ul.appendChild(li);
            return {name: item.name, element: li, inUse: item.inUse};
        })
        productsDisplay.appendChild(ul)
    }

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

async function reloadTable() {
    document.getElementById("table").innerHTML = ''
    console.log(response)
    await fetchNewProducts()
    await getData()
}

async function submitNewelement() {
    const name = document.getElementById('searchBar').value;
    let amount = document.getElementById('searchBarNumber').value;
    if(!amount || amount === 0) amount = 1
    await fetch('/api/project/addNewelement', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            projectID: projectID,
            productID: selectedProduct,
            amount: amount
        })
    })
    await reloadTable()
    // location.reload()
}
async function deleteItem(id) {
    await fetch('/api/project/deleteItem', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            projectID: projectID,
            productID: id,
        })
    })
    await reloadTable()
}
async function updateItem(id, amount) {
    await fetch('/api/project/updateItem', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            projectID: projectID,
            productID: id,
            amount: amount
        })
    })
    await reloadTable()
}