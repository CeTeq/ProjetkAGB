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
        // showNewProjectForm()
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
const newProjectDim = document.createElement("div");
newProjectDim.id = 'dim'
const newProject = document.createElement("div");
newProject.id = 'newProject'
newProject.innerHTML = `
        <img src="close.svg" onclick="i=2" class="cursorPointer">
        <form id="newProjectForm" action="/api/project/newProject" method="POST">
            <input type="text" name="name" placeholder="Nazwa">
            <input type="text" name="street" placeholder="Ulica">
            <input type="text" name="street_number" placeholder="Numer ulicy">
            <input type="text" name="post_code" placeholder="Kod pocztowy">
            <input type="text" name="city" placeholder="Miasto">
            <input type="date" name="date" size="20">
            <input type="text" name="description" placeholder="Opis"><br>
            <input type="submit" value="Dodaj projekt" class="hoverPointer">
        </form>
    `
newProjectDim.classList.add('hidden');

newProjectDim.appendChild(newProject);
document.body.append(newProjectDim);
// document.querySelector('#overlay').addEventListener('click', (e) =>{

// })
let i = 0
function showNewProjectForm() {
    newProjectDim.classList.toggle('hidden');
    document.body.addEventListener('click',  function listener(e)  {
        if (document.querySelector('#newProject').style.display !== 'none' && !newProject.contains(e.target)) i++
        // {
            // if(i>0){
            //     newProjectDim.classList.toggle('hidden');
            //     document.body.removeEventListener('click', listener)
            //     e.preventDefault()
            //     i = 0
            // } else i++
        // }
        if(i>1) {
            newProjectDim.classList.toggle('hidden');
            document.body.removeEventListener('click', listener)
            i=0
        }
        console.log(i)
    })
}