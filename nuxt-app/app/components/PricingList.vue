<script setup lang="js">
const props = defineProps(["products"]);

let productslist = [];

async function displayPricinglist(products) {
    if (!products) return;
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
        name.textContent = item.label;
        const amount = document.createElement("td");
        amount.textContent = item.amount;
        const price = document.createElement("td");
        price.textContent =
            parseInt(item.price) * item.amount + " " + item.currency;
        tr.appendChild(name);
        tr.appendChild(amount);
        tr.appendChild(price);
        return {
            name: item.name,
            id: item.id,
            amount: amount,
            price: price,
            element: tr,
        };
    });

    let sum = 0;
    products.forEach((element) => {
        sum = sum + element.price * element.amount;
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
onMounted(() => {
    displayPricinglist(props.products);
});
</script>
<style>
.pricingListDisplay {
    position: absolute;
    padding-top: 10px;
    left: 5%;
    display: flex;
    align-items: flex-start;
    justify-items: center;
    width: 90%;
    flex-direction: column;
}

.pricing-table {
    border-collapse: collapse;
    font-size: 20px;
    width: 100%;
}

.pricing-table,
.pricing-table th,
.pricing-table td {
    border-top: 1px solid #f39f81;
    border-bottom: 1px solid #f39f81;
}

.pricing-table th {
    height: 20px;
    padding-left: 2px;
    padding-right: 2px;
    background-color: #f39f81;
    text-align: left;
    font-weight: bold;
}

.pricing-table td {
    text-align: left;
    min-width: 80px;
}
.pricing-table td:nth-child(2) {
    padding-right: 7px;
}
.pricing-table td:nth-child(3) {
    padding-left: 7px;
    border-left: #f39f81 solid 1px;
}
</style>
<template>
    <div class="pricingListDisplay"></div>
</template>
