const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get('err');
const username = urlParams.get('username');
console.log(username);
console.log(myParam);
const error = document.getElementById('error');
if (myParam === "noPermissions") {error.innerHTML = "You do not have permission to access this page!";
}
if (username) document.getElementById('greeting').innerText = "Hello " + username + "!";

const table = document.querySelector('.projects');

async function getData() {
    const url = "/api/getProjects"
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);

        json.forEach(element => {
            const project = document.createElement("a")
            project.innerHTML = `
                    <h3></h3>
                    <div class="company">
                        <img src="./company.svg">
                        <span class="company-name"></span>
                    </div>
                    <div class="description"></div>
                `

            project.href = `/project.html?id=${element.id}`;

            project.querySelector("h3").innerText = element.name;
            project.querySelector(".description").innerText = element.description || "Brak opisu";
            project.querySelector(".company-name").innerText = element.company ? `${element.company.name}; ${element.company.street}` : "N/A";

            document.querySelector('.projects').appendChild(project)
        })
    } catch (error) {
        console.error(error.message);
    }

}
getData();