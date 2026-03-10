const urlParams = new URLSearchParams(window.location.search);
const projectID = urlParams.get("id");
let productsDisplay, searchBar;
let itemsList = [];
let allItemsList = [];
console.log(projectID);
let client;
async function getData() {
  const url = "/api/project?id=" + projectID;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    console.log(json);
    document.title = json.name;
    const topBar = document.querySelector("mdui-top-app-bar");
    topBar.innerHTML = "";
    const mduiTitle = document.createElement("mdui-top-app-bar-title");
    const goBackButton = document.createElement("mdui-button-icon");
    goBackButton.className = "goBackButton";
    goBackButton.setAttribute("icon", "arrow_back");
    topBar.appendChild(goBackButton);
    goBackButton.addEventListener(
      "click",
      () => (window.location.href = "/user.html"),
    );

    topBar.appendChild(mduiTitle);
    mduiTitle.innerText = json.name;
    await displayItems(json.items);
    await displayPricinglist(json.items);
    client = json.client;
    await projectData(client);
  } catch (error) {
    console.error(error.message);
  }
}

document.addEventListener("DOMContentLoaded", getData());

async function displayItems(item) {
  item.forEach((item) => {
    const itemContainer = document.createElement("div");
    itemContainer.className = "item-container";
    const more = document.createElement("mdui-dropdown");
    const dropdownTrigger = document.createElement("mdui-button-icon");
    const dropdownMenu = document.createElement("mdui-menu");
    const menuItem1 = document.createElement("mdui-menu-item");

    menuItem1.innerText = "Usuń";
    menuItem1.addEventListener("click", (e) => {
      deleteItem(item);
    });

    dropdownMenu.appendChild(menuItem1);

    dropdownTrigger.setAttribute("icon", "more_vert");
    dropdownTrigger.setAttribute("slot", "trigger");

    more.appendChild(dropdownTrigger);
    more.appendChild(dropdownMenu);
    more.classList.add("more-item");
    itemContainer.appendChild(more);
    const projectCard = document.createElement("mdui-card");
    projectCard.innerHTML = `
                    <div>
                    <h3></h3>
                    <div class="company">
<!--                        <img src="/project/company.svg">-->
                        <mdui-icon name='image'></mdui-icon>
                        <span class="item-name"></span>
                        <mdui-text-field class="amount" variant="outlined"></mdui-text-field>
                    </div>
                    <div class="description"></div>
                    </div>
                `;
    projectCard.querySelector("h3").innerText = item.name;
    let amountInput = projectCard.querySelector(".amount");
    amountInput.value = item.number;
    amountInput.addEventListener("input", (e) => {
      updateItem(item, e.target.value);
      console.log("item: ", item);
    });
    projectCard.className = "item-card";
    itemContainer.appendChild(projectCard);
    itemsList.push({
      item: item,
      itemContainer: itemContainer,
    });
    document.querySelector(".projectCards").appendChild(itemContainer);
  });
}
let productslist = [];
async function displayPricinglist(products) {
  const table = document.createElement("table");
  table.className = "pricing-table";
  const rowH = document.createElement("tr");
  const nameH = document.createElement("th");
  nameH.textContent = "Nazwa produktu";
  const amountH = document.createElement("th");
  amountH.textContent = "Ilość";
  const priceH = document.createElement("th");

  priceH.textContent = "Cena";
  table.appendChild(rowH);
  table.appendChild(nameH);
  table.appendChild(amountH);
  table.appendChild(priceH);
  productslist = products.map((item) => {
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    name.textContent = item.name;
    const number = document.createElement("td");
    number.textContent = item.number;
    const price = document.createElement("td");
    price.textContent =
      parseInt(item.price) * item.number + " " + item.currency;
    tr.appendChild(name);
    tr.appendChild(number);
    tr.appendChild(price);
    return {
      name: item.name,
      id: item.id,
      number: number,
      price: price,
      element: tr,
    };
  });

  let sum = 0;
  itemsList.forEach((element) => {
    sum = sum + element.item.price * element.item.number;
  });

  const totalRow = document.createElement("tr");
  totalRow.className = "total-row";
  const totalName = document.createElement("td");
  totalName.textContent = "Łącznie:";
  const td = document.createElement("td");
  const totalAmount = document.createElement("td");
  totalAmount.textContent = sum + " EUR";
  totalRow.appendChild(totalName);
  totalRow.appendChild(td);
  totalRow.appendChild(totalAmount);
  const totalVatRow = document.createElement("tr");
  totalVatRow.className = "total-vat-row";
  const td1 = document.createElement("td");
  totalVatRow.appendChild(td1);
  const totalVatName = document.createElement("td");
  totalVatName.textContent = "Łącznie z VAT (23%):";
  const vatSum = document.createElement("td");
  vatSum.textContent = (sum * 1.23).toFixed(2) + " EUR";
  totalVatRow.appendChild(totalVatName);
  totalVatRow.appendChild(vatSum);

  productslist.forEach((item) => {
    table.appendChild(item.element);
  });
  table.appendChild(totalRow);
  table.appendChild(totalVatRow);
  document.querySelector(".pricingListDisplay").appendChild(table);
}
async function projectData(client) {
  console.log("client: ", client);
  const clientTab = document.querySelector(".client-data-tab");
  clientTab.innerHTML = "";
  const table = document.createElement("table");
  table.classList.add("mdui-table");
  table.classList.add("client-data-table");
  table.innerHTML = `
    <tr id="city"><th>Nazwa klienta:</th><td>${client.name || "Brak"}</td></tr>
    <tr><th>Miasto:</th><td>${client.city || "Brak"}</td></tr>
    <tr><th>Ulica:</th><td>${client.street || "Brak"} ${client.street_number || ""}</td></tr>
    <tr><th>Opis:</th><td>${client.description || "Brak"}</td></tr>
    <tr><th>Data stworzenia:</th><td>${client.date}</td></tr>`;
  clientTab.appendChild(table);
}

async function addItemDialog() {
  allItemsList.splice(0, allItemsList.length);
  const url = "/api/getProducts";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    console.log(json);
    json.forEach((element) => {
      const item = document.createElement("mdui-list-item");
      let inUse = false;
      if (itemsList.some((el) => el.item.id === element.id)) inUse = true;
      console.log(inUse);
      item.innerText = element.name;
      allItemsList.push({
        html: item,
        item: element,
        inUse: inUse,
      });
    });
  } catch (error) {
    console.error(error.message);
  }

  const dialog = document.createElement("mdui-dialog");
  dialog.setAttribute("close-on-overlay-click", "");
  // dialog.className = 'add-item'
  dialog.innerHTML = `<div class="add-item">
            <div><mdui-text-field type="text" id="searchBar"><mdui-button-icon icon="add" id="addItemConfirm"></mdui-button-icon> </div>
            <mdui-list id="item-list"></mdui-list>
        </div>`;
  const itemList = dialog.querySelector("#item-list");
  const searchBar = dialog.querySelector("#searchBar");
  let selectedItemID;

  allItemsList.forEach((element) => {
    if (element.inUse) {
      element.html.style.cursor = "not-allowed";
      element.html.setAttribute("disabled", "");
    } else {
      element.html.addEventListener("click", async (e) => {
        searchBar.value = element.item.name;
        selectedItemID = element.item.id;
        console.log(
          allItemsList.find((el) => el.item.id === selectedItemID).item.id,
        );
        dialog.open = false;
        const url = "/api/project/addNewelement";
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              number: 1,
              productID: selectedItemID,
              projectID: projectID,
            }),
          });
          if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          }
        } catch (error) {
          console.error(error.message);
        }
        await reloadProject();
      });
    }
    itemList.appendChild(element.html);
  });

  searchBar.addEventListener("input", (event) => {
    const value = event.target.value.toLowerCase();
    allItemsList.forEach((product) => {
      if (product.item.name.toLowerCase().includes(value)) {
        if (itemsList.some((el) => el.id === product.item.id))
          product.html.style.color = "gray";
        product.html.style.display = "block";
      } else product.html.style.display = "none";
    });
  });

  document.body.appendChild(dialog);

  dialog.open = true;
}
async function addItem() {}
// searchBar.addEventListener('input', (event) => {
//     const value = event.target.value.toLowerCase();
//     newProducts.forEach(product => {
//         if (product.name.toLowerCase().includes(value)) {
//             if (productslist.some(el => el.id === product.id)) product.element.style.color = 'gray'
//             product.element.style.display = 'block'
//         } else product.element.style.display = 'none';
//     });
// });
const pendingChanges = new Map();
let unsavedChanges = false;
const ucSnakcBar = document.createElement("mdui-snackbar");
ucSnakcBar.setAttribute("action", "Zapisz");
ucSnakcBar.setAttribute("auto-close-delay", "0");
ucSnakcBar.setAttribute("close-on-outside-click", "false");
ucSnakcBar.innerText = "Masz niezapisane zmiany";
ucSnakcBar.addEventListener("action-click", async () => {
  if (pendingChanges.size > 0) {
    console.log(pendingChanges);
    ucSnakcBar.open = false;
    await uploadItemChanges();
  }
});
document.body.appendChild(ucSnakcBar);

async function updateItem(item, amount) {
  if (item && amount) {
    pendingChanges.set(item.id, item);
    if (item.number == amount && pendingChanges.has(item.id)) {
      pendingChanges.delete(item.id);
      if (pendingChanges.size === 0) {
        ucSnakcBar.open = false;
      }
    } else {
      pendingChanges.set(item.id, amount);
      ucSnakcBar.open = true;
      unsavedChanges = true;
    }
  }
}
async function uploadItemChanges() {
  const items = [];
  pendingChanges.forEach((value, key) => {
    let a = productslist.find((el) => el.id === key);
    console.log(
      "a",
      productslist.find((el) => el.id === key),
    );
    items.push({
      amount: value,
      projectID: projectID,
      productID: a.id,
    });
  });
  await fetch("/api/project/updateItem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: items,
    }),
  });
  await reloadProject();
}

async function reloadProject() {
  itemsList = [];
  allItemsList = [];
  productslist = [];
  document.querySelectorAll(".item-container").forEach((e) => {
    document.querySelector(".projectCards").removeChild(e);
  });
  console.log(document.querySelector(".pricing-table"));
  document
    .querySelector(".pricingListDisplay")
    .removeChild(document.querySelector(".pricing-table"));
  await getData();
}
const deletePopup = document.createElement("mdui-dialog");
deletePopup.innerText = "";
deletePopup.className = "delete-popup";
const delteSnackbar = document.createElement("mdui-snackbar");
async function deleteItem(element) {
  console.log(element);
  deletePopup.innerText =
    'Czy na pewno chcesz usunąć element \"' + element.name + '\"?';
  deletePopup.setAttribute("close-on-overlay-click", "");
  const deleteConfirmButton = document.createElement("mdui-button");
  deleteConfirmButton.innerText = "Usuń";
  deleteConfirmButton.className = "mdui-text-color-red";
  deletePopup.appendChild(document.createElement("br"));
  deletePopup.appendChild(deleteConfirmButton);

  document.body.append(deletePopup);
  deletePopup.open = true;
  deleteConfirmButton.addEventListener("click", async () => {
    deletePopup.open = false;
    const url = "/api/project/deleteItem";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productID: element.id,
          projectID: projectID,
        }),
      });
      console.log(response);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
    } catch (error) {
      console.error(error.message);
    }
    await reloadProject();
  });
  console.log(deletePopup.innerText);
}

async function editProjectInformation() {
  if ((await checkPermission()) <= 0) return;
  console.log(client);
}
async function checkPermission() {
  const url = "/api/projectPermission?projectID=" + projectID;
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.permission) return 0;
    return data.permission;
  } catch (error) {
    throw new Error(`Response status: ${response.status}`);
  }
}
