const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get('err');
const username = urlParams.get('username');
console.log(username);
console.log(myParam);
const error = document.getElementById('error');
if (myParam === "noPermissions") {error.innerHTML = "You do not have permission to access this page!";
}
if (username) document.getElementById('greeting').innerText = "Hello " + username + "!";

const table = document.getElementById('projects');

async function getData() {
    const url = "/api/getProjects"
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);

        // let projects = `<table><tr><th>ID</th><th>Nazwa</th><th>Uprawnienia</th><th></th></tr>`
        // json.forEach(element => {
        //     projects += '<tr><td>' + element.id + '</td>' + '<td>' + element.name + '</td>' + '<td>' + element.permission + '</td><td><a href="/project.html?id='+ element.id + '">Otwórz</a></td></tr>'
        // })
        // table.innerHTML = projects + '</table>'
        let projects = '<ul>'
        json.forEach((element) => {
            projects += '<li>' + element.name + ' <a href="/project.html?id=' + element.id + '">Otwórz</a></li>'
            console.log(element)
        })
        table.innerHTML += projects + '</ul>'

    } catch (error) {
        console.error(error.message);
    }

}
getData();