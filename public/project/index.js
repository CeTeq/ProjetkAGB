const urlParams = new URLSearchParams(window.location.search);
const projectID = urlParams.get('id');
let productsDisplay, searchBar
const itemsList = []
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
        document.querySelector("mdui-top-app-bar-title").innerText = json.name;
        await displayItems(json.items)
        await displayPricinglist(json.items)
    } catch (error) {
        console.error(error.message);
    }

}
getData();

async function displayItems(item) {
    item.forEach(item => {
        itemsList.push(item)

        const itemContainer = document.createElement("div");
        itemContainer.className = 'item-container';
        const more = document.createElement('mdui-dropdown');
        const dropdownTrigger = document.createElement('mdui-button-icon')
        const dropdownMenu = document.createElement('mdui-menu')
        const menuItem1 = document.createElement('mdui-menu-item');

        menuItem1.innerText = 'Usuń';
        menuItem1.addEventListener('click', (e) => {
            unarchiveProject(e.target.closest('.project-container'));
        })

        dropdownMenu.appendChild(menuItem1);

        dropdownTrigger.setAttribute('icon', 'more_vert')
        dropdownTrigger.setAttribute('slot', 'trigger')

        more.appendChild(dropdownTrigger);
        more.appendChild(dropdownMenu);
        more.classList.add('more-item')
        itemContainer.appendChild(more)
        const projectCard = document.createElement("mdui-card")
        projectCard.innerHTML = `
                    <div>
                    <h3></h3>
                    <div class="company">
<!--                        <img src="/project/company.svg">-->
                        <mdui-icon name='image'></mdui-icon>
                        <span class="item-name"></span>
                        <input type="number" class="amount">
                    </div>
                    <div class="description"></div>
                    </div>
                `
        projectCard.querySelector("h3").innerText = item.name;
        projectCard.querySelector('.amount').value = item.number;
        // projectCard.querySelector('.item-name').innerText = item.name;
        projectCard.className = 'item-card'
        itemContainer.appendChild(projectCard);
        document.querySelector('.projectCards').appendChild(itemContainer);
    })
}
let productslist = []
async function displayPricinglist(products) {
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
        tr.appendChild(name);
        tr.appendChild(number);
        tr.appendChild(price);
        return {name: item.name, id: item.id, number: number, price: price,  element: tr};
    })
    let sum = 0;

    itemsList.forEach(item => {
        sum = sum + item.price * item.number;
    })
    console.log(sum);
    // table.innerHTML += '<tr><td><button onclick="addElement()">Add element</button><div id="adder"></div></td></tr>';
    productslist.forEach((item => {
        table.appendChild(item.element);
    }))

    document.querySelector(".pricingListDisplay").appendChild(table)
}